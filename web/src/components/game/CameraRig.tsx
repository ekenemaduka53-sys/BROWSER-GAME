"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

import { useGameStore } from "@/store/useGameStore";

/**
 * A straight top-down orthographic camera. Orthographic means no perspective:
 * far cells look exactly as big as near ones, so the board looks flat and clean.
 *
 * For an orthographic camera, `zoom` = screen pixels per world unit. One cell
 * is one world unit, so zoom = canvas size / cells and the board always fills
 * the canvas exactly, whatever the screen size.
 */
export function CameraRig() {
  const getThree = useThree((s) => s.get);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const gridSize = useGameStore((s) => s.gridSize);

  useEffect(() => {
    const { camera } = getThree();
    // "Up" on screen is -Z, so cell row 0 is at the top, like a paper grid.
    camera.up.set(0, 0, -1);
    camera.position.set(0, 50, 0);
    camera.lookAt(0, 0, 0);
    camera.zoom = Math.min(width, height) / gridSize;
    camera.updateProjectionMatrix();
  }, [getThree, width, height, gridSize]);

  return null;
}
