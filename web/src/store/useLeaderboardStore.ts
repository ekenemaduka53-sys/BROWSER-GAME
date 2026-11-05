import { create } from "zustand";

import type { LeaderboardEntry } from "@/lib/leaderboard-types";
import { getSocket } from "@/lib/socket";

export type ConnectionStatus = "connecting" | "online" | "offline";

interface LeaderboardState {
  entries: LeaderboardEntry[];
  connection: ConnectionStatus;
  /** Rank (1-10) reached by the last submitted score, or null if it missed the top 10. */
  lastRank: number | null;
  /** Opens the socket and starts listening. Safe to call more than once. */
  connect: () => void;
  submitScore: (name: string, score: number) => void;
}

let listening = false;

export const useLeaderboardStore = create<LeaderboardState>()((set) => ({
  entries: [],
  connection: "connecting",
  lastRank: null,

  connect: () => {
    if (listening) return;
    listening = true;

    const socket = getSocket();
    socket.on("connect", () => set({ connection: "online" }));
    socket.on("disconnect", () => set({ connection: "offline" }));
    socket.on("connect_error", () => set({ connection: "offline" }));
    // The server pushes the full top 10 whenever anyone sets a new score.
    socket.on("leaderboard:update", (entries) => set({ entries }));

    if (socket.connected) set({ connection: "online" });
  },

  submitScore: (name, score) => {
    set({ lastRank: null });
    // If we're offline, Socket.IO queues this and sends it once reconnected.
    getSocket().emit("score:submit", { name, score }, (result) => {
      if (result.ok) set({ lastRank: result.rank });
      else console.warn("Score rejected by server:", result.error);
    });
  },
}));
