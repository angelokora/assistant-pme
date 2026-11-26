import { create } from "zustand";
import type { OrbState } from "@elea/ds";
import type { Await, Block, BlockResolution, Reply, Scenario, Step, StepVars } from "./types";
import { choiceDoneSummary } from "../blocks/doneSummary";
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
export const ACTION_AWAIT_KINDS = new Set<Await["kind"]>(["choice", "connector", "upload", "auth", "form", "plan"]);

/** Événements de bloc : pas d'écho « Vous : … », état fait sur le bloc. */
const SILENT_EVENT_KINDS = new Set<Await["kind"]>(["choice", "connector", "auth", "upload", "plan"]);

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
  /** Rejoue les effets du chemin principal jusqu'à `stepId`, puis affiche cette étape (démo). */
  jumpTo: (scenarioId: string, stepId: string) => void;
  /**
   * Rouvre un besoin déjà joué : historique en lecture seule (aucun effet passé),
   * puis blocs `scenario.resume` interpolés depuis la mémoire actuelle.
   */
  reopen: (scenarioId: string) => void;
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
  // +1,1 s après les étapes : l'orbe passe en `done` (coche) avant le tour suivant.
  if (analysis && analysis.type === "analysis") return analysis.steps.reduce((t, s) => t + s.durationMs, 0) + 1100;
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
  // `google` : Gmail et Drive en un geste (compte Google). `provider` reste « gmail » pour l'origine des findings.
  const labels: Record<string, string> = { gmail: "Gmail", outlook: "Outlook", drive: "Drive", google: "Gmail et Drive" };
  return { provider: provider === "google" ? "gmail" : provider, providerLabel: labels[provider] ?? provider };
}

/** Jetons dérivés du plan choisi en mémoire (docs/ARCHITECTURE.md). */
export function varsFromPlan(planId: string): StepVars {
  const plan = useMemory.getState().plans.find((p) => p.id === planId);
  if (!plan) return { planId };
  const n = plan.steps.length;
  const done = plan.steps.filter((s) => s.status === "done").length;
  const next = plan.steps.find((s) => s.status === "doing") ?? plan.steps.find((s) => s.status === "todo");
  return {
    planId: plan.id,
    planTitle: plan.title,
    planFirstStep: plan.steps[0]?.title ?? "",
    planNextStep: next?.title ?? "",
    planStepCount: String(n),
    planStepCountLabel: n <= 1 ? `${n} étape` : `${n} étapes`,
    planDoneCount: String(done),
    planDoneCountLabel: done <= 1 ? `${done} étape` : `${done} étapes`,
  };
}

/** Plan actif (ou premier) pour interpoler une reprise. */
function varsFromActivePlan(): StepVars {
  const plans = useMemory.getState().plans;
  const plan = plans.find((p) => p.status === "active") ?? plans.find((p) => p.status === "waiting") ?? plans[0];
  return plan ? varsFromPlan(plan.id) : {};
}

function enrichPlanVars(vars: StepVars): StepVars {
  if (!vars.planId) return vars;
  return { ...vars, ...varsFromPlan(vars.planId) };
}

/**
 * Dernière étape du chemin principal (pour rouvrir un besoin au bout du fil).
 * Ignore les étapes auth déjà satisfaites, comme `jumpTo`.
 */
export function lastMainStepId(scenario: Scenario): string {
  let cursor: string | undefined = scenario.start;
  let last = scenario.start;
  const seen = new Set<string>();
  let vars: StepVars = {};
  while (cursor) {
    if (seen.has(cursor)) break;
    seen.add(cursor);
    last = cursor;
    const step: Step | undefined = scenario.steps[cursor];
    if (!step) break;
    if (step.await?.kind === "auth" && useMemory.getState().account.created) {
      cursor = step.await.next;
      continue;
    }
    const progressed = mainPathNext(step, vars);
    vars = progressed.vars;
    if (!progressed.next) break;
    cursor = progressed.next;
  }
  return last;
}

/**
 * Suit la route « principale » d'une étape (recommandée / première).
 * `dry` : aucun effet mémoire (auth), pour la reconstitution en lecture seule.
 * `forced` : route imposée (saut démo vers une branche), les jetons suivent la branche choisie.
 */
function mainPathNext(step: Step, vars: StepVars, dry = false, forced?: string): { next?: string; vars: StepVars } {
  const a = step.await;
  if (!a) return { next: step.next, vars };
  switch (a.kind) {
    case "input":
    case "form":
    case "plan":
      return { next: forced ?? a.next, vars };
    case "auth":
      if (!dry) useMemory.getState().apply([{ kind: "account", method: "google" }]);
      return {
        next: forced ?? a.next,
        vars: { ...vars, accountMethod: useMemory.getState().account.method ?? "google" },
      };
    case "connector": {
      // Compte pas encore créé (saut démo) : le chemin principal suppose un compte Google simulé.
      const { created, method } = useMemory.getState().account;
      const google = (method === "google" || !created) && !!a.onConnectGoogle;
      const next = forced ?? (google ? a.onConnectGoogle : a.onConnect);
      if (next === a.onSkip && next !== a.onConnect) return { next, vars };
      const viaGoogle = next === a.onConnectGoogle;
      return {
        next,
        vars: { ...vars, ...varsFromConnector(viaGoogle ? "connect:google" : "connect:gmail"), connectorBlockId: a.blockId },
      };
    }
    case "upload": {
      const next = forced ?? a.onUpload;
      if (next === a.onSkip && next !== a.onUpload) return { next, vars };
      return { next, vars: { ...vars, provider: "document", providerLabel: "Documents" } };
    }
    case "choice": {
      const choice = step.blocks.find((b) => b.type === "choice" && b.id === a.blockId);
      const fromForced = forced ? Object.keys(a.routes).find((id) => a.routes[id] === forced) : undefined;
      const preferred =
        fromForced ||
        (choice && choice.type === "choice" && choice.options.find((o) => o.recommended)?.id) ||
        Object.keys(a.routes)[0];
      let nextVars = vars;
      if (choice && choice.type === "choice" && choice.sideDetail === "plan") {
        nextVars = enrichPlanVars({ ...vars, planId: preferred });
      }
      return { next: forced ?? a.routes[preferred], vars: nextVars };
    }
  }
}

/** Toutes les étapes atteignables en une réponse depuis `step`. */
function edgesOf(step: Step): string[] {
  const a = step.await;
  if (!a) return step.next ? [step.next] : [];
  switch (a.kind) {
    case "input":
      return [a.next, ...Object.values(a.quickRoutes ?? {})];
    case "choice":
      return Object.values(a.routes);
    case "connector":
      return [a.onConnectGoogle, a.onConnect, a.onSkip].filter((id): id is string => !!id);
    case "upload":
      return [a.onUpload, a.onSkip];
    default:
      return [a.next];
  }
}

/**
 * Chemin de `scenario.start` jusqu'à `target` (inclus) pour un saut démo : d'abord la route
 * principale, sinon le plus court chemin (les branches comme `upload` ou `discuss-open`).
 */
function routeTo(scenario: Scenario, target: string): string[] | null {
  const main: string[] = [];
  let cursor: string | undefined = scenario.start;
  let vars: StepVars = {};
  while (cursor && !main.includes(cursor)) {
    main.push(cursor);
    if (cursor === target) return main;
    const step: Step | undefined = scenario.steps[cursor];
    if (!step) break;
    const progressed = mainPathNext(step, vars, true);
    vars = progressed.vars;
    cursor = progressed.next;
  }
  const parents = new Map<string, string | null>([[scenario.start, null]]);
  const queue = [scenario.start];
  while (queue.length) {
    const id = queue.shift() as string;
    if (id === target) {
      const route: string[] = [];
      for (let at: string | null | undefined = id; at; at = parents.get(at)) route.unshift(at);
      return route;
    }
    const step = scenario.steps[id];
    if (!step) continue;
    for (const to of edgesOf(step)) {
      if (!parents.has(to)) {
        parents.set(to, id);
        queue.push(to);
      }
    }
  }
  return null;
}

/** Applique les effets d'une étape sans l'afficher (saut démo). */
function applyStepEffects(step: Step, vars: StepVars) {
  if (!step.effects?.length) return;
  const effects = interpolateVars(step.effects, enrichPlanVars(vars));
  const gauges = useGauges.getState();
  const dims = useMemory.getState().dimensions;
  for (const e of effects) {
    if (e.kind === "progress" && gauges.shown[e.dimensionId] === undefined) {
      gauges.shown[e.dimensionId] = dims.find((d) => d.id === e.dimensionId)?.progress ?? 0;
    }
  }
  useGauges.setState({ shown: { ...gauges.shown } });
  useMemory.getState().apply(effects);
  for (const e of effects) if (e.kind === "progress") useGauges.getState().sync(e.dimensionId);
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

    // Compte déjà créé : on saute l'étape auth sans afficher le bloc.
    if (step.await?.kind === "auth" && useMemory.getState().account.created) {
      set({ orb: "idle" });
      return goTo(step.await.next, token);
    }

    await sleep(step.delayMs ?? DEFAULT_DELAY);
    if (token !== runToken) return;

    const vars = enrichPlanVars(get().vars);
    if (vars !== get().vars) set({ vars });
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

    jumpTo: (scenarioId, stepId) => {
      const scenario = SCENARIOS[scenarioId];
      if (!scenario) return console.warn(`[engine] scénario inconnu : ${scenarioId}`);
      if (!scenario.steps[stepId]) return console.warn(`[engine] étape inconnue : ${stepId}`);

      const token = ++runToken;
      useGauges.setState({ shown: {}, pulses: {} });
      useUploadInbox.getState().clear();

      // Route principale si elle passe par l'étape, sinon plus court chemin (branches : upload, discuss-open…).
      const route = routeTo(scenario, stepId) ?? [];
      let cursor: string | undefined = scenario.start;
      let vars: StepVars = {};
      const seen = new Set<string>();
      const pastTurns: Turn[] = [];
      const resolutions: Record<string, BlockResolution> = {};
      while (cursor && cursor !== stepId) {
        if (seen.has(cursor)) {
          console.warn(`[engine] boucle sur le chemin principal avant ${stepId}`);
          break;
        }
        seen.add(cursor);
        const step: Step | undefined = scenario.steps[cursor];
        if (!step) break;
        const forced = route[route.indexOf(cursor) + 1];
        // Auth déjà satisfaite : même règle que goTo.
        if (step.await?.kind === "auth" && useMemory.getState().account.created) {
          cursor = step.await.next;
          continue;
        }
        applyStepEffects(step, vars);
        const stepVars = enrichPlanVars(vars);
        const blocks = interpolateVars(step.blocks, stepVars);
        pastTurns.push({ id: `past-${cursor}`, from: "elea", stepId: cursor, blocks });
        for (const b of blocks) {
          if (b.type === "choice" || b.type === "connector" || b.type === "auth" || b.type === "upload" || b.type === "plan") {
            resolutions[b.id] = { summary: "Fait" };
          }
        }
        // Le compte est toujours créé en premier : en sautant plus loin, on passe l'étape auth
        // (compte Google simulé), pour que les étapes suivantes le trouvent en mémoire.
        const progressed = mainPathNext(step, vars, false, route.includes(cursor) ? forced : undefined);
        vars = progressed.vars;
        cursor = progressed.next;
      }

      const utterance = scenario.userUtterance;
      const turns: Turn[] = utterance ? [{ id: "utterance", from: "user", text: utterance, mode: "text" }, ...pastTurns] : pastTurns;
      set({
        scenario,
        done: false,
        awaiting: null,
        vars,
        resolutions,
        turns,
        currentStep: stepId,
      });
      void goTo(stepId, token);
    },

    reopen: (scenarioId) => {
      const scenario = SCENARIOS[scenarioId];
      if (!scenario) return console.warn(`[engine] scénario inconnu : ${scenarioId}`);

      ++runToken;
      useGauges.setState({ shown: {}, pulses: {} });
      useUploadInbox.getState().clear();

      let cursor: string | undefined = scenario.start;
      let vars: StepVars = {};
      const seen = new Set<string>();
      const pastTurns: Turn[] = [];
      const resolutions: Record<string, BlockResolution> = {};

      while (cursor) {
        if (seen.has(cursor)) break;
        seen.add(cursor);
        const step: Step | undefined = scenario.steps[cursor];
        if (!step) break;
        if (step.await?.kind === "auth" && useMemory.getState().account.created) {
          cursor = step.await.next;
          continue;
        }
        // Lecture seule : pas d'applyStepEffects.
        const stepVars = enrichPlanVars(vars);
        const blocks = interpolateVars(step.blocks, stepVars);
        pastTurns.push({ id: `past-${cursor}`, from: "elea", stepId: cursor, blocks });
        for (const b of blocks) {
          if (b.type === "choice" || b.type === "connector" || b.type === "auth" || b.type === "upload" || b.type === "plan") {
            resolutions[b.id] = { summary: "Fait" };
          }
        }
        const progressed = mainPathNext(step, vars, true);
        vars = progressed.vars;
        if (!progressed.next) break;
        cursor = progressed.next;
      }

      const resumeVars = enrichPlanVars({ ...vars, ...varsFromActivePlan() });
      const resumeBlocks = scenario.resume?.blocks?.length ? interpolateVars(scenario.resume.blocks, resumeVars) : [];

      const utterance = scenario.userUtterance;
      const turns: Turn[] = [
        ...(utterance ? [{ id: "utterance", from: "user" as const, text: utterance, mode: "text" as const }] : []),
        ...pastTurns,
        ...(resumeBlocks.length ? [{ id: "resume", from: "elea" as const, stepId: "resume", blocks: resumeBlocks }] : []),
      ];

      set({
        scenario,
        done: true,
        awaiting: null,
        vars: resumeVars,
        resolutions,
        turns,
        currentStep: null,
        orb: "idle",
      });
    },

    reply: (reply) => {
      const { awaiting } = get();
      if (!awaiting) return;
      const token = runToken;
      let next: string | undefined;
      let echo: Turn | null = null;
      let nextVars: StepVars = get().vars;
      let resolution: { blockId: string; summary: string; value?: string } | null = null;

      if (awaiting.kind === "input") {
        if (reply.kind !== "text" && reply.kind !== "quick") return;
        if (reply.kind === "quick" && awaiting.quickRoutes?.[reply.id]) {
          next = awaiting.quickRoutes[reply.id];
        } else {
          next = awaiting.next;
        }
        if (reply.kind === "text") echo = { id: `u-${Date.now()}`, from: "user", text: reply.text, mode: reply.mode };
        if (reply.kind === "quick") {
          echo = { id: `u-${Date.now()}`, from: "user", text: reply.label, mode: "choice" };
          const stepId = get().currentStep;
          const turn = [...get().turns].reverse().find((t) => t.from === "elea" && t.stepId === stepId);
          const qBlock = turn && turn.from === "elea" ? turn.blocks.find((b) => b.type === "question") : undefined;
          if (qBlock) resolution = { blockId: qBlock.id, summary: reply.label, value: reply.id };
        }
      } else if (awaiting.kind === "choice" && reply.kind === "text") {
        // Saisie libre sous un choix (allowFreeInput) : on suit la route recommandée / première.
        const stepId = get().currentStep;
        const turn = [...get().turns].reverse().find((t) => t.from === "elea" && t.stepId === stepId);
        const choiceBlock = turn && turn.from === "elea" ? turn.blocks.find((b) => b.type === "choice" && b.id === awaiting.blockId) : undefined;
        const preferred =
          (choiceBlock && choiceBlock.type === "choice" && choiceBlock.options.find((o) => o.recommended)?.id) ||
          Object.keys(awaiting.routes)[0];
        next = awaiting.routes[preferred];
        if (choiceBlock && choiceBlock.type === "choice") {
          if (choiceBlock.sideDetail === "plan") {
            nextVars = enrichPlanVars({ ...nextVars, planId: preferred });
          }
          // Résumé compact sur le bloc ; l'écho garde les mots libres de l'utilisateur (pas le titre d'option).
          resolution = {
            blockId: awaiting.blockId,
            summary: choiceDoneSummary(choiceBlock, preferred, useMemory.getState().plans),
          };
        }
        echo = { id: `u-${Date.now()}`, from: "user", text: reply.text, mode: reply.mode };
      } else if (reply.kind === "event" || reply.kind === "quick") {
        const value = reply.kind === "event" ? reply.value : reply.id;
        const label = reply.label;
        if (reply.kind === "event" && reply.vars) {
          nextVars = { ...nextVars, ...reply.vars };
          if (reply.vars.planId) nextVars = enrichPlanVars(nextVars);
        }
        switch (awaiting.kind) {
          case "choice":
            next = awaiting.routes[value];
            break;
          case "plan":
            next = value === "start" ? awaiting.next : undefined;
            break;
          case "connector":
            next =
              value === "skip"
                ? awaiting.onSkip
                : value === "connect:google" && awaiting.onConnectGoogle
                  ? awaiting.onConnectGoogle
                  : awaiting.onConnect;
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
            nextVars = { ...nextVars, accountMethod: value };
            break;
        }

        const silent = SILENT_EVENT_KINDS.has(awaiting.kind) || (reply.kind === "event" && !!reply.doneLabel && !reply.label);
        if (reply.kind === "event" && silent) {
          const blockId = reply.blockId;
          const summary = reply.doneLabel ?? label ?? value;
          if (summary) resolution = { blockId, summary, value };
        } else if (label) {
          echo = { id: `u-${Date.now()}`, from: "user", text: label, mode: "choice" };
        }
        // Choix / question : garder l'id pour marquer la puce sélectionnée.
        if (!resolution && awaiting.kind === "choice" && (reply.kind === "event" || reply.kind === "quick")) {
          resolution = {
            blockId: awaiting.blockId,
            summary: label ?? value,
            value,
          };
        }
      }
      if (!next) return console.warn("[engine] aucune route pour cette réponse", reply, awaiting);

      // Après auth : le connecteur passe de « choisi » à « connecté ».
      let resolutions = get().resolutions;
      if (resolution) {
        resolutions = {
          ...resolutions,
          [resolution.blockId]: { summary: resolution.summary, value: resolution.value },
        };
      }
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
