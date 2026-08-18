"use client";

/**
 * The row of social links.
 *
 * Shared by the origin star and the contact star: the same links, the same
 * labels, one definition. Everything comes from `content/links.ts`.
 */

import clsx from "clsx";

import { SocialGlyph } from "./Icon";
import { interactiveCursorProps } from "./primitives";
import { SOCIALS } from "@/lib/content/links";

export function SocialRow({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <div className={clsx("flex flex-wrap gap-1.5", className)}>
      {SOCIALS.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target={social.href.startsWith("mailto:") ? undefined : "_blank"}
          rel="noreferrer noopener"
          title={`${social.label} · ${social.handle}`}
          aria-label={`${social.label}: ${social.handle}`}
          className="flex items-center justify-center rounded-full border border-signal/20 text-mist transition-colors hover:border-signal/60 hover:text-signal"
          style={{ width: size, height: size }}
          {...interactiveCursorProps}
        >
          <SocialGlyph icon={social.icon} size={Math.round(size * 0.44)} />
        </a>
      ))}
    </div>
  );
}
