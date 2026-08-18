"use client";

/**
 * Drives a DOM element from a star's screen anchor.
 *
 * It writes transforms directly, so anchored chrome tracks the canvas at full
 * frame rate without React ever re-rendering, and it does so on the canvas's
 * own frame rather than from a separate animation frame loop: a second loop
 * reads positions produced by the previous render, and drifts in and out of
 * step with it, which shows up as the panel shaking while the camera moves.
 */

import { useEffect, type RefObject } from "react";

import { readAnchor, subscribeAnchors } from "@/lib/state/anchors";
import type { StarId } from "@/lib/graph/types";
import { clamp } from "@/lib/three/math";

export interface AnchorOptions {
  /** Offset in CSS pixels applied after projection. */
  offsetX?: number;
  offsetY?: number;
  /** Keep the element fully inside the viewport with this much padding. */
  clampPadding?: number;
  /** Per side padding, so anchored chrome clears the fixed bars and the rail. */
  clampTop?: number;
  clampBottom?: number;
  clampLeft?: number;
  clampRight?: number;
  /** Hide the element when its star leaves the frustum. */
  hideOffscreen?: boolean;
  /**
   * A live offset read on every frame, on top of the static ones. Pass a stable
   * mutable object (never a new literal per render) so dragging can update it
   * without re-running this effect.
   */
  liveOffset?: { x: number; y: number };
}

export function useAnchoredElement(
  ref: RefObject<HTMLElement | null>,
  starId: StarId | null,
  options: AnchorOptions = {},
): void {
  const {
    offsetX = 0,
    offsetY = 0,
    clampPadding = 24,
    clampTop = clampPadding,
    clampBottom = clampPadding,
    clampLeft = clampPadding,
    clampRight = clampPadding,
    hideOffscreen = true,
    liveOffset,
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element || !starId) return;

    const update = () => {
      const anchor = readAnchor(starId);
      if (!anchor) return;

      if (hideOffscreen) {
        element.style.opacity = anchor.visible ? "" : "0";
        element.style.pointerEvents = anchor.visible ? "" : "none";
      }

      const rect = element.getBoundingClientRect();
      const dragX = liveOffset?.x ?? 0;
      const dragY = liveOffset?.y ?? 0;
      const x = clamp(
        anchor.x + offsetX + dragX,
        clampLeft,
        Math.max(clampLeft, window.innerWidth - rect.width - clampRight),
      );
      const y = clamp(
        anchor.y + offsetY + dragY,
        clampTop,
        Math.max(clampTop, window.innerHeight - rect.height - clampBottom),
      );

      // Sub pixel values on purpose: rounding quantises the motion and makes a
      // slowly drifting panel step rather than glide.
      element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    };

    update();
    return subscribeAnchors(update);
  }, [
    ref,
    starId,
    offsetX,
    offsetY,
    clampPadding,
    clampTop,
    clampBottom,
    clampLeft,
    clampRight,
    hideOffscreen,
    liveOffset,
  ]);
}
