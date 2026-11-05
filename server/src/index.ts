/**
 * Slither Garden live leaderboard server.
 *
 * A plain Node.js HTTP server with Socket.IO on top:
 *  - GET /health            -> "is the server up?" (used by Render)
 *  - socket "score:submit"   -> a player sends { name, score } when a game ends
 *  - socket "leaderboard:update" <- everyone receives the new top 10
 */
import { createServer } from "node:http";

import { Server } from "socket.io";

import { Leaderboard, validateSubmission } from "./leaderboard.js";
import type { ClientToServerEvents, ServerToClientEvents } from "./types.js";

/** Render (and most hosts) tell us which port to use via PORT. */
const PORT = Number(process.env.PORT) || 4000;

/**
 * Which websites may connect, e.g. "https://my-game.vercel.app".
 * Comma-separate several. Unset = allow any origin (handy for local dev).
 */
const allowedOrigins = process.env.CLIENT_ORIGIN?.split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

/** Minimum time between two submissions from the same connection. */
const SUBMIT_COOLDOWN_MS = 2000;

const leaderboard = new Leaderboard(10);

// Plain HTTP handler for everything that isn't Socket.IO traffic.
const httpServer = createServer((req, res) => {
  if (req.url === "/" || req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", players: io.engine.clientsCount }));
    return;
  }
  res.writeHead(404).end();
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: allowedOrigins?.length ? allowedOrigins : "*" },
});

io.on("connection", (socket) => {
  // Send the current top 10 straight away so the list is never empty on load.
  socket.emit("leaderboard:update", leaderboard.top());

  let lastSubmitAt = 0;

  socket.on("score:submit", (payload, ack) => {
    // A badly behaved client might not send a callback.
    const reply = typeof ack === "function" ? ack : () => {};

    const now = Date.now();
    if (now - lastSubmitAt < SUBMIT_COOLDOWN_MS) {
      reply({ ok: false, error: "Too many submissions, slow down" });
      return;
    }
    lastSubmitAt = now;

    const result = validateSubmission(payload);
    if (!result.ok) {
      reply(result);
      return;
    }

    const { entry, rank } = leaderboard.add(result.value.name, result.value.score, now);
    reply({ ok: true, entry, rank });

    // Only broadcast when the top 10 actually changed.
    if (rank !== null) {
      io.emit("leaderboard:update", leaderboard.top());
      console.log(`#${rank} ${entry.name} - ${entry.score}`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Leaderboard server listening on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins?.length ? allowedOrigins.join(", ") : "any (*)"}`);
});
