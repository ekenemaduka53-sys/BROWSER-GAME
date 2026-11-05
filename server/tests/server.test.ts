/**
 * Integration test: starts the real server on a spare port and talks to it
 * with two Socket.IO clients, like two players in different browsers.
 */
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { after, before, describe, it } from "node:test";

import { io as connect, type Socket } from "socket.io-client";

import type { LeaderboardEntry, SubmitScoreAck } from "../src/types";

const PORT = 4123;
const URL = `http://localhost:${PORT}`;
let server: ChildProcess;

function waitFor<T>(socket: Socket, event: string, match: (data: T) => boolean): Promise<T> {
  return new Promise((resolve) => {
    const handler = (data: T) => {
      if (!match(data)) return;
      socket.off(event, handler);
      resolve(data);
    };
    socket.on(event, handler);
  });
}

before(async () => {
  server = spawn(process.execPath, ["--import", "tsx", "src/index.ts"], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ["ignore", "pipe", "inherit"],
  });
  // Wait for the "listening" log line.
  await new Promise<void>((resolve) => {
    server.stdout!.on("data", (chunk: Buffer) => {
      if (chunk.toString().includes("listening")) resolve();
    });
  });
});

after(() => {
  server.kill();
});

describe("leaderboard server", () => {
  it("answers the health check", async () => {
    const res = await fetch(`${URL}/health`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).status, "ok");
  });

  it("broadcasts a new score to every connected player", async () => {
    const alice = connect(URL, { transports: ["websocket"] });
    const bob = connect(URL, { transports: ["websocket"] });

    // Both receive the (empty) list on connect.
    await Promise.all([
      waitFor<LeaderboardEntry[]>(alice, "leaderboard:update", () => true),
      waitFor<LeaderboardEntry[]>(bob, "leaderboard:update", () => true),
    ]);

    const bobSees = waitFor<LeaderboardEntry[]>(bob, "leaderboard:update", (list) =>
      list.some((e) => e.name === "Alice"),
    );
    const ack = await new Promise<SubmitScoreAck>((resolve) =>
      alice.emit("score:submit", { name: "Alice", score: 7 }, resolve),
    );

    assert.equal(ack.ok, true);
    assert.equal(ack.ok && ack.rank, 1);
    const list = await bobSees;
    assert.equal(list[0].name, "Alice");
    assert.equal(list[0].score, 7);

    // Invalid data is rejected with an error (after the cooldown).
    await new Promise((r) => setTimeout(r, 2100));
    const bad = await new Promise<SubmitScoreAck>((resolve) =>
      alice.emit("score:submit", { name: "", score: 5 }, resolve),
    );
    assert.equal(bad.ok, false);

    alice.close();
    bob.close();
  });
});
