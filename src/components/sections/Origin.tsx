"use client";

/** Sirius: the landing panel. Identity first, everything else later. */

import { ActionButton, ActionLink, ActionTone, Eyebrow, Hairline, Prose } from "@/components/ui/primitives";
import { DownloadIcon, SendIcon } from "@/components/ui/Icon";
import { PROFILE, ageAt, yearsCoding } from "@/lib/content/profile";
import { SocialRow } from "@/components/ui/SocialLinks";
import { StarId } from "@/lib/graph/types";
import { TravelIntent, useJourney } from "@/lib/state/journey";

/** Default legend, written for a mouse. The handheld deck passes its own. */
const POINTER_HINT = "Scroll to travel · drag to look around · click any star";

export function OriginSection({ hint = POINTER_HINT }: { hint?: string }) {
  const age = ageAt();
  const years = yearsCoding();
  const focusStar = useJourney((state) => state.focusStar);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Eyebrow>{PROFILE.location}</Eyebrow>
        <h1 className="font-display text-[34px] leading-[1.05] tracking-tight text-frost">
          {PROFILE.name}
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal">
          {PROFILE.role}
        </p>
      </div>

      <Hairline />

      <Prose>
        <p>{PROFILE.lede}</p>
        <p>
          {age} years old, {years} of them spent writing code. Based in Ostuni, the white city of
          Puglia, and working remotely with people anywhere.
        </p>
      </Prose>

      <div className="flex flex-wrap gap-2">
        <ActionLink href="/api/cv" tone={ActionTone.Primary} external={false} download>
          <DownloadIcon size={13} />
          Curriculum
        </ActionLink>
        <ActionButton onClick={() => focusStar(StarId.Canopus, TravelIntent.Pointer)}>
          <SendIcon size={13} />
          Contact
        </ActionButton>
      </div>

      <div>
        <Eyebrow className="mb-2">Elsewhere</Eyebrow>
        <SocialRow />
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">{hint}</p>
    </div>
  );
}
