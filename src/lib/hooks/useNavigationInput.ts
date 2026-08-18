"use client";

/**
 * All of the visitor's navigation input in one place.
 *
 * Wheel and trackpad gestures accumulate into a charge rather than mapping one
 * event to one step: trackpads emit dozens of tiny deltas per flick and mice
 * emit a handful of large ones, and charge makes both feel the same. Dragging
 * orbits the view, and the keyboard mirrors every gesture for accessibility.
 */

import { useEffect } from "react";

import { JOURNEY, getStar } from "@/lib/graph/nodes";
import { StarDepth } from "@/lib/graph/types";
import { canOvertake, TravelIntent, useJourney } from "@/lib/state/journey";
import { CursorMode, setCursorMode } from "@/lib/state/cursor";
import { dollyBy, orbitBy, viewIntent, ViewGesture } from "@/lib/state/view";
import { clamp } from "@/lib/three/math";

/** Accumulated wheel delta needed to move one star. */
const CHARGE_THRESHOLD = 130;
/** Charge decays to nothing after this long without input. */
const CHARGE_QUIET_MS = 140;
/** Wheel deltas above this are treated as a deliberate, fast flick. */
const FAST_DELTA = 90;

/** Elements that should keep their native pointer behaviour. */
function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      "input, textarea, select, button, a, [data-native-scroll], [data-panel-drag], [data-modal]",
    ),
  );
}

/** What a wheel gesture over this element should do. */
enum WheelScope {
  /** Nothing: a modal owns every gesture over it. */
  Blocked = "blocked",
  /** The element scrolls itself, so leave the event alone. */
  Native = "native",
  /** The map: page between stars, or dolly with a modifier. */
  Map = "map",
}

function wheelScopeOf(target: EventTarget | null): WheelScope {
  if (!(target instanceof HTMLElement)) return WheelScope.Map;
  if (target.closest("[data-modal]")) return WheelScope.Blocked;
  if (target.closest("[data-native-scroll]")) return WheelScope.Native;
  return WheelScope.Map;
}

export function useNavigationInput(): void {
  useEffect(() => {
    let charge = 0;
    let lastWheelAt = 0;
    let lastSign = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onWheel = (event: WheelEvent) => {
      const scope = wheelScopeOf(event.target);

      // A modal swallows the gesture entirely: the map must not move under it.
      if (scope === WheelScope.Blocked) {
        event.preventDefault();
        return;
      }

      // Panels, media strips and other self scrolling surfaces keep their own
      // behaviour. The media strip maps the delta sideways itself.
      if (scope === WheelScope.Native) return;

      event.preventDefault();

      const now = performance.now();

      // Modifier plus wheel dollies instead of paging.
      if (event.ctrlKey || event.metaKey || event.shiftKey) {
        dollyBy(clamp(event.deltaY * 0.01, -1.5, 1.5), now);
        return;
      }

      const sign = Math.sign(event.deltaY);
      if (now - lastWheelAt > CHARGE_QUIET_MS || sign !== lastSign) charge = 0;
      lastWheelAt = now;
      lastSign = sign;
      charge += event.deltaY;

      if (Math.abs(charge) < CHARGE_THRESHOLD) return;

      const state = useJourney.getState();
      if (!canOvertake(state, now)) {
        charge = 0;
        return;
      }

      const speed = clamp(Math.abs(event.deltaY) / FAST_DELTA, 0, 1);
      state.step(Math.sign(charge), TravelIntent.Scroll, speed);
      charge = 0;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || isInteractiveTarget(event.target)) return;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      viewIntent.gesture = ViewGesture.Orbiting;
      setCursorMode(CursorMode.Grabbing);
    };

    const onPointerMove = (event: PointerEvent) => {
      viewIntent.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      viewIntent.pointerY = -((event.clientY / window.innerHeight) * 2 - 1);
      if (!dragging) return;
      orbitBy(event.clientX - lastX, event.clientY - lastY, performance.now());
      lastX = event.clientX;
      lastY = event.clientY;
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      viewIntent.gesture = ViewGesture.Idle;
      viewIntent.lastInteraction = performance.now();
      setCursorMode(CursorMode.Default);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target)) return;
      const state = useJourney.getState();
      const now = performance.now();

      switch (event.key) {
        case "ArrowDown":
        case "ArrowRight":
        case "PageDown":
        case " ":
          event.preventDefault();
          if (canOvertake(state, now)) state.step(1, TravelIntent.Keyboard, 0.9);
          break;
        case "ArrowUp":
        case "ArrowLeft":
        case "PageUp":
          event.preventDefault();
          if (canOvertake(state, now)) state.step(-1, TravelIntent.Keyboard, 0.9);
          break;
        case "Home":
          event.preventDefault();
          state.goToIndex(0, TravelIntent.Keyboard, 0.2);
          break;
        case "End":
          event.preventDefault();
          state.goToIndex(JOURNEY.length - 1, TravelIntent.Keyboard, 0.2);
          break;
        case "Escape": {
          const star = getStar(state.focus);
          if (star.depth === StarDepth.Satellite && star.parent) {
            event.preventDefault();
            state.focusStar(star.parent, TravelIntent.Keyboard);
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
