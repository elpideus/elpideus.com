"use client";

/**
 * Real companions and planets, in orbit around the nav stars that actually
 * have them.
 *
 * Most stars on the map carry nothing here: the data in `orbitals.ts` only
 * covers what is documented in real astronomy, so a giant like Betelgeuse or
 * a lone star like Canopus is correctly bare. Each body projects its own
 * screen anchor the same way `Projector` does for stars, so its tooltip can
 * track it without React ever re-rendering per frame.
 */

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { getStar } from "@/lib/graph/nodes";
import { ORBITALS, type OrbitalBody } from "@/lib/content/orbitals";
import { flushAnchors, writeAnchor } from "@/lib/state/anchors";
import { useOrbitalHover } from "@/lib/state/orbitalHover";
import { CursorMode, setCursorMode } from "@/lib/state/cursor";

function OrbitalPoint({ body }: { body: OrbitalBody }) {
  const star = getStar(body.star);
  const group = useRef<THREE.Group>(null);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const toBody = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const color = useMemo(() => new THREE.Color(body.color), [body.color]);

  useFrame((state) => {
    const angle = body.phase + state.clock.elapsedTime * body.speed;
    scratch.set(
      star.position[0] + Math.cos(angle) * body.orbitRadius,
      star.position[1] + Math.sin(angle) * body.orbitRadius * Math.sin(body.tilt),
      star.position[2] + Math.sin(angle) * body.orbitRadius * Math.cos(body.tilt),
    );
    group.current?.position.copy(scratch);

    const { camera, size } = state;
    toBody.copy(scratch).sub(camera.position);
    camera.getWorldDirection(forward);
    const inFront = toBody.dot(forward) > 0;

    const projected = scratch.clone().project(camera);
    const x = (projected.x * 0.5 + 0.5) * size.width;
    const y = (-projected.y * 0.5 + 0.5) * size.height;
    writeAnchor(body.id, x, y, inFront, toBody.length());
    flushAnchors();
  });

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    useOrbitalHover.getState().setHovered(body.id);
    setCursorMode(CursorMode.Target);
  };

  const handleOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const hoverState = useOrbitalHover.getState();
    if (hoverState.hovered === body.id) hoverState.setHovered(null);
    setCursorMode(CursorMode.Default);
  };

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[body.radius, 14, 14]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      {/* Generous, invisible hit target so a small planet is easy to hover. */}
      <mesh onPointerOver={handleOver} onPointerOut={handleOut}>
        <sphereGeometry args={[Math.max(body.radius * 3, 0.55), 10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  );
}

function OrbitalDisc({ body }: { body: OrbitalBody }) {
  const star = getStar(body.star);
  const color = useMemo(() => new THREE.Color(body.color), [body.color]);
  const scratch = useMemo(() => new THREE.Vector3(...star.position), [star.position]);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const toBody = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const { camera, size } = state;
    toBody.copy(scratch).sub(camera.position);
    camera.getWorldDirection(forward);
    const inFront = toBody.dot(forward) > 0;

    const projected = scratch.clone().project(camera);
    const x = (projected.x * 0.5 + 0.5) * size.width;
    const y = (-projected.y * 0.5 + 0.5) * size.height;
    writeAnchor(body.id, x, y, inFront, toBody.length());
    flushAnchors();
  });

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    useOrbitalHover.getState().setHovered(body.id);
    setCursorMode(CursorMode.Target);
  };

  const handleOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const hoverState = useOrbitalHover.getState();
    if (hoverState.hovered === body.id) hoverState.setHovered(null);
    setCursorMode(CursorMode.Default);
  };

  return (
    <group position={star.position as unknown as THREE.Vector3Tuple} rotation={[body.tilt, 0, 0]}>
      <mesh onPointerOver={handleOver} onPointerOut={handleOut}>
        <ringGeometry args={[body.radius * 0.55, body.radius, 48]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export function Orbitals() {
  return (
    <group>
      {ORBITALS.map((body) =>
        body.kind === "disc" ? (
          <OrbitalDisc key={body.id} body={body} />
        ) : (
          <OrbitalPoint key={body.id} body={body} />
        ),
      )}
    </group>
  );
}
