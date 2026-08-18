"use client";

/** Vega: how the person behind the work actually operates. */

import { Eyebrow, Hairline, Prose, Tag } from "@/components/ui/primitives";
import { PROFILE } from "@/lib/content/profile";

export function AboutSection() {
  return (
    <div className="space-y-5">
      <Prose>
        {PROFILE.intro.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </Prose>

      <div className="flex flex-wrap gap-1.5">
        {PROFILE.facts.map((fact) => (
          <Tag key={fact.label}>
            <span className="text-dim">{fact.label}</span>
            <span className="mx-1.5 text-signal/50">/</span>
            <span className="text-frost">{fact.value}</span>
          </Tag>
        ))}
      </div>

      <Hairline />

      <div>
        <Eyebrow className="mb-3">Operating principles</Eyebrow>
        <ul className="space-y-3.5">
          {PROFILE.principles.map((principle) => (
            <li key={principle.title} className="border-l border-signal/25 pl-3">
              <p className="font-display text-[13px] tracking-tight text-frost">{principle.title}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-mist">{principle.body}</p>
            </li>
          ))}
        </ul>
      </div>

      <Hairline />

      <div>
        <Eyebrow className="mb-2">{PROFILE.learning.title}</Eyebrow>
        <p className="text-[12.5px] leading-relaxed text-mist">{PROFILE.learning.body}</p>
      </div>
    </div>
  );
}
