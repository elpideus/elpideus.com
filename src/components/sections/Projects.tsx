"use client";

/**
 * Betelgeuse: the index of project satellites.
 *
 * Selecting an entry flies the camera to the matching satellite star instead of
 * opening a modal, so the map stays the single navigation model.
 */

import { Eyebrow, Tag, interactiveCursorProps } from "@/components/ui/primitives";
import { ArrowIcon } from "@/components/ui/Icon";
import { satellitesOf } from "@/lib/graph/nodes";
import { StarId } from "@/lib/graph/types";
import { PROJECT_BY_SLUG } from "@/lib/content/projects";
import { TravelIntent, useJourney } from "@/lib/state/journey";

export function ProjectsSection() {
  const focusStar = useJourney((state) => state.focusStar);
  const satellites = satellitesOf(StarId.Betelgeuse);

  return (
    <div className="space-y-4">
      <Eyebrow>Six satellites orbit this star. Pick one, or click it on the map.</Eyebrow>

      <ul className="divide-y divide-signal/12 border-y border-signal/12">
        {satellites.map((satellite) => {
          const project = satellite.ref ? PROJECT_BY_SLUG.get(satellite.ref) : undefined;
          if (!project) return null;

          return (
            <li key={satellite.id}>
              <button
                type="button"
                onClick={() => focusStar(satellite.id, TravelIntent.Pointer)}
                className="group flex w-full items-start gap-3 py-3 text-left transition-colors"
                {...interactiveCursorProps}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: satellite.color, boxShadow: `0 0 10px ${satellite.color}` }}
                />

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="font-display text-[13.5px] tracking-tight text-frost">
                      {project.name}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
                      {satellite.star}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-mist">
                    {project.summary}
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    <Tag className="border-signal/30 text-signal/90">{project.status}</Tag>
                    <Tag>{project.period}</Tag>
                  </span>
                </span>

                <ArrowIcon
                  size={14}
                  className="mt-1 shrink-0 text-dim transition-all duration-300 group-hover:translate-x-1 group-hover:text-signal"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
