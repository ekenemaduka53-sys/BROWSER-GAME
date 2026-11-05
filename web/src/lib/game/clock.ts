/**
 * The game clock, shared between the game loop and the 3D snake.
 *
 * The rules move the snake one whole cell per "tick", but the screen redraws
 * ~60 times a second. `progress` (0 to 1) says how far we are between the last
 * tick and the next one, so the snake can glide smoothly between cells instead
 * of jumping.
 *
 * It is a plain mutable object, not React state: it changes every frame, and
 * putting it in state would re-render React 60 times a second for nothing.
 */
export const gameClock = {
  /** Milliseconds collected since the last tick. */
  elapsedMs: 0,
  /** 0 = at the previous cell, 1 = arrived at the current cell. */
  progress: 1,
};

export function resetGameClock(): void {
  gameClock.elapsedMs = 0;
  gameClock.progress = 1;
}
