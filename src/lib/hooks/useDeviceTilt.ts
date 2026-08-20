"use client";

/**
 * Device tilt, turned into two numbers the rest of the mobile build can use.
 *
 * Two sensors can supply it. `deviceorientation` is the good one, but a browser
 * only fires it when the hardware can be fused into a pose, which takes a
 * gyroscope or a magnetometer. Plenty of phones ship neither and carry an
 * accelerometer alone, so `devicemotion` is attached alongside and the gravity
 * vector it reports is turned into the same pitch and roll. Both are armed
 * together and the first one to speak owns the stream; orientation may take it
 * over from motion later, never the other way round.
 *
 * The sensor is always on. It arms itself as soon as the mobile build mounts,
 * and where the platform gates it behind a gesture, iOS being the only one, it
 * waits for the first touch and arms then. The first sample becomes the neutral
 * pose, so however the phone is being held at that moment counts as level.
 * Reduced motion is the one thing that keeps it off.
 *
 * Values are published two ways: into `telemetry` for the canvas, which reads
 * them inside `useFrame`, and onto the root element as `--tilt-x` and
 * `--tilt-y` in degrees, which is how the DOM chrome leans without a single
 * React render.
 */

import { useEffect } from "react";

import { TiltStatus, telemetry, useMobileUi } from "@/lib/state/mobile";
import { clamp, damp } from "@/lib/three/math";

/** Beyond this much rotation the effect is already at full strength. */
const RANGE_DEG = 22;
/** How far the camera leans at full tilt, in radians. */
const CAMERA_TILT = 0.085;
/** How far the DOM chrome leans at full tilt, in degrees. */
const CHROME_TILT = 5;
/** A device that never reports a sample within this long has no sensor. */
const SAMPLE_TIMEOUT_MS = 1200;
/** How often to re-register after silence, and how many times to bother. */
const RETRY_MS = 2000;
const RETRY_LIMIT = 20;

/** iOS exposes a permission gate on the constructor; nothing else does. */
interface OrientationPermissionApi {
  requestPermission?: () => Promise<"granted" | "denied">;
}

/** Which sensor is feeding the pose, once one has spoken. */
type TiltSource = "orientation" | "motion";

/** How much of the running gravity estimate each raw sample leaves in place. */
const GRAVITY_SMOOTHING = 0.82;
/** Below this magnitude the sample is freefall or noise, not a direction. */
const GRAVITY_FLOOR = 1.5;

/** Raw, unsmoothed target in the -1..1 range, written by the sensor. */
const target = { x: 0, y: 0 };
/** Smoothed value, written by the animation frame loop. */
const current = { x: 0, y: 0 };

let neutral: { beta: number; gamma: number } | null = null;
let source: TiltSource | null = null;
let gravity: { x: number; y: number; z: number } | null = null;
let listening = false;
let sampleTimer = 0;
let retries = 0;

/**
 * Screen rotation swaps the meaning of the two axes, so a phone held sideways
 * still leans the way it is physically leaning.
 */
function screenAngle(): number {
  return window.screen?.orientation?.angle ?? 0;
}

/**
 * The one place a pose becomes the two published numbers, whichever sensor
 * measured it. Angles arrive in the `deviceorientation` convention: beta is the
 * front to back lean, gamma the side to side one, both in degrees.
 */
function applyPose(beta: number, gamma: number, from: TiltSource): void {
  // Orientation is the better reading, so it is allowed to take the stream off
  // motion. Motion is never allowed to take it back, or a phone with both would
  // flicker between two slightly disagreeing poses.
  if (source !== from) {
    if (source !== null && from === "motion") return;
    source = from;
    neutral = null;
  }

  window.clearTimeout(sampleTimer);
  retries = 0;
  useMobileUi.getState().setTilt(TiltStatus.Live);

  neutral ??= { beta, gamma };

  let pitch = beta - neutral.beta;
  let roll = gamma - neutral.gamma;

  const angle = screenAngle();
  if (angle === 90) [pitch, roll] = [-roll, pitch];
  else if (angle === 270 || angle === -90) [pitch, roll] = [roll, -pitch];
  else if (angle === 180) [pitch, roll] = [-pitch, -roll];

  target.x = clamp(pitch / RANGE_DEG, -1, 1);
  target.y = clamp(roll / RANGE_DEG, -1, 1);
}

function handleOrientation(event: DeviceOrientationEvent): void {
  if (event.beta === null || event.gamma === null) return;
  applyPose(event.beta, event.gamma, "orientation");
}

/**
 * The accelerometer only path.
 *
 * `accelerationIncludingGravity` is the specific force on the device, which at
 * rest is a vector of one gravity pointing out of whichever face is up: flat on
 * a table it reads roughly `(0, 0, 9.8)`. That direction alone fixes pitch and
 * roll, which is everything this hook publishes; the yaw an accelerometer
 * cannot give is never asked for. Waving the phone about adds real acceleration
 * to the reading, so the vector is smoothed before the angles are taken, and
 * anything too short to point anywhere is dropped.
 */
function handleMotion(event: DeviceMotionEvent): void {
  const sample = event.accelerationIncludingGravity;
  if (!sample) return;

  const { x, y, z } = sample;
  if (x === null || y === null || z === null) return;
  if (Math.hypot(x, y, z) < GRAVITY_FLOOR) return;

  if (gravity === null) gravity = { x, y, z };
  else {
    const keep = GRAVITY_SMOOTHING;
    gravity = {
      x: gravity.x * keep + x * (1 - keep),
      y: gravity.y * keep + y * (1 - keep),
      z: gravity.z * keep + z * (1 - keep),
    };
  }

  // The signs match what `deviceorientation` calls beta and gamma, so a phone
  // that reports both sensors leans the same way whichever one is feeding the
  // stream. Checked on hardware: the sky follows the phone rather than running
  // from it.
  const deg = 180 / Math.PI;
  const beta = Math.atan2(gravity.y, gravity.z) * deg;
  const gamma = Math.atan2(-gravity.x, Math.hypot(gravity.y, gravity.z)) * deg;

  applyPose(beta, gamma, "motion");
}

/** Attaches whichever of the two sensor events this browser defines. */
function attachSensors(): void {
  if (typeof DeviceOrientationEvent !== "undefined") {
    window.addEventListener("deviceorientation", handleOrientation);
  }
  if (typeof DeviceMotionEvent !== "undefined") {
    window.addEventListener("devicemotion", handleMotion);
  }
}

function detachSensors(): void {
  window.removeEventListener("deviceorientation", handleOrientation);
  window.removeEventListener("devicemotion", handleMotion);
}

/** What a permission gate had to say, once asked. */
type Verdict = "granted" | "denied" | "ungated" | "deferred";

/**
 * Asks the platform for one sensor, where it gates one behind a gesture.
 *
 * A refusal is final. A throw means the request was made outside a gesture the
 * platform accepts, so nothing was decided and it is worth asking again later.
 */
async function requestGate(ctor: unknown): Promise<Verdict> {
  if (typeof ctor === "undefined") return "ungated";

  const gate = ctor as OrientationPermissionApi;
  if (typeof gate.requestPermission !== "function") return "ungated";

  try {
    return (await gate.requestPermission()) === "granted" ? "granted" : "denied";
  } catch (error) {
    console.error("[tilt] permission request failed:", error);
    return "deferred";
  }
}

/**
 * Starts listening, asking first where the platform requires it. Safe to call
 * repeatedly: a second call while live simply recalibrates the neutral pose.
 */
export async function enableTilt(): Promise<TiltStatus> {
  const ui = useMobileUi.getState();

  const hasOrientation = typeof DeviceOrientationEvent !== "undefined";
  const hasMotion = typeof DeviceMotionEvent !== "undefined";

  if (!hasOrientation && !hasMotion) {
    ui.setTilt(TiltStatus.Unsupported);
    return TiltStatus.Unsupported;
  }

  if (listening) {
    neutral = null;
    return ui.tilt;
  }

  // Both gates are asked for, since a device may answer for one sensor and not
  // the other, and a single grant is enough to run on. Only the sensors this
  // browser actually has are counted, so an absent one cannot vote.
  const gates: Promise<Verdict>[] = [];
  if (hasOrientation) gates.push(requestGate(DeviceOrientationEvent));
  if (hasMotion) gates.push(requestGate(DeviceMotionEvent));
  const verdicts = await Promise.all(gates);

  if (!verdicts.some((verdict) => verdict === "granted" || verdict === "ungated")) {
    // Nothing was decided either way, so the status is left alone and the
    // caller is free to wait for a better moment and ask again.
    if (verdicts.some((verdict) => verdict === "deferred")) return TiltStatus.Idle;

    ui.setTilt(TiltStatus.Denied);
    return TiltStatus.Denied;
  }

  neutral = null;
  source = null;
  gravity = null;
  listening = true;
  attachSensors();

  retries = 0;
  waitForSample(SAMPLE_TIMEOUT_MS);

  return TiltStatus.Live;
}

/**
 * Watches for the first sample and, if none comes, registers again.
 *
 * Registering is what asks the browser to start the sensor, and a browser that
 * had nothing to give at that moment does not come back later on its own: a
 * desktop with no hardware answers no, and stays answering no to that listener
 * even once DevTools starts emulating one. Re-registering is the only way to
 * ask again, so silence is retried on a slow timer rather than treated as
 * final. On a real phone the first sample lands immediately and none of this
 * runs. The readout says no sensor in the meantime, and any sample at all flips
 * it back to live.
 */
function waitForSample(delay: number): void {
  window.clearTimeout(sampleTimer);

  sampleTimer = window.setTimeout(() => {
    if (!listening || useMobileUi.getState().tilt === TiltStatus.Live) return;

    useMobileUi.getState().setTilt(TiltStatus.Unsupported);
    if (retries >= RETRY_LIMIT) return;

    retries += 1;
    detachSensors();
    attachSensors();
    waitForSample(RETRY_MS);
  }, delay);
}

/** Stops listening and eases everything back to level. */
export function disableTilt(): void {
  window.clearTimeout(sampleTimer);
  if (listening) detachSensors();
  listening = false;
  neutral = null;
  source = null;
  gravity = null;
  target.x = 0;
  target.y = 0;
  useMobileUi.getState().setTilt(TiltStatus.Idle);
}

/** Starts the silence retries over, for a moment worth a fresh attempt. */
export function retrySamples(): void {
  if (!listening || useMobileUi.getState().tilt === TiltStatus.Live) return;
  retries = 0;
  waitForSample(RETRY_MS);
}

/** True while the sensor is attached. */
export function tiltIsLive(): boolean {
  return listening;
}

/**
 * Events Safari counts as user activation. `pointerdown` is deliberately not in
 * the list: it fires first but does not activate, so parking the request on it
 * would spend the gesture and get the call thrown out. A finger lifting after a
 * scroll fires `touchend`, so simply reading the page is enough.
 */
const GESTURES = ["touchend", "click", "keydown"] as const;

/** How many gestures to spend before giving up on an unarmed sensor. */
const ARM_ATTEMPTS = 4;

/**
 * Arms the sensor without any visitor action.
 *
 * The attempt is made immediately, which is all a platform without a permission
 * gate needs, and gesture listeners are parked behind it either way. On iOS they
 * are how the request finally gets asked, since Safari only honours it inside an
 * activating event; everywhere else they are insurance, so that if the immediate
 * attempt somehow left the sensor unattached, the first scroll or tap repairs it
 * rather than the visitor having to find something to press.
 */
function armTilt(): () => void {
  void enableTilt();

  let attempts = 0;
  let attached = false;

  const onGesture = () => {
    detach();
    if (listening) return;
    attempts += 1;
    void enableTilt().then((status) => {
      if (status !== TiltStatus.Live && attempts < ARM_ATTEMPTS) attach();
    });
  };

  const attach = () => {
    if (attached) return;
    attached = true;
    for (const name of GESTURES) {
      window.addEventListener(name, onGesture, { once: true, passive: true });
    }
  };

  const detach = () => {
    attached = false;
    for (const name of GESTURES) window.removeEventListener(name, onGesture);
  };

  attach();
  return detach;
}

/**
 * Owns the smoothing loop and arms the sensor. Mount once, high in the mobile
 * tree. The loop runs whether or not the sensor is on, because reduced motion
 * switching it off has to glide back to level rather than snap.
 */
export function useTiltEngine(): void {
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;

    let detachGestures = () => {};

    const readMotion = () => {
      telemetry.reducedMotion = motionQuery.matches;
      if (motionQuery.matches) {
        detachGestures();
        detachGestures = () => {};
        disableTilt();
      } else if (!tiltIsLive()) {
        detachGestures = armTilt();
      }
    };
    readMotion();
    motionQuery.addEventListener("change", readMotion);

    // Coming back to the tab is a fair moment to start the retries over: the
    // visitor may have spent the time away turning a sensor on.
    const onVisible = () => {
      if (document.visibilityState !== "visible" || telemetry.reducedMotion) return;
      if (tiltIsLive()) retrySamples();
      else detachGestures = armTilt();
    };
    document.addEventListener("visibilitychange", onVisible);

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.1);
      last = now;

      const wanted = telemetry.reducedMotion ? { x: 0, y: 0 } : target;
      current.x = damp(current.x, wanted.x, 0.0008, delta);
      current.y = damp(current.y, wanted.y, 0.0008, delta);

      telemetry.tiltX = current.x * CAMERA_TILT;
      telemetry.tiltY = current.y * CAMERA_TILT;

      // Both forms are published: degrees for anything that rotates, and the
      // raw fraction for anything that has to multiply a length or a percentage
      // inside `calc`, which cannot be done with a degree value.
      root.style.setProperty("--tilt-x", `${(current.x * CHROME_TILT).toFixed(3)}deg`);
      root.style.setProperty("--tilt-y", `${(current.y * CHROME_TILT).toFixed(3)}deg`);
      root.style.setProperty("--tilt-nx", current.x.toFixed(4));
      root.style.setProperty("--tilt-ny", current.y.toFixed(4));

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      motionQuery.removeEventListener("change", readMotion);
      document.removeEventListener("visibilitychange", onVisible);
      detachGestures();
      disableTilt();
      root.style.removeProperty("--tilt-x");
      root.style.removeProperty("--tilt-y");
      root.style.removeProperty("--tilt-nx");
      root.style.removeProperty("--tilt-ny");
    };
  }, []);
}
