import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Leaderboard, validateSubmission } from "../src/leaderboard";

describe("Leaderboard", () => {
  it("keeps scores sorted, highest first", () => {
    const board = new Leaderboard(10);
    board.add("a", 5, 1);
    board.add("b", 12, 2);
    board.add("c", 8, 3);
    assert.deepEqual(board.top().map((e) => e.score), [12, 8, 5]);
  });

  it("keeps only the top N and reports ranks", () => {
    const board = new Leaderboard(3);
    board.add("a", 10, 1);
    board.add("b", 20, 2);
    board.add("c", 30, 3);
    assert.equal(board.add("low", 5, 4).rank, null); // not good enough
    assert.equal(board.add("high", 25, 5).rank, 2);
    assert.deepEqual(board.top().map((e) => e.name), ["c", "high", "b"]);
  });

  it("puts the earlier score first on a tie", () => {
    const board = new Leaderboard(10);
    board.add("first", 7, 1);
    assert.equal(board.add("second", 7, 2).rank, 2);
  });

  it("ignores zero scores", () => {
    const board = new Leaderboard(10);
    assert.equal(board.add("zero", 0).rank, null);
    assert.equal(board.top().length, 0);
  });
});

describe("validateSubmission", () => {
  it("accepts and cleans a valid submission", () => {
    assert.deepEqual(validateSubmission({ name: "  Ada \n Lovelace  ", score: 9 }), {
      ok: true,
      value: { name: "Ada Lovelace", score: 9 },
    });
  });

  it("truncates long names", () => {
    const result = validateSubmission({ name: "x".repeat(50), score: 1 });
    assert.ok(result.ok && result.value.name.length === 16);
  });

  it("rejects bad input", () => {
    for (const bad of [
      null,
      "hi",
      { name: "", score: 1 },
      { name: "   ", score: 1 },
      { name: 42, score: 1 },
      { name: "ok", score: -1 },
      { name: "ok", score: 1.5 },
      { name: "ok", score: "10" },
      { name: "ok", score: 999999 },
    ]) {
      assert.equal(validateSubmission(bad).ok, false, JSON.stringify(bad));
    }
  });
});
