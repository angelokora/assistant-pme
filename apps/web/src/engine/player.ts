import { create } from "zustand";
import type { OrbState } from "@elea/ds";
import type { Await, Block, Reply, Scenario } from "./types";
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

type PlayerState = {
  scenario: Scenario | null;
  turns: Turn[];
  orb: OrbState;
  awaiting: Await | null;
  currentStep: string | null;
  done: boolean;
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

    if (step.effects?.length) {
      const gauges = useGauges.getState();
      const dims = useMemory.getState().dimensions;
      for (const e of step.effects) {
        if (e.kind === "progress" && gauges.shown[e.dimensionId] === undefined) {
          gauges.shown[e.dimensionId] = dims.find((d) => d.id === e.dimensionId)?.progress ?? 0;
        }
      }
      useGauges.setState({ shown: { ...gauges.shown } });
      useMemory.getState().apply(step.effects);
      for (const e of step.effects) if (e.kind === "progress") setTimeout(() => useGauges.getState().sync(e.dimensionId), 2600);
    }

    set((s) => ({ orb: "speaking", turns: [...s.turns, { id: `${stepId}-${s.turns.length}`, from: "elea", stepId, blocks: step.blocks }] }));
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

    start: (scenarioId, opts) => {
      const scenario = SCENARIOS[scenarioId];
      if (!scenario) return console.warn(`[engine] scénario inconnu : ${scenarioId}`);
      const token = ++runToken;
      useGauges.setState({ shown: {}, pulses: {} });
      const utterance = opts?.withUtterance ?? scenario.userUtterance;
      set({
        scenario,
        done: false,
        awaiting: null,
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

      if (awaiting.kind === "input") {
        next = awaiting.next;
        if (reply.kind === "text") echo = { id: `u-${Date.now()}`, from: "user", text: reply.text, mode: reply.mode };
        if (reply.kind === "quick") echo = { id: `u-${Date.now()}`, from: "user", text: reply.label, mode: "choice" };
      } else if (reply.kind === "event" || reply.kind === "quick") {
        const value = reply.kind === "event" ? reply.value : reply.id;
        const label = reply.label;
        switch (awaiting.kind) {
          case "choice": next = awaiting.routes[value]; break;
          case "connector": next = value === "skip" ? awaiting.onSkip : awaiting.onConnect; break;
          case "upload": next = value === "skip" ? awaiting.onSkip : awaiting.onUpload; break;
          case "form": next = awaiting.next; break;
          case "auth":
            next = awaiting.next;
            useMemory.getState().apply([{ kind: "account", method: (value as "google" | "apple" | "email") ?? "google" }]);
            break;
        }
        if (label) echo = { id: `u-${Date.now()}`, from: "user", text: label, mode: "choice" };
      }
      if (!next) return console.warn("[engine] aucune route pour cette réponse", reply, awaiting);
      set((s) => ({ awaiting: null, turns: echo ? [...s.turns, echo] : s.turns }));
      void goTo(next, token);
    },

    stop: () => {
      runToken++;
      set({ scenario: null, turns: [], awaiting: null, orb: "idle", done: false, currentStep: null });
    },
  };
});
