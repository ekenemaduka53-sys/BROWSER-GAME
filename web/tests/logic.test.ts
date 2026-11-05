/**
 * Unit tests for the pure Snake rules. Run with: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createInitialSnake,
  isOpposite,
  spawnFood,
  stepSnake,
  tickIntervalForScore,
  type Cell,
} from "../src/lib/game/logic";

const GRID = 10;

describe("stepSnake", () => {
  it("moves the head forward and the tail along", () => {
    const snake = createInitialSnake(GRID); // (5,5) (4,5) (3,5), facing right
    const result = stepSnake(snake, "right", null, GRID);
    assert.equal(result.kind, "moved");
    if (result.kind !== "moved") return;
    assert.deepEqual(result.snake, [
      { x: 6, y: 5 },
      { x: 5, y: 5 },
      { x: 4, y: 5 },
    ]);
    assert.equal(result.ate, false);
  });

  it("grows by one when eating the apple", () => {
    const snake = createInitialSnake(GRID);
    const result = stepSnake(snake, "right", { x: 6, y: 5 }, GRID);
    assert.equal(result.kind, "moved");
    if (result.kind !== "moved") return;
    assert.equal(result.ate, true);
    assert.equal(result.snake.length, 4);
  });

  it("crashes into a wall", () => {
    const snake: Cell[] = [{ x: 0, y: 3 }, { x: 1, y: 3 }];
    assert.deepEqual(stepSnake(snake, "left", null, GRID), { kind: "crashed", reason: "wall" });
  });

  it("crashes into its own body", () => {
    // A U-shape: moving up from (1,1) hits (1,0).
    const snake: Cell[] = [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 0 },
    ];
    assert.deepEqual(stepSnake(snake, "up", null, GRID), { kind: "crashed", reason: "self" });
  });

  it("may move into the cell its tail is leaving", () => {
    // A 2x2 loop: the head chases the tail.
    const snake: Cell[] = [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
      { x: 0, y: 0 },
    ];
    assert.equal(stepSnake(snake, "up", null, GRID).kind, "moved");
  });
});

describe("helpers", () => {
  it("detects opposite directions", () => {
    assert.equal(isOpposite("left", "right"), true);
    assert.equal(isOpposite("up", "down"), true);
    assert.equal(isOpposite("up", "left"), false);
  });

  it("never spawns food on the snake", () => {
    const snake = createInitialSnake(GRID);
    for (let i = 0; i < 200; i++) {
      const food = spawnFood(snake, GRID)!;
      assert.ok(!snake.some((c) => c.x === food.x && c.y === food.y));
    }
  });

  it("returns null when the board is full", () => {
    const full: Cell[] = [];
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) full.push({ x, y });
    assert.equal(spawnFood(full, 2), null);
  });

  it("speeds up every 5 points, with a minimum", () => {
    const cfg = { baseMs: 150, speedupEvery: 5, stepMs: 10, minMs: 60 };
    assert.equal(tickIntervalForScore(0, cfg), 150);
    assert.equal(tickIntervalForScore(4, cfg), 150);
    assert.equal(tickIntervalForScore(5, cfg), 140);
    assert.equal(tickIntervalForScore(12, cfg), 130);
    assert.equal(tickIntervalForScore(500, cfg), 60);
  });
});
