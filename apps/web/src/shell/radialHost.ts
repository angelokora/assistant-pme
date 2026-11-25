import { create } from "zustand";

type RadialHostState = {
  /** Élément orbe micro qui porte le menu (null = orbe de secours du RadialMenu). */
  anchor: HTMLElement | null;
  open: boolean;
  setAnchor: (el: HTMLElement | null) => void;
  setOpen: (v: boolean) => void;
};

/** Pont entre l'orbe micro et la couche d'arc du menu B. */
export const useRadialHost = create<RadialHostState>((set) => ({
  anchor: null,
  open: false,
  setAnchor: (el) => set({ anchor: el }),
  setOpen: (v) => set({ open: v }),
}));
