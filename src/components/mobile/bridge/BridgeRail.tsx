"use client";

/**
 * The ladder, stood upright along the edge of the sky.
 *
 * On a phone the ladder is a row of nine rungs squeezed into the header, and it
 * is mostly a progress readout that happens to be tappable. On a tablet it is
 * the other way round: there is room to run it down the side of the sky at full
 * touch size, name the star it is on, and treat it as the primary way to jump.
 *
 * It holds no state of its own. Everything is read from the journey store,
 * which the dossier keeps current.
 */

import clsx from "clsx";
import { useEffect, useRef } from "react";

import { JOURNEY, getStar } from "@/lib/graph/nodes";
import { StarClass, StarDepth } from "@/lib/graph/types";
import { TravelIntent, useJourney } from "@/lib/state/journey";

/** Length of the confirmation buzz when a new star is reached. */
const ARRIVAL_BUZZ_MS = 8;

export function BridgeRail() {
  const index = useJourney((state) => state.index);
  const focus = useJourney((state) => state.focus);
  const goToIndex = useJourney((state) => state.goToIndex);
  const arrived = useRef(index);

  /*
   * While a satellite has the reading, the rail keeps its rungs but drops the
   * name: the visitor is not at that star any more, and in portrait the label
   * would be lying across the project header underneath it.
   */
  const named = getStar(focus).depth !== StarDepth.Satellite;

  /*
   * A short buzz on arrival, the same one the deck gives. It is the one piece
   * of feedback a handheld can give that a screen cannot, and it is what makes
   * a continuous scroll feel like it has detents.
   */
  useEffect(() => {
    if (arrived.current === index) return;
    arrived.current = index;
    navigator.vibrate?.(ARRIVAL_BUZZ_MS);
  }, [index]);

  return (
    <nav
      aria-label="Stars on the journey"
      className="u-tilt-shift pointer-events-auto absolute inset-y-0 right-0 flex items-center pr-3"
    >
      <ol className="flex flex-col items-end gap-1">
        {JOURNEY.map((id, position) => {
          const node = getStar(id);
          const current = position === index;

          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => goToIndex(position, TravelIntent.Pointer, 0.35)}
                aria-current={current ? "true" : undefined}
                aria-label={`${node.star}, ${node.section}`}
                /*
                  The rung is the whole touch target and nothing else is: the
                  name floats beside it out of the flow, so the rail never
                  swallows a drag meant for the sky next to it.
                */
                className="relative flex h-10 w-11 items-center justify-end"
              >
                <span
                  className={clsx(
                    "pointer-events-none absolute right-11 whitespace-nowrap font-mono text-[9.5px] uppercase tracking-[0.18em] transition-opacity duration-300",
                    current && named ? "opacity-100" : "opacity-0",
                  )}
                  style={{ color: node.color }}
                >
                  {node.star}
                </span>
                <span
                  className={clsx(
                    "block h-[3px] rounded-full transition-all duration-300",
                    current ? "w-9" : "w-4",
                    node.kind === StarClass.Dormant && !current ? "opacity-40" : "",
                  )}
                  style={{
                    background: node.color,
                    boxShadow: current ? `0 0 12px ${node.color}` : "none",
                    opacity: current ? 1 : 0.4,
                  }}
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
