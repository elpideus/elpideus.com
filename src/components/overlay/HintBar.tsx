"use client";

/**
 * Bottom strip: what the visitor can do, plus where they currently are.
 *
 * The gesture legend fades away once the first flight happens, since by then
 * the visitor has clearly worked it out.
 */

import clsx from "clsx";

import { getStar } from "@/lib/graph/nodes";
import { useJourney } from "@/lib/state/journey";

const HINTS: readonly { key: string; label: string }[] = [
  { key: "Scroll", label: "travel between stars" },
  { key: "Drag", label: "look around" },
  { key: "Click", label: "jump to a star" },
  { key: "Shift + scroll", label: "move closer" },
];

export function HintBar() {
  const index = useJourney((state) => state.index);
  const focus = useJourney((state) => state.focus);
  const star = getStar(focus);

  // Derived rather than remembered: once the visitor has left the origin they
  // have clearly worked the gestures out, and coming home is a fine moment to
  // show them again.
  const dismissed = index > 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex items-end justify-between px-6 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
        <span className="text-signal">{star.star}</span>
        <span className="mx-2 text-signal/40">/</span>
        {star.section}
      </p>

      <ul
        className={clsx(
          "flex items-center gap-4 transition-opacity duration-700",
          dismissed ? "opacity-0" : "opacity-100",
        )}
      >
        {HINTS.map((hint) => (
          <li key={hint.key} className="flex items-center gap-1.5">
            <span className="rounded-[2px] border border-signal/25 px-1.5 py-[2px] font-mono text-[9px] uppercase tracking-[0.16em] text-signal">
              {hint.key}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-dim">
              {hint.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
