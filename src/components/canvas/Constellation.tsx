"use client";

/**
 * Constellation lines between stars.
 *
 * Every link is subdivided into short segments so a travelling highlight can
 * run along it in the fragment shader. All links share one geometry and one
 * draw call; per link differences ride on vertex attributes.
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { LINKS, getStar } from "@/lib/graph/nodes";
import { LinkKind } from "@/lib/graph/types";
import { LINK_FRAGMENT, LINK_VERTEX } from "@/lib/three/shaders/link";

/** How strongly each kind of link is drawn. */
const WEIGHT: Record<LinkKind, number> = {
  [LinkKind.Spine]: 1,
  [LinkKind.Branch]: 0.72,
  [LinkKind.Whisper]: 0.28,
};

/** Segments per link. More segments means a smoother travelling pulse. */
const SEGMENTS = 24;

function buildGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const progress: number[] = [];
  const weights: number[] = [];
  const seeds: number[] = [];

  LINKS.forEach((link, linkIndex) => {
    const from = new THREE.Vector3(...getStar(link.from).position);
    const to = new THREE.Vector3(...getStar(link.to).position);
    const weight = WEIGHT[link.kind];
    const seed = (linkIndex * 0.137) % 1;

    for (let segment = 0; segment < SEGMENTS; segment += 1) {
      const t0 = segment / SEGMENTS;
      const t1 = (segment + 1) / SEGMENTS;
      const a = from.clone().lerp(to, t0);
      const b = from.clone().lerp(to, t1);

      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      progress.push(t0, t1);
      weights.push(weight, weight);
      seeds.push(seed, seed);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aProgress", new THREE.Float32BufferAttribute(progress, 1));
  geometry.setAttribute("aWeight", new THREE.Float32BufferAttribute(weights, 1));
  geometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
  return geometry;
}

export function Constellation({ opacity = 0.42 }: { opacity?: number }) {
  const geometry = useMemo(() => buildGeometry(), []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#8fb6ff") },
      uOpacity: { value: opacity },
    }),
    [opacity],
  );

  const lines = useRef<THREE.LineSegments>(null);
  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <lineSegments ref={lines} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={LINK_VERTEX}
        fragmentShader={LINK_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}
