"use client";

import { useEffect } from "react";

import type { Direction } from "@/lib/game/logic";
import { useGameStore } from "@/store/useGameStore";

/**
 * Physical key positions (KeyboardEvent.code), so WASD works on any keyboard
 * layout, e.g. ZQSD on a French AZERTY keyboard uses the same keys.
 */
const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
};

/** Arrow keys / WASD steer the snake, Space pauses and resumes. */
export function useKeyboardControls() {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Never hijack typing, e.g. in the player-name input.
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, [contenteditable='true']")) {
        return;
      }

      const { status, queueDirection, togglePause, isSettingsOpen } = useGameStore.getState();
      // While the settings dialog is open, keys belong to the dialog.
      if (isSettingsOpen) return;
      const direction = KEY_TO_DIRECTION[event.code];

      if (direction && status === "playing") {
        event.preventDefault(); // stop arrow keys from scrolling the page
        queueDirection(direction);
      } else if (event.code === "Space" && (status === "playing" || status === "paused")) {
        event.preventDefault(); // stop Space from scrolling or "clicking" a focused button
        if (!event.repeat) togglePause();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
