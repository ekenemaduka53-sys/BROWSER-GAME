"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { useGameStore } from "@/store/useGameStore";
import { useThemeStore } from "@/store/useThemeStore";

import { cellToWorld } from "./coords";
import { SCENE_PALETTES } from "./palette";

const DURATION = 0.5; // seconds
const PARTICLES = 10;

interface Burst {
  id: number;
  x: number;
  z: number;
}

/**
 * The "pop" when an apple is eaten: an expanding ring plus a few sparks
 * flying outwards, all fading away in half a second.
 */
export function PopEffects() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  // Listen to the store: every new `lastMeal` spawns a burst at that cell.
  useEffect(
    () =>
      useGameStore.subscribe((state, previous) => {
        const meal = state.lastMeal;
        if (!meal || meal === previous.lastMeal) return;
        const [x, z] = cellToWorld(meal.x, meal.y, state.gridSize);
        setBursts((list) => [...list, { id: Date.now() + meal.id, x, z }]);
      }),
    [],
  );

  return (
    <>
      {bursts.map((burst) => (
        <PopBurst
          key={burst.id}
          x={burst.x}
          z={burst.z}
          onDone={() => setBursts((list) => list.filter((b) => b.id !== burst.id))}
        />
      ))}
    </>
  );
}

function PopBurst({ x, z, onDone }: { x: number; z: number; onDone: () => void }) {
  const theme = useThemeStore((s) => s.theme);
  const colors = SCENE_PALETTES[theme].pop;
  const ringRef = useRef<THREE.Mesh>(null);
  const sparksRef = useRef<THREE.Group>(null);
  const age = useRef(0);
  const finished = useRef(false);

  useFrame((_, delta) => {
    age.current += delta;
    const p = Math.min(age.current / DURATION, 1); // 0 -> 1
    const ease = 1 - (1 - p) ** 3; // fast start, soft finish

    const ring = ringRef.current;
    if (ring) {
      ring.scale.setScalar(0.5 + ease * 1.6);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - p);
    }
    sparksRef.current?.children.forEach((spark, i) => {
      const angle = (i / PARTICLES) * Math.PI * 2;
      const distance = 0.2 + ease * 1.1;
      spark.position.set(Math.cos(angle) * distance, 0.6, Math.sin(angle) * distance);
      spark.scale.setScalar(0.11 * (1 - p) + 0.001);
    });

    if (p >= 1 && !finished.current) {
      finished.current = true;
      onDone();
    }
  });

  return (
    <group position={[x, 0, z]}>
      <mesh ref={ringRef} rotation-x={-Math.PI / 2} position-y={0.05}>
        <ringGeometry args={[0.42, 0.52, 40]} />
        <meshBasicMaterial color={colors[0]} transparent depthWrite={false} />
      </mesh>
      <group ref={sparksRef}>
        {Array.from({ length: PARTICLES }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color={colors[i % colors.length]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
