import { create } from "zustand";

type ComposerContextState = {
  /** Titre du finding sur lequel Thomas veut interroger Éléa. */
  aboutTitle: string | null;
  setAbout: (title: string) => void;
  clear: () => void;
};

/** Contexte visible du composer (« À propos de : … »), hors scénario. */
export const useComposerContext = create<ComposerContextState>((set) => ({
  aboutTitle: null,
  setAbout: (title) => set({ aboutTitle: title }),
  clear: () => set({ aboutTitle: null }),
}));
