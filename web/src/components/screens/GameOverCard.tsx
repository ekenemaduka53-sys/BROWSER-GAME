"use client";

import { Apple, RotateCcw, Trophy } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGameStore } from "@/store/useGameStore";
import { useLeaderboardStore } from "@/store/useLeaderboardStore";

import { Leaderboard } from "./Leaderboard";
import { Overlay } from "./Overlay";

/** Shown over the board when the snake crashes. */
export function GameOverCard() {
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const isNewHighScore = useGameStore((s) => s.isNewHighScore);
  const playerName = useGameStore((s) => s.playerName);
  const startGame = useGameStore((s) => s.startGame);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const lastRank = useLeaderboardStore((s) => s.lastRank);

  return (
    <Overlay>
      <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95" role="dialog" aria-label="Game over">
        <CardContent className="flex flex-col gap-4">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold">Game over!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {score === 0 ? "Oops — try steering towards the apple." : `Nice run, ${playerName}!`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ScoreBox label="Score" value={score} icon={<Apple className="size-5 fill-red-500 text-red-500" />} />
            <ScoreBox
              label="High score"
              value={highScore}
              icon={<Trophy className="size-5 fill-amber-400 text-amber-400" />}
            />
          </div>

          {(isNewHighScore || lastRank !== null) && (
            <div className="flex flex-wrap justify-center gap-2">
              {isNewHighScore && (
                <Badge className="bg-amber-400 text-amber-950">
                  <Trophy /> New high score!
                </Badge>
              )}
              {lastRank !== null && <Badge>#{lastRank} on the live leaderboard</Badge>}
            </div>
          )}

          <Leaderboard highlightName={playerName} compact />

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="lg" className="h-11" onClick={goToMenu}>
              Main menu
            </Button>
            <Button
              autoFocus
              size="lg"
              className="h-11 font-bold"
              onClick={(e) => {
                e.currentTarget.blur();
                startGame();
              }}
            >
              <RotateCcw /> Replay
            </Button>
          </div>
        </CardContent>
      </Card>
    </Overlay>
  );
}

function ScoreBox({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-xl bg-muted p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {icon}
        {label}
      </div>
      <div className="text-3xl font-extrabold tabular-nums">{value}</div>
    </div>
  );
}
