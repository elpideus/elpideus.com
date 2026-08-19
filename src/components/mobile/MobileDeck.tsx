"use client";

/**
 * The scrolling deck: the whole site, one waypoint after another.
 *
 * This is the piece that replaces the desktop paging model. Instead of one
 * gesture equalling one flight, the scroll position is mapped continuously onto
 * the journey and handed to the camera as a float index, so travel is something
 * the visitor does with their thumb rather than something they wait for.
 *
 * Two rules keep it honest:
 *
 * - Scroll position never becomes React state. It is written into `telemetry`
 *   from an animation frame and read by the rig inside `useFrame`.
 * - The journey store stays the single source of truth for where the visitor
 *   is. The deck reports arrivals into it and listens for jumps out of it, so
 *   the chart sheet, the hash route and the in panel links all keep working
 *   without knowing a deck exists.
 */

import { useCallback, useEffect, useRef, type ReactNode } from "react";

import { AboutSection } from "@/components/sections/About";
import { ContactSection } from "@/components/sections/Contact";
import { JournalSection } from "@/components/sections/Journal";
import { OriginSection } from "@/components/sections/Origin";
import { PassionsSection } from "@/components/sections/Passions";
import { ProjectsSection } from "@/components/sections/Projects";
import { StudioSection } from "@/components/sections/Studio";
import { ToolkitSection } from "@/components/sections/Toolkit";
import { TrajectorySection } from "@/components/sections/Trajectory";
import { SKY_WINDOW_VH, Waypoint } from "./Waypoint";
import { JOURNEY, getStar, journeyIndexOf } from "@/lib/graph/nodes";
import { PanelKind, StarDepth } from "@/lib/graph/types";
import { clamp } from "@/lib/three/math";
import { telemetry } from "@/lib/state/mobile";
import { TravelIntent, useJourney } from "@/lib/state/journey";

/** Gesture legend for a touch screen, in place of the desktop one. */
const TOUCH_HINT = "Scroll to travel · tilt to look around · open the chart to jump";

/**
 * Where in the viewport a waypoint counts as the one being read. Just under
 * halfway down, which is where a panel header sits once its sky window has
 * scrolled past.
 */
const READING_LINE = 0.45;

function panelBody(kind: PanelKind): ReactNode {
  switch (kind) {
    case PanelKind.Origin:
      return <OriginSection hint={TOUCH_HINT} />;
    case PanelKind.About:
      return <AboutSection />;
    case PanelKind.Journey:
      return <TrajectorySection />;
    case PanelKind.Projects:
      return <ProjectsSection />;
    case PanelKind.Studio:
      return <StudioSection />;
    case PanelKind.Toolkit:
      return <ToolkitSection />;
    case PanelKind.Passions:
      return <PassionsSection />;
    case PanelKind.Blog:
      return <JournalSection />;
    case PanelKind.Contact:
      return <ContactSection />;
    default:
      return null;
  }
}

/** Straight line distance between two stars, used as the leg readout. */
function legLength(index: number): number | null {
  if (index === 0) return null;
  const from = getStar(JOURNEY[index - 1]).position;
  const to = getStar(JOURNEY[index]).position;
  return Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
}

export function MobileDeck() {
  const scroller = useRef<HTMLDivElement>(null);
  const sections = useRef<(HTMLElement | null)[]>([]);
  /** Scroll offset at which each waypoint's star counts as reached. */
  const anchors = useRef<number[]>([]);
  const active = useRef(0);

  const measure = useCallback(() => {
    anchors.current = sections.current.map((element) => element?.offsetTop ?? 0);
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
   * scheduled while the deck is actually moving, so a visitor reading a panel
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
      // waypoint's sky window fills the top of the screen.
      let index = 0;
      while (index < last - 1 && top >= offsets[index + 1]) index += 1;
      const span = Math.max(offsets[index + 1] - offsets[index], 1);
      telemetry.progress = clamp(index + (top - offsets[index]) / span, 0, last);

      // Which waypoint is being read is a different question from where the
      // camera is: a long panel keeps the reader in place while the camera
      // drifts on towards the next star.
      const line = top + box.clientHeight * READING_LINE;
      let reading = 0;
      for (let at = 0; at <= last; at += 1) {
        if (line >= offsets[at]) reading = at;
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
    sections.current.forEach((element) => element && observer.observe(element));

    // A deep link has already put a star in the store by the time the deck
    // mounts, so the first position is jumped to rather than travelled.
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
     * Anything that changes focus without touching the deck (the chart sheet, a
     * panel button, the back button) brings the deck along. A satellite is
     * deliberately ignored: its sheet covers the deck, and leaving the deck
     * parked on Betelgeuse is what makes closing the sheet feel like stepping
     * back rather than travelling.
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
  }, [measure, scrollToIndex]);

  return (
    <div
      ref={scroller}
      data-native-scroll
      className="relative z-10 h-dvh overflow-y-auto overscroll-y-none"
    >
      <div className="relative pb-[26svh]">
        {JOURNEY.map((id, position) => (
          <div
            key={id}
            ref={(element) => {
              sections.current[position] = element;
            }}
          >
            <Waypoint
              id={id}
              position={position}
              total={JOURNEY.length}
              leg={legLength(position)}
            >
              {panelBody(getStar(id).panel)}
            </Waypoint>
          </div>
        ))}

        {/* Closing sky, so the last panel can still be scrolled to the top. */}
        <div style={{ height: `${SKY_WINDOW_VH}svh` }} aria-hidden="true" />
      </div>
    </div>
  );
}
