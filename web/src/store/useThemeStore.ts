import { create } from "zustand";

import { STORAGE_KEYS } from "@/lib/game/constants";
import { writeString } from "@/lib/storage";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  /** Reads the theme the inline script in layout.tsx already applied. */
  syncFromDocument: () => void;
  toggleTheme: () => void;
}

/**
 * Light / dark theme. The `dark` class on <html> switches every Tailwind and
 * shadcn colour; the 3D scene reads `theme` from here to pick its colours.
 */
export const useThemeStore = create<ThemeState>()((set, get) => ({
  theme: "light",

  syncFromDocument: () => {
    set({ theme: document.documentElement.classList.contains("dark") ? "dark" : "light" });
  },

  toggleTheme: () => {
    const theme: Theme = get().theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
    writeString(STORAGE_KEYS.theme, theme);
    set({ theme });
  },
}));
