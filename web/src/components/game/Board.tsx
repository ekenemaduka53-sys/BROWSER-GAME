"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { useGameStore } from "@/store/useGameStore";
import { useThemeStore } from "@/store/useThemeStore";

import { SCENE_PALETTES } from "./palette";

/**
 * Builds a tiny N x N pixel image (one pixel per cell) in a checkered pattern.
 * Stretched over the floor with "nearest" filtering, every pixel becomes one
 * crisp board tile — a whole checkerboard in a single flat mesh.
 */
function createCheckerTexture(gridSize: number, light: string, dark: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = gridSize;
  canvas.height = gridSize;
  const ctx = canvas.getContext("2d")!;
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? light : dark;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * The flat two-tone checkered floor. (The border around it is plain CSS.)
 * Tiles use a basic material so they keep their exact colours; a separate
 * see-through "shadow catcher" layer on top adds the soft shadows.
 */
export function Board() {
  const gridSize = useGameStore((s) => s.gridSize);
  const theme = useThemeStore((s) => s.theme);
  const { tileLight, tileDark } = SCENE_PALETTES[theme];

  const texture = useMemo(
    () => createCheckerTexture(gridSize, tileLight, tileDark),
    [gridSize, tileLight, tileDark],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.001} receiveShadow>
        <planeGeometry args={[gridSize, gridSize]} />
        <shadowMaterial opacity={theme === "dark" ? 0.35 : 0.16} />
      </mesh>
    </group>
  );
}
