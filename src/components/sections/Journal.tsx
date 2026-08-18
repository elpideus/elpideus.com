"use client";

/** Proxima Centauri: the blog, deliberately not lit yet. */

import { Eyebrow, Prose, Tag } from "@/components/ui/primitives";
import { JOURNAL } from "@/lib/content/contact";

export function JournalSection() {
  return (
    <div className="space-y-4">
      <Tag className="border-warning/30 text-warning">{JOURNAL.badge}</Tag>

      <Prose>
        {JOURNAL.body.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </Prose>

      <Eyebrow>Nothing to read here yet. The star stays dim until there is.</Eyebrow>
    </div>
  );
}
