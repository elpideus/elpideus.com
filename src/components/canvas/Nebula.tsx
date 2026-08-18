"use client";

/**
 * The nebula shell that surrounds the entire scene.
 *
 * A single inverted sphere rides with the camera. Because the shader samples
 * noise along the view direction only, the clouds never shift when the camera
 * translates, which is exactly how something a thousand light years away should
 * behave, while orbiting still reveals new parts of the sky.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { NEBULA_FRAGMENT, NEBULA_VERTEX } from "@/lib/three/shaders/nebula";

const SHELL_RADIUS = 800;

export function Nebula({ intensity = 0.85 }: { intensity?: number }) {
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
      <sphereGeometry args={[SHELL_RADIUS, 48, 32]} />
      <shaderMaterial
        vertexShader={NEBULA_VERTEX}
        fragmentShader={NEBULA_FRAGMENT}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
