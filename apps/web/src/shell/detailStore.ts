import { create } from "zustand";

export type DetailKind = "finding" | "plan" | "attention" | null;

type DetailState = {
  kind: DetailKind;
  id: string | null;
  open: (kind: Exclude<DetailKind, null>, id: string) => void;
  close: () => void;
};

/** Panneau de détail (colonne droite desktop / feuille tablette). */
export const useDetail = create<DetailState>((set) => ({
  kind: null,
  id: null,
  open: (kind, id) => set({ kind, id }),
  close: () => set({ kind: null, id: null }),
}));
