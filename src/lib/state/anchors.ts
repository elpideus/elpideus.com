"use client";

/**
 * Screen space anchors for every star.
 *
 * The canvas projects each star once per frame and writes the result here; the
 * DOM overlay reads it in its own animation frame and moves panels and tooltips
 * with plain transforms. Nothing crosses React state, so a flight through the
 * map costs zero re-renders.
 */

import type { StarId } from "@/lib/graph/types";

export interface ScreenAnchor {
  /** Position in CSS pixels, origin at the top left of the viewport. */
  x: number;
  y: number;
  /** True when the star is in front of the camera and inside the frustum. */
  visible: boolean;
  /** Distance from the camera in world units, useful for scaling chrome. */
  distance: number;
}

const anchors = new Map<StarId, ScreenAnchor>();

/**
 * Subscribers that reposition DOM against the anchors.
 *
 * They are called by the canvas at the end of its own frame rather than from a
 * second animation frame loop of their own. Two independent loops read each
 * other's results one frame late, and whether a given frame lands before or
 * after the render is not stable, so anchored chrome would alternate between
 * zero and one frame of lag and appear to shake while the camera moves.
 */
type AnchorListener = () => void;

const listeners = new Set<AnchorListener>();

export function subscribeAnchors(listener: AnchorListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called once per rendered frame, after every anchor has been written. */
export function flushAnchors(): void {
  for (const listener of listeners) listener();
}

export function writeAnchor(id: StarId, x: number, y: number, visible: boolean, distance: number): void {
  const existing = anchors.get(id);
  if (existing) {
    existing.x = x;
    existing.y = y;
    existing.visible = visible;
    existing.distance = distance;
    return;
  }
  anchors.set(id, { x, y, visible, distance });
}

export function readAnchor(id: StarId): ScreenAnchor | undefined {
  return anchors.get(id);
}
