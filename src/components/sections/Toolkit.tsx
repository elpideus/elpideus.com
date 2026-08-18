"use client";

/** Antares: the stack, grouped by what each part is for. */

import { Eyebrow, Tag } from "@/components/ui/primitives";
import { KitGlyph } from "@/components/ui/Icon";
import { KIT } from "@/lib/content/kit";

export function ToolkitSection() {
  return (
    <div className="space-y-4">
      {KIT.map((section) => (
        <section key={section.group} className="space-y-2">
          <header className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[3px] border border-signal/25 text-signal">
              <KitGlyph group={section.group} size={15} />
            </span>
            <div>
              <p className="font-display text-[13px] tracking-tight text-frost">{section.group}</p>
              <Eyebrow>{section.note}</Eyebrow>
            </div>
          </header>

          <div className="flex flex-wrap gap-1.5 pl-9">
            {section.items.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
