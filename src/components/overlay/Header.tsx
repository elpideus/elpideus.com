"use client";

/** Fixed chrome: wordmark on the left, permanent actions on the right. */

import { ActionLink, ActionTone, interactiveCursorProps } from "@/components/ui/primitives";
import { DownloadIcon, SocialGlyph } from "@/components/ui/Icon";
import { Mark } from "@/components/ui/Mark";
import { LinkIcon, SOCIALS } from "@/lib/content/links";
import { JOURNEY } from "@/lib/graph/nodes";
import { TravelIntent, useJourney } from "@/lib/state/journey";

/** Socials worth surfacing permanently rather than only on the contact star. */
const PINNED: readonly LinkIcon[] = [LinkIcon.GitHub, LinkIcon.YouTube, LinkIcon.LinkedIn];

export function Header() {
  const goToIndex = useJourney((state) => state.goToIndex);
  const focus = useJourney((state) => state.focus);
  const atOrigin = focus === JOURNEY[0];

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between px-6 py-5">
      <button
        type="button"
        onClick={() => goToIndex(0, TravelIntent.Pointer, 0.2)}
        className="pointer-events-auto flex items-baseline gap-2.5 text-left"
        aria-label="Return to Sirius, the origin star"
        {...interactiveCursorProps}
      >
        <Mark size={13} className="relative top-[3px] shrink-0 text-frost" />
        <span className="font-display text-[15px] tracking-[0.06em] text-frost">elpideus</span>
        <span
          className="h-1 w-1 rounded-full bg-signal transition-opacity duration-500"
          style={{ opacity: atOrigin ? 1 : 0.35 }}
        />
        <span className="u-eyebrow relative top-[2px] hidden sm:block">Stefan Narcis Cucoranu</span>
      </button>

      <div className="pointer-events-auto flex items-center gap-2">
        {SOCIALS.filter((social) => PINNED.includes(social.icon)).map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={social.label}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-signal/15 text-mist transition-colors hover:border-signal/50 hover:text-signal"
            {...interactiveCursorProps}
          >
            <SocialGlyph icon={social.icon} size={15} />
          </a>
        ))}

        <ActionLink href="/api/cv" tone={ActionTone.Primary} external={false} download>
          <DownloadIcon size={13} />
          CV
        </ActionLink>
      </div>
    </header>
  );
}
