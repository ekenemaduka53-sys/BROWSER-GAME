"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

import { GameOverCard } from "@/components/screens/GameOverCard";
import { PauseOverlay } from "@/components/screens/PauseOverlay";
import { SettingsDialog } from "@/components/screens/SettingsDialog";
import { StartScreen } from "@/components/screens/StartScreen";
import { TopBar } from "@/components/screens/TopBar";
import { useAutoPause } from "@/hooks/useAutoPause";
import { useKeyboardControls } from "@/hooks/useKeyboardControls";
import { useSwipeControls } from "@/hooks/useSwipeControls";
import { useGameStore } from "@/store/useGameStore";
import { useLeaderboardStore } from "@/store/useLeaderboardStore";
import { useThemeStore } from "@/store/useThemeStore";

// The 3D scene needs WebGL, which only exists in the browser, so we skip
// server rendering for it and show a plain placeholder while it loads.
const GameCanvas = dynamic(() => import("@/components/game/GameCanvas"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-muted" />,
});

/**
 * The whole game: a framed card with the top bar and the 3D board, plus the
 * 2D screens (start, pause, game over, settings) layered on top.
 */
export function Game() {
  const containerRef = useRef<HTMLElement>(null);
  const status = useGameStore((s) => s.status);
  const isSettingsOpen = useGameStore((s) => s.isSettingsOpen);

  // Input handling
  useKeyboardControls();
  useSwipeControls(containerRef);
  useAutoPause();

  useEffect(() => {
    // Saved high score, name, settings and theme can only be read in the browser.
    useGameStore.getState().loadSavedData();
    useThemeStore.getState().syncFromDocument();
    // Connect to the live leaderboard.
    useLeaderboardStore.getState().connect();
    // Development only: inspect the game from the browser console
    // with window.__gameStore.getState(). Removed from production builds.
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __gameStore: typeof useGameStore }).__gameStore = useGameStore;
    }

    // When a game ends, send the result to the leaderboard server.
    return useGameStore.subscribe((state, previous) => {
      if (state.status === "over" && previous.status !== "over") {
        useLeaderboardStore.getState().submitScore(state.playerName, state.score);
      }
    });
  }, []);

  return (
    <main
      ref={containerRef}
      // touch-none while playing: the browser won't scroll/zoom on swipes.
      className={`relative flex h-dvh w-full items-center justify-center overflow-hidden bg-garden-bg p-3 select-none sm:p-6 ${
        status === "playing" ? "touch-none" : ""
      }`}
    >
      {/*
        The frame is as wide as possible while the whole thing (top bar + square
        board) still fits the screen height: width <= screen height - extra space.
      */}
      <div className="w-[min(100%,calc(100dvh-5.5rem),48rem)] rounded-3xl bg-garden-frame p-2 shadow-xl sm:w-[min(100%,calc(100dvh-7.5rem),48rem)] sm:p-3">
        <TopBar />
        <div className="relative mt-2 aspect-square w-full overflow-hidden rounded-2xl sm:mt-3">
          <GameCanvas />
          {status === "paused" && !isSettingsOpen && <PauseOverlay />}
        </div>
      </div>

      {status === "menu" && <StartScreen />}
      {status === "over" && <GameOverCard />}
      <SettingsDialog />
    </main>
  );
}
