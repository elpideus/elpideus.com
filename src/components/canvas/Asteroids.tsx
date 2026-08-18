"use client";

/**
 * Debris drifting through the map.
 *
 * The sky is made of points and shaders, all of it infinitely far away, so
 * nothing in the scene ever passes the camera. A handful of small lit rocks
 * fixes that: they are the only objects with real silhouettes and real
 * parallax, and they are what makes flying between stars feel like moving
 * through something rather than across a backdrop.
 *
 * The field is a box that follows the camera and wraps, so it is always around
 * the visitor at the same density no matter how far along the journey they are,
 * and it never needs more rocks than are on screen.
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { EffectTier } from "./Effects";
import { hashNoise } from "@/lib/three/math";

/**
 * Half extent of the box the field fills, centred on the camera.
 *
 * A rock teleports to the opposite face the instant it crosses one of these
 * planes, since the box is axis aligned in world space rather than aligned to
 * the view. The camera orbits stars on spheres up to ~30 units across and the
 * vertical extent used to be far smaller than that, so a pan would routinely
 * push the box past a rock still well inside the frame and pop it to the far
 * side. Keeping every axis comfortably past the widest orbit keeps the wrap
 * boundary outside what the visitor can actually see.
 */
const HALF = new THREE.Vector3(80, 80, 100);

/** Rocks per tier. The field is decoration, so it is the first thing to thin. */
const COUNT: Record<EffectTier, number> = {
  [EffectTier.Rich]: 220,
  [EffectTier.Lean]: 100,
  [EffectTier.Off]: 0,
};

interface Rock {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  tilt: THREE.Euler;
  spin: THREE.Vector3;
  scale: number;
}

/** Keep a coordinate inside the box around the camera, wrapping at the edges. */
function wrap(value: number, centre: number, half: number): number {
  const span = half * 2;
  const offset = value - centre + half;
  return centre - half + ((offset % span) + span) % span;
}

export function Asteroids({ tier = EffectTier.Rich }: { tier?: EffectTier }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const scratch = useMemo(() => new THREE.Object3D(), []);
  const count = COUNT[tier];

  /*
   * Hashed rather than random: the same field every visit, and no impure call
   * during a render.
   */
  const rocks = useMemo<Rock[]>(() => {
    return Array.from({ length: count }, (_, index) => {
      const seed = index * 11 + 3;
      return {
        position: new THREE.Vector3(
          (hashNoise(seed) - 0.5) * HALF.x * 2,
          (hashNoise(seed + 1) - 0.5) * HALF.y * 2,
          (hashNoise(seed + 2) - 0.5) * HALF.z * 2,
        ),
        velocity: new THREE.Vector3(
          (hashNoise(seed + 3) - 0.5) * 0.5,
          (hashNoise(seed + 4) - 0.5) * 0.3,
          (hashNoise(seed + 5) - 0.5) * 0.5,
        ),
        tilt: new THREE.Euler(
          hashNoise(seed + 6) * 3,
          hashNoise(seed + 7) * 3,
          hashNoise(seed + 8) * 3,
        ),
        spin: new THREE.Vector3(
          (hashNoise(seed + 9) - 0.5) * 0.35,
          (hashNoise(seed + 10) - 0.5) * 0.35,
          (hashNoise(seed + 11) - 0.5) * 0.35,
        ),
        // Mostly gravel, with the occasional rock worth looking at.
        scale: 0.06 + Math.pow(hashNoise(seed + 12), 3) * 0.9,
      };
    });
  }, [count]);

  useFrame((state, delta) => {
    const instances = mesh.current;
    if (!instances) return;

    const camera = state.camera.position;
    const step = Math.min(delta, 0.05);

    rocks.forEach((rock, index) => {
      rock.position.addScaledVector(rock.velocity, step);
      rock.position.set(
        wrap(rock.position.x, camera.x, HALF.x),
        wrap(rock.position.y, camera.y, HALF.y),
        wrap(rock.position.z, camera.z, HALF.z),
      );

      scratch.position.copy(rock.position);
      scratch.rotation.set(
        rock.tilt.x + state.clock.elapsedTime * rock.spin.x,
        rock.tilt.y + state.clock.elapsedTime * rock.spin.y,
        rock.tilt.z + state.clock.elapsedTime * rock.spin.z,
      );
      scratch.scale.setScalar(rock.scale);
      scratch.updateMatrix();
      instances.setMatrixAt(index, scratch.matrix);
    });

    instances.instanceMatrix.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <>
      {/*
        Two lights, and only the rocks answer to them: everything else in the
        scene is a shader or a point sprite. A cool key from above and a warm
        fill from behind keep the silhouettes readable without lighting the
        rocks brightly enough to compete with the stars.
      */}
      <directionalLight position={[8, 14, 6]} intensity={1.5} color="#cfe1ff" />
      <directionalLight position={[-10, -4, -12]} intensity={0.5} color="#ffb27a" />
      <ambientLight intensity={0.16} color="#2b3358" />

      <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#4a4a5c" roughness={1} metalness={0} flatShading />
      </instancedMesh>
    </>
  );
}
