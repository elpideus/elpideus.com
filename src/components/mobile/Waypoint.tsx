"use client";

/**
 * One section of the touch build, in either layout.
 *
 * A waypoint is always the same two pieces: something that stands for the leg
 * just travelled, and the reading about the star at the end of it. What those
 * look like depends on what is around them.
 *
 * - `Deck`, on a phone: an open sky window above a floating card, so the star
 *   itself is visible behind the glass and the scene is part of the reading
 *   rather than wallpaper behind it. Its height is a shared constant because
 *   the closing spacer needs the same number.
 * - `Dossier`, on a tablet: no window and no card. The sky is already a
 *   permanent viewport beside the console, and the console is already a
 *   surface, so a card here would be glass on glass. The waypoints run as one
 *   document instead, divided by a transit rule that carries the leg readout
 *   and a mark in the colour of the star being approached.
 *
 * The glass catches a highlight that slides with the device, driven by the tilt
 * variables the engine publishes on the root element. That is why nothing here
 * subscribes to the sensor: the sheen is pure CSS reading a moving variable.
 */

import clsx from "clsx";
import type { ReactNode } from "react";

import { getStar } from "@/lib/graph/nodes";
import { StarClass, type StarId } from "@/lib/graph/types";

/** Height of the open sky above each panel on a phone, in percent of the viewport. */
export const SKY_WINDOW_VH = 44;

/** Which of the two touch layouts is framing this waypoint. */
export enum WaypointVariant {
  Deck = "deck",
  Dossier = "dossier",
}

export interface WaypointProps {
  readonly id: StarId;
  readonly position: number;
  readonly total: number;
  /** Distance travelled from the previous star, in world units. */
  readonly leg: number | null;
  readonly variant?: WaypointVariant;
  readonly children: ReactNode;
}

/** The leg readout, worded the same in both layouts. */
function LegLabel({ ordinal, leg }: { ordinal: string; leg: number | null }) {
  return (
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
  );
}

export function Waypoint({
  id,
  position,
  total,
  leg,
  variant = WaypointVariant.Deck,
  children,
}: WaypointProps) {
  const star = getStar(id);
  const ordinal = String(position + 1).padStart(2, "0");
  const dossier = variant === WaypointVariant.Dossier;

  const heading = (
    <>
      <p className="u-eyebrow">
        Waypoint {ordinal} / {String(total).padStart(2, "0")}
        {star.kind === StarClass.Dormant ? (
          <span className="ml-2 text-warning">Dormant</span>
        ) : null}
      </p>
      <h2
        id={`waypoint-${id}`}
        className={clsx(
          "mt-1 font-display tracking-tight text-frost",
          dossier ? "text-[24px]" : "text-[19px]",
        )}
      >
        <span style={{ color: star.color }}>{star.star}</span>
        <span className="mx-2 text-dim">/</span>
        {star.section}
      </h2>
      <p
        className={clsx(
          "mt-1.5 leading-relaxed text-mist",
          dossier ? "text-[13px]" : "text-[12px]",
        )}
      >
        {star.tagline}
      </p>
    </>
  );

  if (dossier) {
    return (
      <section data-waypoint={id} aria-labelledby={`waypoint-${id}`} className="relative">
        {/*
          The transit rule. It is the divider between two waypoints and the
          readout for the leg between them at the same time, which is why the
          console needs no empty air to separate its sections: the join is the
          instrument. The mark takes the colour of the star being approached.
        */}
        <div className="pointer-events-none flex h-14 items-center gap-3">
          <span
            aria-hidden="true"
            className="h-[5px] w-[5px] shrink-0 rotate-45"
            style={{ background: star.color, boxShadow: `0 0 10px ${star.color}` }}
          />
          <LegLabel ordinal={ordinal} leg={leg} />
          <span
            aria-hidden="true"
            className="h-px flex-1 bg-gradient-to-r from-signal/30 via-signal/10 to-transparent"
          />
        </div>

        <header className="pb-5">{heading}</header>
        <div className="pb-12">{children}</div>
      </section>
    );
  }

  return (
    <section data-waypoint={id} aria-labelledby={`waypoint-${id}`} className="relative">
      {/* The open sky. Empty on purpose: the star behind it is the content. */}
      <div
        className="pointer-events-none flex flex-col justify-between px-5 pb-5 pt-[calc(env(safe-area-inset-top)+94px)]"
        style={{ height: `${SKY_WINDOW_VH}svh` }}
      >
        <LegLabel ordinal={ordinal} leg={leg} />

        <span
          aria-hidden="true"
          className="mx-auto h-8 w-px bg-gradient-to-b from-transparent to-signal/45"
        />
      </div>

      <article data-panel className="u-glass u-ticks relative mx-3 rounded-[var(--radius-panel)]">
        <span aria-hidden="true" className="u-sheen" />

        <header className="border-b border-[var(--panel-rule)] px-4 py-3">{heading}</header>

        <div className="px-4 py-4">{children}</div>
      </article>
    </section>
  );
}
