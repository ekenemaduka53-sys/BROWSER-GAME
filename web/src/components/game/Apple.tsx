"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { useGameStore } from "@/store/useGameStore";
import { useThemeStore } from "@/store/useThemeStore";

import { cellToWorld } from "./coords";
import { SCENE_PALETTES, type ScenePalette } from "./palette";

const APPLE_RADIUS = 0.38;

/** The food: a simple, bright red apple with a small leaf. */
export function Apple() {
  const food = useGameStore((s) => s.food);
  const gridSize = useGameStore((s) => s.gridSize);
  const theme = useThemeStore((s) => s.theme);
  if (!food) return null;

  // Keying by position remounts the apple each time it moves, which replays
  // the little "pop in" animation.
  const [x, z] = cellToWorld(food.x, food.y, gridSize);
  return <AppleModel key={`${food.x},${food.y}`} position={[x, 0, z]} palette={SCENE_PALETTES[theme]} />;
}

function AppleModel({
  position,
  palette,
}: {
  position: [number, number, number];
  palette: ScenePalette;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const grown = useRef(0);

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    // Pop in (0 -> 1 with a little overshoot), then a gentle "breathing" pulse.
    grown.current = THREE.MathUtils.damp(grown.current, 1, 9, delta);
    const overshoot = Math.sin(grown.current * Math.PI) * 0.25;
    const breathe = Math.sin(clock.elapsedTime * 4) * 0.04;
    group.scale.setScalar(grown.current + overshoot + breathe);
  });

  return (
    <group position={position}>
      <group ref={groupRef} scale={0}>
        {/* Apple body */}
        <mesh castShadow position-y={APPLE_RADIUS}>
          <sphereGeometry args={[APPLE_RADIUS, 32, 24]} />
          <meshStandardMaterial color={palette.apple} roughness={0.35} />
        </mesh>
        {/* Shine */}
        <mesh position={[-0.13, APPLE_RADIUS * 1.8, 0.05]} scale={[0.08, 0.02, 0.11]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.75} />
        </mesh>
        {/* Stem */}
        <mesh position={[0, APPLE_RADIUS * 2, -0.12]} scale={[0.04, 0.04, 0.09]}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial color={palette.stem} />
        </mesh>
        {/* Leaf */}
        <mesh
          position={[0.13, APPLE_RADIUS * 2 + 0.02, -0.2]}
          rotation-y={-0.7}
          scale={[0.17, 0.03, 0.08]}
        >
          <sphereGeometry args={[1, 16, 8]} />
          <meshBasicMaterial color={palette.leaf} />
        </mesh>
      </group>
    </group>
  );
}
