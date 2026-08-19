"use client";

/** Rigel: the video side of the work. */

import { ActionLink, ActionTone, Eyebrow, Hairline, Prose, Tag } from "@/components/ui/primitives";
import { HologramVideo } from "@/components/overlay/HologramVideo";
import { CHANNEL } from "@/lib/content/studio";
import { formatCount, useChannelStats } from "@/lib/hooks/useChannelStats";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1">
      <p className="font-display text-[22px] leading-none tracking-tight text-frost">{value}</p>
      <p className="u-eyebrow mt-1">{label}</p>
    </div>
  );
}

export function StudioSection() {
  const stats = useChannelStats();

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4 border-y border-signal/12 py-3">
        <Stat label="Subscribers" value={formatCount(stats.subscribers)} />
        <Stat label="Views" value={formatCount(stats.views)} />
        {stats.videos > 0 ? <Stat label="Uploads" value={formatCount(stats.videos)} /> : null}
      </div>

      <Prose>
        {CHANNEL.body.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </Prose>

      <HologramVideo
        videoId={CHANNEL.featuredVideo.id}
        title={CHANNEL.featuredVideo.title}
        label="Featured transmission"
      />

      <div className="flex flex-wrap gap-1.5">
        {CHANNEL.tools.map((tool) => (
          <Tag key={tool}>{tool}</Tag>
        ))}
      </div>

      <Hairline />

      <div className="flex flex-wrap items-center gap-2">
        <ActionLink href={CHANNEL.href} tone={ActionTone.Primary}>
          Watch on YouTube
        </ActionLink>
        <Eyebrow>Channel opened {CHANNEL.opened}</Eyebrow>
      </div>
    </div>
  );
}
