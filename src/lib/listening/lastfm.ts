/**
 * What is playing right now, read from Last.fm.
 *
 * Spotify's own Web API only serves Development Mode apps whose owner pays for
 * Premium (February 2026), so Spotify scrobbles to Last.fm and this module reads
 * the scrobbles instead. Last.fm reports the track and whether it is playing,
 * but not the playback position, which is why the card animates without a
 * progress bar.
 *
 * Every failure collapses to the silent state with a console message: the card
 * is decoration on someone else's page and must never render an error.
 */

const ENDPOINT = "https://ws.audioscrobbler.com/2.0/";

/** Last.fm answers in well under a second; anything slower is an outage. */
const TIMEOUT_MS = 4000;

/** Last.fm's grey star, served when a scrobble has no artwork of its own. */
const PLACEHOLDER_ARTWORK = "2a96cbd8b46e442fc41c2b86b821562f";

export enum ListeningState {
  /** Last.fm flags the latest scrobble as now playing. */
  Playing = "playing",
  /** Nothing is playing; the latest scrobble is shown with its age. */
  Recent = "recent",
  /** No credentials, no history or Last.fm is down. */
  Silent = "silent",
}

export interface Track {
  readonly title: string;
  readonly artist: string;
  readonly album: string;
  /** Remote artwork URL, or null when Last.fm only has its placeholder. */
  readonly artworkUrl: string | null;
  /** When the scrobble landed. Null while the track is still playing. */
  readonly playedAt: Date | null;
}

export type Listening =
  | { readonly state: ListeningState.Playing; readonly track: Track }
  | { readonly state: ListeningState.Recent; readonly track: Track }
  | { readonly state: ListeningState.Silent; readonly track: null };

export const SILENT: Listening = { state: ListeningState.Silent, track: null };

interface LastFmText {
  "#text"?: string;
}

interface LastFmImage extends LastFmText {
  size?: string;
}

interface LastFmTrack {
  name?: string;
  artist?: LastFmText;
  album?: LastFmText;
  image?: LastFmImage[];
  date?: { uts?: string };
  "@attr"?: { nowplaying?: string };
}

interface LastFmResponse {
  error?: number;
  message?: string;
  recenttracks?: {
    /** A single scrobble arrives as an object rather than a one item array. */
    track?: LastFmTrack | LastFmTrack[];
  };
}

/** Largest real artwork on offer, skipping the placeholder star. */
function pickArtwork(images: LastFmImage[] | undefined): string | null {
  const url = images?.filter((image) => image["#text"]).at(-1)?.["#text"];
  if (!url || url.includes(PLACEHOLDER_ARTWORK)) return null;
  return url;
}

function toListening(raw: LastFmTrack | undefined): Listening {
  const title = raw?.name?.trim();
  const artist = raw?.artist?.["#text"]?.trim();
  if (!raw || !title || !artist) return SILENT;

  const playing = raw["@attr"]?.nowplaying === "true";
  const seconds = Number(raw.date?.uts);
  const track: Track = {
    title,
    artist,
    album: raw.album?.["#text"]?.trim() ?? "",
    artworkUrl: pickArtwork(raw.image),
    playedAt: !playing && Number.isFinite(seconds) ? new Date(seconds * 1000) : null,
  };

  return playing
    ? { state: ListeningState.Playing, track }
    : { state: ListeningState.Recent, track };
}

export async function fetchListening(): Promise<Listening> {
  const apiKey = process.env.LASTFM_API_KEY;
  const username = process.env.LASTFM_USERNAME;

  // Not an error: a local checkout without credentials is a normal state.
  if (!apiKey || !username) return SILENT;

  const query = new URLSearchParams({
    method: "user.getrecenttracks",
    user: username,
    api_key: apiKey,
    format: "json",
    limit: "1",
  });

  try {
    const response = await fetch(`${ENDPOINT}?${query}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const payload = (await response.json()) as LastFmResponse;
    if (payload.error) throw new Error(`last.fm error ${payload.error}: ${payload.message}`);
    if (!response.ok) throw new Error(`last.fm responded ${response.status}`);

    const tracks = payload.recenttracks?.track;
    return toListening(Array.isArray(tracks) ? tracks[0] : tracks);
  } catch (error) {
    console.error("[now-playing] serving the silent card:", error);
    return SILENT;
  }
}
