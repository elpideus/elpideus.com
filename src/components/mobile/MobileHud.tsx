"use client";

/**
 * Fixed chrome for the handheld build.
 *
 * It is a heads up display rather than a navigation bar: identity on the left,
 * two permanent actions on the right, and under them a ladder of nine rungs
 * that is both the progress readout and direct navigation. The ladder shifts a
 * few pixels with the phone, which is the cheapest possible reminder that the
 * thing behind the glass is a real space.
 *
 * It holds no state of its own. Everything is read from the journey store,
 * which the deck keeps current. Tilt has no control and no readout here: it is
 * always on where the device allows it, and silent where it does not.
 */

import clsx from "clsx";
import { useEffect, useRef } from "react";

import { CompassIcon, DownloadIcon } from "@/components/ui/Icon";
import { Mark } from "@/components/ui/Mark";
import { JOURNEY, getStar } from "@/lib/graph/nodes";
import { StarClass } from "@/lib/graph/types";
import { useMobileUi } from "@/lib/state/mobile";
import { TravelIntent, useJourney } from "@/lib/state/journey";

/** Length of the confirmation buzz when a new star is reached. */
const ARRIVAL_BUZZ_MS = 8;

export function MobileHud() {
  const index = useJourney((state) => state.index);
  const focus = useJourney((state) => state.focus);
  const goToIndex = useJourney((state) => state.goToIndex);
  const setChartOpen = useMobileUi((state) => state.setChartOpen);
  const star = getStar(focus);
  const arrived = useRef(index);

  /*
   * A short buzz on arrival. It is the one piece of feedback a phone can give
   * that a screen cannot, and it makes the deck feel like it has detents.
   * Browsers that do not support it, or have not been touched yet, ignore it.
   */
  useEffect(() => {
    if (arrived.current === index) return;
    arrived.current = index;
    navigator.vibrate?.(ARRIVAL_BUZZ_MS);
  }, [index]);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)]">
        <div className="u-glass border-x-0 border-t-0 px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goToIndex(0, TravelIntent.Pointer, 0.4)}
              className="pointer-events-auto flex items-baseline gap-2"
              aria-label="Return to Sirius, the origin star"
            >
              <Mark size={12} className="relative top-[2px] shrink-0 text-frost" />
              <span className="font-display text-[14px] tracking-[0.06em] text-frost">
                elpideus
              </span>
            </button>

            <div className="pointer-events-auto flex items-center gap-1.5">
              <a
                href="/api/cv"
                download
                aria-label="Download the curriculum"
                className="flex items-center gap-1.5 rounded-[3px] border border-signal/45 bg-signal/12 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-frost"
              >
                <DownloadIcon size={12} />
                CV
              </a>
            </div>
          </div>

          {/* The ladder: nine rungs, one per section, in journey order. */}
          <div className="u-tilt-shift mt-2 flex items-center gap-2">
            <p className="min-w-0 shrink-0 font-mono text-[9.5px] uppercase tracking-[0.18em] text-dim">
              <span style={{ color: star.color }}>{star.star}</span>
              <span className="mx-1.5 text-signal/35">/</span>
              {star.section}
            </p>

            <ol className="pointer-events-auto flex flex-1 items-center justify-end gap-1">
              {JOURNEY.map((id, position) => {
                const node = getStar(id);
                const current = position === index;

                return (
                  <li key={id} className="contents">
                    <button
                      type="button"
                      onClick={() => goToIndex(position, TravelIntent.Pointer, 0.35)}
                      aria-current={current ? "true" : undefined}
                      aria-label={`${node.star}, ${node.section}`}
                      className="flex h-6 items-center px-[3px]"
                    >
                      <span
                        className={clsx(
                          "block h-[3px] rounded-full transition-all duration-300",
                          current ? "w-6" : "w-[9px]",
                          node.kind === StarClass.Dormant && !current ? "opacity-45" : "",
                        )}
                        style={{
                          background: node.color,
                          boxShadow: current ? `0 0 10px ${node.color}` : "none",
                          opacity: current ? 1 : 0.4,
                        }}
                      />
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </header>

      <button
        type="button"
        onClick={() => setChartOpen(true)}
        className="u-glass fixed bottom-[calc(env(safe-area-inset-bottom)+18px)] right-4 z-40 flex items-center gap-2 rounded-full px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-frost"
        aria-label="Open the star chart"
      >
        <CompassIcon size={14} className="text-signal" />
        Chart
      </button>
    </>
  );
}
