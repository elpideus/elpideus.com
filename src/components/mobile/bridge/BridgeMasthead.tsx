"use client";

/**
 * The bridge masthead: the mark, and the way off the site with the CV.
 *
 * It lives outside the dossier because the two orientations hang it in
 * different places. In landscape it caps the console column; in portrait the
 * console is docked to the bottom of the screen and the masthead floats over
 * the open sky above it. Either way it stays put while the reading scrolls, and
 * a satellite never covers it.
 */

import clsx from "clsx";
import type { CSSProperties } from "react";

import { DownloadIcon } from "@/components/ui/Icon";
import { Mark } from "@/components/ui/Mark";
import { TravelIntent, useJourney } from "@/lib/state/journey";

export interface BridgeMastheadProps {
  readonly className?: string;
  readonly style?: CSSProperties;
}

export function BridgeMasthead({ className, style }: BridgeMastheadProps) {
  return (
    <header
      className={clsx(
        "pointer-events-auto z-20 flex shrink-0 items-center justify-between gap-3 px-5 py-3",
        className,
      )}
      style={style}
    >
      <button
        type="button"
        onClick={() => useJourney.getState().goToIndex(0, TravelIntent.Pointer, 0.4)}
        className="flex items-baseline gap-2"
        aria-label="Return to Sirius, the origin star"
      >
        <Mark size={13} className="relative top-[2px] shrink-0 text-frost" />
        <span className="font-display text-[15px] tracking-[0.06em] text-frost">elpideus</span>
      </button>

      <a
        href="/api/cv"
        download
        aria-label="Download the curriculum"
        className="flex items-center gap-1.5 rounded-[3px] border border-signal/45 bg-signal/12 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-frost"
      >
        <DownloadIcon size={12} />
        CV
      </a>
    </header>
  );
}
