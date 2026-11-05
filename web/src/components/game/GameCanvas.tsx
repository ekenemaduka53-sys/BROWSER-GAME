"use client";

import { Canvas } from "@react-three/fiber";

import { BOARD_SIZES } from "@/lib/game/constants";
import { useThemeStore } from "@/store/useThemeStore";

import { Apple } from "./Apple";
import { Board } from "./Board";
import { CameraRig } from "./CameraRig";
import { GameLoop } from "./GameLoop";
import { PopEffects } from "./PopEffects";
import { Snake } from "./Snake";

/** The sun's shadow area must cover the largest board. */
const SHADOW_HALF = BOARD_SIZES.large / 2 + 1;

/**
 * The 3D scene, rendered with Three.js through React Three Fiber.
 * Loaded only in the browser (see Game.tsx), because WebGL doesn't exist
 * during server rendering.
 */
export default function GameCanvas() {
  const theme = useThemeStore((s) => s.theme);

  return (
    <Canvas
      orthographic // flat, straight top-down view (see CameraRig)
      flat // no tone mapping: colours stay bright and exact
      shadows
      dpr={[1, 2]} // sharp on retina screens, capped at 2x for performance
      camera={{ position: [0, 50, 0], zoom: 40, near: 0.1, far: 200 }}
    >
      {/* Soft overall light + one "sun" up and to the top-left that casts a small drop shadow. */}
      <ambientLight intensity={theme === "dark" ? 1.6 : 1.9} />
      <directionalLight
        position={[-4, 20, -6]}
        intensity={theme === "dark" ? 1.6 : 1.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-SHADOW_HALF}
        shadow-camera-right={SHADOW_HALF}
        shadow-camera-top={SHADOW_HALF}
        shadow-camera-bottom={-SHADOW_HALF}
        shadow-radius={4}
        shadow-bias={-0.0005}
      />

      <CameraRig />
      <GameLoop />
      <Board />
      <Apple />
      <Snake />
      <PopEffects />
    </Canvas>
  );
}
