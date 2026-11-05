import { randomUUID } from "node:crypto";

import type { LeaderboardEntry, ScoreSubmission } from "./types.js";

/** Same limit as the browser's player-name input. */
export const MAX_NAME_LENGTH = 16;

/**
 * Highest score we accept. The largest board is 20x20 = 400 cells, so a real
 * game can't score more than ~397. Anything above this is clearly bogus.
 */
export const MAX_SCORE = 1000;

/**
 * Keeps the best N scores in memory, highest first.
 * (In memory means the list resets when the server restarts. Swap this class
 * for a database-backed one if you need it to survive restarts.)
 */
export class Leaderboard {
  private entries: LeaderboardEntry[] = [];

  constructor(private readonly size = 10) {}

  /** A copy of the current top list, so callers can't modify ours. */
  top(): LeaderboardEntry[] {
    return [...this.entries];
  }

  /**
   * Records a score. Returns the new entry and its rank (1 = first place),
   * or rank null if it wasn't good enough for the top list.
   */
  add(name: string, score: number, now = Date.now()): { entry: LeaderboardEntry; rank: number | null } {
    const entry: LeaderboardEntry = { id: randomUUID(), name, score, createdAt: now };

    // A score of 0 never earns a spot on the board.
    if (score <= 0) return { entry, rank: null };

    this.entries.push(entry);
    // Highest score first; on a tie, whoever got there first stays ahead.
    this.entries.sort((a, b) => b.score - a.score || a.createdAt - b.createdAt);
    this.entries = this.entries.slice(0, this.size);

    const index = this.entries.findIndex((e) => e.id === entry.id);
    return { entry, rank: index === -1 ? null : index + 1 };
  }
}

/**
 * Never trust data from the network: check the shape and clean up the values.
 * Returns the cleaned submission, or an error message.
 */
export function validateSubmission(
  payload: unknown,
): { ok: true; value: ScoreSubmission } | { ok: false; error: string } {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, error: "Invalid payload" };
  }
  const { name, score } = payload as Record<string, unknown>;

  if (typeof name !== "string") return { ok: false, error: "Name must be text" };
  const cleanName = name
    .replace(/[\u0000-\u001f\u007f]/g, "") // strip control characters
    .replace(/\s+/g, " ") // collapse whitespace
    .trim()
    .slice(0, MAX_NAME_LENGTH);
  if (cleanName.length === 0) return { ok: false, error: "Name is required" };

  if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return { ok: false, error: "Score must be a whole number between 0 and " + MAX_SCORE };
  }

  return { ok: true, value: { name: cleanName, score } };
}
