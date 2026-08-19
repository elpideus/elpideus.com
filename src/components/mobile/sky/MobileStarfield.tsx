"use client";

/**
 * The still sky for the handheld build.
 *
 * Two layers instead of the desktop's three, at roughly half the point count.
 * `Distant` rides with the camera so the sky reads as infinite in every
 * direction, `Field` is fixed in world space along the journey corridor and is
 * what actually produces parallax while travelling. The near dust layer is
 * dropped: on a small screen the warp streaks already say "moving", and the
 * dust only cost fill rate.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { STARFIELD_FRAGMENT, STARFIELD_VERTEX } from "@/lib/three/shaders/starfield";
import { hashNoise } from "@/lib/three/math";

interface LayerConfig {
  readonly count: number;
  readonly spread: readonly [number, number, number];
  readonly center: readonly [number, number, number];
  readonly sizeRange: readonly [number, number];
  readonly sizeScale: number;
  readonly attachedToCamera: boolean;
  readonly seed: number;
}

const LAYERS: readonly LayerConfig[] = [
  {
    count: 3400,
    spread: [700, 700, 700],
    center: [0, 0, 0],
    sizeRange: [0.6, 2.4],
    sizeScale: 1,
    attachedToCamera: true,
    seed: 11,
  },
  {
    count: 2400,
    spread: [230, 190, 300],
    center: [0, 0, -110],
    sizeRange: [0.8, 3.2],
    sizeScale: 1.15,
    attachedToCamera: false,
    seed: 2207,
  },
];

/** Same floor as the desktop sky: below it points scintillate instead of fade. */
const MIN_POINT_SIZE = 3.2;

const PALETTE = [
  new THREE.Color("#ffffff"),
  new THREE.Color("#dfe9ff"),
  new THREE.Color("#bcd2ff"),
  new THREE.Color("#9fb8ff"),
  new THREE.Color("#ffe6c9"),
  new THREE.Color("#ffc9a3"),
];

function buildGeometry(config: LayerConfig): THREE.BufferGeometry {
  const { count, spread, center, sizeRange, seed } = config;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const base = seed + i * 3;
    positions[i * 3 + 0] = center[0] + (hashNoise(base) * 2 - 1) * spread[0];
    positions[i * 3 + 1] = center[1] + (hashNoise(base + 1) * 2 - 1) * spread[1];
    positions[i * 3 + 2] = center[2] + (hashNoise(base + 2) * 2 - 1) * spread[2];

    const roll = hashNoise(base + 0.5);
    sizes[i] = sizeRange[0] + Math.pow(roll, 3) * (sizeRange[1] - sizeRange[0]);
    phases[i] = hashNoise(base + 0.75);

    const swatch = PALETTE[Math.floor(hashNoise(base + 0.9) * PALETTE.length) % PALETTE.length];
    colors[i * 3 + 0] = swatch.r;
    colors[i * 3 + 1] = swatch.g;
    colors[i * 3 + 2] = swatch.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.boundingSphere = new THREE.Sphere(
    new THREE.Vector3(center[0], center[1], center[2]),
    Math.max(spread[0], spread[1], spread[2]) * 1.8,
  );
  return geometry;
}

function StarLayer({ config }: { config: LayerConfig }) {
  const points = useRef<THREE.Points>(null);
  const { camera, viewport } = useThree();

  const geometry = useMemo(() => buildGeometry(config), [config]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(viewport.dpr, 2) },
      uSizeScale: { value: config.sizeScale },
      uTwinkle: { value: 0 },
      uMinSize: { value: MIN_POINT_SIZE },
    }),
    [config.sizeScale, viewport.dpr],
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    if (config.attachedToCamera) points.current?.position.copy(camera.position);
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={!config.attachedToCamera}>
      <shaderMaterial
        vertexShader={STARFIELD_VERTEX}
        fragmentShader={STARFIELD_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function MobileStarfield() {
  return (
    <group>
      {LAYERS.map((config) => (
        <StarLayer key={config.seed} config={config} />
      ))}
    </group>
  );
}
