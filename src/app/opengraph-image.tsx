import { ImageResponse } from "next/og";

import { PROFILE } from "@/lib/content/profile";
import { SITE } from "@/lib/content/links";

/**
 * Social card.
 *
 * Generated rather than designed in an editor so it stays in sync with the
 * profile content, and drawn with plain gradients and circles because the OG
 * renderer supports a deliberately small subset of CSS.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = SITE.title;

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

export default function OpengraphImage() {
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
          <div style={{ fontSize: 22, letterSpacing: 8, color: "#93a4c4" }}>ELPIDEUS.COM</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 700 }}>
          <div style={{ fontSize: 68, lineHeight: 1.05, letterSpacing: -1 }}>{PROFILE.name}</div>
          <div style={{ fontSize: 26, color: "#7fd7ff", letterSpacing: 2 }}>{PROFILE.role}</div>
          <div style={{ fontSize: 24, color: "#93a4c4", lineHeight: 1.4 }}>
            A scroll driven star map of projects, tools and story. Ostuni, Italy.
          </div>
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
    size,
  );
}
