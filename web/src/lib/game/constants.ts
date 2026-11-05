/**
 * Game-wide configuration.
 * Tweak these numbers to change how the game looks and feels.
 */

/** The game's title, shown on the start screen and in the browser tab. */
export const GAME_NAME = "Slither Garden";

/** Board size options: the board is N x N cells. */
export const BOARD_SIZES = {
  small: 12,
  medium: 16,
  large: 20,
} as const;
export type BoardSizeSetting = keyof typeof BOARD_SIZES;

/**
 * Speed options. `baseMs` is the time between moves at the start of a game
 * (lower = faster); `minMs` is the fastest it can ever get.
 */
export const SPEEDS = {
  slow: { baseMs: 200, minMs: 100 },
  normal: { baseMs: 150, minMs: 70 },
  fast: { baseMs: 110, minMs: 55 },
} as const;
export type SpeedSetting = keyof typeof SPEEDS;

export interface GameSettings {
  speed: SpeedSetting;
  boardSize: BoardSizeSetting;
}

export const DEFAULT_SETTINGS: GameSettings = { speed: "normal", boardSize: "medium" };

/** Every SPEEDUP_EVERY apples, the snake gets a little faster... */
export const SPEEDUP_EVERY = 5;

/** ...by this many milliseconds per move. */
export const SPEEDUP_STEP_MS = 10;

/** Longest player name allowed (the server enforces the same limit). */
export const MAX_NAME_LENGTH = 16;

/** localStorage keys. */
export const STORAGE_KEYS = {
  highScore: "slither-garden:high-score",
  playerName: "slither-garden:player-name",
  settings: "slither-garden:settings",
  theme: "slither-garden:theme",
} as const;
