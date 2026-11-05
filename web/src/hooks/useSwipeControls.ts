"use client";

import { useEffect, type RefObject } from "react";

import { useGameStore } from "@/store/useGameStore";

/** How far (in CSS pixels) a finger must travel to count as a swipe. */
const SWIPE_THRESHOLD = 24;

/**
 * Swipe to steer on touch screens.
 *
 * The turn fires as soon as the finger has moved far enough — no need to lift
 * it — and the starting point is then reset, so one continuous drag can make
 * several turns (e.g. right, then down).
 *
 * While playing we call preventDefault() on touchmove so the page doesn't
 * scroll, bounce or zoom. That requires a non-passive listener, which React's
 * onTouchMove can't provide, so we attach native listeners to the element.
 */
export function useSwipeControls(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let start: { x: number; y: number } | null = null;

    const isPlaying = () => useGameStore.getState().status === "playing";

    function onTouchStart(event: TouchEvent) {
      if (!isPlaying()) return;
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY };
    }

    function onTouchMove(event: TouchEvent) {
      if (!isPlaying()) return;
      event.preventDefault(); // no page scrolling while swiping
      if (!start) return;

      const touch = event.touches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;

      // The bigger movement wins: mostly sideways = left/right, else up/down.
      const { queueDirection } = useGameStore.getState();
      if (Math.abs(dx) > Math.abs(dy)) queueDirection(dx > 0 ? "right" : "left");
      else queueDirection(dy > 0 ? "down" : "up");

      start = { x: touch.clientX, y: touch.clientY };
    }

    function onTouchEnd() {
      start = null;
    }

    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchmove", onTouchMove, { passive: false });
    element.addEventListener("touchend", onTouchEnd);
    element.addEventListener("touchcancel", onTouchEnd);
    return () => {
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
      element.removeEventListener("touchend", onTouchEnd);
      element.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [ref]);
}
