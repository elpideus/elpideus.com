"use client";

/**
 * Polaris: the year by year story.
 *
 * Two tracks share one timeline component because they are the same shape of
 * data: engineering on one side, the craft of making videos on the other.
 */

import { useState } from "react";
import clsx from "clsx";

import { ActionButton, ActionTone, Eyebrow, Tag } from "@/components/ui/primitives";
import {
  CRAFT_JOURNEY,
  ENGINEERING_JOURNEY,
  Track,
  type JourneyEntry,
} from "@/lib/content/journey";
import { ExternalIcon } from "@/components/ui/Icon";
import { interactiveCursorProps } from "@/components/ui/primitives";

const TRACK_LABEL: Record<Track, string> = {
  [Track.Engineering]: "Engineering",
  [Track.Craft]: "Craft",
};

const TRACK_ENTRIES: Record<Track, readonly JourneyEntry[]> = {
  [Track.Engineering]: ENGINEERING_JOURNEY,
  [Track.Craft]: CRAFT_JOURNEY,
};

function Entry({ entry }: { entry: JourneyEntry }) {
  return (
    <li className="relative pl-6">
      {/* The timeline itself: a line with a node per year. */}
      <span className="absolute left-[3px] top-2 h-full w-px bg-gradient-to-b from-signal/40 to-transparent" />
      <span className="absolute left-0 top-1.5 h-[7px] w-[7px] rounded-full border border-signal/70 bg-void" />

      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[11px] tracking-[0.14em] text-signal">{entry.year}</span>
        <span className="font-display text-[13px] tracking-tight text-frost">{entry.title}</span>
      </div>

      <p className="mt-1 text-[12.5px] leading-relaxed text-mist">{entry.body}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Tag className="border-signal/30 text-signal/90">{entry.focus}</Tag>
        {entry.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
        {entry.href ? (
          <a
            href={entry.href}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-dim transition-colors hover:text-signal"
            {...interactiveCursorProps}
          >
            Evidence
            <ExternalIcon size={11} />
          </a>
        ) : null}
      </div>
    </li>
  );
}

export function TrajectorySection() {
  const [track, setTrack] = useState<Track>(Track.Engineering);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {Object.values(Track).map((value) => (
          <ActionButton
            key={value}
            tone={track === value ? ActionTone.Primary : ActionTone.Ghost}
            onClick={() => setTrack(value)}
            aria-pressed={track === value}
          >
            {TRACK_LABEL[value]}
          </ActionButton>
        ))}
      </div>

      <Eyebrow>
        {track === Track.Engineering
          ? "From PHP on a tablet to agentic engineering"
          : "From Movie Maker to a million views"}
      </Eyebrow>

      <ul className={clsx("space-y-5")}>
        {TRACK_ENTRIES[track].map((entry) => (
          <Entry key={`${entry.year}-${entry.title}`} entry={entry} />
        ))}
      </ul>
    </div>
  );
}
