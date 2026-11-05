import type { Theme } from "@/store/useThemeStore";

/** Colours for the 3D scene, one set per theme. */
export interface ScenePalette {
  tileLight: string;
  tileDark: string;
  snake: string;
  apple: string;
  leaf: string;
  stem: string;
  mouth: string;
  tongue: string;
  pop: string[];
}

export const SCENE_PALETTES: Record<Theme, ScenePalette> = {
  light: {
    tileLight: "#d6f5e3",
    tileDark: "#c2ecd4",
    snake: "#8b5cf6",
    apple: "#f03a3a",
    leaf: "#2fbf5b",
    stem: "#7a4a24",
    mouth: "#3b1a4f",
    tongue: "#ff6f91",
    pop: ["#ff4d4d", "#ffb020", "#ffffff"],
  },
  dark: {
    tileLight: "#1f3d37",
    tileDark: "#19332e",
    snake: "#a78bfa",
    apple: "#ff4a4a",
    leaf: "#3ddc6e",
    stem: "#9a6a3a",
    mouth: "#2a1038",
    tongue: "#ff7fa0",
    pop: ["#ff5c5c", "#ffc44d", "#e9e4ff"],
  },
};
