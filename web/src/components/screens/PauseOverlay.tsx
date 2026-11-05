"use client";

import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/useGameStore";

/** Shown over the frozen board while the game is paused. */
export function PauseOverlay() {
  const togglePause = useGameStore((s) => s.togglePause);
  const goToMenu = useGameStore((s) => s.goToMenu);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/25 p-4 backdrop-blur-[2px]">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-8 py-6 text-center text-card-foreground shadow-xl ring-1 ring-foreground/10">
        <h2 className="text-2xl font-extrabold">Paused</h2>
        <p className="text-sm text-muted-foreground">
          <span className="pointer-coarse:hidden">Press Space to resume</span>
          <span className="hidden pointer-coarse:inline">Tap Resume to keep going</span>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={goToMenu}>
            Quit
          </Button>
          <Button
            className="font-bold"
            onClick={(e) => {
              e.currentTarget.blur();
              togglePause();
            }}
          >
            <Play className="fill-current" /> Resume
          </Button>
        </div>
      </div>
    </div>
  );
}
