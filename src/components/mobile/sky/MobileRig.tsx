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
 * Where the star lands on the glass is not the rig's decision. The chrome asks
 * for a screen fraction through `telemetry.focusX/focusY`, because only the
 * chrome knows how much of the screen it is covering, and the rig converts that
 * into a look at offset once it knows how wide the frustum is at its parking
 * distance. That is what lets one camera serve a phone deck, a tablet bridge
 * beside the sky and a tablet bridge above it.
 *
 * Two rules from the desktop rig carry over unchanged: nothing per frame goes
 * through React, and the roll is applied with `rotateZ` after `lookAt` rather
 * than damped as an Euler component, because `lookAt` rewrites the whole
 * rotation on every frame.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
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
 * A satellite is framed nearer the middle than a section star: its sheet or its
 * dossier covers less glass, and it is small enough that pushing it to an edge
 * loses it.
 */
const SATELLITE_FRAME_PULL = 0.85;
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
  const framing = useMemo(() => new THREE.Vector2(), []);
  /** Free look, damped towards whatever the chrome is currently asking for. */
  const look = useMemo(() => new THREE.Vector2(), []);

  /** Camera stations, one per section star, in journey order. */
  const stations = useMemo(
    () => JOURNEY.map((id) => new THREE.Vector3(...getStar(id).position)),
    [],
  );

  /**
   * Turns the framing request into a look at offset in world units.
   *
   * The chrome says where on the glass the star belongs; only the rig knows how
   * wide the frustum is at the distance it is parked from that star, so the
   * conversion happens here. Aiming away from a point is what moves it towards
   * the opposite edge, hence the subtraction at the call sites.
   */
  const frameOffset = useCallback(
    (distance: number, pull: number, out: THREE.Vector2) => {
      const lens = camera as THREE.PerspectiveCamera;
      const height = 2 * distance * Math.tan((lens.fov * Math.PI) / 360);
      out.set(
        (telemetry.focusX - 0.5) * height * lens.aspect * pull,
        (0.5 - telemetry.focusY) * height * pull,
      );
    },
    [camera],
  );

  /*
   * Start parked on the first star rather than flying in from nowhere. The
   * frustum is not measurable yet on the first tick, so the opening drop is a
   * rough stand in for the framing offset; the first frame corrects it.
   */
  useEffect(() => {
    smoothTarget.copy(stations[0]).setY(stations[0].y - STANDOFF.length() * 0.25);
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
      frameOffset(SATELLITE_STANDOFF.length(), SATELLITE_FRAME_PULL, framing);
    } else {
      const progress = clamp(telemetry.progress, 0, stations.length - 1);
      const index = Math.min(Math.floor(progress), stations.length - 2);
      const blend = clamp(progress - index, 0, 1);

      wantedTarget.copy(stations[index]).lerp(stations[index + 1], blend);
      wantedPosition.copy(wantedTarget).add(STANDOFF);
      frameOffset(STANDOFF.length(), 1, framing);
    }

    wantedTarget.x -= framing.x;
    wantedTarget.y -= framing.y;

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

    // Free look is damped rather than applied raw, so releasing a drag drifts
    // the sky back to the flight path instead of snapping it.
    look.x = damp(look.x, telemetry.lookX, 0.0025, delta);
    look.y = damp(look.y, telemetry.lookY, 0.0025, delta);

    // Tilt and look are applied on top of the flight path, never mixed into it,
    // so the sky answers the hand immediately however slowly the camera moves.
    if (!telemetry.reducedMotion) {
      camera.rotateX(-telemetry.tiltX + look.x);
      camera.rotateY(-telemetry.tiltY + look.y);
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
