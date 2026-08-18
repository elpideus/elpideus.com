"use client";

/**
 * Distant galaxies scattered around the scene.
 *
 * Each one is a single billboarded plane, world fixed at a real distance so
 * flying between stars gives them the faint parallax something that far away
 * should have, unlike the camera locked starfield. A handful of spiral and
 * elliptical variants, hashed rather than random so the field is identical
 * every visit, keeps the sky from feeling like an empty void past the nearest
 * stars.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { EffectTier } from "./Effects";
import { GALAXY_FRAGMENT, GALAXY_VERTEX } from "@/lib/three/shaders/galaxy";
import { hashNoise } from "@/lib/three/math";

/** Galaxies per tier. Purely decorative background, thinned first. */
const COUNT: Record<EffectTier, number> = {
  [EffectTier.Rich]: 34,
  [EffectTier.Lean]: 16,
  [EffectTier.Off]: 0,
};

/** Colour pairs: core tone, arm/halo tone. Biased warm core, cool or warm arms. */
const PALETTES: readonly [string, string][] = [
  ["#fff3e0", "#8fb4ff"],
  ["#ffe9c9", "#ff9f7a"],
  ["#f2e9ff", "#b78bff"],
  ["#e8f0ff", "#6fd8d0"],
  ["#fff0e6", "#ffd28a"],
  ["#eae4ff", "#7a90ff"],
];

interface GalaxyConfig {
  position: THREE.Vector3;
  size: number;
  roll: number;
  squash: number;
  armStrength: number;
  seed: number;
  opacity: number;
  colorCore: THREE.Color;
  colorArm: THREE.Color;
}

function buildGalaxies(count: number, radiusRange: readonly [number, number]): GalaxyConfig[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = index * 17 + 5;
    const [minR, maxR] = radiusRange;
    const radius = minR + hashNoise(seed) * (maxR - minR);

    // Even coverage of the sphere, not just the equator.
    const theta = hashNoise(seed + 1) * Math.PI * 2;
    const phi = Math.acos(hashNoise(seed + 2) * 2 - 1);

    const position = new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi) * 0.6,
      radius * Math.sin(phi) * Math.sin(theta),
    );

    /*
     * Skewed towards small so a field of them reads as depth rather than a
     * wall of identical smudges: most are faint background specks, and the
     * cubed roll rarely lands on the handful that read as big and close.
     */
    const sizeRoll = Math.pow(hashNoise(seed + 3), 3);
    const size = (10 + sizeRoll * 130) * (radius / minR);

    const palette = PALETTES[Math.floor(hashNoise(seed + 4) * PALETTES.length) % PALETTES.length];
    const isElliptical = hashNoise(seed + 5) < 0.35;

    return {
      position,
      size,
      roll: hashNoise(seed + 6) * Math.PI * 2,
      squash: isElliptical ? 0.75 + hashNoise(seed + 7) * 0.25 : 0.28 + hashNoise(seed + 7) * 0.4,
      armStrength: isElliptical ? 0.08 : 0.55 + hashNoise(seed + 8) * 0.45,
      seed: hashNoise(seed + 9) * 40,
      opacity: 0.4 + hashNoise(seed + 10) * 0.4,
      colorCore: new THREE.Color(palette[0]),
      colorArm: new THREE.Color(palette[1]),
    };
  });
}

function Galaxy({ config }: { config: GalaxyConfig }) {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const uniforms = useMemo(
    () => ({
      uColorCore: { value: config.colorCore },
      uColorArm: { value: config.colorArm },
      uSeed: { value: config.seed },
      uArmStrength: { value: config.armStrength },
      uSquash: { value: config.squash },
      uCoreSize: { value: 0.55 },
      uOpacity: { value: config.opacity },
    }),
    [config],
  );

  useFrame(() => {
    const object = mesh.current;
    if (!object) return;
    object.quaternion.copy(camera.quaternion);
    object.rotateZ(config.roll);
  });

  return (
    <mesh ref={mesh} position={config.position} frustumCulled={false} renderOrder={-0.5}>
      <planeGeometry args={[config.size, config.size]} />
      <shaderMaterial
        vertexShader={GALAXY_VERTEX}
        fragmentShader={GALAXY_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export function Galaxies({
  tier = EffectTier.Rich,
  radiusRange = [260, 900],
}: {
  tier?: EffectTier;
  radiusRange?: readonly [number, number];
}) {
  const count = COUNT[tier];
  const galaxies = useMemo(() => buildGalaxies(count, radiusRange), [count, radiusRange]);

  if (count === 0) return null;

  return (
    <group>
      {galaxies.map((config, index) => (
        <Galaxy key={index} config={config} />
      ))}
    </group>
  );
}
