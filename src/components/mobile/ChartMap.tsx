"use client";

/**
 * The map itself, projected from above onto the plane of travel.
 *
 * The projection is deliberately literal: world X becomes chart X and world Z
 * becomes chart Y, so the shape drawn here is the shape in the sky, seen from
 * above. Nothing is invented geometry.
 *
 * It is a component of its own because both touch layouts need the same
 * drawing at different sizes: a phone opens it as a sheet on demand, and a
 * tablet keeps it pinned in the corner of the sky the whole time. Only the
 * labels and the touch targets change between the two.
 */

import type { CSSProperties } from "react";

import { LINKS, STARS, getStar } from "@/lib/graph/nodes";
import { LinkKind, StarClass, StarDepth, type StarId, type StarNode } from "@/lib/graph/types";
import { PROJECT_BY_SLUG } from "@/lib/content/projects";

/** Chart space. Taller than it is wide, because the journey runs into depth. */
export const CHART_WIDTH = 100;
export const CHART_HEIGHT = 260;
const MARGIN_X = 17;
const MARGIN_Y = 10;

/** Opacity per edge kind, mirroring how the sky draws them. */
const EDGE_OPACITY: Record<LinkKind, number> = {
  [LinkKind.Spine]: 0.45,
  [LinkKind.Branch]: 0.3,
  [LinkKind.Whisper]: 0.12,
};

/** Every satellite on the map, listed under the chart. */
export const SATELLITES = STARS.filter((star) => star.depth === StarDepth.Satellite);

const bounds = STARS.reduce(
  (box, star) => ({
    minX: Math.min(box.minX, star.position[0]),
    maxX: Math.max(box.maxX, star.position[0]),
    minZ: Math.min(box.minZ, star.position[2]),
    maxZ: Math.max(box.maxZ, star.position[2]),
  }),
  { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity },
);

export function chartX(star: StarNode): number {
  const span = bounds.maxX - bounds.minX || 1;
  return MARGIN_X + ((star.position[0] - bounds.minX) / span) * (CHART_WIDTH - MARGIN_X * 2);
}

export function chartY(star: StarNode): number {
  // Travel runs towards negative Z, so the far end of the journey is the bottom
  // of the sheet: down the chart is forwards.
  const span = bounds.maxZ - bounds.minZ || 1;
  return MARGIN_Y + ((bounds.maxZ - star.position[2]) / span) * (CHART_HEIGHT - MARGIN_Y * 2);
}

/** What a satellite is called on the chart: the project, not the star. */
export function satelliteLabel(star: StarNode): string {
  const project = star.ref ? PROJECT_BY_SLUG.get(star.ref) : undefined;
  return project?.name ?? star.section;
}

export interface ChartMapProps {
  readonly focus: StarId;
  readonly onTravel: (star: StarNode) => void;
  /**
   * Star names beside the dots. Off in the pinned tablet chart, where the map
   * is a few centimetres wide and the names would be a smear.
   */
  readonly labels?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
}

export function ChartMap({ focus, onTravel, labels = true, className, style }: ChartMapProps) {
  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      className={className}
      style={style}
      role="group"
      aria-label="Map of every star on the site"
    >
      {LINKS.map((link, at) => {
        const from = getStar(link.from);
        const to = getStar(link.to);
        return (
          <line
            // Two stars can be joined twice, once by the spine and once by a
            // whisper, so the kind is part of the identity.
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
            onClick={() => onTravel(star)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onTravel(star);
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
              Satellites are left unlabelled. Six of them sit inside ten world
              units of each other, so on this scale their names overlap into a
              smear; they are named in the list under the map instead, where
              there is room for them.
            */}
            {labels && !satellite ? (
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
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
