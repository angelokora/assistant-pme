import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HomeVariant = "a" | "b" | "c";
export type MenuVariant = "a" | "b";
export type FindVariant = "a" | "b";

type DemoState = {
  open: boolean;
  animations: boolean;
  homeVariant: HomeVariant;
  menuVariant: MenuVariant;
  findVariant: FindVariant;
  /** Simule une connexion mail interrompue (connecteur). */
  mailInterrupted: boolean;
  toggle: () => void;
  setOpen: (v: boolean) => void;
  setAnimations: (v: boolean) => void;
  setHomeVariant: (v: HomeVariant) => void;
  setMenuVariant: (v: MenuVariant) => void;
  setFindVariant: (v: FindVariant) => void;
  setMailInterrupted: (v: boolean) => void;
};

export const useDemo = create<DemoState>()(
  persist(
    (set) => ({
      open: false,
      animations: true,
      homeVariant: "a",
      menuVariant: "a",
      findVariant: "a",
      mailInterrupted: false,
      toggle: () => set((s) => ({ open: !s.open })),
      setOpen: (v) => set({ open: v }),
      setAnimations: (v) => set({ animations: v }),
      setHomeVariant: (v) => set({ homeVariant: v }),
      setMenuVariant: (v) => set({ menuVariant: v }),
      setFindVariant: (v) => set({ findVariant: v }),
      setMailInterrupted: (v) => set({ mailInterrupted: v }),
    }),
    {
      name: "elea-demo",
      partialize: (s) => ({
        animations: s.animations,
        homeVariant: s.homeVariant,
        menuVariant: s.menuVariant,
        findVariant: s.findVariant,
        mailInterrupted: s.mailInterrupted,
      }),
    },
  ),
);
