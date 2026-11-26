import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Effect, Memory } from "../engine/types";
import { PRESETS, type PresetId } from "../engine/scenarios";

type MemoryState = Memory & {
  preset: PresetId;
  reset: (preset: PresetId) => void;
  apply: (effects: Effect[]) => void;
  /** Correction manuelle d'un finding ou d'une dimension (exigence : pouvoir rectifier la mémoire). */
  patchFinding: (id: string, patch: Partial<Memory["findings"][number]>) => void;
  /** Retire un finding (et l'attention liée). Renvoie le snapshot pour annuler. */
  removeFinding: (id: string) => { finding: Memory["findings"][number]; attention: Memory["attention"] } | null;
  /** Restaure un finding après annulation. */
  restoreFinding: (snapshot: { finding: Memory["findings"][number]; attention: Memory["attention"] }) => void;
  /** Met à jour les étapes d'un plan (dates, ordre) depuis le bloc editable. */
  patchPlanSteps: (planId: string, steps: Memory["plans"][number]["steps"]) => void;
  /** Coche une étape (live) : faite, prochaine en cours, attention liée retirée. */
  completePlanStep: (planId: string, stepId: string) => void;
  /** Change l'état d'une source (déconnexion / reconnexion). */
  setSourceStatus: (sourceId: string, status: Memory["sources"][number]["status"], patch?: Partial<Memory["sources"][number]>) => void;
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function reduce(m: Memory, e: Effect): Memory {
  switch (e.kind) {
    case "progress":
      return {
        ...m,
        dimensions: m.dimensions.map((d) =>
          d.id === e.dimensionId
            ? { ...d, progress: Math.max(d.progress, e.to), status: e.status ?? d.status, summary: e.summary ?? d.summary }
            : d,
        ),
      };
    case "finding": {
      const exists = m.findings.some((f) => f.id === e.finding.id);
      return {
        ...m,
        findings: exists ? m.findings.map((f) => (f.id === e.finding.id ? { ...f, ...e.finding } : f)) : [e.finding, ...m.findings],
      };
    }
    case "update-finding":
      return { ...m, findings: m.findings.map((f) => (f.id === e.findingId ? { ...f, ...e.patch } : f)) };
    case "subject": {
      const exists = m.subjects.some((s) => s.id === e.subject.id);
      return {
        ...m,
        subjects: exists
          ? m.subjects.map((s) => (s.id === e.subject.id ? { ...s, ...e.subject } : s))
          : [...m.subjects, e.subject],
      };
    }
    case "update-subject":
      return {
        ...m,
        subjects: m.subjects.map((s) => (s.id === e.subjectId ? { ...s, ...e.patch } : s)),
      };
    case "source": {
      const exists = m.sources.some((s) => s.id === e.source.id);
      return { ...m, sources: exists ? m.sources.map((s) => (s.id === e.source.id ? e.source : s)) : [...m.sources, e.source] };
    }
    case "plan": {
      const existing = m.plans.find((p) => p.id === e.plan.id);
      if (!existing) return { ...m, plans: [...m.plans, e.plan] };
      // Ne pas écraser un plan déjà avancé (returning) par un brouillon de scénario.
      if (existing.status !== "draft" && e.plan.status === "draft") return m;
      const existingDone = existing.steps.filter((s) => s.status === "done").length;
      const incomingDone = e.plan.steps.filter((s) => s.status === "done").length;
      if (existingDone > incomingDone) return m;
      if (existing.steps.length > e.plan.steps.length && existingDone >= incomingDone) return m;
      return { ...m, plans: m.plans.map((p) => (p.id === e.plan.id ? { ...p, ...e.plan } : p)) };
    }
    case "update-plan":
      return { ...m, plans: m.plans.map((p) => (p.id === e.planId ? { ...p, ...e.patch } : p)) };
    case "plan-step":
      return {
        ...m,
        plans: m.plans.map((p) =>
          p.id === e.planId ? { ...p, steps: p.steps.map((s) => (s.id === e.stepId ? { ...s, status: e.status } : s)) } : p,
        ),
      };
    case "account":
      return { ...m, account: { created: true, method: e.method } };
    case "update-attention":
      return {
        ...m,
        attention: m.attention.map((a) => (a.id === e.attentionId ? { ...a, ...e.patch } : a)),
      };
    case "remove-attention":
      return { ...m, attention: m.attention.filter((a) => a.id !== e.attentionId) };
  }
}

export const useMemory = create<MemoryState>()(
  persist(
    (set) => ({
      ...clone(PRESETS["first-visit"]),
      preset: "first-visit",
      reset: (preset) => set({ ...clone(PRESETS[preset]), preset }),
      apply: (effects) => set((s) => effects.reduce<Memory>(reduce, s) as MemoryState),
      patchFinding: (id, patch) => set((s) => ({ findings: s.findings.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      removeFinding: (id) => {
        type Snapshot = { finding: Memory["findings"][number]; attention: Memory["attention"] };
        let snapshot: Snapshot | null = null;
        set((s) => {
          const finding = s.findings.find((f) => f.id === id);
          if (!finding) return s;
          const linkedAttention = s.attention.filter((a) => a.findingId === id);
          snapshot = { finding, attention: linkedAttention };
          return {
            findings: s.findings.filter((f) => f.id !== id),
            attention: s.attention.filter((a) => a.findingId !== id),
          };
        });
        return snapshot;
      },
      restoreFinding: (snapshot) =>
        set((s) => ({
          findings: s.findings.some((f) => f.id === snapshot.finding.id)
            ? s.findings
            : [snapshot.finding, ...s.findings],
          attention: [
            ...snapshot.attention.filter((a) => !s.attention.some((x) => x.id === a.id)),
            ...s.attention,
          ],
        })),
      patchPlanSteps: (planId, steps) =>
        set((s) => ({ plans: s.plans.map((p) => (p.id === planId ? { ...p, steps } : p)) })),
      completePlanStep: (planId, stepId) =>
        set((s) => {
          const plans = s.plans.map((p) => {
            if (p.id !== planId) return p;
            let found = false;
            let nextPromoted = false;
            const steps = p.steps.map((step) => {
              if (step.id === stepId) {
                found = true;
                return { ...step, status: "done" as const };
              }
              if (found && !nextPromoted && (step.status === "todo" || step.status === "doing")) {
                nextPromoted = true;
                return { ...step, status: "doing" as const };
              }
              return step;
            });
            const allDone = steps.every((st) => st.status === "done");
            return {
              ...p,
              steps,
              status: allDone ? ("done" as const) : p.status === "waiting" ? ("active" as const) : p.status,
            };
          });
          const attention = s.attention.filter((a) => !(a.kind === "plan-step" && a.planId === planId && a.stepId === stepId));
          return { plans, attention };
        }),
      setSourceStatus: (sourceId, status, patch) =>
        set((s) => ({
          sources: s.sources.map((src) =>
            src.id === sourceId
              ? {
                  ...src,
                  ...patch,
                  status,
                  lastSync: status === "connected" ? patch?.lastSync ?? new Date().toISOString().slice(0, 19) : src.lastSync,
                }
              : src,
          ),
        })),
    }),
    {
      name: "elea-memory",
      version: 3,
      migrate: () => clone(PRESETS["first-visit"]),
    },
  ),
);

/**
 * Affichage des jauges : la valeur affichée attend que le « Noté dans… » arrive sur sa carte
 * (ou 2,4 s au plus), pour que le remplissage suive le vol. docs/BLOCKS.md, bloc noted.
 */
type GaugeState = {
  shown: Record<string, number>;
  pulses: Record<string, number>;
  land: (dimensionId: string) => void;
  sync: (dimensionId: string) => void;
};

export const useGauges = create<GaugeState>((set) => ({
  shown: {},
  pulses: {},
  land: (id) =>
    set((s) => ({
      shown: { ...s.shown, [id]: useMemory.getState().dimensions.find((d) => d.id === id)?.progress ?? 0 },
      pulses: { ...s.pulses, [id]: (s.pulses[id] ?? 0) + 1 },
    })),
  sync: (id) => set((s) => ({ shown: { ...s.shown, [id]: useMemory.getState().dimensions.find((d) => d.id === id)?.progress ?? 0 } })),
}));
