"use client";

/**
 * A project satellite, opened over the deck.
 *
 * On the desktop map a satellite is a place: the camera leaves the spine and
 * flies out to it. That is preserved here rather than replaced by a modal. The
 * sheet only covers the deck, the rig has genuinely taken the camera off the
 * corridor, and closing it flies back to Betelgeuse. Which is why the sheet
 * takes its open state from the journey store instead of owning one.
 */

import { useEffect } from "react";

import { CloseIcon } from "@/components/ui/Icon";
import { ProjectDetailSection } from "@/components/sections/ProjectDetail";
import { getStar } from "@/lib/graph/nodes";
import { StarDepth, StarId } from "@/lib/graph/types";
import { TravelIntent, useJourney } from "@/lib/state/journey";

export function SatelliteSheet() {
  const focus = useJourney((state) => state.focus);
  const star = getStar(focus);
  const open = star.depth === StarDepth.Satellite;

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      useJourney.getState().focusStar(star.parent ?? StarId.Betelgeuse, TravelIntent.Pointer);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, star.parent]);

  if (!open) return null;

  const back = () =>
    useJourney.getState().focusStar(star.parent ?? StarId.Betelgeuse, TravelIntent.Pointer);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" data-modal>
      <button
        type="button"
        aria-label="Back to Betelgeuse"
        onClick={back}
        className="absolute inset-0 bg-void/60"
      />

      <article
        aria-label={`${star.star}, ${star.section}`}
        className="u-glass u-ticks relative mx-2 mb-[calc(env(safe-area-inset-bottom)+8px)] max-h-[86svh] rounded-[var(--radius-panel)]"
        style={{ animation: "sheet-in 340ms var(--ease-out-expo) both" }}
      >
        <span aria-hidden="true" className="u-sheen" />

        <header className="flex items-start justify-between gap-3 border-b border-[var(--panel-rule)] px-4 py-3">
          <div className="min-w-0">
            <p className="u-eyebrow">Satellite</p>
            <h2 className="mt-0.5 truncate font-display text-[17px] tracking-tight text-frost">
              <span style={{ color: star.color }}>{star.star}</span>
              <span className="mx-2 text-dim">/</span>
              {star.section}
            </h2>
          </div>

          <button
            type="button"
            onClick={back}
            aria-label="Back to Betelgeuse"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-signal/20 text-mist"
          >
            <CloseIcon size={14} />
          </button>
        </header>

        <div className="max-h-[70svh] overflow-y-auto px-4 py-4" data-native-scroll>
          {star.ref ? <ProjectDetailSection slug={star.ref} /> : null}
        </div>
      </article>
    </div>
  );
}
