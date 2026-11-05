"use client";

import { useFrame } from "@react-three/fiber";

import { gameClock } from "@/lib/game/clock";
import { useGameStore } from "@/store/useGameStore";

/**
 * Count at most this much time per frame. Slow devices still play at the
 * right speed, but one long hiccup can't make the snake jump many cells.
 */
const MAX_FRAME_MS = 250;

/**
 * The heartbeat of the game. Runs once per rendered frame:
 * it collects elapsed time and calls `tick()` (one snake move) each time a
 * full tick interval has passed. It renders nothing.
 */
export function GameLoop() {
  useFrame((_, delta) => {
    const { status, tickMs, tick } = useGameStore.getState();

    if (status === "over" || status === "menu") {
      gameClock.progress = 1;
      return;
    }
    // While paused, keep the clock frozen exactly where it is.
    if (status === "paused") return;

    gameClock.elapsedMs += Math.min(delta * 1000, MAX_FRAME_MS);

    // Usually 0 or 1 tick per frame; a loop handles slow frames correctly.
    while (gameClock.elapsedMs >= tickMs) {
      gameClock.elapsedMs -= tickMs;
      tick();
      if (useGameStore.getState().status !== "playing") break;
    }

    gameClock.progress = Math.min(gameClock.elapsedMs / useGameStore.getState().tickMs, 1);
  });

  return null;
}
