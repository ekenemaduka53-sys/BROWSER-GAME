"use client";

import { Crown } from "lucide-react";

import { useLeaderboardStore, type ConnectionStatus } from "@/store/useLeaderboardStore";

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * The live top 10. It re-renders automatically whenever the server
 * broadcasts a new leaderboard, because it reads from the Zustand store.
 */
export function Leaderboard({
  highlightName,
  compact = false,
}: {
  /** Rows with this player name are highlighted. */
  highlightName?: string;
  /** Tighter rows and a scrollable list, for use inside the cards. */
  compact?: boolean;
}) {
  const entries = useLeaderboardStore((s) => s.entries);
  const connection = useLeaderboardStore((s) => s.connection);

  return (
    <section className="rounded-xl bg-muted/60 p-3 ring-1 ring-foreground/5">
      <header className="mb-1.5 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-bold">
          <Crown className="size-4 fill-amber-400 text-amber-500" /> Live top 10
        </h3>
        <ConnectionBadge status={connection} />
      </header>

      {entries.length === 0 ? (
        <p className="py-3 text-center text-sm text-muted-foreground">
          {connection === "online"
            ? "No scores yet — be the first!"
            : connection === "connecting"
              ? "Connecting to the leaderboard…"
              : "Leaderboard offline. Your scores will be sent when it's back."}
        </p>
      ) : (
        <ol className={`space-y-0.5 ${compact ? "max-h-44 overflow-y-auto" : ""}`}>
          {entries.map((entry, index) => {
            const isYou =
              !!highlightName && entry.name.toLowerCase() === highlightName.toLowerCase();
            return (
              <li
                key={entry.id}
                className={`flex items-center gap-3 rounded-lg px-2 py-1 text-sm ${
                  isYou ? "bg-primary/15 font-semibold text-primary" : ""
                }`}
              >
                <span className="w-6 text-center text-muted-foreground tabular-nums">
                  {MEDALS[index] ?? index + 1}
                </span>
                <span className="flex-1 truncate">{entry.name}</span>
                <span className="font-bold tabular-nums">{entry.score}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const styles: Record<ConnectionStatus, { dot: string; label: string }> = {
    online: { dot: "bg-emerald-500 animate-pulse", label: "Live" },
    connecting: { dot: "bg-amber-400", label: "Connecting" },
    offline: { dot: "bg-red-400", label: "Offline" },
  };
  const { dot, label } = styles[status];
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`size-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
