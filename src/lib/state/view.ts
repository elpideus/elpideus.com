"use client";

/**
 * Camera view intent shared between DOM input handlers and the render loop.
 *
 * This deliberately lives outside React: pointer movement updates it dozens of
 * times per second and no component needs to re-render because of it.
 */

import { clamp } from "@/lib/three/math";

/** How the visitor is currently manipulating the view. */
export enum ViewGesture {
  Idle = "idle",
  Orbiting = "orbiting",
}

/** Limits of the free orbit, in radians. */
const PITCH_LIMIT = Math.PI * 0.42;
const YAW_LIMIT = Math.PI * 0.85;

export interface ViewIntent {
  /** Desired orbit angles around the focused star. */
  yaw: number;
  pitch: number;
  /** Extra dolly applied to the base distance, in world units. */
  dolly: number;
  /** Pointer position in normalised device coordinates, for parallax. */
  pointerX: number;
  pointerY: number;
  gesture: ViewGesture;
  /** Timestamp of the last orbit input, used to fade the idle drift back in. */
  lastInteraction: number;
}

export const viewIntent: ViewIntent = {
  yaw: 0,
  pitch: 0,
  dolly: 0,
  pointerX: 0,
  pointerY: 0,
  gesture: ViewGesture.Idle,
  lastInteraction: 0,
};

/** Apply a drag delta expressed in pixels. */
export function orbitBy(deltaX: number, deltaY: number, now: number): void {
  viewIntent.yaw = clamp(viewIntent.yaw - deltaX * 0.0032, -YAW_LIMIT, YAW_LIMIT);
  viewIntent.pitch = clamp(viewIntent.pitch - deltaY * 0.0028, -PITCH_LIMIT, PITCH_LIMIT);
  viewIntent.lastInteraction = now;
}

/** Apply a dolly delta, typically from a modifier plus wheel gesture. */
export function dollyBy(delta: number, now: number): void {
  viewIntent.dolly = clamp(viewIntent.dolly + delta, -6, 18);
  viewIntent.lastInteraction = now;
}

/** Ease the orbit back towards the neutral pose after a flight. */
export function relaxOrbit(factor: number): void {
  viewIntent.yaw *= factor;
  viewIntent.pitch *= factor;
  viewIntent.dolly *= factor;
}
