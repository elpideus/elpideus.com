"use client";

/**
 * The stars themselves.
 *
 * Every node is three objects: an emissive core, a camera facing halo drawn by
 * a shader, and an oversized invisible sphere that catches the pointer so the
 * hit area stays comfortable without making the visible star bigger.
 *
 * Per frame state (scale, glow, twinkle) is read straight from the store inside
 * `useFrame` instead of through React, so hovering a star never re-renders the
 * scene graph.
 */

import { Billboard } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { STARS } from "@/lib/graph/nodes";
import { StarClass, type StarNode } from "@/lib/graph/types";
import { HALO_FRAGMENT, HALO_VERTEX } from "@/lib/three/shaders/halo";
import { damp, hashNoise } from "@/lib/three/math";
import { TravelIntent, useJourney } from "@/lib/state/journey";
import { CursorMode, setCursorMode } from "@/lib/state/cursor";

/** Per class visual tuning. */
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

/** Extra scale applied while a star is hovered or focused. */
const HOVER_SCALE = 1.28;
const FOCUS_SCALE = 1.16;

function Star({ node }: { node: StarNode }) {
  const style = CLASS_STYLE[node.kind];
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => hashNoise(node.position[2] + node.radius) * Math.PI * 2, [node]);

  const color = useMemo(() => new THREE.Color(node.color), [node.color]);
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

  const focusScale = useRef(1);

  /*
    The focused star swells and sits closest to the camera, so leaving its hit
    sphere in the scene would swallow pointer events meant for its neighbours.
    Focus changes at most once per navigation, so subscribing to it in React is
    free; nothing per frame goes through this.
  */
  const isFocused = useJourney((state) => state.focus === node.id);

  // Unmounting the hit sphere fires no pointer out, so drop any stale hover.
  useEffect(() => {
    if (!isFocused) return;
    const state = useJourney.getState();
    if (state.hovered === node.id) state.setHovered(null);
    setCursorMode(CursorMode.Default);
  }, [isFocused, node.id]);

  useFrame((state, delta) => {
    haloUniforms.uTime.value = state.clock.elapsedTime;

    const { hovered } = useJourney.getState();
    const isHovered = hovered === node.id;
    const target = isHovered ? HOVER_SCALE : isFocused ? FOCUS_SCALE : 1;

    focusScale.current = damp(focusScale.current, target, 0.001, delta);
    group.current?.scale.setScalar(focusScale.current);

    haloUniforms.uIntensity.value = damp(
      haloUniforms.uIntensity.value,
      style.intensity * (isHovered ? 1.45 : isFocused ? 1.2 : 1),
      0.002,
      delta,
    );

    if (core.current) {
      const material = core.current.material as THREE.MeshBasicMaterial;
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.9 + phase) * 0.06 * style.twinkle * 6;
      material.color.copy(color).multiplyScalar(style.coreBoost * breathe);
    }
  });

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    useJourney.getState().setHovered(node.id);
    setCursorMode(CursorMode.Target);
  };

  const handleOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const state = useJourney.getState();
    if (state.hovered === node.id) state.setHovered(null);
    setCursorMode(CursorMode.Default);
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    useJourney.getState().focusStar(node.id, TravelIntent.Pointer);
  };

  return (
    <group ref={group} position={node.position as unknown as THREE.Vector3Tuple}>
      <mesh ref={core}>
        <sphereGeometry args={[node.radius * 0.34, 20, 20]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      <Billboard>
        <mesh renderOrder={2}>
          <planeGeometry args={[node.radius * style.haloScale, node.radius * style.haloScale]} />
          <shaderMaterial
            vertexShader={HALO_VERTEX}
            fragmentShader={HALO_FRAGMENT}
            uniforms={haloUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </Billboard>

      {/*
        Generous hit target. It has to stay "visible" as far as three.js is
        concerned, because the raycaster skips invisible objects; writing
        neither colour nor depth makes it invisible to the eye instead.
        The focused star drops it entirely so the pointer can reach past it.
      */}
      {!isFocused && (
        <mesh onPointerOver={handleOver} onPointerOut={handleOut} onClick={handleClick}>
          <sphereGeometry args={[Math.max(node.radius * 2.6, 2.2), 12, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      )}
    </group>
  );
}

export function StarNodes() {
  return (
    <group>
      {STARS.map((node) => (
        <Star key={node.id} node={node} />
      ))}
    </group>
  );
}
