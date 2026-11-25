import { create } from "zustand";

/** Cible DOM du portail ActionDock (zone du composer, mobile). */
type HostState = {
  host: HTMLElement | null;
  setHost: (el: HTMLElement | null) => void;
};

export const useActionDockHost = create<HostState>((set) => ({
  host: null,
  setHost: (host) => set({ host }),
}));
