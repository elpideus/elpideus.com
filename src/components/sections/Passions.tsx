"use client";

/** Aldebaran: the things that keep the rest of it fuelled. */

import { Eyebrow, Tag, interactiveCursorProps } from "@/components/ui/primitives";
import { ExternalIcon, PassionGlyph } from "@/components/ui/Icon";
import { PASSIONS } from "@/lib/content/passions";

export function PassionsSection() {
  return (
    <div className="space-y-5">
      {PASSIONS.map((passion) => (
        <section key={passion.kind} className="space-y-2">
          <header className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[3px] border border-ember/30 text-ember">
              <PassionGlyph kind={passion.kind} size={15} />
            </span>
            <p className="font-display text-[13px] tracking-tight text-frost">{passion.title}</p>
          </header>

          <div className="space-y-2 pl-9">
            {passion.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-[12.5px] leading-relaxed text-mist">
                {paragraph}
              </p>
            ))}

            <div className="flex flex-wrap items-center gap-1.5">
              {passion.notes.map((note) => (
                <Tag key={note}>{note}</Tag>
              ))}
              {passion.href ? (
                <a
                  href={passion.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-dim transition-colors hover:text-signal"
                  {...interactiveCursorProps}
                >
                  {passion.hrefLabel ?? "Visit"}
                  <ExternalIcon size={11} />
                </a>
              ) : null}
            </div>
          </div>
        </section>
      ))}

      <Eyebrow>There is more, but this is the part that shapes the work.</Eyebrow>
    </div>
  );
}
