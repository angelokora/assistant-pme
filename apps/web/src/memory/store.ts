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
    case "source": {
      const exists = m.sources.some((s) => s.id === e.source.id);
      return { ...m, sources: exists ? m.sources.map((s) => (s.id === e.source.id ? e.source : s)) : [...m.sources, e.source] };
    }
    case "plan": {
      const exists = m.plans.some((p) => p.id === e.plan.id);
      return { ...m, plans: exists ? m.plans.map((p) => (p.id === e.plan.id ? { ...p, ...e.plan } : p)) : [...m.plans, e.plan] };
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
    }),
    { name: "elea-memory", version: 1 },
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
