"use client";

/**
 * The chart, pinned into the corner of the sky.
 *
 * On a phone the chart has to be a sheet: there is no room to keep it on screen
 * and it would cover the thing it describes. A tablet has room, so the map is
 * never hidden and never opened. It sits in the sky window with a live marker
 * sliding along the route, which turns it from a menu into an instrument: the
 * scroll position, the camera and the map all say the same thing at once.
 *
 * The marker is written straight into the SVG from an animation frame. It is
 * two attributes per frame on one element, and it is the only piece of chrome
 * in the touch build that follows the camera continuously.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { ChartMap, CHART_HEIGHT, CHART_WIDTH, chartX, chartY } from "../ChartMap";
import { CompassIcon } from "@/components/ui/Icon";
import { JOURNEY, getStar, journeyIndexOf } from "@/lib/graph/nodes";
import { StarDepth, type StarNode } from "@/lib/graph/types";
import { clamp } from "@/lib/three/math";
import { telemetry } from "@/lib/state/mobile";
import { TravelIntent, useJourney } from "@/lib/state/journey";

/** Chart space coordinates of every station, in journey order. */
const ROUTE = JOURNEY.map((id) => {
  const star = getStar(id);
  return { x: chartX(star), y: chartY(star) };
});

export interface BridgeChartProps {
  /** Width of the drawing in pixels. Portrait has less open sky to spend. */
  readonly width: number;
  /** Where in the sky the instrument is pinned. */
  readonly style: CSSProperties;
}

export function BridgeChart({ width, style }: BridgeChartProps) {
  const focus = useJourney((state) => state.focus);
  const marker = useRef<SVGCircleElement>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) return;
    let frame = 0;

    const follow = () => {
      const dot = marker.current;
      if (dot) {
        const progress = clamp(telemetry.progress, 0, ROUTE.length - 1);
        const index = Math.min(Math.floor(progress), ROUTE.length - 2);
        const blend = progress - index;
        const from = ROUTE[index];
        const to = ROUTE[index + 1];
        dot.setAttribute("cx", String(from.x + (to.x - from.x) * blend));
        dot.setAttribute("cy", String(from.y + (to.y - from.y) * blend));
      }
      frame = window.requestAnimationFrame(follow);
    };

    frame = window.requestAnimationFrame(follow);
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const travel = (star: StarNode) => {
    const journey = useJourney.getState();
    if (star.depth === StarDepth.Satellite) journey.focusStar(star.id, TravelIntent.Pointer);
    else journey.goToIndex(journeyIndexOf(star.id), TravelIntent.Pointer, 0.35);
  };

  return (
    /*
      Two elements rather than one: `u-ticks` carries `position: relative`, and
      it is declared after Tailwind's own `absolute` in the utilities layer, so
      a single element wearing both ends up back in flow. The pinning lives out
      here, where nothing can override it.
    */
    <div className="pointer-events-auto absolute" style={{ ...style, width: width + 24 }}>
      <aside
        className="u-glass u-ticks rounded-[var(--radius-panel)] px-2.5 pb-2 pt-2"
        aria-label="Star chart"
      >
        <button
          type="button"
          onClick={() => setOpen((state) => !state)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 px-0.5 pb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-dim"
        >
          <CompassIcon size={12} className="text-signal" />
          Chart
        </button>

        {open ? (
          <div className="relative">
            {/*
              A fixed width, not a fixed height: an SVG with `width: auto` falls
              back to filling its container rather than honouring the viewBox
              ratio, which stretches the map across the whole sky.
            */}
            <ChartMap
              focus={focus}
              onTravel={travel}
              labels={false}
              className="block h-auto"
              style={{ width }}
            />
            {/*
              The marker rides above the map in its own layer so it can be moved
              without the chart re-rendering around it.
            */}
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {/*
                Dashed, and smaller than the ring the chart puts around the
                focused star: one says where the visitor is going, this one says
                where the camera has actually got to.
              */}
              <circle
                ref={marker}
                r={2.6}
                fill="none"
                stroke="var(--color-signal)"
                strokeWidth={0.6}
                strokeDasharray="1.4 1.4"
              />
            </svg>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
