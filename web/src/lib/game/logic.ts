/**
 * Pure Snake rules.
 *
 * Nothing here knows about React, Three.js or the browser. Every function takes
 * data in and returns new data out, which makes the rules easy to read, reuse
 * and unit-test (see tests/logic.test.ts).
 *
 * Coordinate system: a cell is { x, y } with (0, 0) in the top-left corner of
 * the board. x grows to the right, y grows "down" (towards the camera).
 */

export type Direction = "up" | "down" | "left" | "right";

export interface Cell {
  x: number;
  y: number;
}

/** How far one step in each direction moves the head. */
export const DIRECTION_VECTORS: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** True when two directions point opposite ways (e.g. "left" and "right"). */
export function isOpposite(a: Direction, b: Direction): boolean {
  const va = DIRECTION_VECTORS[a];
  const vb = DIRECTION_VECTORS[b];
  return va.x + vb.x === 0 && va.y + vb.y === 0;
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

export function isInsideBoard(cell: Cell, gridSize: number): boolean {
  return cell.x >= 0 && cell.y >= 0 && cell.x < gridSize && cell.y < gridSize;
}

/**
 * A new snake: 3 segments in the middle of the board, facing right.
 * Index 0 is always the head; the last index is the tail.
 */
export function createInitialSnake(gridSize: number): Cell[] {
  const mid = Math.floor(gridSize / 2);
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
}

/**
 * Picks a random empty cell for the next apple.
 * Returns null when the snake fills the whole board (the player has won).
 * `random` can be replaced in tests to get predictable results.
 */
export function spawnFood(
  snake: Cell[],
  gridSize: number,
  random: () => number = Math.random,
): Cell | null {
  const occupied = new Set(snake.map((c) => `${c.x},${c.y}`));
  const free: Cell[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(random() * free.length)];
}

/** What happened after moving the snake one step. */
export type StepResult =
  | { kind: "moved"; snake: Cell[]; ate: boolean }
  | { kind: "crashed"; reason: "wall" | "self" };

/**
 * Moves the snake one cell in `direction`.
 *
 * - Hitting a wall or its own body is a crash (game over).
 * - Landing on the food grows the snake by one: the tail stays where it is.
 * - Otherwise the head moves forward and the tail moves up behind it.
 */
export function stepSnake(
  snake: Cell[],
  direction: Direction,
  food: Cell | null,
  gridSize: number,
): StepResult {
  const head = snake[0];
  const v = DIRECTION_VECTORS[direction];
  const nextHead: Cell = { x: head.x + v.x, y: head.y + v.y };

  if (!isInsideBoard(nextHead, gridSize)) {
    return { kind: "crashed", reason: "wall" };
  }

  const ate = food !== null && sameCell(nextHead, food);

  // If we don't eat, the tail leaves its cell this tick, so the head is
  // allowed to move into the cell the tail is leaving.
  const body = ate ? snake : snake.slice(0, -1);

  if (body.some((segment) => sameCell(segment, nextHead))) {
    return { kind: "crashed", reason: "self" };
  }

  return { kind: "moved", snake: [nextHead, ...body], ate };
}

/**
 * Time between moves for a given score.
 * Every `speedupEvery` points the interval shrinks by `stepMs`, down to `minMs`.
 */
export function tickIntervalForScore(
  score: number,
  { baseMs, speedupEvery, stepMs, minMs }: {
    baseMs: number;
    speedupEvery: number;
    stepMs: number;
    minMs: number;
  },
): number {
  const level = Math.floor(score / speedupEvery);
  return Math.max(minMs, baseMs - level * stepMs);
}
