import { create } from "zustand";

export type Flight = { id: string; dimensionId: string; from: DOMRect; to: DOMRect; label: string };

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

/** Trouve la carte de dimension visible la plus pertinente (bandeau collant ou bloc dans le fil). */
export function findTarget(dimensionId: string): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-dimension-target="${dimensionId}"]`));
  const visible = els.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  });
  return visible[visible.length - 1] ?? null;
}
