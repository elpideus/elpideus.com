"use client";

/**
 * One section of the deck.
 *
 * Every waypoint is the same two pieces: an open sky window where the star
 * itself is visible behind the glass, and the panel that talks about it. The
 * window is what makes the scene part of the reading rather than wallpaper
 * behind it, so its height is a shared constant: the deck uses the same number
 * to work out when a star counts as reached.
 *
 * The glass catches a highlight that slides with the phone, driven by the tilt
 * variables the engine publishes on the root element. That is why nothing here
 * subscribes to the sensor: the sheen is pure CSS reading a moving variable.
 */

import type { ReactNode } from "react";

import { getStar } from "@/lib/graph/nodes";
import { StarClass, type StarId } from "@/lib/graph/types";

/** Height of the open sky above each panel, in percent of the viewport. */
export const SKY_WINDOW_VH = 44;

export interface WaypointProps {
  readonly id: StarId;
  readonly position: number;
  readonly total: number;
  /** Distance travelled from the previous star, in world units. */
  readonly leg: number | null;
  readonly children: ReactNode;
}

export function Waypoint({ id, position, total, leg, children }: WaypointProps) {
  const star = getStar(id);
  const ordinal = String(position + 1).padStart(2, "0");

  return (
    <section
      data-waypoint={id}
      aria-labelledby={`waypoint-${id}`}
      className="relative"
    >
      {/* The open sky. Empty on purpose: the star behind it is the content. */}
      <div
        className="pointer-events-none flex flex-col justify-between px-5 pb-5 pt-[calc(env(safe-area-inset-top)+94px)]"
        style={{ height: `${SKY_WINDOW_VH}svh` }}
      >
        <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-dim">
          {leg === null ? (
            <span className="text-signal">Journey origin</span>
          ) : (
            <>
              <span className="text-signal">Leg {ordinal}</span>
              <span className="mx-2 text-signal/35">/</span>
              {leg.toFixed(1)} ly
            </>
          )}
        </p>

        <span
          aria-hidden="true"
          className="mx-auto h-8 w-px bg-gradient-to-b from-transparent to-signal/45"
        />
      </div>

      <article
        data-panel
        className="u-glass u-ticks relative mx-3 rounded-[var(--radius-panel)]"
      >
        <span aria-hidden="true" className="u-sheen" />

        <header className="border-b border-[var(--panel-rule)] px-4 py-3">
          <p className="u-eyebrow">
            Waypoint {ordinal} / {String(total).padStart(2, "0")}
            {star.kind === StarClass.Dormant ? (
              <span className="ml-2 text-warning">Dormant</span>
            ) : null}
          </p>
          <h2
            id={`waypoint-${id}`}
            className="mt-1 font-display text-[19px] tracking-tight text-frost"
          >
            <span style={{ color: star.color }}>{star.star}</span>
            <span className="mx-2 text-dim">/</span>
            {star.section}
          </h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-mist">{star.tagline}</p>
        </header>

        <div className="px-4 py-4">{children}</div>
      </article>
    </section>
  );
}
