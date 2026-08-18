"use client";

/**
 * Star chart on the right edge.
 *
 * Doubles as a progress indicator and as direct navigation: every depth one
 * star is listed in journey order, and selecting one flies straight to it.
 * Satellites are intentionally absent, because the rail mirrors the scroll
 * journey and the scroll journey only walks depth one.
 */

import clsx from "clsx";

import { JOURNEY, getStar } from "@/lib/graph/nodes";
import { StarClass } from "@/lib/graph/types";
import { TravelIntent, useJourney } from "@/lib/state/journey";
import { interactiveCursorProps } from "@/components/ui/primitives";

export function NavRail() {
  const index = useJourney((state) => state.index);
  const focus = useJourney((state) => state.focus);
  const goToIndex = useJourney((state) => state.goToIndex);
  const setHovered = useJourney((state) => state.setHovered);

  return (
    <nav
      className="pointer-events-auto fixed right-6 top-1/2 z-30 -translate-y-1/2"
      aria-label="Star chart"
    >
      <ol className="space-y-1">
        {JOURNEY.map((id, position) => {
          const star = getStar(id);
          const active = position === index;
          const current = focus === id;

          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => goToIndex(position, TravelIntent.Pointer, 0.3)}
                onPointerEnter={() => {
                  interactiveCursorProps.onPointerEnter();
                  setHovered(id);
                }}
                onPointerLeave={() => {
                  interactiveCursorProps.onPointerLeave();
                  setHovered(null);
                }}
                aria-current={current ? "true" : undefined}
                className="group flex w-full items-center justify-end gap-2.5 py-[3px] text-right"
              >
                <span
                  className={clsx(
                    "font-mono text-[10px] uppercase tracking-[0.16em] transition-all duration-300",
                    active
                      ? "text-frost opacity-100"
                      : "text-dim opacity-0 group-hover:opacity-100",
                  )}
                >
                  {star.star}
                  <span className="mx-1 text-signal/40">/</span>
                  {star.section}
                </span>

                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span
                    className={clsx(
                      "block rounded-full transition-all duration-300",
                      active ? "h-2 w-2" : "h-1 w-1",
                      star.kind === StarClass.Dormant && !active ? "opacity-45" : "",
                    )}
                    style={{
                      background: star.color,
                      boxShadow: active ? `0 0 12px ${star.color}` : "none",
                    }}
                  />
                  {star.kind === StarClass.Beacon ? (
                    <span
                      className="absolute inset-0 animate-ping rounded-full opacity-30"
                      style={{ background: star.color, animationDuration: "3.2s" }}
                    />
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-right font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
        {String(index + 1).padStart(2, "0")} / {String(JOURNEY.length).padStart(2, "0")}
      </p>
    </nav>
  );
}
