/**
 * Album artwork, inlined as a data URI.
 *
 * The card is an SVG that GitHub shows through an `<img>` tag, and an image
 * loaded that way may not fetch anything else. The cover therefore travels
 * inside the SVG. Last.fm is the first source; Deezer's keyless search fills in
 * when a scrobble only has Last.fm's placeholder.
 *
 * Covers never change for a given URL, so every fetch here is cached for a day.
 */

import type { Track } from "./lastfm";

const TIMEOUT_MS = 3000;
const ONE_DAY = 86_400;
/** A 300px cover is around 30 KB; anything far beyond that is not a cover. */
const MAX_BYTES = 400_000;

interface DeezerSearch {
  data?: { album?: { cover_medium?: string } }[];
}

async function findOnDeezer(track: Track): Promise<string | null> {
  // Plain text, not Deezer's `artist:"" track:""` syntax: that one misses
  // whenever the credits are spelled differently, which soundtracks often are.
  const query = `${track.title} ${track.artist}`;
  const response = await fetch(
    `https://api.deezer.com/search?limit=1&q=${encodeURIComponent(query)}`,
    { next: { revalidate: ONE_DAY }, signal: AbortSignal.timeout(TIMEOUT_MS) },
  );
  if (!response.ok) return null;
  const payload = (await response.json()) as DeezerSearch;
  return payload.data?.[0]?.album?.cover_medium ?? null;
}

async function inline(url: string): Promise<string | null> {
  const response = await fetch(url, {
    next: { revalidate: ONE_DAY },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const type = response.headers.get("content-type") ?? "";
  if (!response.ok || !type.startsWith("image/")) return null;

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > MAX_BYTES) return null;
  return `data:${type};base64,${bytes.toString("base64")}`;
}

/** The cover as a data URI, or null so the card draws its own placeholder. */
export async function resolveArtwork(track: Track): Promise<string | null> {
  try {
    const url = track.artworkUrl ?? (await findOnDeezer(track));
    return url ? await inline(url) : null;
  } catch (error) {
    console.error("[now-playing] drawing the placeholder cover:", error);
    return null;
  }
}
