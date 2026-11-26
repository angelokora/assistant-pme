import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = "vivant" | "classic";

type ThemeState = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

/** Applique data-theme sur <html> (source unique pour les tokens). */
export function applyThemeToDocument(theme: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    theme === "classic" ? "#fbf8f3" : "#ffe066",
  );
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "vivant",
      setTheme: (theme) => {
        applyThemeToDocument(theme);
        set({ theme });
      },
    }),
    {
      name: "elea-theme",
      onRehydrateStorage: () => (state) => {
        applyThemeToDocument(state?.theme ?? "vivant");
      },
    },
  ),
);

/** À appeler une fois au boot (avant paint si possible). */
export function initTheme() {
  const stored = useTheme.getState().theme;
  applyThemeToDocument(stored ?? "vivant");
}
