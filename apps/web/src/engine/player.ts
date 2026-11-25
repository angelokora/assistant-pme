import { create } from "zustand";
import type { OrbState } from "@elea/ds";
import type { Await, Block, BlockResolution, Reply, Scenario, StepVars } from "./types";
import { useUploadInbox } from "../blocks/uploadInbox";
import { SCENARIOS } from "./scenarios";
import { useGauges, useMemory } from "../memory/store";

/**
 * Moteur de scénario (docs/ARCHITECTURE.md, section 3).
 * Joue les étapes d'un scénario : réflexion simulée, effets sur la mémoire, tour d'Éléa, attente d'une saisie.
 * Remplaçable plus tard par un agent qui renverrait les mêmes blocs.
 */

export type Turn =
  | { id: string; from: "elea"; stepId: string; blocks: Block[] }
  | { id: string; from: "user"; text: string; mode?: "voice" | "text" | "choice" };

/** Await qui publient leurs actions dans l'ActionDock mobile (pas de saisie libre). */
export const ACTION_AWAIT_KINDS = new Set<Await["kind"]>(["choice", "connector", "upload", "auth", "form"]);

/** Événements de bloc : pas d'écho « Vous : … », état fait sur le bloc. */
const SILENT_EVENT_KINDS = new Set<Await["kind"]>(["connector", "auth", "upload"]);

type PlayerState = {
  scenario: Scenario | null;
  turns: Turn[];
  orb: OrbState;
  awaiting: Await | null;
  currentStep: string | null;
  done: boolean;
  vars: StepVars;
  resolutions: Record<string, BlockResolution>;
  start: (scenarioId: string, opts?: { withUtterance?: string }) => void;
  reply: (reply: Reply) => void;
  stop: () => void;
};

const DEFAULT_DELAY = 600;
const STAGGER = 60;
let runToken = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Temps laissé à l'utilisateur pour lire un tour avant l'étape suivante automatique. */
function readingTime(blocks: Block[]) {
  const analysis = blocks.find((b) => b.type === "analysis");
  if (analysis && analysis.type === "analysis") return analysis.steps.reduce((t, s) => t + s.durationMs, 0) + 700;
  const hasNoted = blocks.some((b) => b.type === "noted");
  return 900 + blocks.length * 350 + (hasNoted ? 1600 : 0);
}

/** Remplace les jetons `{{nom}}` dans n'importe quelle structure JSON (effets, blocs…). */
export function interpolateVars<T>(value: T, vars: StepVars): T {
  if (!Object.keys(vars).length) return value;
  return JSON.parse(interpolateString(JSON.stringify(value), vars)) as T;
}

function interpolateString(input: string, vars: StepVars) {
  return input.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

function varsFromConnector(value: string): StepVars {
  if (!value.startsWith("connect:")) return {};
  const provider = value.slice("connect:".length);
  const labels: Record<string, string> = { gmail: "Gmail", outlook: "Outlook", drive: "Drive" };
  return { provider, providerLabel: labels[provider] ?? provider };
}

export const usePlayer = create<PlayerState>((set, get) => {
  async function goTo(stepId: string, token: number) {
    const scenario = get().scenario;
    if (!scenario || token !== runToken) return;
    const step = scenario.steps[stepId];
    if (!step) {
      console.warn(`[engine] étape inconnue : ${stepId}`);
      return;
    }
    set({ orb: "thinking", awaiting: null, currentStep: stepId });
    await sleep(step.delayMs ?? DEFAULT_DELAY);
    if (token !== runToken) return;

    const vars = get().vars;
    if (step.effects?.length) {
      const effects = interpolateVars(step.effects, vars);
      const gauges = useGauges.getState();
      const dims = useMemory.getState().dimensions;
      for (const e of effects) {
        if (e.kind === "progress" && gauges.shown[e.dimensionId] === undefined) {
          gauges.shown[e.dimensionId] = dims.find((d) => d.id === e.dimensionId)?.progress ?? 0;
        }
      }
      useGauges.setState({ shown: { ...gauges.shown } });
      useMemory.getState().apply(effects);
      for (const e of effects) if (e.kind === "progress") setTimeout(() => useGauges.getState().sync(e.dimensionId), 2600);
    }

    const blocks = interpolateVars(step.blocks, vars);
    set((s) => ({ orb: "speaking", turns: [...s.turns, { id: `${stepId}-${s.turns.length}`, from: "elea", stepId, blocks }] }));
    await sleep(step.blocks.length * STAGGER + 450);
    if (token !== runToken) return;

    if (step.await) {
      if (step.await.kind === "auth" && useMemory.getState().account.created) {
        set({ orb: "idle" });
        return goTo(step.await.next, token);
      }
      set({ orb: "idle", awaiting: step.await });
      return;
    }
    if (step.next) {
      set({ orb: "idle" });
      await sleep(readingTime(step.blocks));
      return goTo(step.next, token);
    }
    set({ orb: "done", done: true });
    setTimeout(() => token === runToken && set({ orb: "idle" }), 900);
  }

  return {
    scenario: null,
    turns: [],
    orb: "idle",
    awaiting: null,
    currentStep: null,
    done: false,
    vars: {},
    resolutions: {},

    start: (scenarioId, opts) => {
      const scenario = SCENARIOS[scenarioId];
      if (!scenario) return console.warn(`[engine] scénario inconnu : ${scenarioId}`);
      const token = ++runToken;
      useGauges.setState({ shown: {}, pulses: {} });
      useUploadInbox.getState().clear();
      const utterance = opts?.withUtterance ?? scenario.userUtterance;
      set({
        scenario,
        done: false,
        awaiting: null,
        vars: {},
        resolutions: {},
        turns: utterance ? [{ id: "utterance", from: "user", text: utterance, mode: "text" }] : [],
      });
      void goTo(scenario.start, token);
    },

    reply: (reply) => {
      const { awaiting } = get();
      if (!awaiting) return;
      const token = runToken;
      let next: string | undefined;
      let echo: Turn | null = null;
      let nextVars: StepVars = get().vars;
      let resolution: { blockId: string; summary: string } | null = null;

      if (awaiting.kind === "input") {
        if (reply.kind !== "text" && reply.kind !== "quick") return;
        if (reply.kind === "quick" && awaiting.quickRoutes?.[reply.id]) {
          next = awaiting.quickRoutes[reply.id];
        } else {
          next = awaiting.next;
        }
        if (reply.kind === "text") echo = { id: `u-${Date.now()}`, from: "user", text: reply.text, mode: reply.mode };
        if (reply.kind === "quick") echo = { id: `u-${Date.now()}`, from: "user", text: reply.label, mode: "choice" };
      } else if (reply.kind === "event" || reply.kind === "quick") {
        const value = reply.kind === "event" ? reply.value : reply.id;
        const label = reply.label;
        if (reply.kind === "event" && reply.vars) nextVars = { ...nextVars, ...reply.vars };
        switch (awaiting.kind) {
          case "choice":
            next = awaiting.routes[value];
            break;
          case "connector":
            next = value === "skip" ? awaiting.onSkip : awaiting.onConnect;
            if (value.startsWith("connect:")) {
              nextVars = { ...nextVars, ...varsFromConnector(value), connectorBlockId: reply.kind === "event" ? reply.blockId : awaiting.blockId };
            }
            break;
          case "upload":
            next = value === "skip" ? awaiting.onSkip : awaiting.onUpload;
            if (value !== "skip") nextVars = { ...nextVars, provider: "document", providerLabel: "Documents" };
            break;
          case "form":
            next = awaiting.next;
            break;
          case "auth":
            next = awaiting.next;
            useMemory.getState().apply([{ kind: "account", method: (value as "google" | "apple" | "email") ?? "google" }]);
            break;
        }

        if (reply.kind === "event" && SILENT_EVENT_KINDS.has(awaiting.kind)) {
          const blockId = reply.blockId;
          const summary = reply.doneLabel ?? label ?? value;
          if (summary) resolution = { blockId, summary };
        } else if (label) {
          echo = { id: `u-${Date.now()}`, from: "user", text: label, mode: "choice" };
        }
      }
      if (!next) return console.warn("[engine] aucune route pour cette réponse", reply, awaiting);

      // Après auth : le connecteur passe de « choisi » à « connecté ».
      let resolutions = get().resolutions;
      if (resolution) resolutions = { ...resolutions, [resolution.blockId]: { summary: resolution.summary } };
      if (awaiting.kind === "auth" && nextVars.connectorBlockId && nextVars.providerLabel) {
        resolutions = {
          ...resolutions,
          [nextVars.connectorBlockId]: { summary: `${nextVars.providerLabel} connecté` },
        };
      }

      set((s) => ({
        awaiting: null,
        vars: nextVars,
        turns: echo ? [...s.turns, echo] : s.turns,
        resolutions,
      }));
      void goTo(next, token);
    },

    stop: () => {
      runToken++;
      useUploadInbox.getState().clear();
      set({ scenario: null, turns: [], awaiting: null, orb: "idle", done: false, currentStep: null, vars: {}, resolutions: {} });
    },
  };
});
