"use client";

/**
 * The star chart sheet: the whole map on one screen.
 *
 * The desktop rail lists the nine sections and leaves satellites to the sky,
 * because on a desktop the sky is right there and can be aimed at. A phone has
 * no aiming, so this chart carries everything: sections, satellites and the
 * edges between them.
 *
 * On a tablet the same map is pinned permanently into the corner of the sky
 * instead, so this sheet is the phone layout only. The drawing they share lives
 * in `ChartMap`.
 */

import { useEffect } from "react";

import { ChartMap, SATELLITES, satelliteLabel } from "./ChartMap";
import { CloseIcon } from "@/components/ui/Icon";
import { journeyIndexOf } from "@/lib/graph/nodes";
import { StarDepth, type StarNode } from "@/lib/graph/types";
import { useMobileUi } from "@/lib/state/mobile";
import { TravelIntent, useJourney } from "@/lib/state/journey";

export function StarChart() {
  const open = useMobileUi((state) => state.chartOpen);
  const setChartOpen = useMobileUi((state) => state.setChartOpen);
  const focus = useJourney((state) => state.focus);

  // A sheet that stays open behind the back button would be a trap, and the
  // hash is already the site's routing, so Escape and the backdrop are the only
  // ways out. Escape matters for anyone on a phone with a keyboard attached.
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setChartOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, setChartOpen]);

  if (!open) return null;

  const travel = (star: StarNode) => {
    const journey = useJourney.getState();
    if (star.depth === StarDepth.Satellite) journey.focusStar(star.id, TravelIntent.Pointer);
    else journey.goToIndex(journeyIndexOf(star.id), TravelIntent.Pointer, 0.35);
    setChartOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" data-modal>
      <button
        type="button"
        aria-label="Close the star chart"
        onClick={() => setChartOpen(false)}
        className="absolute inset-0 bg-void/70 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-label="Star chart"
        className="u-glass relative mx-2 mb-[calc(env(safe-area-inset-bottom)+8px)] max-h-[82svh] rounded-[var(--radius-panel)]"
        style={{ animation: "sheet-in 320ms var(--ease-out-expo) both" }}
      >
        <span aria-hidden="true" className="u-sheen" />

        <header className="flex items-center justify-between border-b border-[var(--panel-rule)] px-4 py-3">
          <div>
            <p className="u-eyebrow">Star chart</p>
            <p className="mt-0.5 font-display text-[15px] tracking-tight text-frost">
              Fifteen stars, seen from above
            </p>
          </div>
          <button
            type="button"
            onClick={() => setChartOpen(false)}
            aria-label="Close the star chart"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-signal/20 text-mist"
          >
            <CloseIcon size={14} />
          </button>
        </header>

        <div className="max-h-[62svh] overflow-y-auto px-3 py-4" data-native-scroll>
          <ChartMap focus={focus} onTravel={travel} className="w-full" />

          {/* The satellites, by name, since the map has no room to label them. */}
          <div className="mt-4 border-t border-[var(--panel-rule)] pt-3">
            <p className="u-eyebrow mb-2">Satellites of Betelgeuse</p>
            <div className="flex flex-wrap gap-1.5">
              {SATELLITES.map((star) => (
                <button
                  key={star.id}
                  type="button"
                  onClick={() => travel(star)}
                  className="inline-flex items-center gap-1.5 rounded-[3px] border border-signal/20 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-mist"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: star.color, boxShadow: `0 0 8px ${star.color}` }}
                  />
                  {satelliteLabel(star)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer className="border-t border-[var(--panel-rule)] px-4 py-2.5">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-dim">
            Large dots are sections · small dots are their satellites
          </p>
        </footer>
      </div>
    </div>
  );
}
