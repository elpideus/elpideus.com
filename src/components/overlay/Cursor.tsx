"use client";

/**
 * Custom cursor: a navigation reticle.
 *
 * Two layers, both driven from one animation frame loop. The dot tracks the
 * pointer exactly, the ring lags slightly and reshapes according to what is
 * under the pointer, which reads as an instrument locking onto a target.
 *
 * It renders into the body through a portal so it floats above every other
 * layer, including windows that portal themselves out of the overlay: a
 * z-index inside the overlay stacking context could never reach past them.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CursorMode, getCursorMode, subscribeCursor } from "@/lib/state/cursor";
import { damp } from "@/lib/three/math";

/** Ring geometry per cursor mode. */
const RING_STYLE: Record<CursorMode, { size: number; opacity: number; border: string; spin: number }> = {
  [CursorMode.Default]: { size: 30, opacity: 0.55, border: "var(--color-mist)", spin: 8 },
  [CursorMode.Target]: { size: 52, opacity: 1, border: "var(--color-signal)", spin: 26 },
  [CursorMode.Interactive]: { size: 40, opacity: 0.9, border: "var(--color-beacon)", spin: 14 },
  [CursorMode.Grabbing]: { size: 22, opacity: 0.9, border: "var(--color-signal)", spin: 40 },
  [CursorMode.Text]: { size: 20, opacity: 0.8, border: "var(--color-frost)", spin: 0 },
};

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<CursorMode>(CursorMode.Default);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Only take over the cursor where a precise pointer exists.
    const fine = window.matchMedia("(pointer: fine)").matches;
    // The pointer type is unknowable during server rendering, so the cursor can
    // only switch itself on once mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(fine);
    if (!fine) return;

    document.body.dataset.customCursor = "on";
     
    setMode(getCursorMode());
    const unsubscribe = subscribeCursor(setMode);

    return () => {
      delete document.body.dataset.customCursor;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;
    let angle = 0;
    let last = performance.now();
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      ringX = damp(ringX, pointerX, 0.0005, delta);
      ringY = damp(ringY, pointerY, 0.0005, delta);
      angle += delta * RING_STYLE[getCursorMode()].spin;

      if (dot.current) {
        dot.current.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
      }
      if (ring.current) {
        ring.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) rotate(${angle}deg)`;
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  const style = RING_STYLE[mode];

  const reticle = (
    <div className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden="true">
      <div
        ref={ring}
        className="absolute left-0 top-0 transition-[width,height,opacity,border-color] duration-300 ease-[var(--ease-out-expo)]"
        style={{
          width: style.size,
          height: style.size,
          opacity: style.opacity,
        }}
      >
        <div
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: style.border }}
        />
        {/* Crosshair ticks on all four sides. */}
        {[0, 90, 180, 270].map((rotation) => (
          <span
            key={rotation}
            className="absolute left-1/2 top-1/2 block h-[5px] w-px"
            style={{
              background: style.border,
              transform: `rotate(${rotation}deg) translateY(${style.size / 2 + 2}px)`,
              transformOrigin: "center top",
            }}
          />
        ))}
      </div>

      <div
        ref={dot}
        className="absolute left-0 top-0 h-[3px] w-[3px] rounded-full"
        style={{ background: style.border, boxShadow: `0 0 8px ${style.border}` }}
      />
    </div>
  );

  return createPortal(reticle, document.body);
}
