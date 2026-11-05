import { create } from "zustand";

import { resetGameClock } from "@/lib/game/clock";
import {
  BOARD_SIZES,
  DEFAULT_SETTINGS,
  MAX_NAME_LENGTH,
  SPEEDS,
  SPEEDUP_EVERY,
  SPEEDUP_STEP_MS,
  STORAGE_KEYS,
  type BoardSizeSetting,
  type GameSettings,
  type SpeedSetting,
} from "@/lib/game/constants";
import {
  createInitialSnake,
  isOpposite,
  spawnFood,
  stepSnake,
  tickIntervalForScore,
  type Cell,
  type Direction,
} from "@/lib/game/logic";
import { readNumber, readString, writeString } from "@/lib/storage";

/**
 * Which screen the player is on:
 * - menu:    start screen (name input + Play)
 * - playing: the snake is moving
 * - paused:  frozen until Space / Resume
 * - over:    the snake crashed; the game-over card is shown
 */
export type GameStatus = "menu" | "playing" | "paused" | "over";

/** Allow at most this many turns buffered between two ticks. */
const MAX_QUEUED_TURNS = 2;

/** Milliseconds between moves for a score, using the chosen speed setting. */
function tickMsFor(score: number, speed: SpeedSetting): number {
  return tickIntervalForScore(score, {
    baseMs: SPEEDS[speed].baseMs,
    minMs: SPEEDS[speed].minMs,
    speedupEvery: SPEEDUP_EVERY,
    stepMs: SPEEDUP_STEP_MS,
  });
}

interface GameState {
  // ----- data -----
  status: GameStatus;
  playerName: string;
  score: number;
  highScore: number;
  /** True when the game that just ended beat the previous high score. */
  isNewHighScore: boolean;
  /** Speed and board size chosen in the settings dialog. */
  settings: GameSettings;
  /** Cells per side of the board currently in play. */
  gridSize: number;
  /** Current speed: milliseconds between moves. */
  tickMs: number;
  /** Snake cells, head first. */
  snake: Cell[];
  /** Snake cells one tick ago; the 3D view glides from these to `snake`. */
  previousSnake: Cell[];
  /** The direction the snake moved on the last tick. */
  direction: Direction;
  /** Turns pressed by the player that haven't been applied yet. */
  directionQueue: Direction[];
  food: Cell | null;
  /** Where the last apple was eaten; `id` changes every time (drives the "pop" effect). */
  lastMeal: { x: number; y: number; id: number } | null;
  isSettingsOpen: boolean;

  // ----- actions -----
  /** Reads high score, player name and settings from localStorage (client only). */
  loadSavedData: () => void;
  setPlayerName: (name: string) => void;
  startGame: () => void;
  queueDirection: (direction: Direction) => void;
  /** Advances the game by one move. Called by the game loop. */
  tick: () => void;
  togglePause: () => void;
  pause: () => void;
  goToMenu: () => void;
  setSpeed: (speed: SpeedSetting) => void;
  setBoardSize: (size: BoardSizeSetting) => void;
  /** Opening the settings pauses a running game. */
  setSettingsOpen: (open: boolean) => void;
}

/** The board as it looks before a game starts. */
function freshBoard(gridSize: number, speed: SpeedSetting) {
  const snake = createInitialSnake(gridSize);
  return {
    gridSize,
    snake,
    previousSnake: snake,
    direction: "right" as Direction,
    directionQueue: [] as Direction[],
    // Fixed spot for the very first apple keeps server and client render identical.
    food: { x: Math.min(snake[0].x + 3, gridSize - 1), y: snake[0].y },
    lastMeal: null,
    score: 0,
    tickMs: tickMsFor(0, speed),
  };
}

/** Reads saved settings, ignoring anything missing or invalid. */
function loadSettings(): GameSettings {
  try {
    const saved = JSON.parse(readString(STORAGE_KEYS.settings) ?? "{}") as Partial<GameSettings>;
    return {
      speed: saved.speed && saved.speed in SPEEDS ? saved.speed : DEFAULT_SETTINGS.speed,
      boardSize:
        saved.boardSize && saved.boardSize in BOARD_SIZES
          ? saved.boardSize
          : DEFAULT_SETTINGS.boardSize,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const useGameStore = create<GameState>()((set, get) => ({
  status: "menu",
  playerName: "",
  highScore: 0,
  isNewHighScore: false,
  settings: DEFAULT_SETTINGS,
  isSettingsOpen: false,
  ...freshBoard(BOARD_SIZES[DEFAULT_SETTINGS.boardSize], DEFAULT_SETTINGS.speed),

  loadSavedData: () => {
    const settings = loadSettings();
    set({
      highScore: readNumber(STORAGE_KEYS.highScore, 0),
      playerName: readString(STORAGE_KEYS.playerName) ?? "",
      settings,
      ...(get().status === "menu" ? freshBoard(BOARD_SIZES[settings.boardSize], settings.speed) : {}),
    });
  },

  setPlayerName: (name) => {
    const trimmed = name.slice(0, MAX_NAME_LENGTH);
    writeString(STORAGE_KEYS.playerName, trimmed);
    set({ playerName: trimmed });
  },

  startGame: () => {
    const { settings } = get();
    const board = freshBoard(BOARD_SIZES[settings.boardSize], settings.speed);
    resetGameClock();
    set({
      ...board,
      // A random first apple once the game actually starts.
      food: spawnFood(board.snake, board.gridSize),
      status: "playing",
      isNewHighScore: false,
    });
  },

  queueDirection: (next) => {
    const { status, direction, directionQueue } = get();
    if (status !== "playing" || directionQueue.length >= MAX_QUEUED_TURNS) return;

    // Compare against the last *planned* direction, so quick double-taps like
    // "up, left" work but an instant U-turn into your own neck is ignored.
    const last = directionQueue[directionQueue.length - 1] ?? direction;
    if (next === last || isOpposite(next, last)) return;

    set({ directionQueue: [...directionQueue, next] });
  },

  tick: () => {
    const state = get();
    if (state.status !== "playing") return;

    // Take the next buffered turn, if any.
    const [queued, ...restOfQueue] = state.directionQueue;
    const direction = queued ?? state.direction;

    const result = stepSnake(state.snake, direction, state.food, state.gridSize);

    if (result.kind === "crashed") {
      endGame(state.score);
      return;
    }

    const score = result.ate ? state.score + 1 : state.score;
    const food = result.ate ? spawnFood(result.snake, state.gridSize) : state.food;

    set({
      previousSnake: state.snake,
      snake: result.snake,
      direction,
      directionQueue: restOfQueue,
      score,
      food,
      tickMs: tickMsFor(score, state.settings.speed),
      ...(result.ate && state.food
        ? { lastMeal: { x: state.food.x, y: state.food.y, id: score } }
        : {}),
    });

    // No free cell left for an apple: the board is full, the game is complete.
    if (food === null) endGame(score);
  },

  togglePause: () => {
    const { status } = get();
    if (status === "playing") set({ status: "paused" });
    else if (status === "paused") set({ status: "playing" });
  },

  pause: () => {
    if (get().status === "playing") set({ status: "paused" });
  },

  goToMenu: () => {
    const { settings } = get();
    set({
      ...freshBoard(BOARD_SIZES[settings.boardSize], settings.speed),
      status: "menu",
      isNewHighScore: false,
    });
  },

  setSpeed: (speed) => {
    const settings = { ...get().settings, speed };
    writeString(STORAGE_KEYS.settings, JSON.stringify(settings));
    // A new speed applies right away, even in the middle of a game.
    set({ settings, tickMs: tickMsFor(get().score, speed) });
  },

  setBoardSize: (boardSize) => {
    const settings = { ...get().settings, boardSize };
    writeString(STORAGE_KEYS.settings, JSON.stringify(settings));
    set({ settings });
    // On the start screen, show the new board immediately. During a game it
    // would move the walls, so it waits until the next game instead.
    if (get().status === "menu") set(freshBoard(BOARD_SIZES[boardSize], settings.speed));
  },

  setSettingsOpen: (open) => {
    if (open) get().pause();
    set({ isSettingsOpen: open });
  },
}));

/** Ends the current game and saves a new high score if it was beaten. */
function endGame(finalScore: number) {
  const { highScore, snake } = useGameStore.getState();
  const isNewHighScore = finalScore > highScore;
  if (isNewHighScore) writeString(STORAGE_KEYS.highScore, String(finalScore));

  useGameStore.setState({
    status: "over",
    // Freeze the snake where it is (no more gliding).
    previousSnake: snake,
    directionQueue: [],
    isNewHighScore,
    highScore: Math.max(highScore, finalScore),
  });
}
