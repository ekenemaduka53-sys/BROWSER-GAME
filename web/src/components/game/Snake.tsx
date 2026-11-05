"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { BOARD_SIZES } from "@/lib/game/constants";
import { gameClock } from "@/lib/game/clock";
import { useGameStore } from "@/store/useGameStore";
import { useThemeStore } from "@/store/useThemeStore";

import { cellToWorld } from "./coords";
import { SCENE_PALETTES } from "./palette";

const HEAD_RADIUS = 0.52;
const BODY_RADIUS = 0.37;
const TAIL_RADIUS = 0.22;

/** Spheres drawn per cell of body. More = smoother tube. */
const SPHERES_PER_CELL = 7;
/** Enough instances for a snake filling the largest board. */
const MAX_SPHERES = BOARD_SIZES.large ** 2 * SPHERES_PER_CELL + 1;

/** How fast the "gulp" bulge travels down the body, in cells per second. */
const GULP_SPEED = 22;
/** Mouth starts opening when the apple is this close (in cells). */
const MOUTH_RANGE = 2.6;

/** Reused scratch objects, so the frame loop doesn't create garbage. */
const scratch = new THREE.Object3D();
const xs = new Float32Array(BOARD_SIZES.large ** 2);
const zs = new Float32Array(BOARD_SIZES.large ** 2);

/** Rotate `current` towards `target` along the shortest way round. */
function turnTowards(current: number, target: number, amount: number): number {
  const diff = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + diff * amount;
}

/**
 * The snake, seen from above.
 *
 * Body: one InstancedMesh (a single draw call) of many overlapping spheres
 * placed along the path through every segment. Overlapping spheres read as a
 * smooth, rounded, continuous tube that bends around corners.
 *
 * Head: a slightly bigger sphere with two eyes that turn to face the direction
 * of travel, and a mouth that opens when an apple is close in front.
 *
 * Everything moves inside useFrame (every frame) by reading the store directly,
 * so React doesn't re-render while the snake moves.
 */
export function Snake() {
  const theme = useThemeStore((s) => s.theme);
  const palette = SCENE_PALETTES[theme];

  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const headScaleRef = useRef<THREE.Group>(null);
  const eyesRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Group>(null);

  // Animation memory between frames.
  const anim = useRef({ lastScore: 0, ateAt: -10, mouthOpen: 0 });

  useFrame(({ clock }, delta) => {
    const body = bodyRef.current;
    if (!body) return;
    const { snake, previousSnake, gridSize, food, score } = useGameStore.getState();
    const t = gameClock.progress;
    const now = clock.elapsedTime;
    const a = anim.current;

    // Notice when an apple was just eaten (score went up).
    if (score > a.lastScore) a.ateAt = now;
    a.lastScore = score;
    const sinceAte = now - a.ateAt;

    // 1) Where is each segment right now? Glide from last tick's cell to this tick's.
    const length = snake.length;
    for (let i = 0; i < length; i++) {
      const to = snake[i];
      // A brand-new tail segment has no previous cell: start it at the old tail.
      const from = previousSnake[i] ?? previousSnake[previousSnake.length - 1] ?? to;
      const [x, z] = cellToWorld(
        THREE.MathUtils.lerp(from.x, to.x, t),
        THREE.MathUtils.lerp(from.y, to.y, t),
        gridSize,
      );
      xs[i] = x;
      zs[i] = z;
    }

    // 2) Lay spheres along the body path, getting thinner towards the tail.
    //    After eating, a small bulge ("gulp") travels from head to tail.
    const gulpAt = sinceAte * GULP_SPEED;
    const gulpStrength = Math.max(0, 1 - gulpAt / (length + 2)) * 0.22;
    let count = 0;
    const last = length - 1;
    for (let i = 0; i < last; i++) {
      for (let s = 0; s < SPHERES_PER_CELL; s++) {
        const f = i + s / SPHERES_PER_CELL; // position along the body, in segments
        const k = s / SPHERES_PER_CELL;
        const x = xs[i] + (xs[i + 1] - xs[i]) * k;
        const z = zs[i] + (zs[i + 1] - zs[i]) * k;
        let r = THREE.MathUtils.lerp(BODY_RADIUS, TAIL_RADIUS, f / Math.max(last, 1));
        r *= 1 + gulpStrength * Math.exp(-((f - gulpAt) ** 2));
        scratch.position.set(x, r, z);
        scratch.scale.setScalar(r);
        scratch.updateMatrix();
        body.setMatrixAt(count++, scratch.matrix);
      }
    }
    // Tail tip
    scratch.position.set(xs[last], TAIL_RADIUS, zs[last]);
    scratch.scale.setScalar(TAIL_RADIUS);
    scratch.updateMatrix();
    body.setMatrixAt(count++, scratch.matrix);
    body.count = count;
    body.instanceMatrix.needsUpdate = true;

    // 3) Head: follow segment 0, face the direction of travel (head minus neck).
    const head = headRef.current;
    if (head) {
      head.position.set(xs[0], 0, zs[0]);
      if (length > 1) {
        const target = Math.atan2(snake[0].x - snake[1].x, snake[0].y - snake[1].y);
        head.rotation.y = turnTowards(head.rotation.y, target, 1 - Math.exp(-20 * delta));
      }
    }

    // 4) A little "boing" of the head right after eating.
    if (headScaleRef.current) {
      headScaleRef.current.scale.setScalar(1 + 0.22 * Math.exp(-sinceAte * 9));
    }

    // 5) Open the mouth when an apple is close and roughly in front of the head.
    let wantOpen = 0;
    if (food && head) {
      const [fx, fz] = cellToWorld(food.x, food.y, gridSize);
      const dx = fx - xs[0];
      const dz = fz - zs[0];
      const distance = Math.hypot(dx, dz);
      const facing =
        (dx * Math.sin(head.rotation.y) + dz * Math.cos(head.rotation.y)) / (distance || 1);
      if (distance < MOUTH_RANGE && facing > 0.3) wantOpen = 1;
    }
    a.mouthOpen = THREE.MathUtils.damp(a.mouthOpen, wantOpen, 14, delta);
    if (mouthRef.current) {
      mouthRef.current.visible = a.mouthOpen > 0.03;
      mouthRef.current.scale.set(a.mouthOpen, 1, a.mouthOpen);
    }

    // 6) Blink every few seconds.
    if (eyesRef.current) {
      eyesRef.current.scale.z = now % 3.6 < 0.13 ? 0.15 : 1;
    }
  });

  return (
    <group>
      {/* Body tube */}
      <instancedMesh
        ref={bodyRef}
        args={[undefined, undefined, MAX_SPHERES]}
        castShadow
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={palette.snake} roughness={0.55} />
      </instancedMesh>

      {/* Head. Its local +Z axis is "forward". */}
      <group ref={headRef}>
        <group ref={headScaleRef}>
          <mesh castShadow position-y={HEAD_RADIUS * 0.8} scale={[HEAD_RADIUS, HEAD_RADIUS * 0.8, HEAD_RADIUS * 1.06]}>
            <sphereGeometry args={[1, 32, 24]} />
            <meshStandardMaterial color={palette.snake} roughness={0.55} />
          </mesh>

          {/* Mouth: a dark oval on the front of the head with a pink tongue, scaled open/closed.
              (The head sphere is raised off the floor, so its top surface is at y ≈ 0.83.) */}
          <group ref={mouthRef} position={[0, 0.62, 0.42]} visible={false}>
            <mesh scale={[0.24, 0.12, 0.17]}>
              <sphereGeometry args={[1, 20, 12]} />
              <meshBasicMaterial color={palette.mouth} />
            </mesh>
            <mesh position={[0, 0.06, 0.05]} scale={[0.1, 0.08, 0.09]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshBasicMaterial color={palette.tongue} />
            </mesh>
          </group>

          {/* Eyes sit on top of the head, near the front. */}
          <group ref={eyesRef} position={[0, 0.74, 0.1]}>
            <Eye side={-1} />
            <Eye side={1} />
          </group>
        </group>
      </group>
    </group>
  );
}

/** A white eyeball with a pupil looking forward. side: -1 left, 1 right. */
function Eye({ side }: { side: -1 | 1 }) {
  return (
    <group position={[side * 0.21, 0, 0]}>
      <mesh scale={0.17}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Pupil pushed forward (+Z) so the snake "looks" where it is going. */}
      <mesh position={[0, 0.1, 0.06]} scale={0.09}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color="#1d1630" />
      </mesh>
      <mesh position={[-0.03, 0.19, 0.04]} scale={0.03}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
