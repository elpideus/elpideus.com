"use client";

/**
 * The tablet layout: a console docked against a window onto the sky.
 *
 * A tablet is not a large phone and it is not a small desktop. It has no
 * pointer to hover with, so the desktop map cannot be flown on it, but it has
 * enough glass to show the reading and the scene at the same time, which the
 * phone deck deliberately does not attempt. The bridge is that third answer:
 * the sky is a fixed viewport that never scrolls away, and the reading is a
 * console docked to one edge of it.
 *
 * Which edge is the only thing that changes with orientation. In landscape the
 * console takes the left of the screen and the sky keeps the wider right half.
 * In portrait it is docked to the bottom, with rounded shoulders and a lit seam,
 * so the screen reads as sky with an instrument panel slid up into it rather
 * than as two stacked halves of equal weight.
 *
 * The sky is one full bleed layer underneath everything, not a slot in a grid.
 * The console covers the part of it that belongs to the reading, so there is no
 * layout to keep in step: whatever the console does not cover is the window.
 */

import { useEffect, useRef } from "react";

import { BridgeChart } from "./BridgeChart";
import { BridgeDossier } from "./BridgeDossier";
import { BridgeMasthead } from "./BridgeMasthead";
import { BridgeRail } from "./BridgeRail";
import { useSkyLook } from "./useSkyLook";
import { BridgeOrientation, useBridgeOrientation } from "@/lib/hooks/useFormFactor";
import { telemetry } from "@/lib/state/mobile";

/**
 * Share of the screen the console takes, per orientation. The two are not the
 * same split turned sideways: a column of text beside the sky can be narrow and
 * still read well, while a console docked under the sky is as wide as the
 * tablet and needs the height instead.
 */
const CONSOLE_FRACTION = {
  [BridgeOrientation.Landscape]: 0.42,
  [BridgeOrientation.Portrait]: 0.58,
} as const;

/**
 * Where the star belongs, per orientation, as a fraction of the screen: the
 * middle of whatever the sky is left with, nudged clear of the chart pinned in
 * the corner of it.
 */
const FRAMING = {
  [BridgeOrientation.Landscape]: { x: 0.71, y: 0.44 },
  [BridgeOrientation.Portrait]: { x: 0.5, y: 0.19 },
} as const;

/** Width of the chart drawing, per orientation, in pixels. */
const CHART_SIZE = {
  [BridgeOrientation.Landscape]: 104,
  [BridgeOrientation.Portrait]: 96,
} as const;

export function Bridge() {
  const orientation = useBridgeOrientation();
  const sky = useRef<HTMLDivElement>(null);
  useSkyLook(sky);

  useEffect(() => {
    const framing = FRAMING[orientation];
    telemetry.focusX = framing.x;
    telemetry.focusY = framing.y;
  }, [orientation]);

  const landscape = orientation === BridgeOrientation.Landscape;
  const dock = CONSOLE_FRACTION[orientation];
  const edge = `${dock * 100}%`;

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {/*
        The window. One layer, the whole screen, empty of content by design:
        everything on it is either the scene behind the glass or an instrument
        pinned to an edge. The console lies on top and takes its own share back,
        so the visible sky and the draggable sky are the same shape without
        either of them having to be measured.
      */}
      <div ref={sky} className="pointer-events-auto absolute inset-0 touch-none" />

      <BridgeChart
        width={CHART_SIZE[orientation]}
        style={
          landscape
            ? { left: `calc(${edge} + 1rem)`, bottom: "1rem" }
            : { left: "1rem", bottom: `calc(${edge} + 1rem)` }
        }
      />

      {/*
        The console. A single continuous surface rather than a stack of floating
        cards: the waypoints inside it are separated by a transit rule, which is
        both the divider and the readout for the leg just travelled.
      */}
      <section
        className="pointer-events-auto absolute flex flex-col overflow-hidden"
        style={{
          ...(landscape
            ? { top: 0, bottom: 0, left: 0, width: edge }
            : { left: 0, right: 0, bottom: 0, height: edge }),
          backgroundImage: "var(--panel-surface)",
          backdropFilter: "var(--panel-blur)",
          boxShadow: landscape
            ? "26px 0 70px -34px rgb(0 0 0 / 0.95)"
            : "0 -26px 70px -34px rgb(0 0 0 / 0.95)",
          borderTopLeftRadius: landscape ? 0 : 20,
          borderTopRightRadius: landscape ? 0 : 20,
          paddingTop: landscape ? "env(safe-area-inset-top)" : undefined,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* The seam: the console is lit along the edge it meets the sky on. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-30"
          style={
            landscape
              ? {
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: 1,
                  background:
                    "linear-gradient(to bottom, transparent, color-mix(in srgb, var(--color-signal) 45%, transparent) 30%, color-mix(in srgb, var(--color-signal) 45%, transparent) 70%, transparent)",
                }
              : {
                  left: 0,
                  right: 0,
                  top: 0,
                  height: 1,
                  background:
                    "linear-gradient(to right, transparent, color-mix(in srgb, var(--color-signal) 45%, transparent) 25%, color-mix(in srgb, var(--color-signal) 45%, transparent) 75%, transparent)",
                }
          }
        />

        {landscape ? (
          <BridgeMasthead className="border-b border-[var(--panel-rule)]" />
        ) : null}

        <BridgeDossier orientation={orientation} />
      </section>

      {/*
        The rail runs down the edge of the screen rather than the edge of the
        sky, so in portrait it crosses the console and has to be painted after
        it. The console leaves it a gutter to cross.
      */}
      <BridgeRail />

      {/*
        In portrait the masthead cannot live in the console: the console starts
        halfway down the screen and the mark would sit in the middle of it. It
        hangs over the open sky instead, where it doubles as the top edge of the
        window.
      */}
      {landscape ? null : (
        <BridgeMasthead
          className="absolute inset-x-0 top-0 bg-gradient-to-b from-void/85 via-void/45 to-transparent pb-6"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
        />
      )}
    </div>
  );
}
