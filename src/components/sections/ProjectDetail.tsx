"use client";

/** A single project satellite: what it is, what it runs on, where to see it. */

import { ActionLink, ActionTone, Eyebrow, Hairline, Prose, Tag } from "@/components/ui/primitives";
import { ArrowIcon } from "@/components/ui/Icon";
import { MediaStrip } from "@/components/overlay/MediaStrip";
import { PROJECT_BY_SLUG, ProjectLinkKind } from "@/lib/content/projects";
import { StarId } from "@/lib/graph/types";
import { TravelIntent, useJourney } from "@/lib/state/journey";
import { interactiveCursorProps } from "@/components/ui/primitives";

export function ProjectDetailSection({ slug }: { slug: string }) {
  const project = PROJECT_BY_SLUG.get(slug);
  const focusStar = useJourney((state) => state.focusStar);

  if (!project) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag className="border-signal/30 text-signal/90">{project.status}</Tag>
        <Tag>{project.period}</Tag>
        {project.client ? <Tag>Client: {project.client}</Tag> : null}
      </div>

      <Prose>
        {project.body.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </Prose>

      <MediaStrip media={project.media} title={project.name} />

      <div>
        <Eyebrow className="mb-2">Stack</Eyebrow>
        <div className="flex flex-wrap gap-1.5">
          {project.stack.map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </div>
      </div>

      <Hairline />

      <div className="flex flex-wrap items-center gap-2">
        {project.links.map((link) => (
          <ActionLink
            key={link.href}
            href={link.href}
            tone={link.kind === ProjectLinkKind.Website ? ActionTone.Primary : ActionTone.Ghost}
          >
            {link.kind}
          </ActionLink>
        ))}
        {project.links.length === 0 ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
            No public link while the work is under agreement
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => focusStar(StarId.Betelgeuse, TravelIntent.Pointer)}
        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-dim transition-colors hover:text-signal"
        {...interactiveCursorProps}
      >
        <ArrowIcon size={12} className="rotate-180" />
        Back to Betelgeuse
      </button>
    </div>
  );
}
