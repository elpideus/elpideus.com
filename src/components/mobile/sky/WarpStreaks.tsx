"use client";

/**
 * Speed, made visible.
 *
 * A tunnel of short line segments riding with the camera. Their length and
 * opacity come from `telemetry.warp`, which the rig writes from the distance
 * the camera actually covered in the last frame, so the sky stretches when the
 * visitor flicks the deck and settles the moment they stop. At rest the layer
 * is fully transparent and costs nothing but a draw call.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { WARP_FRAGMENT, WARP_VERTEX } from "@/lib/three/shaders/warp";
import { damp, hashNoise } from "@/lib/three/math";
import { telemetry } from "@/lib/state/mobile";

const SEGMENTS = 700;
/** Half width and half height of the tunnel, in world units. */
const RADIUS = 46;
/** Length of the wrapping corridor along the direction of travel. */
const SPAN = 220;
/** Streak length at full speed. */
const MAX_STREAK = 30;
/** Base scroll of the tunnel with no input, so the sky is never quite dead. */
const IDLE_DRIFT = 5;
/** Extra scroll at full speed. */
const WARP_DRIFT = 320;

const PALETTE = [
  new THREE.Color("#cfe4ff"),
  new THREE.Color("#7fd7ff"),
  new THREE.Color("#ffffff"),
  new THREE.Color("#b39cff"),
];

function buildGeometry(): THREE.BufferGeometry {
  const positions = new Float32Array(SEGMENTS * 2 * 3);
  const tails = new Float32Array(SEGMENTS * 2);
  const colors = new Float32Array(SEGMENTS * 2 * 3);

  for (let i = 0; i < SEGMENTS; i += 1) {
    const seed = 4801 + i * 3;

    // Polar placement keeps the tunnel round rather than boxy, and biasing the
    // radius outwards leaves the middle of the screen clear for the panels.
    const angle = hashNoise(seed) * Math.PI * 2;
    const radius = RADIUS * (0.32 + Math.sqrt(hashNoise(seed + 1)) * 0.68);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.8;
    const z = hashNoise(seed + 2) * SPAN;

    const swatch = PALETTE[Math.floor(hashNoise(seed + 0.6) * PALETTE.length) % PALETTE.length];

    for (let vertex = 0; vertex < 2; vertex += 1) {
      const at = i * 2 + vertex;
      positions[at * 3 + 0] = x;
      positions[at * 3 + 1] = y;
      positions[at * 3 + 2] = z;
      tails[at] = vertex;
      colors[at * 3 + 0] = swatch.r;
      colors[at * 3 + 1] = swatch.g;
      colors[at * 3 + 2] = swatch.b;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aTail", new THREE.BufferAttribute(tails, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SPAN);
  return geometry;
}

export function WarpStreaks() {
  const lines = useRef<THREE.LineSegments>(null);
  const { camera } = useThree();
  const geometry = useMemo(() => buildGeometry(), []);

  const uniforms = useMemo(
    () => ({
      uTravel: { value: 0 },
      uStreak: { value: 0 },
      uSpan: { value: SPAN },
      uAlpha: { value: 0 },
    }),
    [],
  );

  useFrame((state, delta) => {
    const warp = telemetry.reducedMotion ? 0 : telemetry.warp;

    uniforms.uTravel.value += (IDLE_DRIFT + warp * WARP_DRIFT) * delta;
    // The streak itself lags the speed a little, which is what makes the tunnel
    // feel like it has mass rather than switching on and off with the scroll.
    uniforms.uStreak.value = damp(uniforms.uStreak.value, warp * MAX_STREAK, 0.002, delta);
    uniforms.uAlpha.value = damp(uniforms.uAlpha.value, Math.min(warp * 1.15, 0.85), 0.002, delta);

    lines.current?.position.copy(camera.position);
  });

  return (
    <lineSegments ref={lines} geometry={geometry} frustumCulled={false} renderOrder={1}>
      <shaderMaterial
        vertexShader={WARP_VERTEX}
        fragmentShader={WARP_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}
