/**
 * Social cards, one per star.
 *
 * A shared drawing so every section and every project gets its own card without
 * nine copies of the same layout, and so the cards stay in sync with the copy
 * they advertise. Plain gradients and circles only: the OG renderer supports a
 * deliberately small subset of CSS.
 */

import { ImageResponse } from "next/og";

import { PROFILE } from "@/lib/content/profile";
import { getStar } from "@/lib/graph/nodes";
import { StarDepth, StarId } from "@/lib/graph/types";
import { starPageCopy } from "./pages";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

/** A handful of decorative stars, positioned by hand for balance. */
const STARS: readonly { x: number; y: number; r: number; o: number }[] = [
  { x: 880, y: 140, r: 5, o: 0.9 },
  { x: 1020, y: 250, r: 3, o: 0.7 },
  { x: 760, y: 330, r: 4, o: 0.6 },
  { x: 960, y: 430, r: 7, o: 1 },
  { x: 1090, y: 520, r: 3, o: 0.5 },
  { x: 840, y: 500, r: 3, o: 0.45 },
  { x: 1120, y: 120, r: 4, o: 0.55 },
];

/** Cards have room for roughly two lines of body, so long summaries get cut. */
function trim(text: string, limit = 150): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  return `${cut.slice(0, cut.lastIndexOf(" "))}...`;
}

export interface OgCardCopy {
  /** Small line above the title, e.g. the star this card belongs to. */
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly body: string;
}

/** The card for a star, derived from its page copy. */
export function starCardCopy(id: StarId): OgCardCopy {
  const star = getStar(id);
  const copy = starPageCopy(id);

  if (id === StarId.Sirius) {
    return {
      eyebrow: "ELPIDEUS.COM",
      title: PROFILE.name,
      subtitle: PROFILE.role,
      body: "A scroll driven star map of projects, tools and story. Ostuni, Italy.",
    };
  }

  return {
    eyebrow: `ELPIDEUS.COM · ${star.star.toUpperCase()}`,
    title: star.depth === StarDepth.Satellite ? copy.heading : star.section,
    subtitle: star.depth === StarDepth.Satellite ? "Project" : PROFILE.name,
    body: trim(copy.summary),
  };
}

export function renderOgCard(copy: OgCardCopy): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background:
            "radial-gradient(1000px 620px at 78% 46%, #2a1a4a 0%, #0a0d1c 55%, #03040a 100%)",
          color: "#e9f1ff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {STARS.map((star) => (
          <div
            key={`${star.x}-${star.y}`}
            style={{
              position: "absolute",
              left: star.x,
              top: star.y,
              width: star.r * 2,
              height: star.r * 2,
              borderRadius: 999,
              background: "#dff0ff",
              opacity: star.o,
              boxShadow: "0 0 22px #7fd7ff",
            }}
          />
        ))}

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#7fd7ff",
              boxShadow: "0 0 18px #7fd7ff",
            }}
          />
          <div style={{ fontSize: 22, letterSpacing: 8, color: "#93a4c4" }}>{copy.eyebrow}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 700 }}>
          <div style={{ fontSize: 68, lineHeight: 1.05, letterSpacing: -1 }}>{copy.title}</div>
          <div style={{ fontSize: 26, color: "#7fd7ff", letterSpacing: 2 }}>{copy.subtitle}</div>
          <div style={{ fontSize: 24, color: "#93a4c4", lineHeight: 1.4 }}>{copy.body}</div>
        </div>

        <div style={{ display: "flex", gap: 28, fontSize: 20, color: "#62718f" }}>
          <div>Full stack</div>
          <div>·</div>
          <div>Design</div>
          <div>·</div>
          <div>Video</div>
          <div>·</div>
          <div>Open source</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}

/** Card for a star, ready to be returned from an `opengraph-image` route. */
export function starCard(id: StarId): ImageResponse {
  return renderOgCard(starCardCopy(id));
}
