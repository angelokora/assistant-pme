import { create } from "zustand";
import { persist } from "zustand/middleware";

type DemoState = { open: boolean; animations: boolean; toggle: () => void; setAnimations: (v: boolean) => void };

export const useDemo = create<DemoState>()(
  persist(
    (set) => ({
      open: false,
      animations: true,
      toggle: () => set((s) => ({ open: !s.open })),
      setAnimations: (v) => set({ animations: v }),
    }),
    { name: "elea-demo", partialize: (s) => ({ animations: s.animations }) },
  ),
);
