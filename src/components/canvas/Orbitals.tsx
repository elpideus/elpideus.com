"use client";

/**
 * Real companions and planets, in orbit around the stars that actually have
 * them.
 *
 * Most stars on the map carry nothing here: the data in `orbitals.ts` only
 * covers what is documented in real astronomy, so a lone star like Canopus is
 * correctly bare. A body may orbit a star or another body, which is how a
 * companion that is itself a close pair gets both halves drawn.
 *
 * Each body is rendered for what it is. A companion star is emissive with its
 * own halo, a planet is a lit sphere with a terminator and a procedural
 * surface, and a debris disc is a shaded plane of belts. Every body projects
 * its own screen anchor the same way `Projector` does for stars, so its
 * tooltip tracks it without React re-rendering per frame.
 */

import { Billboard } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { getStar } from "@/lib/graph/nodes";
import { ORBITAL_BY_ID, ORBITALS, OrbitalLook, type OrbitalBody } from "@/lib/content/orbitals";
import { flushAnchors, writeAnchor } from "@/lib/state/anchors";
import { useOrbitalHover } from "@/lib/state/orbitalHover";
import { CursorMode, setCursorMode } from "@/lib/state/cursor";
import { HALO_FRAGMENT, HALO_VERTEX } from "@/lib/three/shaders/halo";
import {
  DISC_FRAGMENT,
  DISC_VERTEX,
  PLANET_FRAGMENT,
  PLANET_MODE,
  PLANET_VERTEX,
} from "@/lib/three/shaders/orbital";
import { hashNoise } from "@/lib/three/math";

/** Halo tuning per stellar archetype. A white dwarf is tiny and fierce. */
const STAR_STYLE: Record<string, { halo: number; intensity: number; spikes: number; twinkle: number }> = {
  [OrbitalLook.WhiteDwarf]: { halo: 13, intensity: 0.82, spikes: 0.95, twinkle: 0.14 },
  [OrbitalLook.BlueStar]: { halo: 8, intensity: 0.6, spikes: 0.45, twinkle: 0.1 },
  [OrbitalLook.SunLike]: { halo: 7.2, intensity: 0.52, spikes: 0.35, twinkle: 0.08 },
};

const PLANET_LOOKS: Partial<Record<OrbitalLook, number>> = {
  [OrbitalLook.Rocky]: PLANET_MODE.rocky,
  [OrbitalLook.GasGiant]: PLANET_MODE.gasGiant,
  [OrbitalLook.IceGiant]: PLANET_MODE.iceGiant,
};

/**
 * World position of a body at a given time.
 *
 * A body that orbits another body is resolved by walking up to its parent
 * first, so the pair moves as one and the inner member never drifts off on its
 * own. The chain is one deep in the data and guarded anyway.
 */
function bodyPosition(body: OrbitalBody, time: number, out: THREE.Vector3): THREE.Vector3 {
  const parent = body.parentBody ? ORBITAL_BY_ID.get(body.parentBody) : undefined;

  if (parent && parent.id !== body.id) {
    bodyPosition(parent, time, out);
  } else {
    const star = getStar(body.star);
    out.set(star.position[0], star.position[1], star.position[2]);
  }

  const angle = body.phase + time * body.speed;
  out.x += Math.cos(angle) * body.orbitRadius;
  out.y += Math.sin(angle) * body.orbitRadius * Math.sin(body.tilt);
  out.z += Math.sin(angle) * body.orbitRadius * Math.cos(body.tilt);
  return out;
}

/** Pointer handlers shared by every body. */
function useHoverHandlers(id: string) {
  return useMemo(() => {
    const over = (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      useOrbitalHover.getState().setHovered(id);
      setCursorMode(CursorMode.Target);
    };

    const out = (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      const hoverState = useOrbitalHover.getState();
      if (hoverState.hovered === id) hoverState.setHovered(null);
      setCursorMode(CursorMode.Default);
    };

    return { over, out };
  }, [id]);
}

/** Screen anchor for the tooltip, written straight into the anchor store. */
function writeBodyAnchor(
  id: string,
  world: THREE.Vector3,
  camera: THREE.Camera,
  forward: THREE.Vector3,
  toBody: THREE.Vector3,
  projected: THREE.Vector3,
  width: number,
  height: number,
) {
  toBody.copy(world).sub(camera.position);
  camera.getWorldDirection(forward);
  const inFront = toBody.dot(forward) > 0;

  projected.copy(world).project(camera);
  writeAnchor(
    id,
    (projected.x * 0.5 + 0.5) * width,
    (-projected.y * 0.5 + 0.5) * height,
    inFront,
    toBody.length(),
  );
  flushAnchors();
}

function CompanionStar({ body }: { body: OrbitalBody }) {
  const group = useRef<THREE.Group>(null);
  const halo = useRef<THREE.ShaderMaterial>(null);
  const style = STAR_STYLE[body.look] ?? STAR_STYLE[OrbitalLook.SunLike];
  const handlers = useHoverHandlers(body.id);

  const color = useMemo(() => new THREE.Color(body.color), [body.color]);
  const phase = useMemo(() => hashNoise(body.orbitRadius + body.phase) * Math.PI * 2, [body]);
  const scratch = useMemo(
    () => ({
      world: new THREE.Vector3(),
      forward: new THREE.Vector3(),
      toBody: new THREE.Vector3(),
      projected: new THREE.Vector3(),
    }),
    [],
  );

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

  /*
   * Uniforms are written through the material, not through the object handed
   * to it. That object is the initial value; the material holds the live copy
   * the renderer reads, and writing to the wrong one animates nothing.
   */
  useFrame((state) => {
    const live = halo.current?.uniforms;
    if (live) live.uTime.value = state.clock.elapsedTime;
    bodyPosition(body, state.clock.elapsedTime, scratch.world);
    group.current?.position.copy(scratch.world);

    writeBodyAnchor(
      body.id,
      scratch.world,
      state.camera,
      scratch.forward,
      scratch.toBody,
      scratch.projected,
      state.size.width,
      state.size.height,
    );
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[body.radius, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      <Billboard>
        <mesh renderOrder={2}>
          <planeGeometry args={[body.radius * style.halo, body.radius * style.halo]} />
          <shaderMaterial
            ref={halo}
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

      {/* Generous, invisible hit target so a small companion is easy to hover. */}
      <mesh onPointerOver={handlers.over} onPointerOut={handlers.out}>
        <sphereGeometry args={[Math.max(body.radius * 4, 0.55), 10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  );
}

function Planet({ body }: { body: OrbitalBody }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const handlers = useHoverHandlers(body.id);
  const star = getStar(body.star);

  const scratch = useMemo(
    () => ({
      world: new THREE.Vector3(),
      forward: new THREE.Vector3(),
      toBody: new THREE.Vector3(),
      projected: new THREE.Vector3(),
      star: new THREE.Vector3(star.position[0], star.position[1], star.position[2]),
    }),
    [star.position],
  );

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(body.color) },
      uAccent: { value: new THREE.Color(body.accent ?? body.color) },
      uLight: { value: new THREE.Vector3(0, 0, 1) },
      uLightColor: { value: new THREE.Color(star.color) },
      uTime: { value: 0 },
      uSeed: { value: hashNoise(body.orbitRadius * 31.7 + body.phase) * 40 },
      uSpin: { value: 0.06 + body.speed * 0.35 },
      uMode: { value: PLANET_LOOKS[body.look] ?? PLANET_MODE.rocky },
    }),
    [body, star.color],
  );

  // Through the material, for the reason given in `CompanionStar`.
  useFrame((state) => {
    const live = material.current?.uniforms;
    bodyPosition(body, state.clock.elapsedTime, scratch.world);
    group.current?.position.copy(scratch.world);

    if (live) {
      live.uTime.value = state.clock.elapsedTime;
      // The star lights the planet, so the terminator turns as the orbit does.
      live.uLight.value.copy(scratch.star).sub(scratch.world).normalize();
    }

    writeBodyAnchor(
      body.id,
      scratch.world,
      state.camera,
      scratch.forward,
      scratch.toBody,
      scratch.projected,
      state.size.width,
      state.size.height,
    );
  });

  return (
    <group ref={group}>
      {/* A modest axial tilt, so the bands and poles are never edge on. */}
      <mesh rotation={[0.32, 0, 0.12]}>
        <sphereGeometry args={[body.radius, 40, 28]} />
        <shaderMaterial
          ref={material}
          vertexShader={PLANET_VERTEX}
          fragmentShader={PLANET_FRAGMENT}
          uniforms={uniforms}
          toneMapped={false}
        />
      </mesh>

      <mesh onPointerOver={handlers.over} onPointerOut={handlers.out}>
        <sphereGeometry args={[Math.max(body.radius * 3, 0.55), 10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  );
}

function DebrisDisc({ body }: { body: OrbitalBody }) {
  const star = getStar(body.star);
  const material = useRef<THREE.ShaderMaterial>(null);
  const handlers = useHoverHandlers(body.id);

  const scratch = useMemo(
    () => ({
      world: new THREE.Vector3(star.position[0], star.position[1], star.position[2]),
      forward: new THREE.Vector3(),
      toBody: new THREE.Vector3(),
      projected: new THREE.Vector3(),
    }),
    [star.position],
  );

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(body.color) },
      uAccent: { value: new THREE.Color(body.accent ?? body.color) },
      uTime: { value: 0 },
      // The body's own rate, straight through. It is set in the content file
      // on the same scale as every companion here, so the dust keeps pace with
      // what orbits at a comparable distance instead of racing it.
      uSpin: { value: body.speed },
      uSeed: { value: hashNoise(body.radius * 17.3) * 30 },
    }),
    [body],
  );

  // Through the material, for the reason given in `CompanionStar`.
  useFrame((state) => {
    const live = material.current?.uniforms;
    if (live) live.uTime.value = state.clock.elapsedTime;

    writeBodyAnchor(
      body.id,
      scratch.world,
      state.camera,
      scratch.forward,
      scratch.toBody,
      scratch.projected,
      state.size.width,
      state.size.height,
    );
  });

  const span = body.radius * 2;

  return (
    <group
      position={star.position as unknown as THREE.Vector3Tuple}
      rotation={[body.tilt, 0, 0.24]}
    >
      <mesh renderOrder={1} onPointerOver={handlers.over} onPointerOut={handlers.out}>
        <planeGeometry args={[span, span]} />
        <shaderMaterial
          ref={material}
          vertexShader={DISC_VERTEX}
          fragmentShader={DISC_FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export function Orbitals() {
  return (
    <group>
      {ORBITALS.map((body) => {
        if (body.look === OrbitalLook.DebrisDisc) return <DebrisDisc key={body.id} body={body} />;
        if (body.look in PLANET_LOOKS) return <Planet key={body.id} body={body} />;
        return <CompanionStar key={body.id} body={body} />;
      })}
    </group>
  );
}
