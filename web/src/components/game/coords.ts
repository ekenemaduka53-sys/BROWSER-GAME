/**
 * Converts a board cell to a 3D position.
 * The board is centered on the world origin and lies flat on the XZ plane:
 * cell x -> world X, cell y -> world Z. Each cell is 1 world unit wide.
 */
export function cellToWorld(x: number, y: number, gridSize: number): [number, number] {
  const offset = gridSize / 2 - 0.5;
  return [x - offset, y - offset];
}
