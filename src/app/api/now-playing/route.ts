/**
 * Now playing card for the GitHub profile README.
 *
 * `GET /api/now-playing?theme=dark|light|auto` answers with the SVG card.
 * `GET /api/now-playing?open` redirects to the current track on Spotify, so the
 * card can link somewhere useful without knowing the song in advance.
 *
 * GitHub proxies README images through its own cache (Camo), which honours
 * `cache-control`. The browser and Camo are told never to keep a copy, so a
 * reload always shows the current track; Vercel's edge keeps one for a few
 * seconds so a burst of profile views costs a single Last.fm call.
 */

import type { NextRequest } from "next/server";

import { SITE } from "@/lib/content/links";
import { resolveArtwork } from "@/lib/listening/artwork";
import { parseTheme, renderCard } from "@/lib/listening/card";
import { fetchListening } from "@/lib/listening/lastfm";

export const runtime = "nodejs";
/** Always render per request; the artwork fetches still opt into caching. */
export const revalidate = 0;

const NO_STORE = "no-cache, no-store, must-revalidate, max-age=0";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const listening = await fetchListening();

  if (params.has("open")) {
    const target = listening.track
      ? `https://open.spotify.com/search/${encodeURIComponent(`${listening.track.title} ${listening.track.artist}`)}`
      : SITE.url;
    return new Response(null, {
      status: 307,
      headers: { location: target, "cache-control": NO_STORE },
    });
  }

  const artwork = listening.track ? await resolveArtwork(listening.track) : null;
  const svg = renderCard({
    listening,
    artwork,
    theme: parseTheme(params.get("theme")),
    now: new Date(),
  });

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": NO_STORE,
      "vercel-cdn-cache-control": "max-age=10",
      "x-content-type-options": "nosniff",
    },
  });
}
