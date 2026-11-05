"use client";

import { Apple, Moon, Pause, Play, Settings, Sun, Trophy } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/useGameStore";
import { useThemeStore } from "@/store/useThemeStore";

/** The bar above the board: score and high score, plus pause, settings and theme buttons. */
export function TopBar() {
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const status = useGameStore((s) => s.status);
  const togglePause = useGameStore((s) => s.togglePause);
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  // Show the live score as the best once the player beats their record.
  const best = Math.max(score, highScore);
  const inGame = status === "playing" || status === "paused";

  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl bg-garden-bar px-3 py-1.5 text-white sm:px-4 sm:py-2">
      <div className="flex items-center gap-4 sm:gap-6">
        <Stat label="Score" value={score}>
          <Apple className="size-6 fill-red-500 text-red-500 sm:size-7" />
        </Stat>
        <Stat label="High score" value={best}>
          <Trophy className="size-6 fill-amber-400 text-amber-400 sm:size-7" />
        </Stat>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1">
        {inGame && (
          <BarButton
            label={status === "paused" ? "Resume" : "Pause"}
            onClick={togglePause}
          >
            {status === "paused" ? <Play className="fill-current" /> : <Pause className="fill-current" />}
          </BarButton>
        )}
        <BarButton label="Settings" onClick={() => setSettingsOpen(true)}>
          <Settings />
        </BarButton>
        <BarButton
          label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </BarButton>
      </div>
    </div>
  );
}

function Stat({ label, value, children }: { label: string; value: number; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${label}: ${value}`}>
      {children}
      <span className="text-2xl font-extrabold tabular-nums sm:text-3xl">{value}</span>
    </div>
  );
}

function BarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      aria-label={label}
      title={label}
      className="text-white hover:bg-white/15 hover:text-white [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-6"
      onClick={(e) => {
        e.currentTarget.blur(); // keep Space for the game, not this button
        onClick();
      }}
    >
      {children}
    </Button>
  );
}
