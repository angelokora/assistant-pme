import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

function inIframe() {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export type HomeVariant = "a" | "b" | "c";
export type MenuVariant = "a" | "b";
export type FindVariant = "a" | "b";
export type DeviceMode = "desktop" | "phone" | "tablet";
export type DeviceOrientation = "portrait" | "landscape";

type DemoState = {
  open: boolean;
  animations: boolean;
  homeVariant: HomeVariant;
  menuVariant: MenuVariant;
  findVariant: FindVariant;
  /** Simule une connexion mail interrompue (connecteur). */
  mailInterrupted: boolean;
  /** Pastille de variantes (≥ 1024 px). Masquable pour les démos. */
  showVariantPill: boolean;
  /** Indice de découverte du menu radial déjà vu. */
  radialHintSeen: boolean;
  device: DeviceMode;
  orientation: DeviceOrientation;
  toggle: () => void;
  setOpen: (v: boolean) => void;
  setAnimations: (v: boolean) => void;
  setHomeVariant: (v: HomeVariant) => void;
  setMenuVariant: (v: MenuVariant) => void;
  setFindVariant: (v: FindVariant) => void;
  setMailInterrupted: (v: boolean) => void;
  setShowVariantPill: (v: boolean) => void;
  setRadialHintSeen: (v: boolean) => void;
  setDevice: (v: DeviceMode) => void;
  setOrientation: (v: DeviceOrientation) => void;
};

const initial = {
  open: false,
  animations: true,
  homeVariant: "a" as HomeVariant,
  menuVariant: "a" as MenuVariant,
  findVariant: "a" as FindVariant,
  mailInterrupted: false,
  showVariantPill: true,
  radialHintSeen: false,
  device: "desktop" as DeviceMode,
  orientation: "portrait" as DeviceOrientation,
};

function createActions(
  set: (
    partial: Partial<DemoState> | ((s: DemoState) => Partial<DemoState>),
  ) => void,
): Omit<
  DemoState,
  | "open"
  | "animations"
  | "homeVariant"
  | "menuVariant"
  | "findVariant"
  | "mailInterrupted"
  | "showVariantPill"
  | "radialHintSeen"
  | "device"
  | "orientation"
> {
  return {
    toggle: () => set((s) => ({ open: !s.open })),
    setOpen: (v) => set({ open: v }),
    setAnimations: (v) => set({ animations: v }),
    setHomeVariant: (v) => set({ homeVariant: v }),
    setMenuVariant: (v) => set({ menuVariant: v }),
    setFindVariant: (v) => set({ findVariant: v }),
    setMailInterrupted: (v) => set({ mailInterrupted: v }),
    setShowVariantPill: (v) => set({ showVariantPill: v }),
    setRadialHintSeen: (v) => set({ radialHintSeen: v }),
    setDevice: (v) => set({ device: v }),
    setOrientation: (v) => set({ orientation: v }),
  };
}

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * Store démo. Dans l'iframe, pas de persistance localStorage (partagé avec l'hôte) :
 * le panneau est la source de vérité via postMessage.
 */
export const useDemo = create<DemoState>()(
  persist(
    (set) => ({
      ...initial,
      ...createActions(set),
    }),
    {
      name: "elea-demo",
      storage: createJSONStorage(() => (inIframe() ? noopStorage : localStorage)),
      partialize: (s) => ({
        animations: s.animations,
        homeVariant: s.homeVariant,
        menuVariant: s.menuVariant,
        findVariant: s.findVariant,
        mailInterrupted: s.mailInterrupted,
        showVariantPill: s.showVariantPill,
        radialHintSeen: s.radialHintSeen,
        device: s.device,
        orientation: s.orientation,
      }),
    },
  ),
);
