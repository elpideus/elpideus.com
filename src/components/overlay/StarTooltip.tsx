"use client";

/**
 * Hover tooltip for stars.
 *
 * Shows the full "star - section" label plus a single line about what lives
 * there, so the map can be read before committing to a flight.
 */

import { useRef } from "react";

import { getStar } from "@/lib/graph/nodes";
import { StarClass, StarDepth } from "@/lib/graph/types";
import { useAnchoredElement } from "@/lib/hooks/useAnchoredElement";
import { useJourney } from "@/lib/state/journey";

export function StarTooltip() {
  const hovered = useJourney((state) => state.hovered);
  const focus = useJourney((state) => state.focus);
  const tooltip = useRef<HTMLDivElement>(null);

  useAnchoredElement(tooltip, hovered, { offsetX: 22, offsetY: -14, clampPadding: 16 });

  if (!hovered || hovered === focus) return null;
  const star = getStar(hovered);

  return (
    <div
      ref={tooltip}
      className="pointer-events-none fixed left-0 top-0 z-40 w-[248px] will-change-transform"
      role="tooltip"
    >
      {/* Same split as the panel: transform on the wrapper, animation inside. */}
      <div
        key={hovered}
        className="u-glass rounded-[3px] px-3 py-2"
        style={{ animation: "panel-in 220ms var(--ease-out-expo) both" }}
      >
        <p className="u-eyebrow">
          {star.depth === StarDepth.Satellite ? "Satellite" : "Waypoint"}
          {star.kind === StarClass.Dormant ? " · dormant" : ""}
          {star.kind === StarClass.Beacon ? " · beacon" : ""}
        </p>
        <p className="font-display text-[13px] leading-tight tracking-tight text-frost">
          <span style={{ color: star.color }}>{star.star}</span>
          <span className="mx-1.5 text-dim">/</span>
          {star.section}
        </p>
        <p className="mt-1 text-[11.5px] leading-snug text-mist">{star.tagline}</p>
        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-signal/70">
          Click to travel
        </p>
      </div>
    </div>
  );
}
