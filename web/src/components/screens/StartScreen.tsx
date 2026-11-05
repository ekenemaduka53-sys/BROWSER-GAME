"use client";

import { Moon, Play, Settings, Sun } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GAME_NAME, MAX_NAME_LENGTH } from "@/lib/game/constants";
import { useGameStore } from "@/store/useGameStore";
import { useThemeStore } from "@/store/useThemeStore";

import { Leaderboard } from "./Leaderboard";
import { Overlay } from "./Overlay";

/** Title, player-name input, Play button, controls hint and the live top 10. */
export function StartScreen() {
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const startGame = useGameStore((s) => s.startGame);
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const canPlay = playerName.trim().length > 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canPlay) return;
    setPlayerName(playerName.trim());
    // Drop focus from the input so Space/arrow keys go to the game.
    (document.activeElement as HTMLElement | null)?.blur();
    startGame();
  }

  return (
    <Overlay>
      <Card className="relative w-full max-w-sm shadow-2xl">
        {/* Settings and theme are reachable from the start screen too. */}
        <div className="absolute top-2 right-2 flex gap-0.5">
          <Button variant="ghost" size="icon" aria-label="Settings" title="Settings" onClick={() => setSettingsOpen(true)}>
            <Settings />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title="Toggle theme"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
        </div>
        <CardContent className="flex flex-col gap-4">
          <div className="text-center">
            <div className="text-4xl" aria-hidden>
              🐍
            </div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
              {GAME_NAME}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="player-name">Player name</Label>
              <Input
                id="player-name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Noodle"
                maxLength={MAX_NAME_LENGTH}
                autoComplete="nickname"
                enterKeyHint="go"
                className="h-11 text-base"
              />
            </div>
            <Button type="submit" size="lg" disabled={!canPlay} className="h-12 text-base font-bold">
              <Play className="fill-current" /> Play
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Use arrow keys, WASD or swipe
            </p>
          </form>

          <Leaderboard highlightName={playerName.trim()} compact />
        </CardContent>
      </Card>
    </Overlay>
  );
}
