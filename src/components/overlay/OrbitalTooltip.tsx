"use client";

/**
 * Hover tooltip for orbital bodies: real planets, companion stars and debris
 * discs, drawn only where real astronomy documents one.
 */

import { useRef } from "react";

import { ORBITALS } from "@/lib/content/orbitals";
import { getStar } from "@/lib/graph/nodes";
import { useAnchoredElement } from "@/lib/hooks/useAnchoredElement";
import { useOrbitalHover } from "@/lib/state/orbitalHover";

const KIND_LABEL = {
  planet: "Planet",
  star: "Companion star",
  disc: "Debris disc",
} as const;

export function OrbitalTooltip() {
  const hovered = useOrbitalHover((state) => state.hovered);
  const tooltip = useRef<HTMLDivElement>(null);

  useAnchoredElement(tooltip, hovered, { offsetX: 22, offsetY: -14, clampPadding: 16 });

  if (!hovered) return null;
  const body = ORBITALS.find((entry) => entry.id === hovered);
  if (!body) return null;
  const star = getStar(body.star);

  return (
    <div
      ref={tooltip}
      className="pointer-events-none fixed left-0 top-0 z-40 w-[248px] will-change-transform"
      role="tooltip"
    >
      <div
        key={hovered}
        className="u-glass rounded-[3px] px-3 py-2"
        style={{ animation: "panel-in 220ms var(--ease-out-expo) both" }}
      >
        <p className="u-eyebrow">
          {KIND_LABEL[body.kind]} · {star.star}
        </p>
        <p className="font-display text-[13px] leading-tight tracking-tight text-frost">
          <span style={{ color: body.color }}>{body.name}</span>
        </p>
        <p className="mt-1 text-[11.5px] leading-snug text-mist">{body.tagline}</p>
        <p className="mt-1.5 text-[10.5px] leading-snug text-signal/80">{body.fact}</p>
      </div>
    </div>
  );
}
