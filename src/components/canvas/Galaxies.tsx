"use client";

/**
 * Distant galaxies scattered around the scene.
 *
 * Each one is a single billboarded plane, world fixed at a real distance so
 * flying between stars gives them the faint parallax something that far away
 * should have, unlike the camera locked starfield. Shape, size and colour come
 * from `galaxyField`, which the 404 shares, so the two skies are populated
 * from one description of what galaxies are.
 *
 * Two details that matter more than they look:
 *
 * - The quad is turned with `lookAt`, not by copying the camera's quaternion.
 *   Copying carries the camera's roll into the galaxy, so banking the camera
 *   spins every galaxy in place; `lookAt` leaves them pinned to the sky and
 *   lets the shader own the position angle.
 * - World size is angular size times distance, so how big a galaxy looks is a
 *   property of the galaxy and how far away it is only sets its parallax.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { EffectTier } from "./Effects";
import { GALAXY_FRAGMENT, GALAXY_VERTEX } from "@/lib/three/shaders/galaxy";
import {
  buildGalaxyField,
  galaxyDetailVector,
  galaxyDirection,
  galaxyDistance,
  galaxyExtraVector,
  galaxyFormVector,
  type GalaxyForm,
} from "@/lib/three/galaxyField";

/** Galaxies per tier. Purely decorative background, thinned first. */
const COUNT: Record<EffectTier, number> = {
  [EffectTier.Rich]: 38,
  [EffectTier.Lean]: 18,
  [EffectTier.Off]: 0,
};

/**
 * Angular half width on the sky, in radians: from a smudge a few pixels across
 * to something that fills a good part of a 52 degree frame.
 */
const ANGULAR_RANGE: readonly [number, number] = [0.012, 0.22];

/**
 * Room left around a galaxy on its quad, matching `GX_EXTENT` in the shader.
 * The shape fades to nothing before the border, so the border never shows.
 */
const QUAD_EXTENT = 1.5;

interface PlacedGalaxy {
  readonly form: GalaxyForm;
  readonly position: THREE.Vector3;
  /** Full width of the quad in world units. */
  readonly size: number;
}

function placeGalaxies(count: number, radiusRange: readonly [number, number]): PlacedGalaxy[] {
  return buildGalaxyField(count, ANGULAR_RANGE).map((form, index) => {
    const distance = galaxyDistance(index, radiusRange);
    return {
      form,
      /* Flattened a little vertically: the map is a wide field, and galaxies
         directly overhead or underfoot are never looked at. */
      position: galaxyDirection(index, 0.6).multiplyScalar(distance),
      size: form.angularRadius * distance * 2 * QUAD_EXTENT,
    };
  });
}

function Galaxy({ placed }: { placed: PlacedGalaxy }) {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const { form } = placed;

  const uniforms = useMemo(
    () => ({
      uColorCore: { value: form.core },
      uColorArm: { value: form.arm },
      uSquash: { value: form.squash },
      uRoll: { value: form.roll },
      uForm: { value: galaxyFormVector(form) },
      uDetail: { value: galaxyDetailVector(form) },
      uExtra: { value: galaxyExtraVector(form) },
      uOpacity: { value: form.brightness },
    }),
    [form],
  );

  useFrame(() => {
    mesh.current?.lookAt(camera.position);
  });

  return (
    <mesh ref={mesh} position={placed.position} frustumCulled={false} renderOrder={-0.5}>
      <planeGeometry args={[placed.size, placed.size]} />
      <shaderMaterial
        vertexShader={GALAXY_VERTEX}
        fragmentShader={GALAXY_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
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
  const [minRadius, maxRadius] = radiusRange;
  // Depend on the numbers, not the array: a literal prop is a new array every
  // render and would reroll the whole field each time.
  const galaxies = useMemo(
    () => placeGalaxies(count, [minRadius, maxRadius]),
    [count, minRadius, maxRadius],
  );

  if (count === 0) return null;

  return (
    <group>
      {galaxies.map((placed, index) => (
        <Galaxy key={index} placed={placed} />
      ))}
    </group>
  );
}
