"use client";

/**
 * The content panel for whichever star currently has focus.
 *
 * It is anchored to the star's projected position, so orbiting the camera drags
 * the panel along with its star, and a tether line keeps the relationship
 * explicit. Only one panel exists at a time; switching stars swaps its content
 * and replays the entrance animation.
 */

import { useCallback, useRef, useState } from "react";

import { getStar } from "@/lib/graph/nodes";
import { PanelKind, StarClass, StarDepth } from "@/lib/graph/types";
import { useAnchoredElement } from "@/lib/hooks/useAnchoredElement";
import { useWindowDrag } from "@/lib/hooks/useWindowDrag";
import { useJourney } from "@/lib/state/journey";
import { interactiveCursorProps } from "@/components/ui/primitives";
import { panelOffset, panelWasMoved, resetPanelOffset } from "@/lib/state/panel";

import { AboutSection } from "@/components/sections/About";
import { ContactSection } from "@/components/sections/Contact";
import { JournalSection } from "@/components/sections/Journal";
import { OriginSection } from "@/components/sections/Origin";
import { PassionsSection } from "@/components/sections/Passions";
import { ProjectDetailSection } from "@/components/sections/ProjectDetail";
import { ProjectsSection } from "@/components/sections/Projects";
import { StudioSection } from "@/components/sections/Studio";
import { ToolkitSection } from "@/components/sections/Toolkit";
import { TrajectorySection } from "@/components/sections/Trajectory";

/** Horizontal gap between a star and its panel, in CSS pixels. */
const PANEL_OFFSET_X = 96;
const PANEL_OFFSET_Y = -140;

function renderPanel(kind: PanelKind, ref: string | undefined) {
  switch (kind) {
    case PanelKind.Origin:
      return <OriginSection />;
    case PanelKind.About:
      return <AboutSection />;
    case PanelKind.Journey:
      return <TrajectorySection />;
    case PanelKind.Projects:
      return <ProjectsSection />;
    case PanelKind.Studio:
      return <StudioSection />;
    case PanelKind.Toolkit:
      return <ToolkitSection />;
    case PanelKind.Passions:
      return <PassionsSection />;
    case PanelKind.Blog:
      return <JournalSection />;
    case PanelKind.Contact:
      return <ContactSection />;
    case PanelKind.Project:
      return ref ? <ProjectDetailSection slug={ref} /> : null;
    default:
      return null;
  }
}

export function FocusPanel() {
  const focus = useJourney((state) => state.focus);
  const ready = useJourney((state) => state.ready);
  const panel = useRef<HTMLElement>(null);
  const star = getStar(focus);

  const [moved, setMoved] = useState(panelWasMoved);
  const [dragging, setDragging] = useState(false);

  useAnchoredElement(panel, focus, {
    offsetX: PANEL_OFFSET_X,
    offsetY: PANEL_OFFSET_Y,
    clampPadding: 28,
    clampTop: 88,
    clampBottom: 72,
    clampLeft: 28,
    // Keep clear of the star chart pinned to the right edge.
    clampRight: 190,
    liveOffset: panelOffset,
  });

  /**
   * Dragging the header moves the panel. The gesture writes into the shared
   * offset rather than into state, so the panel follows the pointer at frame
   * rate; React only hears about it twice, to track the drag cursor and to swap
   * the recentre affordance in.
   */
  const startDrag = useWindowDrag(panelOffset, {
    onStart: () => setDragging(true),
    onEnd: () => {
      setDragging(false);
      setMoved(panelWasMoved());
    },
  });

  const resetPosition = useCallback(() => {
    resetPanelOffset();
    setMoved(false);
  }, []);

  return (
    <article
      ref={panel}
      className="pointer-events-auto fixed left-0 top-0 z-30 w-[clamp(360px,32vw,470px)] will-change-transform"
      aria-live="polite"
    >
      {/*
        The anchor transform lives on the wrapper and the entrance animation on
        the inner element: a CSS animation on `transform` would otherwise fight
        the per frame positioning and pin the panel to the corner.
      */}
      <div
        key={focus}
        className="relative"
        style={{
          animation: ready ? "panel-in 700ms var(--ease-out-expo) both" : undefined,
          opacity: ready ? undefined : 0,
        }}
      >
        {/*
          Tether: a short line back towards the star this panel belongs to. It
          only makes sense while the panel sits where it was placed, so it goes
          away once the visitor has dragged the window somewhere else.
        */}
        {moved ? null : (
          <>
            <span className="pointer-events-none absolute -left-[68px] top-[152px] h-px w-[68px] bg-gradient-to-l from-signal/60 to-transparent" />
            <span className="pointer-events-none absolute -left-[70px] top-[150px] h-[5px] w-[5px] rounded-full bg-signal shadow-[0_0_10px_var(--color-signal)]" />
          </>
        )}

        <div className="u-glass u-ticks rounded-[var(--radius-panel)]">
          <header
            data-panel-drag
            onPointerDown={startDrag}
            onDoubleClick={resetPosition}
            style={{ cursor: dragging ? "grabbing" : "grab" }}
            title="Drag to move the panel, double click to send it back to its star"
            className="flex items-baseline justify-between gap-3 border-b border-[var(--panel-rule)] px-5 py-3 select-none"
          >
            <div className="flex min-w-0 items-baseline gap-2.5">
              {/* Grip: the affordance that says this edge is draggable. */}
              <span
                aria-hidden="true"
                className="mt-1 grid shrink-0 grid-cols-2 gap-[3px] self-center opacity-45"
              >
                {Array.from({ length: 6 }).map((_, dot) => (
                  <span key={dot} className="block h-[2px] w-[2px] rounded-full bg-mist" />
                ))}
              </span>

              <div className="min-w-0">
                <p className="u-eyebrow">
                  {star.depth === StarDepth.Satellite ? "Satellite" : "Waypoint"}
                </p>
                <h2 className="truncate font-display text-[15px] tracking-tight text-frost">
                  <span style={{ color: star.color }}>{star.star}</span>
                  <span className="mx-2 text-dim">/</span>
                  {star.section}
                </h2>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {star.kind === StarClass.Dormant ? (
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-warning">
                  Dormant
                </span>
              ) : null}

              {moved ? (
                <button
                  type="button"
                  onClick={resetPosition}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="font-mono text-[9px] uppercase tracking-[0.18em] text-dim transition-colors hover:text-signal"
                  {...interactiveCursorProps}
                >
                  Recentre
                </button>
              ) : null}
            </div>
          </header>

          <div className="max-h-[58vh] overflow-y-auto px-5 py-4" data-native-scroll>
            {renderPanel(star.panel, star.ref)}
          </div>
        </div>
      </div>
    </article>
  );
}
