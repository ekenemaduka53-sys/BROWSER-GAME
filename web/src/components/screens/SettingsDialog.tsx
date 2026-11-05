"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  BOARD_SIZES,
  SPEEDS,
  type BoardSizeSetting,
  type SpeedSetting,
} from "@/lib/game/constants";
import { useGameStore } from "@/store/useGameStore";

/** Speed and board-size settings. Opening it pauses the game (see setSettingsOpen). */
export function SettingsDialog() {
  const isOpen = useGameStore((s) => s.isSettingsOpen);
  const setOpen = useGameStore((s) => s.setSettingsOpen);
  const settings = useGameStore((s) => s.settings);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const setBoardSize = useGameStore((s) => s.setBoardSize);
  const status = useGameStore((s) => s.status);
  const gridSize = useGameStore((s) => s.gridSize);

  // Changing the board size mid-game would move the walls, so it waits.
  const sizeIsPending = status !== "menu" && BOARD_SIZES[settings.boardSize] !== gridSize;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Settings</DialogTitle>
          <DialogDescription>
            {status === "paused" ? "The game is paused while you're here." : "Choose how you like to play."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label>Speed</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            className="w-full"
            value={settings.speed}
            // An empty value means the active item was clicked again: keep it.
            onValueChange={(value) => value && setSpeed(value as SpeedSetting)}
          >
            {(Object.keys(SPEEDS) as SpeedSetting[]).map((speed) => (
              <ToggleGroupItem key={speed} value={speed} className="h-10 flex-1 capitalize data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                {speed}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Board size</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            className="w-full"
            value={settings.boardSize}
            onValueChange={(value) => value && setBoardSize(value as BoardSizeSetting)}
          >
            {(Object.keys(BOARD_SIZES) as BoardSizeSetting[]).map((size) => (
              <ToggleGroupItem key={size} value={size} className="h-11 flex-1 flex-col gap-0 capitalize data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <span>{size}</span>
                <span className="text-[10px] opacity-70">
                  {BOARD_SIZES[size]}×{BOARD_SIZES[size]}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {sizeIsPending && (
            <p className="text-xs text-muted-foreground">The new board size starts with your next game.</p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)} className="font-bold">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
