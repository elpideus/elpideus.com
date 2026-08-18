"use client";

/**
 * Horizontal strip of project projections.
 *
 * Three things make it feel right:
 *
 * - A wheel over the strip scrolls the pictures instead of the panel behind it,
 *   or the map behind that. The listener is attached natively because React
 *   registers wheel handlers as passive, where `preventDefault` is ignored.
 * - Explicit previous and next controls, for anyone who would rather click.
 * - Clicking a projection opens it full size in the lightbox.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";

import { ArrowIcon } from "@/components/ui/Icon";
import { HologramImage } from "@/components/overlay/Hologram";
import { Lightbox, type LightboxMedia } from "@/components/overlay/Lightbox";
import { interactiveCursorProps } from "@/components/ui/primitives";

export interface StripMedia {
  readonly src: string;
  readonly alt: string;
}

/** Which end of the strip the visitor is scrolled to. */
enum StripEdge {
  Start = "start",
  Middle = "middle",
  End = "end",
  /** Everything fits, so the controls have nothing to do. */
  Whole = "whole",
}

/** Width of one card plus its gap, used as the step for the controls. */
const CARD_WIDTH = 300;
const CARD_GAP = 12;
const STEP = CARD_WIDTH + CARD_GAP;

function edgeOf(element: HTMLElement): StripEdge {
  const max = element.scrollWidth - element.clientWidth;
  if (max <= 2) return StripEdge.Whole;
  if (element.scrollLeft <= 2) return StripEdge.Start;
  if (element.scrollLeft >= max - 2) return StripEdge.End;
  return StripEdge.Middle;
}

export function MediaStrip({ media, title }: { media: readonly StripMedia[]; title: string }) {
  const strip = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState<StripEdge>(StripEdge.Start);
  const [opened, setOpened] = useState<number | null>(null);

  const syncEdge = useCallback(() => {
    const element = strip.current;
    if (element) setEdge(edgeOf(element));
  }, []);

  useEffect(() => {
    const element = strip.current;
    if (!element) return;

    // Vertical wheel deltas move the strip sideways, which is what a visitor
    // expects when the content only exists on one axis.
    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta === 0) return;

      const max = element.scrollWidth - element.clientWidth;
      if (max <= 0) return;

      event.preventDefault();
      event.stopPropagation();
      element.scrollLeft += delta;
      syncEdge();
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    syncEdge();
    return () => element.removeEventListener("wheel", onWheel);
  }, [syncEdge]);

  const step = (direction: number) => {
    strip.current?.scrollBy({ left: direction * STEP, behavior: "smooth" });
    // The smooth scroll settles after the event, so re-read shortly after.
    window.setTimeout(syncEdge, 320);
  };

  if (media.length === 0) return null;

  const atStart = edge === StripEdge.Start || edge === StripEdge.Whole;
  const atEnd = edge === StripEdge.End || edge === StripEdge.Whole;
  const total = String(media.length).padStart(2, "0");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="u-eyebrow">Projection</p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={atStart}
            aria-label="Previous projection"
            className={clsx(
              "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
              atStart
                ? "border-signal/10 text-dim/50"
                : "border-signal/25 text-mist hover:border-signal/60 hover:text-signal",
            )}
            {...interactiveCursorProps}
          >
            <ArrowIcon size={12} className="rotate-180" />
          </button>

          <button
            type="button"
            onClick={() => step(1)}
            disabled={atEnd}
            aria-label="Next projection"
            className={clsx(
              "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
              atEnd
                ? "border-signal/10 text-dim/50"
                : "border-signal/25 text-mist hover:border-signal/60 hover:text-signal",
            )}
            {...interactiveCursorProps}
          >
            <ArrowIcon size={12} />
          </button>
        </div>
      </div>

      <div
        ref={strip}
        onScroll={syncEdge}
        data-native-scroll
        className="flex snap-x gap-3 overflow-x-auto pb-2"
      >
        {media.map((item, index) => (
          <button
            key={item.src}
            type="button"
            onClick={() => setOpened(index)}
            aria-label={`Open ${item.alt} at full size`}
            className="w-[300px] shrink-0 snap-start text-left"
            {...interactiveCursorProps}
          >
            <HologramImage
              src={item.src}
              alt={item.alt}
              label={`${String(index + 1).padStart(2, "0")} / ${total}`}
              priority={index === 0}
              className="transition-transform duration-300 hover:-translate-y-0.5"
            />
          </button>
        ))}
      </div>

      {opened !== null && media[opened] ? (
        <Lightbox
          media={
            {
              src: media[opened].src,
              alt: media[opened].alt,
              label: `${title} · ${String(opened + 1).padStart(2, "0")} of ${total}`,
            } satisfies LightboxMedia
          }
          onClose={() => setOpened(null)}
        />
      ) : null}
    </div>
  );
}
