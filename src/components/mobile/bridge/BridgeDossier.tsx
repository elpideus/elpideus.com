"use client";

/**
 * The reading area of the console.
 *
 * Same content as the deck, same scroll to journey engine, different job. On a
 * phone every section is its own card floating over the sky, because the sky is
 * the background and the cards are what stop it. Here the console is already a
 * surface, so a second frame around each section would only be glass on glass:
 * the waypoints run as one continuous document, divided by the transit rule
 * that carries the leg readout.
 *
 * A satellite takes the reading over rather than opening a sheet on top of the
 * screen. The camera really has left the corridor for it, and covering only the
 * reading is what keeps that legible: the project is on one side, its star is
 * on the other, and closing it is stepping back rather than dismissing a modal.
 */

import clsx from "clsx";
import { useEffect } from "react";

import { CloseIcon } from "@/components/ui/Icon";
import { ProjectDetailSection } from "@/components/sections/ProjectDetail";
import { Waypoint, WaypointVariant } from "../Waypoint";
import { BRIDGE_HINT, panelBody } from "../panelBody";
import { legLength, useJourneyScroll } from "../useJourneyScroll";
import { BridgeOrientation } from "@/lib/hooks/useFormFactor";
import { JOURNEY, getStar } from "@/lib/graph/nodes";
import { StarDepth, StarId } from "@/lib/graph/types";
import { TravelIntent, useJourney } from "@/lib/state/journey";

/**
 * Where in the console a waypoint counts as the one being read, as a fraction
 * from the top. Higher than on a phone in both orientations: the column is
 * narrower or shorter than a screen, so a panel runs longer through it, and
 * waiting for the middle would leave the sky a section behind the reading.
 */
const READING_LINE = {
  [BridgeOrientation.Landscape]: 0.35,
  [BridgeOrientation.Portrait]: 0.3,
} as const;

export function BridgeDossier({ orientation }: { readonly orientation: BridgeOrientation }) {
  const portrait = orientation === BridgeOrientation.Portrait;
  const { scroller, sections } = useJourneyScroll(READING_LINE[orientation]);
  const focus = useJourney((state) => state.focus);
  const star = getStar(focus);
  const satellite = star.depth === StarDepth.Satellite;
  const parent = star.parent ?? StarId.Betelgeuse;

  const back = () => useJourney.getState().focusStar(parent, TravelIntent.Pointer);

  // A tablet is the one handheld that regularly has a keyboard attached to it.
  useEffect(() => {
    if (!satellite) return;
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      useJourney.getState().focusStar(parent, TravelIntent.Pointer);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [parent, satellite]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scroller}
        data-native-scroll
        /*
          Absolutely filled and declared a size container, so the trailing
          spacer can be stated as a share of the console rather than of the
          viewport: in portrait the console is the shorter part of the screen.

          The right gutter is for the rail, which runs down the edge of the
          screen and therefore crosses the console in portrait. Nothing in the
          reading is allowed under it.
        */
        className={
          portrait
            ? "absolute inset-0 overflow-y-auto overscroll-y-contain pl-6 pr-14 [container-type:size]"
            : "absolute inset-0 overflow-y-auto overscroll-y-contain px-6 [container-type:size]"
        }
        /*
          A short fade where the reading meets the top edge, so a panel scrolling
          out dissolves into the seam instead of being guillotined by it.
        */
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 28px)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 28px)",
        }}
      >
        {/*
          A measure cap. In portrait the console is the full width of the tablet,
          and a line of body text running the whole way across it is past the
          point where the eye finds the next line reliably.
        */}
        <div className={portrait ? "mx-auto w-full max-w-[34rem] pb-[75cqh]" : "w-full pb-[75cqh]"}>
          {JOURNEY.map((id, position) => (
            <div
              key={id}
              ref={(element) => {
                sections.current[position] = element;
              }}
            >
              <Waypoint
                id={id}
                position={position}
                total={JOURNEY.length}
                leg={legLength(position)}
                variant={WaypointVariant.Dossier}
              >
                {panelBody(getStar(id).panel, BRIDGE_HINT)}
              </Waypoint>
            </div>
          ))}
        </div>
      </div>

      {satellite ? (
        <article
          aria-label={`${star.star}, ${star.section}`}
          className="absolute inset-0 z-30 flex flex-col"
          style={{
            // Opaque, unlike the console it covers: the reading behind it would
            // otherwise read straight through the project.
            backgroundColor: "var(--color-void)",
            backgroundImage: "var(--panel-surface)",
            backdropFilter: "var(--panel-blur)",
            animation: "sheet-in 320ms var(--ease-out-expo) both",
          }}
          data-modal
        >
          <header
            /* The right gutter clears the rail, which crosses the console in portrait. */
            className={clsx(
              "flex shrink-0 items-start justify-between gap-3 border-b border-[var(--panel-rule)] py-4 pl-6",
              portrait ? "pr-14" : "pr-6",
            )}
          >
            <div className="min-w-0">
              <p className="u-eyebrow">Satellite of {getStar(parent).star}</p>
              <h2 className="mt-0.5 truncate font-display text-[21px] tracking-tight text-frost">
                <span style={{ color: star.color }}>{star.star}</span>
                <span className="mx-2 text-dim">/</span>
                {star.section}
              </h2>
            </div>

            <button
              type="button"
              onClick={back}
              aria-label="Back to the journey"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-signal/20 text-mist"
            >
              <CloseIcon size={15} />
            </button>
          </header>

          <div
            className={
              portrait
                ? "min-h-0 flex-1 overflow-y-auto py-5 pl-6 pr-14"
                : "min-h-0 flex-1 overflow-y-auto px-6 py-5"
            }
            data-native-scroll
          >
            {star.ref ? <ProjectDetailSection slug={star.ref} /> : null}
          </div>
        </article>
      ) : null}
    </div>
  );
}
