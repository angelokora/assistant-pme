import { create } from "zustand";

export type Flight = {
  id: string;
  targetKind: "dimension";
  targetId: string;
  from: DOMRect;
  to: DOMRect;
  label: string;
};

type FlightState = {
  flights: Flight[];
  launch: (f: Flight) => void;
  done: (id: string) => void;
};

export const useFlights = create<FlightState>((set) => ({
  flights: [],
  launch: (f) => set((s) => ({ flights: [...s.flights.filter((x) => x.id !== f.id), f] })),
  done: (id) => set((s) => ({ flights: s.flights.filter((x) => x.id !== id) })),
}));

/** Cible visible pour l'envol : carte de dimension, ou secours « Mon entreprise ». */
export function findTarget(_kind: "dimension", id: string): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-dimension-target="${id}"]`));
  const visible = els.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  });
  if (visible.length) return visible[visible.length - 1];
  return document.querySelector<HTMLElement>("[data-subject-fallback]");
}
