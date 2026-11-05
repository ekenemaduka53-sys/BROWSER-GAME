import { io, type Socket } from "socket.io-client";

import type { ClientToServerEvents, ServerToClientEvents } from "./leaderboard-types";

/**
 * Where the leaderboard server lives. Set NEXT_PUBLIC_SOCKET_URL in
 * .env.local (dev) or in Vercel's project settings (production).
 * NEXT_PUBLIC_ variables are baked into the browser bundle at build time.
 */
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;

/** One shared connection for the whole app, created on first use. */
export function getSocket(): GameSocket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      // Reconnect forever: free hosting tiers can take a while to wake up.
      reconnectionDelayMax: 10_000,
    });
  }
  return socket;
}
