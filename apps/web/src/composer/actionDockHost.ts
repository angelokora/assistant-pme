import { create } from "zustand";

/** Cible DOM du portail ActionDock (zone du composer, mobile). */
type HostState = {
  host: HTMLElement | null;
  /** Nombre de blocs qui ont une action à porter dans le dock. */
  claimed: number;
  setHost: (el: HTMLElement | null) => void;
  /** Enregistre qu'un ActionSlot veut le dock ; retourne la fonction de libération. */
  claim: () => () => void;
};

export const useActionDockHost = create<HostState>((set, get) => ({
  host: null,
  claimed: 0,
  setHost: (host) => set({ host }),
  claim: () => {
    set({ claimed: get().claimed + 1 });
    let released = false;
    return () => {
      if (released) return;
      released = true;
      set({ claimed: Math.max(0, get().claimed - 1) });
    };
  },
}));
