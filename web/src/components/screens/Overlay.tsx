import type { ReactNode } from "react";

/**
 * A see-through layer over the board that centres a card (start screen,
 * game over). It scrolls on very short screens so the card is always reachable.
 */
export function Overlay({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 overflow-y-auto bg-black/25 backdrop-blur-[2px] animate-in fade-in-0">
      <div className="flex min-h-full items-center justify-center p-4">{children}</div>
    </div>
  );
}
