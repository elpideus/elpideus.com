"use client";

/**
 * What is left of whatever fell in.
 *
 * Real geometry orbiting the hole, lit by a single warm light at the centre.
 * It exists to make the shot three dimensional: the lensed sky behind is a
 * shader, so without something with actual parallax in front of it the scene
 * would read as a picture of a black hole rather than a place near one.
 *
 * Orbits are Keplerian in shape only, the inner rocks lapping the outer ones,
 * which is enough for the eye and costs one matrix per rock per frame.
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { hashNoise } from "@/lib/three/math";

const COUNT = 40;
/** Rocks stay outside the disc, so nothing appears to sit inside the fire. */
const RADIUS_MIN = 15;
const RADIUS_MAX = 62;

interface Rock {
  radius: number;
  /** Angle now, and how fast it grows. */
  phase: number;
  speed: number;
  height: number;
  scale: number;
  tilt: THREE.Euler;
  spin: THREE.Vector3;
}

export function Debris({ frozen = false }: { frozen?: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const scratch = useMemo(() => new THREE.Object3D(), []);

  /*
   * The field is hashed rather than random, the way the star layers on the map
   * are: the same debris every visit, and no impurity in a render.
   */
  const rocks = useMemo<Rock[]>(() => {
    return Array.from({ length: COUNT }, (_, index) => {
      const seed = index * 7 + 1;
      const radius =
        RADIUS_MIN + Math.pow(hashNoise(seed), 0.7) * (RADIUS_MAX - RADIUS_MIN);

      return {
        radius,
        phase: hashNoise(seed + 1) * Math.PI * 2,
        speed: 0.16 * Math.pow(RADIUS_MIN / radius, 1.5),
        height: (hashNoise(seed + 2) - 0.5) * radius * 0.25,
        scale: 0.1 + hashNoise(seed + 3) * 0.34,
        tilt: new THREE.Euler(
          hashNoise(seed + 4) * 3,
          hashNoise(seed + 5) * 3,
          hashNoise(seed + 6) * 3,
        ),
        spin: new THREE.Vector3(
          (hashNoise(seed + 7) - 0.5) * 0.6,
          (hashNoise(seed + 8) - 0.5) * 0.6,
          (hashNoise(seed + 9) - 0.5) * 0.6,
        ),
      };
    });
  }, []);

  useFrame((state) => {
    const instances = mesh.current;
    if (!instances) return;

    const t = frozen ? 8 : state.clock.elapsedTime;

    rocks.forEach((rock, index) => {
      const angle = rock.phase + t * rock.speed;
      scratch.position.set(
        Math.cos(angle) * rock.radius,
        rock.height + Math.sin(angle * 0.6) * 0.6,
        Math.sin(angle) * rock.radius,
      );
      scratch.rotation.set(
        rock.tilt.x + t * rock.spin.x,
        rock.tilt.y + t * rock.spin.y,
        rock.tilt.z + t * rock.spin.z,
      );
      scratch.scale.setScalar(rock.scale);
      scratch.updateMatrix();
      instances.setMatrixAt(index, scratch.matrix);
    });

    instances.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {/* The disc is the only light source in the scene, so it acts like one. */}
      <pointLight position={[0, 0, 0]} color="#ffb27a" intensity={1900} distance={0} decay={2} />
      <ambientLight color="#4a4468" intensity={0.35} />

      <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#5f5869" roughness={1} metalness={0} flatShading />
      </instancedMesh>
    </>
  );
}
