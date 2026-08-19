"use client";

/**
 * The nebula shell for the handheld build.
 *
 * Identical geometry to the desktop shell, a cheaper shader and a coarser
 * sphere: the clouds are a backdrop nobody looks at directly, and every
 * fragment of them is paid for on a phone GPU.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { NEBULA_FRAGMENT_LEAN, NEBULA_VERTEX } from "@/lib/three/shaders/nebula";

const SHELL_RADIUS = 700;

export function MobileNebula({ intensity = 0.62 }: { intensity?: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uColorDeep: { value: new THREE.Color("#03040c") },
      uColorMid: { value: new THREE.Color("#1b2b6b") },
      uColorHot: { value: new THREE.Color("#7a2f6b") },
    }),
    [intensity],
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    mesh.current?.position.copy(camera.position);
  });

  return (
    <mesh ref={mesh} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[SHELL_RADIUS, 32, 20]} />
      <shaderMaterial
        vertexShader={NEBULA_VERTEX}
        fragmentShader={NEBULA_FRAGMENT_LEAN}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
