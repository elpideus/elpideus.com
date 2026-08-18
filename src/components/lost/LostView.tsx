"use client";

/**
 * The 404: a black hole, an apology, and a way back to the map.
 *
 * Falling off the map should feel like falling into something rather than
 * hitting an error page, so the whole viewport is a scene with Gargantua in
 * it, built the same way the map is: a canvas underneath, the readable things
 * laid over it. Three deliberate clicks into the shadow open Trailblazing Rovers, which
 * is the only reward for poking at a black hole that anyone has ever received.
 */

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { CloseIcon } from "@/components/ui/Icon";
import { Cursor } from "@/components/overlay/Cursor";
import { interactiveCursorProps } from "@/components/ui/primitives";
import { LostScene } from "./LostScene";
import { LostVeil } from "./LostVeil";
import { DriftRun } from "./DriftRun";
import { useWindowDrag, type DragOffset } from "@/lib/hooks/useWindowDrag";
import { SITE } from "@/lib/content/links";

/** Clicks into the shadow needed to shake the game loose. */
const CLICKS_TO_OPEN = 3;

/**
 * Where the visitor has dragged the game window, in CSS pixels. Module level
 * and mutable on purpose, the same way the waypoint panel keeps its offset:
 * the drag writes to it on every pointer move, and only one of these windows
 * can ever exist.
 */
const windowOffset = { x: 0, y: 0 };

export function LostView() {
  const [clicks, setClicks] = useState(0);
  const [gameOpen, setGameOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);

  const frame = useRef<HTMLDivElement>(null);
  const onReady = useCallback(() => setReady(true), []);

  const applyOffset = useCallback((next: DragOffset) => {
    const element = frame.current;
    if (!element) return;
    element.style.transform = `translate3d(${Math.round(next.x)}px, ${Math.round(next.y)}px, 0)`;
  }, []);

  const startDrag = useWindowDrag(windowOffset, {
    onStart: () => setDragging(true),
    onMove: applyOffset,
    onEnd: () => setDragging(false),
  });

  const onHoleClick = useCallback(() => {
    setClicks((count) => {
      const next = count + 1;
      if (next >= CLICKS_TO_OPEN) {
        setGameOpen(true);
        return 0;
      }
      return next;
    });
  }, []);

  const closeGame = useCallback(() => {
    setGameOpen(false);
    windowOffset.x = 0;
    windowOffset.y = 0;
  }, []);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-void">
      <LostScene onHoleClick={onHoleClick} onReady={onReady} />

      {/* Copy sits clear of the shadow so the hole stays clickable. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-3 px-6 pt-[9vh] text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">Error 404</p>
        <h1 className="font-display text-[28px] tracking-tight text-frost">
          No star at these coordinates
        </h1>
        <p className="max-w-md text-[13px] leading-relaxed text-mist">
          Whatever was here has fallen past the horizon. The map itself is still out there, and
          everything on it is one link away.
        </p>

        {/* The only hint that the shadow answers to being poked. */}
        <div className="flex items-center gap-1.5 pt-1" aria-hidden="true">
          {Array.from({ length: CLICKS_TO_OPEN }).map((_, dot) => (
            <span
              key={dot}
              className="h-[3px] w-[3px] rounded-full transition-colors duration-300"
              style={{
                background: dot < clicks ? "var(--color-halo)" : "transparent",
                boxShadow: dot < clicks ? "0 0 8px var(--color-halo)" : undefined,
              }}
            />
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-5 px-6 pb-[8vh] text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-[3px] border border-halo/45 bg-halo/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-frost transition-colors hover:bg-halo/20"
          {...interactiveCursorProps}
        >
          Return to Sirius
        </Link>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">{SITE.url}</p>
      </div>

      {gameOpen ? (
        <div
          ref={frame}
          data-modal
          role="dialog"
          aria-label="Trailblazing Rovers"
          className="u-glass u-ticks absolute left-1/2 top-1/2 w-[min(860px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-panel)]"
          style={{ animation: "panel-in 320ms var(--ease-out-expo) both" }}
        >
          {/*
            The transform that centres the window lives on this wrapper and the
            drag transform on the element itself, for the same reason the focus
            panel splits them: two transforms on one element fight each other.
          */}
          <header
            data-panel-drag
            onPointerDown={startDrag}
            style={{ cursor: dragging ? "grabbing" : "grab" }}
            title="Drag to move the window"
            className="flex select-none items-center justify-between gap-3 border-b border-[var(--panel-rule)] px-4 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span aria-hidden="true" className="grid shrink-0 grid-cols-2 gap-[3px] opacity-45">
                {Array.from({ length: 6 }).map((_, dot) => (
                  <span key={dot} className="block h-[2px] w-[2px] rounded-full bg-mist" />
                ))}
              </span>
              <div className="min-w-0">
                <p className="u-eyebrow">Salvage</p>
                <h2 className="truncate font-display text-[14px] tracking-tight text-frost">
                  <span className="text-halo">Trailblazing Rovers</span>
                  <span className="mx-2 text-dim">/</span>
                  debris field
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={closeGame}
              aria-label="Close Trailblazing Rovers"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-halo/25 text-mist transition-colors hover:border-halo/60 hover:text-halo"
              {...interactiveCursorProps}
            >
              <CloseIcon size={14} />
            </button>
          </header>

          <div className="px-4 py-3">
            <DriftRun />
            <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
              A tribute to the little metal heroes who paved the way: Spirit, Opportunity, and Sojourner.
            </p>
          </div>
        </div>
      ) : null}

      <LostVeil ready={ready} />

      {/* The same reticle the map uses, so the two pages feel like one site. */}
      <Cursor />
    </main>
  );
}
