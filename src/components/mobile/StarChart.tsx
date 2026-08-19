"use client";

/**
 * The star chart sheet: the whole map on one screen.
 *
 * The desktop rail lists the nine sections and leaves satellites to the sky,
 * because on a desktop the sky is right there and can be aimed at. A phone has
 * no aiming, so this chart carries everything: sections, satellites and the
 * edges between them, projected from above onto the plane of travel.
 *
 * The projection is deliberately literal. World X becomes chart X and world Z
 * becomes chart Y, so the shape in the sheet is the shape in the sky, seen from
 * above. Nothing here is invented geometry.
 */

import { useEffect } from "react";

import { CloseIcon } from "@/components/ui/Icon";
import { LINKS, STARS, getStar, journeyIndexOf } from "@/lib/graph/nodes";
import { LinkKind, StarClass, StarDepth, type StarNode } from "@/lib/graph/types";
import { PROJECT_BY_SLUG } from "@/lib/content/projects";
import { useMobileUi } from "@/lib/state/mobile";
import { TravelIntent, useJourney } from "@/lib/state/journey";

/** Chart space. Taller than it is wide, because the journey runs into depth. */
const CHART_WIDTH = 100;
const CHART_HEIGHT = 260;
const MARGIN_X = 17;
const MARGIN_Y = 10;

/** Opacity per edge kind, mirroring how the sky draws them. */
const EDGE_OPACITY: Record<LinkKind, number> = {
  [LinkKind.Spine]: 0.45,
  [LinkKind.Branch]: 0.3,
  [LinkKind.Whisper]: 0.12,
};

/** Every satellite on the map, listed under the chart. */
const SATELLITES = STARS.filter((star) => star.depth === StarDepth.Satellite);

const bounds = STARS.reduce(
  (box, star) => ({
    minX: Math.min(box.minX, star.position[0]),
    maxX: Math.max(box.maxX, star.position[0]),
    minZ: Math.min(box.minZ, star.position[2]),
    maxZ: Math.max(box.maxZ, star.position[2]),
  }),
  { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity },
);

function chartX(star: StarNode): number {
  const span = bounds.maxX - bounds.minX || 1;
  return MARGIN_X + ((star.position[0] - bounds.minX) / span) * (CHART_WIDTH - MARGIN_X * 2);
}

function chartY(star: StarNode): number {
  // Travel runs towards negative Z, so the far end of the journey is the bottom
  // of the sheet: down the chart is forwards.
  const span = bounds.maxZ - bounds.minZ || 1;
  return MARGIN_Y + ((bounds.maxZ - star.position[2]) / span) * (CHART_HEIGHT - MARGIN_Y * 2);
}

/** What a satellite is called on the chart: the project, not the star. */
function satelliteLabel(star: StarNode): string {
  const project = star.ref ? PROJECT_BY_SLUG.get(star.ref) : undefined;
  return project?.name ?? star.section;
}

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
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="w-full"
            role="group"
            aria-label="Map of every star on the site"
          >
            {LINKS.map((link, at) => {
              const from = getStar(link.from);
              const to = getStar(link.to);
              return (
                <line
                  // Two stars can be joined twice, once by the spine and once
                  // by a whisper, so the kind is part of the identity.
                  key={`${link.from}-${link.to}-${link.kind}-${at}`}
                  x1={chartX(from)}
                  y1={chartY(from)}
                  x2={chartX(to)}
                  y2={chartY(to)}
                  stroke="var(--color-signal)"
                  strokeWidth={0.4}
                  opacity={EDGE_OPACITY[link.kind]}
                />
              );
            })}

            {STARS.map((star) => {
              const x = chartX(star);
              const y = chartY(star);
              const satellite = star.depth === StarDepth.Satellite;
              const current = focus === star.id;
              const leftSide = x > CHART_WIDTH * 0.55;

              return (
                <g
                  key={star.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${star.star}, ${star.section}`}
                  onClick={() => travel(star)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") travel(star);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {/* Comfortable touch target, invisible and much larger than the dot. */}
                  <circle cx={x} cy={y} r={7} fill="transparent" />

                  {current ? (
                    <circle
                      cx={x}
                      cy={y}
                      r={satellite ? 3.6 : 5}
                      fill="none"
                      stroke={star.color}
                      strokeWidth={0.5}
                      opacity={0.7}
                    />
                  ) : null}

                  <circle
                    cx={x}
                    cy={y}
                    r={satellite ? 1.3 : 2.1}
                    fill={star.color}
                    opacity={star.kind === StarClass.Dormant ? 0.5 : 1}
                  />

                  {/*
                    Satellites are left unlabelled. Six of them sit inside ten
                    world units of each other, so on this scale their names
                    overlap into a smear; they are named in the list under the
                    map instead, where there is room for them.
                  */}
                  {satellite ? null : (
                    <text
                      x={leftSide ? x - 4 : x + 4}
                      y={y + 1.3}
                      textAnchor={leftSide ? "end" : "start"}
                      fill={current ? "var(--color-frost)" : "var(--color-mist)"}
                      fontSize={4}
                      fontFamily="var(--font-mono)"
                      letterSpacing={0.2}
                    >
                      {star.star}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

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
