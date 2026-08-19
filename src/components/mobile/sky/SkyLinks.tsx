"use client";

/**
 * The constellation, drawn as plain lines.
 *
 * The desktop version animates a travelling pulse along every edge through a
 * custom shader. Here the edges only need to say "these stars are one shape",
 * so they are a single additive line buffer: one draw call, no shader, no per
 * frame work at all.
 */

import { useMemo } from "react";
import * as THREE from "three";

import { LINKS, getStar } from "@/lib/graph/nodes";
import { LinkKind } from "@/lib/graph/types";

/** How brightly each kind of edge is drawn. */
const WEIGHT: Record<LinkKind, number> = {
  [LinkKind.Spine]: 0.5,
  [LinkKind.Branch]: 0.34,
  [LinkKind.Whisper]: 0.12,
};

function buildGeometry(): THREE.BufferGeometry {
  const positions = new Float32Array(LINKS.length * 2 * 3);
  const colors = new Float32Array(LINKS.length * 2 * 3);
  const scratch = new THREE.Color();

  LINKS.forEach((link, index) => {
    const ends = [getStar(link.from), getStar(link.to)];
    ends.forEach((star, side) => {
      const at = (index * 2 + side) * 3;
      positions[at + 0] = star.position[0];
      positions[at + 1] = star.position[1];
      positions[at + 2] = star.position[2];

      scratch.set(star.color).multiplyScalar(WEIGHT[link.kind]);
      colors[at + 0] = scratch.r;
      colors[at + 1] = scratch.g;
      colors[at + 2] = scratch.b;
    });
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

export function SkyLinks() {
  const geometry = useMemo(() => buildGeometry(), []);

  return (
    <lineSegments geometry={geometry} renderOrder={2}>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.45}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  );
}
