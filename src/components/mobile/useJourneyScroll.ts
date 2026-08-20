"use client";

/**
 * Binds a scrolling element to the journey.
 *
 * This is the engine both touch layouts fly on. The deck scrolls a full screen
 * column of sky windows and panels; the bridge scrolls a narrow dossier beside
 * a fixed sky. Neither difference reaches this file: all it needs is a
 * scrolling box and the elements inside it, one per waypoint, in journey order.
 *
 * Two rules keep it honest, and they are the same two the desktop rig follows:
 *
 * - Scroll position never becomes React state. It is written into `telemetry`
 *   from an animation frame and read by the rig inside `useFrame`.
 * - The journey store stays the single source of truth for where the visitor
 *   is. The engine reports arrivals into it and listens for jumps out of it, so
 *   the chart, the hash route and the in panel links all keep working without
 *   knowing which layout is mounted.
 */

import { useCallback, useEffect, useRef, type RefObject } from "react";

import { JOURNEY, getStar, journeyIndexOf } from "@/lib/graph/nodes";
import { StarDepth } from "@/lib/graph/types";
import { clamp } from "@/lib/three/math";
import { telemetry } from "@/lib/state/mobile";
import { TravelIntent, useJourney } from "@/lib/state/journey";

export interface JourneyScroll {
  /** Attach to the scrolling box. */
  readonly scroller: RefObject<HTMLDivElement | null>;
  /** Attach one element per waypoint, indexed by journey position. */
  readonly sections: RefObject<(HTMLElement | null)[]>;
}

/**
 * `readingLine` is where in the box a waypoint counts as the one being read,
 * as a fraction from the top. It is a separate question from where the camera
 * is: a long panel keeps the reader in place while the camera drifts on towards
 * the next star.
 */
export function useJourneyScroll(readingLine: number): JourneyScroll {
  const scroller = useRef<HTMLDivElement>(null);
  const sections = useRef<(HTMLElement | null)[]>([]);
  /** Scroll offset at which each waypoint's star counts as reached. */
  const anchors = useRef<number[]>([]);
  const active = useRef(0);

  const measure = useCallback(() => {
    const box = scroller.current;
    if (!box) return;
    // Offsets are taken against the scrolling box rather than the offset parent
    // so the layout is free to wrap waypoints in whatever it needs.
    const origin = box.getBoundingClientRect().top - box.scrollTop;
    anchors.current = sections.current.map((element) =>
      element ? element.getBoundingClientRect().top - origin : 0,
    );
  }, []);

  const scrollToIndex = useCallback((index: number, smooth: boolean) => {
    const box = scroller.current;
    const top = anchors.current[index];
    if (!box || top === undefined) return;
    box.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
  }, []);

  /*
   * One animation frame owns everything scroll driven: the float progress the
   * camera flies on, and the integer waypoint the chrome reports. It is only
   * scheduled while the column is actually moving, so a visitor reading a panel
   * costs nothing at all.
   */
  useEffect(() => {
    const box = scroller.current;
    if (!box) return;

    measure();

    let frame = 0;
    let pending = false;

    const sample = () => {
      pending = false;
      const offsets = anchors.current;
      if (offsets.length < 2) return;

      const top = box.scrollTop;
      const last = offsets.length - 1;

      // Piecewise linear: the star of waypoint N is reached exactly when that
      // waypoint reaches the top of the box.
      let index = 0;
      while (index < last - 1 && top >= offsets[index + 1]) index += 1;
      const span = Math.max(offsets[index + 1] - offsets[index], 1);
      telemetry.progress = clamp(index + (top - offsets[index]) / span, 0, last);

      const marker = top + box.clientHeight * readingLine;
      let reading = 0;
      for (let at = 0; at <= last; at += 1) {
        if (marker >= offsets[at]) reading = at;
      }

      if (reading !== active.current) {
        active.current = reading;
        useJourney.getState().goToIndex(reading, TravelIntent.Scroll, 0.6);
      }
    };

    const onScroll = () => {
      if (pending) return;
      pending = true;
      frame = window.requestAnimationFrame(sample);
    };

    box.addEventListener("scroll", onScroll, { passive: true });

    const observer = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    observer.observe(box);
    sections.current.forEach((element) => element && observer.observe(element));

    // A deep link has already put a star in the store by the time this mounts,
    // so the first position is jumped to rather than travelled.
    const focus = useJourney.getState().focus;
    const target = getStar(focus);
    const initial =
      target.depth === StarDepth.Satellite && target.parent
        ? journeyIndexOf(target.parent)
        : journeyIndexOf(focus);
    if (initial > 0) {
      active.current = initial;
      telemetry.progress = initial;
      scrollToIndex(initial, false);
    }

    /*
     * Anything that changes focus without touching the column (the chart, a
     * panel button, the back button) brings the column along. A satellite is
     * deliberately ignored: its sheet or dossier covers the reading, and
     * leaving the column parked on Betelgeuse is what makes closing it feel
     * like stepping back rather than travelling.
     */
    const unsubscribe = useJourney.subscribe((state, previous) => {
      if (state.focus === previous.focus) return;
      const star = getStar(state.focus);
      if (star.depth === StarDepth.Satellite) return;

      const index = journeyIndexOf(state.focus);
      if (index < 0 || index === active.current) return;
      active.current = index;
      scrollToIndex(index, true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      box.removeEventListener("scroll", onScroll);
      observer.disconnect();
      unsubscribe();
    };
  }, [measure, readingLine, scrollToIndex]);

  return { scroller, sections };
}

/** Straight line distance between two stars, used as the leg readout. */
export function legLength(index: number): number | null {
  if (index === 0) return null;
  const from = getStar(JOURNEY[index - 1]).position;
  const to = getStar(JOURNEY[index]).position;
  return Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
}
