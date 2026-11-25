import { create } from "zustand";

/** État du bandeau de dimensions collant en tête d'un besoin. */
type StripState = { ids: string[]; blockVisible: boolean; set: (p: Partial<Omit<StripState, "set">>) => void };

export const useStrip = create<StripState>((set) => ({
  ids: [],
  blockVisible: true,
  set: (p) => set(p),
}));
