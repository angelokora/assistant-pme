import { create } from "zustand";

export type Flight = {
  id: string;
  targetKind: "dimension" | "topic";
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

/** Cible visible pour l'envol : carte de dimension, lien de sujet, ou secours « Mon entreprise ». */
export function findTarget(kind: "dimension" | "topic", id: string): HTMLElement | null {
  const attr = kind === "dimension" ? "data-dimension-target" : "data-topic-target";
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[${attr}="${id}"]`));
  const visible = els.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  });
  if (visible.length) return visible[visible.length - 1];
  if (kind === "topic") {
    return document.querySelector<HTMLElement>("[data-topic-fallback]");
  }
  return null;
}
