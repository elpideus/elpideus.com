"use client";

/**
 * The section stars, drawn for the handheld build.
 *
 * The desktop scene leans on a bloom pass to make a star look like a star. That
 * pass is the single most expensive thing on the screen and it is the first
 * thing to go on a phone, so the glow is faked here instead: a small emissive
 * core, the shared halo shader, and a second much wider halo at low intensity
 * standing in for the bloom. Three transparent quads per star beats a full
 * screen convolution on every frame.
 *
 * Nothing here answers to the pointer. Stars are chosen from the chart sheet or
 * by scrolling, never by aiming at a three pixel dot on a moving sky.
 */

import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { STARS } from "@/lib/graph/nodes";
import { StarClass, type StarNode } from "@/lib/graph/types";
import { HALO_FRAGMENT, HALO_VERTEX } from "@/lib/three/shaders/halo";
import { damp, hashNoise } from "@/lib/three/math";
import { useJourney } from "@/lib/state/journey";

interface ClassStyle {
  readonly haloScale: number;
  readonly intensity: number;
  readonly twinkle: number;
  readonly spikes: number;
  readonly coreBoost: number;
}

const CLASS_STYLE: Record<StarClass, ClassStyle> = {
  [StarClass.Anchor]: { haloScale: 7, intensity: 0.8, twinkle: 0.12, spikes: 0.75, coreBoost: 1.5 },
  [StarClass.Sequence]: { haloScale: 6.4, intensity: 0.66, twinkle: 0.1, spikes: 0.55, coreBoost: 1.3 },
  [StarClass.Beacon]: { haloScale: 8.4, intensity: 0.9, twinkle: 0.42, spikes: 0.95, coreBoost: 1.8 },
  [StarClass.Dormant]: { haloScale: 5.5, intensity: 0.34, twinkle: 0.06, spikes: 0.25, coreBoost: 0.85 },
  [StarClass.Satellite]: { haloScale: 5.4, intensity: 0.55, twinkle: 0.16, spikes: 0.35, coreBoost: 1.15 },
};

/**
 * Core size as a fraction of the star radius. Much smaller than the desktop
 * core, because the handheld camera parks far closer to its star: at this range
 * the desktop proportion reads as a white ball rather than as a point of light
 * with a halo around it.
 */
const CORE_RADIUS = 0.14;

/** How much bigger the stand in bloom quad is than the halo. */
const BLOOM_SCALE = 2.4;
/** Swell applied to whichever star currently holds focus. */
const FOCUS_SCALE = 1.2;

function Star({ node }: { node: StarNode }) {
  const style = CLASS_STYLE[node.kind];
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => hashNoise(node.position[2] + node.radius) * Math.PI * 2, [node]);
  const color = useMemo(() => new THREE.Color(node.color), [node.color]);
  const scale = useRef(1);

  const haloUniforms = useMemo(
    () => ({
      uColor: { value: color.clone() },
      uTime: { value: 0 },
      uIntensity: { value: style.intensity },
      uTwinkle: { value: style.twinkle },
      uSpikes: { value: style.spikes },
      uPhase: { value: phase },
    }),
    [color, phase, style],
  );

  const bloomUniforms = useMemo(
    () => ({
      uColor: { value: color.clone() },
      uTime: { value: 0 },
      uIntensity: { value: style.intensity * 0.3 },
      uTwinkle: { value: 0 },
      uSpikes: { value: 0 },
      uPhase: { value: phase },
    }),
    [color, phase, style],
  );

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;
    haloUniforms.uTime.value = elapsed;
    bloomUniforms.uTime.value = elapsed;

    const focused = useJourney.getState().focus === node.id;
    scale.current = damp(scale.current, focused ? FOCUS_SCALE : 1, 0.001, delta);
    group.current?.scale.setScalar(scale.current);

    if (core.current) {
      const material = core.current.material as THREE.MeshBasicMaterial;
      const breathe = 1 + Math.sin(elapsed * 0.9 + phase) * 0.06 * style.twinkle * 6;
      material.color.copy(color).multiplyScalar(style.coreBoost * breathe);
    }
  });

  const halo = node.radius * style.haloScale;

  return (
    <group ref={group} position={node.position as unknown as THREE.Vector3Tuple}>
      <mesh ref={core}>
        <sphereGeometry args={[node.radius * CORE_RADIUS, 10, 10]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      <Billboard>
        <mesh renderOrder={3}>
          <planeGeometry args={[halo * BLOOM_SCALE, halo * BLOOM_SCALE]} />
          <shaderMaterial
            vertexShader={HALO_VERTEX}
            fragmentShader={HALO_FRAGMENT}
            uniforms={bloomUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh renderOrder={4}>
          <planeGeometry args={[halo, halo]} />
          <shaderMaterial
            vertexShader={HALO_VERTEX}
            fragmentShader={HALO_FRAGMENT}
            uniforms={haloUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Billboard>
    </group>
  );
}

export function MobileStars() {
  return (
    <group>
      {STARS.map((node) => (
        <Star key={node.id} node={node} />
      ))}
    </group>
  );
}
