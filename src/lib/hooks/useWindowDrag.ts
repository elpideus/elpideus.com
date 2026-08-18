"use client";

/**
 * Makes any element a drag handle for a floating window.
 *
 * The gesture writes into a caller owned offset object rather than into React
 * state, so the window follows the pointer at frame rate and the component
 * re-renders at most twice per drag: once when it starts, once when it ends.
 *
 * Two windows use it today: the waypoint panel, which feeds the offset into its
 * anchoring loop, and the media lightbox, which writes the transform itself
 * through `onMove`.
 */

import { useCallback, type PointerEvent as ReactPointerEvent } from "react";

import { CursorMode, setCursorMode } from "@/lib/state/cursor";

/** Mutable offset in CSS pixels. Pass a stable object, never a fresh literal. */
export interface DragOffset {
  x: number;
  y: number;
}

export interface WindowDragOptions {
  /** Called once when the drag starts. */
  onStart?: () => void;
  /** Called on every pointer move, after the offset has been updated. */
  onMove?: (offset: DragOffset) => void;
  /** Called once when the pointer is released or the gesture is cancelled. */
  onEnd?: (offset: DragOffset) => void;
}

export function useWindowDrag(offset: DragOffset, options: WindowDragOptions = {}) {
  const { onStart, onMove, onEnd } = options;

  return useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      // Left button only, and never when the press landed on a control.
      // `Element`, not `HTMLElement`: an icon button's press often lands on its
      // inline SVG, and SVGElement does not extend HTMLElement.
      if (event.button !== 0) return;
      if (event.target instanceof Element && event.target.closest("button, a, input")) return;

      event.preventDefault();
      event.stopPropagation();

      const handle = event.currentTarget;
      handle.setPointerCapture(event.pointerId);
      setCursorMode(CursorMode.Grabbing);
      onStart?.();

      let lastX = event.clientX;
      let lastY = event.clientY;

      const move = (pointer: PointerEvent) => {
        offset.x += pointer.clientX - lastX;
        offset.y += pointer.clientY - lastY;
        lastX = pointer.clientX;
        lastY = pointer.clientY;
        onMove?.(offset);
      };

      const finish = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", finish);
        handle.removeEventListener("pointercancel", finish);
        handle.releasePointerCapture(event.pointerId);
        setCursorMode(CursorMode.Default);
        onEnd?.(offset);
      };

      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", finish);
      handle.addEventListener("pointercancel", finish);
    },
    [offset, onStart, onMove, onEnd],
  );
}
