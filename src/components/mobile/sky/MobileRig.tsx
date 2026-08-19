"use client";

/**
 * The camera, flown by the scroll position of the deck.
 *
 * Desktop pages between stars one gesture at a time. A phone scrolls, so here
 * the journey is continuous: `telemetry.progress` is a float index into
 * `JOURNEY` written by the deck, and the camera sits at the matching point of
 * the polyline through the stars. Reading a section holds the camera at its
 * star; flicking the deck sends it down the corridor.
 *
 * Focusing a satellite takes the camera off the corridor entirely, which is
 * what makes a project sheet feel like a place rather than a modal.
 *
 * Two rules from the desktop rig carry over unchanged: nothing per frame goes
 * through React, and the roll is applied with `rotateZ` after `lookAt` rather
 * than damped as an Euler component, because `lookAt` rewrites the whole
 * rotation on every frame.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { JOURNEY, getStar } from "@/lib/graph/nodes";
import { StarDepth } from "@/lib/graph/types";
import { clamp, damp } from "@/lib/three/math";
import { telemetry } from "@/lib/state/mobile";
import { useJourney } from "@/lib/state/journey";

/** Where the camera parks relative to a section star. */
const STANDOFF = new THREE.Vector3(0, 2.2, 15);
/** Same, for a satellite: closer, because satellites are much smaller. */
const SATELLITE_STANDOFF = new THREE.Vector3(0, 1, 8);
/**
 * How far below the star the camera actually looks. Pushing the star into the
 * upper third of a portrait screen is what leaves room for the panel without
 * ever burying the thing the panel is about.
 */
const LOOK_DROP = 3.8;
const SATELLITE_LOOK_DROP = 1.8;
/** Camera speed, in world units per second, that counts as full warp. */
const FULL_WARP = 70;
/** Frames to let the first shaders compile before the veil is allowed to lift. */
const READY_AFTER_FRAMES = 8;

export function MobileRig() {
  const { camera } = useThree();
  const frames = useRef(0);
  const previous = useMemo(() => new THREE.Vector3(), []);
  const wantedPosition = useMemo(() => new THREE.Vector3(), []);
  const wantedTarget = useMemo(() => new THREE.Vector3(), []);
  const smoothTarget = useMemo(() => new THREE.Vector3(), []);
  const scratch = useMemo(() => new THREE.Vector3(), []);

  /** Camera stations, one per section star, in journey order. */
  const stations = useMemo(
    () => JOURNEY.map((id) => new THREE.Vector3(...getStar(id).position)),
    [],
  );

  // Start parked on the first star rather than flying in from nowhere.
  useEffect(() => {
    smoothTarget.copy(stations[0]).setY(stations[0].y - LOOK_DROP);
    camera.position.copy(stations[0]).add(STANDOFF);
    camera.lookAt(smoothTarget);
    previous.copy(camera.position);
  }, [camera, previous, smoothTarget, stations]);

  useFrame((state, delta) => {
    const focus = useJourney.getState().focus;
    const focused = getStar(focus);
    const onSatellite = focused.depth === StarDepth.Satellite;

    if (onSatellite) {
      wantedTarget.set(...focused.position);
      wantedPosition.copy(wantedTarget).add(SATELLITE_STANDOFF);
      wantedTarget.y -= SATELLITE_LOOK_DROP;
    } else {
      const progress = clamp(telemetry.progress, 0, stations.length - 1);
      const index = Math.min(Math.floor(progress), stations.length - 2);
      const blend = clamp(progress - index, 0, 1);

      wantedTarget.copy(stations[index]).lerp(stations[index + 1], blend);
      wantedPosition.copy(wantedTarget).add(STANDOFF);
      wantedTarget.y -= LOOK_DROP;
    }

    // A slow breath so a stationary sky is never completely still.
    if (!telemetry.reducedMotion) {
      const elapsed = state.clock.elapsedTime;
      wantedPosition.x += Math.sin(elapsed * 0.17) * 0.9;
      wantedPosition.y += Math.cos(elapsed * 0.13) * 0.6;
    }

    // Satellites are a deliberate detour, so they are approached faster than
    // the corridor is travelled.
    const smoothing = onSatellite ? 0.0009 : 0.004;
    camera.position.x = damp(camera.position.x, wantedPosition.x, smoothing, delta);
    camera.position.y = damp(camera.position.y, wantedPosition.y, smoothing, delta);
    camera.position.z = damp(camera.position.z, wantedPosition.z, smoothing, delta);

    smoothTarget.x = damp(smoothTarget.x, wantedTarget.x, smoothing, delta);
    smoothTarget.y = damp(smoothTarget.y, wantedTarget.y, smoothing, delta);
    smoothTarget.z = damp(smoothTarget.z, wantedTarget.z, smoothing, delta);

    camera.lookAt(smoothTarget);

    // Tilt is applied on top of the flight path, never mixed into it, so the
    // sky answers the phone immediately however slowly the camera is moving.
    if (!telemetry.reducedMotion) {
      camera.rotateX(-telemetry.tiltX);
      camera.rotateY(-telemetry.tiltY);
      camera.rotateZ(telemetry.tiltY * 0.45);
    }

    // Whatever ground the camera actually covered becomes the warp signal, so
    // scrolling, deep links and satellite flights all stretch the sky alike.
    const covered = scratch.copy(camera.position).sub(previous).length();
    previous.copy(camera.position);
    telemetry.warp = damp(
      telemetry.warp,
      clamp(covered / Math.max(delta, 0.0001) / FULL_WARP, 0, 1),
      0.004,
      delta,
    );

    frames.current += 1;
    if (frames.current === READY_AFTER_FRAMES) useJourney.getState().markReady();
  });

  return null;
}
