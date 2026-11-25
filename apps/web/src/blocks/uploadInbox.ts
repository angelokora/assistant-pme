import { create } from "zustand";

/**
 * Boîte aux lettres entre le composer (pièces jointes) et le bloc upload actif.
 * Les fichiers choisis via « Ajouter un document » / « Prendre une photo » y arrivent.
 */
type InboxState = {
  files: File[];
  push: (files: File[]) => void;
  take: () => File[];
  clear: () => void;
};

export const useUploadInbox = create<InboxState>((set, get) => ({
  files: [],
  push: (files) => set((s) => ({ files: [...s.files, ...files] })),
  take: () => {
    const files = get().files;
    set({ files: [] });
    return files;
  },
  clear: () => set({ files: [] }),
}));
