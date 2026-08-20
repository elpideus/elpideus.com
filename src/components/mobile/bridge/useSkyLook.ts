"use client";

/**
 * Drag the open sky to look around.
 *
 * The phone has no gesture like this and should not: every pixel there belongs
 * to the deck scrolling. A tablet keeps a permanent window onto the scene next
 * to the reading, and a window you cannot lean into is a picture rather than a
 * place, so the bridge gives that window the desktop orbit gesture back in
 * touch form.
 *
 * The offset is written straight into `telemetry`, never into React state, and
 * the rig damps towards it: releasing the drag drifts the sky back onto the
 * flight path rather than snapping it, which is what keeps the gesture feeling
 * like a lean rather than a control.
 */

import { useEffect, type RefObject } from "react";

import { clamp } from "@/lib/three/math";
import { telemetry } from "@/lib/state/mobile";

/** Radians of look per fraction of the sky window dragged. */
const SWEEP = 0.5;
/** How far the look may go before it stops following, in radians. */
const LIMIT = 0.42;
/**
 * How much of the offset survives the release. A little is kept so a flick has
 * a trailing lean, and the rig damps the rest of the way home.
 */
const RELEASE_KEEP = 0.25;

export function useSkyLook(surface: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = surface.current;
    if (!element) return;

    let pointer: number | null = null;
    let originX = 0;
    let originY = 0;
    let baseX = 0;
    let baseY = 0;

    const down = (event: PointerEvent) => {
      if (pointer !== null) return;
      pointer = event.pointerId;
      originX = event.clientX;
      originY = event.clientY;
      baseX = telemetry.lookX;
      baseY = telemetry.lookY;
      element.setPointerCapture(event.pointerId);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      const width = element.clientWidth || 1;
      const height = element.clientHeight || 1;
      // The sky follows the hand rather than the camera following it: a drag
      // downwards pulls the sky down and reveals what was above it, which is
      // the same grab and pull the desktop orbit gesture uses.
      telemetry.lookX = clamp(baseX + ((event.clientY - originY) / height) * SWEEP, -LIMIT, LIMIT);
      telemetry.lookY = clamp(baseY + ((event.clientX - originX) / width) * SWEEP, -LIMIT, LIMIT);
    };

    const release = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      pointer = null;
      telemetry.lookX *= RELEASE_KEEP;
      telemetry.lookY *= RELEASE_KEEP;
    };

    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", release);
    element.addEventListener("pointercancel", release);

    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", release);
      element.removeEventListener("pointercancel", release);
      telemetry.lookX = 0;
      telemetry.lookY = 0;
    };
  }, [surface]);
}
