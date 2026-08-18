"use client";

/**
 * Name tag for a background star.
 *
 * Quieter than the waypoint tooltip on purpose: these stars are scenery, not
 * destinations, so the label reads as a line from a catalogue rather than as
 * something to click. The familiar name leads; the catalogue identifiers follow
 * in smaller type.
 *
 * Position is written straight to the element on every canvas frame; React only
 * runs when the pointer moves to a different star.
 */

import { useEffect, useRef, useState } from "react";

import { subscribeAnchors } from "@/lib/state/anchors";
import { readSkyHover, subscribeSkyHover } from "@/lib/state/sky";

/** Offset from the star, in CSS pixels. */
const OFFSET_X = 14;
const OFFSET_Y = -12;

interface Label {
  readonly key: string;
  readonly name: string;
  readonly aliases: readonly string[];
}

const EMPTY: Label = { key: "", name: "", aliases: [] };

export function SkyTooltip() {
  const frame = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<Label>(EMPTY);

  useEffect(
    () =>
      subscribeSkyHover(() => {
        const hover = readSkyHover();
        setLabel(
          hover.key ? { key: hover.key, name: hover.name, aliases: hover.aliases } : EMPTY,
        );
      }),
    [],
  );

  useEffect(() => {
    if (!label.key) return;

    const place = () => {
      const element = frame.current;
      if (!element) return;
      const hover = readSkyHover();
      element.style.transform = `translate3d(${(hover.x + OFFSET_X).toFixed(2)}px, ${(
        hover.y + OFFSET_Y
      ).toFixed(2)}px, 0)`;
    };

    // Place it before the first paint of this label, then keep it on the
    // canvas frame so it never lags the star it belongs to.
    place();
    return subscribeAnchors(place);
  }, [label.key]);

  if (!label.key) return null;

  return (
    <div
      ref={frame}
      className="pointer-events-none fixed left-0 top-0 z-30 will-change-transform"
      aria-hidden="true"
    >
      {/*
        The entrance animation lives on the inner element: animating `transform`
        on the positioned wrapper would override the per frame placement and
        park the label in the corner.
      */}
      <div
        key={label.key}
        className="rounded-[2px] border border-signal/15 bg-void/70 px-2 py-1 backdrop-blur-[2px]"
        style={{ animation: "panel-in 180ms var(--ease-out-expo) both" }}
      >
        <div className="flex items-center gap-2">
          <span className="h-[3px] w-[3px] shrink-0 rounded-full bg-signal/80" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-frost">
            {label.name}
          </span>
        </div>

        {label.aliases.length > 0 ? (
          <p className="mt-0.5 pl-[11px] font-mono text-[9px] uppercase tracking-[0.14em] text-dim">
            {label.aliases.join(" · ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
