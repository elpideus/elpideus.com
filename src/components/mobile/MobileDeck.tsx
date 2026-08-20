"use client";

/**
 * The phone layout: the whole site, one waypoint after another.
 *
 * This is the piece that replaces the desktop paging model on a screen with
 * room for exactly one thing. Instead of one gesture equalling one flight, the
 * scroll position is mapped continuously onto the journey and handed to the
 * camera as a float index, so travel is something the visitor does with their
 * thumb rather than something they wait for. Sky windows and panels alternate
 * down one column, which is what keeps the scene part of the reading.
 *
 * The scroll to journey binding itself lives in `useJourneyScroll`, shared with
 * the tablet bridge. All that is left here is the column.
 */

import { useEffect } from "react";

import { SKY_WINDOW_VH, Waypoint, WaypointVariant } from "./Waypoint";
import { DECK_HINT, panelBody } from "./panelBody";
import { legLength, useJourneyScroll } from "./useJourneyScroll";
import { JOURNEY, getStar } from "@/lib/graph/nodes";
import { telemetry } from "@/lib/state/mobile";

/**
 * Where in the viewport a waypoint counts as the one being read. Just under
 * halfway down, which is where a panel header sits once its sky window has
 * scrolled past.
 */
const READING_LINE = 0.45;

/**
 * Where the star belongs on a phone screen: horizontally centred, in the upper
 * quarter, which is the middle of the sky window once the header is allowed for.
 */
const FOCUS_X = 0.5;
const FOCUS_Y = 0.28;

export function MobileDeck() {
  const { scroller, sections } = useJourneyScroll(READING_LINE);

  useEffect(() => {
    telemetry.focusX = FOCUS_X;
    telemetry.focusY = FOCUS_Y;
  }, []);

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
              variant={WaypointVariant.Deck}
            >
              {panelBody(getStar(id).panel, DECK_HINT)}
            </Waypoint>
          </div>
        ))}

        {/* Closing sky, so the last panel can still be scrolled to the top. */}
        <div style={{ height: `${SKY_WINDOW_VH}svh` }} aria-hidden="true" />
      </div>
    </div>
  );
}
