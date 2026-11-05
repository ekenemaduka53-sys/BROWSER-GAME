/**
 * The "contract" between the browser and this server.
 *
 * The same definitions live in web/src/lib/leaderboard-types.ts. The two apps
 * deploy separately (Vercel and Render), so each keeps its own copy:
 * if you change one, change the other.
 */

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  /** When the score was achieved (ms since epoch). Earlier wins ties. */
  createdAt: number;
}

export interface ScoreSubmission {
  name: string;
  score: number;
}

/** The server's reply to a score submission. */
export type SubmitScoreAck =
  | { ok: true; entry: LeaderboardEntry; rank: number | null }
  | { ok: false; error: string };

/** Events the server sends to browsers. */
export interface ServerToClientEvents {
  /** The full, current top 10, sent on connect and after every change. */
  "leaderboard:update": (entries: LeaderboardEntry[]) => void;
}

/** Events browsers send to the server. */
export interface ClientToServerEvents {
  "score:submit": (submission: ScoreSubmission, ack: (result: SubmitScoreAck) => void) => void;
}
