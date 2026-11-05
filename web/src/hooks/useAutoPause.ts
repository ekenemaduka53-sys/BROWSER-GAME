"use client";

import { useEffect } from "react";

import { useGameStore } from "@/store/useGameStore";

/** Pauses the game when the player switches tabs or the window loses focus. */
export function useAutoPause() {
  useEffect(() => {
    const pause = () => useGameStore.getState().pause();
    const onVisibilityChange = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", pause);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", pause);
    };
  }, []);
}
