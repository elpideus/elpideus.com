"use client";

/**
 * The sky.
 *
 * Three point layers with different jobs:
 *
 * - `Distant` is parented to the camera, so it can never be reached and the sky
 *   feels genuinely infinite in every direction.
 * - `Field` is fixed in world space and spans the whole journey, which is what
 *   actually produces parallax while flying between stars.
 * - `Dust` is a small, close, slowly drifting layer that gives the sense of
 *   moving through something rather than across a painted backdrop.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { STARFIELD_FRAGMENT, STARFIELD_VERTEX } from "@/lib/three/shaders/starfield";
import { hashNoise } from "@/lib/three/math";
import { registerSkyLayer } from "@/lib/state/sky";
import { SKY_DESIGNATION_COUNT } from "@/lib/content/starNames";

/** Which of the three sky layers a buffer belongs to. */
export enum SkyLayer {
  Distant = "distant",
  Field = "field",
  Dust = "dust",
}

interface LayerConfig {
  readonly count: number;
  /** Half extent of the box the layer fills, in world units. */
  readonly spread: readonly [number, number, number];
  /** Centre of that box. */
  readonly center: readonly [number, number, number];
  readonly sizeRange: readonly [number, number];
  readonly sizeScale: number;
  /**
   * Twinkle depth. Zero everywhere by choice: a sky of thousands of points
   * flickering reads as noise rather than as stars. Only the section stars,
   * which are few and meaningful, are allowed to pulse.
   */
  readonly twinkle: number;
  readonly opacity: number;
  /** Whether the layer rides along with the camera. */
  readonly attachedToCamera: boolean;
  readonly drift: number;
  /** Whether its points answer to the pointer with a name. */
  readonly hoverable: boolean;
  /**
   * Share of the name pool this layer takes, as a fraction. Layers split the
   * pool between them, and the shares must add up to one.
   */
  readonly nameShare: number;
}

const LAYERS: Record<SkyLayer, LayerConfig> = {
  [SkyLayer.Distant]: {
    count: 9000,
    spread: [900, 900, 900],
    center: [0, 0, 0],
    sizeRange: [0.6, 2.4],
    sizeScale: 1.0,
    twinkle: 0,
    opacity: 0.95,
    attachedToCamera: true,
    drift: 0,
    hoverable: true,
    nameShare: 0.63,
  },
  [SkyLayer.Field]: {
    count: 5200,
    spread: [340, 260, 340],
    center: [0, 0, -110],
    sizeRange: [0.8, 3.4],
    sizeScale: 1.15,
    twinkle: 0,
    opacity: 1,
    attachedToCamera: false,
    drift: 0,
    hoverable: true,
    nameShare: 0.37,
  },
  [SkyLayer.Dust]: {
    count: 1400,
    spread: [90, 70, 200],
    center: [0, 0, -110],
    sizeRange: [0.35, 1.2],
    sizeScale: 0.9,
    twinkle: 0,
    opacity: 0.55,
    attachedToCamera: false,
    drift: 0.35,
    // The near dust is decoration that drifts past; naming it would be noise.
    hoverable: false,
    nameShare: 0,
  },
};

/**
 * Floor for a point's size in CSS pixels.
 *
 * A star drawn into one or two pixels cannot move smoothly: as the idle camera
 * drift slides it across the pixel grid its brightness jumps, and a sky full of
 * them sparkles. Holding every point at a few pixels wide, with the brightness
 * faded in proportion, keeps distant stars faint without making them unstable.
 */
const MIN_POINT_SIZE = 3.2;

/** Star colour palette, biased towards cold white with a few warm outliers. */
const PALETTE = [
  new THREE.Color("#ffffff"),
  new THREE.Color("#dfe9ff"),
  new THREE.Color("#bcd2ff"),
  new THREE.Color("#9fb8ff"),
  new THREE.Color("#ffe6c9"),
  new THREE.Color("#ffc9a3"),
];

function buildGeometry(config: LayerConfig, seed: number): THREE.BufferGeometry {
  const { count, spread, center, sizeRange } = config;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const base = seed + i * 3;
    positions[i * 3 + 0] = center[0] + (hashNoise(base) * 2 - 1) * spread[0];
    positions[i * 3 + 1] = center[1] + (hashNoise(base + 1) * 2 - 1) * spread[1];
    positions[i * 3 + 2] = center[2] + (hashNoise(base + 2) * 2 - 1) * spread[2];

    // Bias sizes towards the small end so bright stars stay rare.
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

/**
 * Picks which points of a layer answer to the pointer.
 *
 * Every label is a real object and the catalogue of those is finite, so only
 * part of the sky can be named. The points are taken at an even stride rather
 * than in a block, which spreads the named stars across the whole sky instead
 * of clustering them in one corner of the buffer.
 */
function chooseHoverable(count: number, quota: number): Uint32Array {
  const wanted = Math.min(quota, count);
  const stride = Math.max(1, Math.floor(count / wanted));
  const indices = new Uint32Array(wanted);
  for (let i = 0; i < wanted; i += 1) indices[i] = (i * stride * 3) % (count * 3);
  return indices;
}

function StarLayer({
  layer,
  seed,
  slotBase,
}: {
  layer: SkyLayer;
  seed: number;
  slotBase: number;
}) {
  const config = LAYERS[layer];
  const points = useRef<THREE.Points>(null);
  const { camera, viewport } = useThree();

  const geometry = useMemo(() => buildGeometry(config, seed), [config, seed]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(viewport.dpr, 2) },
      uSizeScale: { value: config.sizeScale },
      uTwinkle: { value: config.twinkle },
      uMinSize: { value: MIN_POINT_SIZE },
    }),
    [config.sizeScale, config.twinkle, viewport.dpr],
  );

  useEffect(() => {
    if (!config.hoverable) return;
    const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
    const quota = Math.round(SKY_DESIGNATION_COUNT * config.nameShare);
    return registerSkyLayer({
      seed,
      slotBase,
      positions: positions.array as Float32Array,
      indices: chooseHoverable(config.count, quota),
      cameraLocked: config.attachedToCamera,
    });
  }, [
    config.hoverable,
    config.attachedToCamera,
    config.count,
    config.nameShare,
    geometry,
    seed,
    slotBase,
  ]);

  useFrame((state, delta) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    const mesh = points.current;
    if (!mesh) return;

    if (config.attachedToCamera) {
      mesh.position.copy(camera.position);
    } else if (config.drift > 0) {
      // A barely perceptible rotation keeps the near dust from feeling static.
      mesh.rotation.y += delta * 0.004 * config.drift;
      mesh.rotation.x += delta * 0.002 * config.drift;
    }
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
        opacity={config.opacity}
      />
    </points>
  );
}

export function Starfield() {
  return (
    <group>
      {/* Slot bases split the name pool between the layers without overlap. */}
      <StarLayer layer={SkyLayer.Distant} seed={11} slotBase={0} />
      <StarLayer
        layer={SkyLayer.Field}
        seed={2207}
        slotBase={Math.round(SKY_DESIGNATION_COUNT * LAYERS[SkyLayer.Distant].nameShare)}
      />
      <StarLayer layer={SkyLayer.Dust} seed={9931} slotBase={0} />
    </group>
  );
}
