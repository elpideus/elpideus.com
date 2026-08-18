"use client";

/**
 * Camera choreography.
 *
 * The rig owns one job: given the star the store says is focused, plus the free
 * orbit the visitor has dialled in, put the camera somewhere flattering and get
 * there smoothly. Nothing here writes to React state during a frame; the only
 * store write is the settle flag once a flight ends.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { getStar, satellitesOf } from "@/lib/graph/nodes";
import { StarClass, StarDepth } from "@/lib/graph/types";
import { damp, easeInOutCubic } from "@/lib/three/math";
import { TravelPhase, travelProgress, useJourney } from "@/lib/state/journey";
import { relaxOrbit, viewIntent } from "@/lib/state/view";

/** Base viewing distance per depth, before dolly and per star radius. */
const DISTANCE_PRIMARY = 15;
const DISTANCE_SATELLITE = 7.5;
/**
 * Framing offset, expressed as a fraction of the viewing distance and applied
 * to the look at point rather than to the camera position: moving the camera
 * sideways changes nothing once it looks back at the star, while nudging the
 * target sideways is what actually pushes the star off centre. Positive values
 * move the aim to the right, so the star lands on the left, clear of the panel.
 */
const FRAMING_RIGHT = 0.3;
const FRAMING_UP = -0.02;
/** How long the orbit keeps drifting back to neutral after a flight starts. */
const ORBIT_RELAX = 0.965;

export function CameraRig() {
  const { camera } = useThree();

  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);
  const currentTarget = useRef(new THREE.Vector3(0, 0, -12));
  const orbit = useRef({ yaw: 0, pitch: 0, dolly: 0 });
  const roll = useRef(0);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const worldUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const initialised = useRef(false);

  useFrame((state, delta) => {
    const journey = useJourney.getState();
    const star = getStar(journey.focus);
    const traveling = journey.phase === TravelPhase.Traveling;
    const progress = travelProgress(journey, performance.now());

    // While travelling, ease the free orbit back towards neutral so arrivals are
    // always well framed, then hand control back to the visitor.
    if (traveling) relaxOrbit(ORBIT_RELAX);

    orbit.current.yaw = damp(orbit.current.yaw, viewIntent.yaw, 0.0015, delta);
    orbit.current.pitch = damp(orbit.current.pitch, viewIntent.pitch, 0.0015, delta);
    orbit.current.dolly = damp(orbit.current.dolly, viewIntent.dolly, 0.002, delta);

    // Stars that carry satellites are viewed from further back, so the whole
    // cluster fits beside the panel rather than hiding behind it.
    const crowded = star.depth === StarDepth.Primary && satellitesOf(star.id).length > 0;
    const baseDistance =
      (star.depth === StarDepth.Satellite ? DISTANCE_SATELLITE : DISTANCE_PRIMARY) *
      (0.75 + star.radius * 0.35) *
      (crowded ? 1.45 : 1);

    // Idle drift: a slow figure that never stops, scaled down while the visitor
    // is actively orbiting so it never fights the pointer.
    const sinceInput = (performance.now() - viewIntent.lastInteraction) / 1000;
    const idle = Math.min(Math.max(sinceInput - 0.8, 0) / 2.5, 1);
    const t = state.clock.elapsedTime;
    const driftYaw = Math.sin(t * 0.09) * 0.055 * idle;
    const driftPitch = Math.cos(t * 0.071) * 0.035 * idle;

    const yaw = orbit.current.yaw + driftYaw;
    const pitch = orbit.current.pitch + driftPitch;
    const distance = baseDistance + orbit.current.dolly;

    // Spherical placement around the focused star.
    desiredPosition.set(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch),
    );
    desiredPosition.multiplyScalar(distance);
    desiredPosition.add(scratch.set(...star.position));

    forward.copy(scratch).sub(desiredPosition).normalize();
    right.copy(forward).cross(worldUp).normalize();

    desiredTarget
      .set(...star.position)
      .addScaledVector(right, distance * FRAMING_RIGHT)
      .addScaledVector(worldUp, distance * FRAMING_UP);

    // Flights use an eased blend that starts slow, covers ground, then settles.
    const flightEase = traveling ? 0.18 + easeInOutCubic(progress) * 0.55 : 1;
    const positionSmoothing = traveling ? 0.00035 / flightEase : 0.0025;
    const targetSmoothing = traveling ? 0.0006 / flightEase : 0.003;

    if (!initialised.current) {
      // First frame: start pulled back and slightly above, then fly in.
      camera.position.copy(desiredPosition).add(scratch.set(6, 4, 26));
      currentTarget.current.copy(desiredTarget);
      initialised.current = true;
    }

    camera.position.x = damp(camera.position.x, desiredPosition.x, positionSmoothing, delta);
    camera.position.y = damp(camera.position.y, desiredPosition.y, positionSmoothing, delta);
    camera.position.z = damp(camera.position.z, desiredPosition.z, positionSmoothing, delta);

    currentTarget.current.x = damp(currentTarget.current.x, desiredTarget.x, targetSmoothing, delta);
    currentTarget.current.y = damp(currentTarget.current.y, desiredTarget.y, targetSmoothing, delta);
    currentTarget.current.z = damp(currentTarget.current.z, desiredTarget.z, targetSmoothing, delta);

    camera.lookAt(currentTarget.current);

    /*
     * Beacon stars get a touch of roll, purely for character.
     *
     * It is tracked here and applied on top of `lookAt`, never damped through
     * `camera.rotation.z`. That Euler component is recomputed by `lookAt` from
     * the current orientation every frame, and it is only zero while the pitch
     * is: damping the camera's own value back towards a target therefore fights
     * `lookAt` once the visitor has tilted the view, and the two alternate every
     * frame. Since a roll moves an off centre star mostly up and down, that
     * showed up as the waypoint panel shaking after a pan.
     */
    const rollTarget = star.kind === StarClass.Beacon ? Math.sin(t * 0.12) * 0.012 : 0;
    roll.current = damp(roll.current, rollTarget, 0.002, delta);
    if (Math.abs(roll.current) > 1e-5) camera.rotateZ(roll.current);

    if (traveling && progress >= 1) {
      journey.markSettled();
      if (!journey.ready) journey.markReady();
    }
    if (!journey.ready && state.clock.elapsedTime > 1.6) journey.markReady();
  });

  return null;
}
