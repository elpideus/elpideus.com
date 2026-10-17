/**
 * The now playing card, drawn as a standalone SVG for the GitHub profile.
 *
 * It lives on GitHub rather than on the site, so the usual rules bend: there is
 * a light palette because GitHub has light themes, and nothing may load from
 * elsewhere because GitHub serves the card through an `<img>` tag. Motion is
 * CSS only (the one thing an image can still do) and stops for visitors who
 * prefer reduced motion.
 *
 * Long titles fade out at the right edge instead of being cut at a character
 * count, because the font that renders them depends on the viewer's machine.
 */

import { ListeningState, type Listening } from "./lastfm";

export enum CardTheme {
  Dark = "dark",
  Light = "light",
  /** Follows the viewer's colour scheme, dark first like the site. */
  Auto = "auto",
}

export function parseTheme(value: string | null): CardTheme {
  return Object.values(CardTheme).find((theme) => theme === value) ?? CardTheme.Auto;
}

export interface CardInput {
  readonly listening: Listening;
  /** Cover as a data URI, or null for the drawn placeholder. */
  readonly artwork: string | null;
  readonly theme: CardTheme;
  readonly now: Date;
}

const WIDTH = 540;
const HEIGHT = 136;
const COVER = { x: 20, y: 20, size: 96 } as const;
/**
 * The record sits behind the cover and slides out while something plays, far
 * enough that its label shows: grooves are concentric, so the label is the only
 * thing that makes the spin visible.
 */
const DISC = { x: 128, y: 68, radius: 44, label: 17, parked: -28 } as const;
const TEXT_X = 192;
const RIGHT = WIDTH - 24;

/** Palette roles map onto the site tokens in `globals.css`. */
const PALETTES = {
  [CardTheme.Dark]: {
    frame: "rgba(233,241,255,.025)",
    line: "rgba(233,241,255,.1)",
    title: "#e9f1ff",
    artist: "#93a4c4",
    quiet: "#6c7a96",
    accent: "#8fe6d8",
    star: "#e9f1ff",
    edge: "rgba(233,241,255,.1)",
    lift: ".55",
    aura: ".14",
    "cover-a": "#0d1322",
    "cover-b": "#1c2a48",
    "cover-ink": "#7fd7ff",
  },
  [CardTheme.Light]: {
    frame: "rgba(13,19,34,.02)",
    line: "rgba(13,19,34,.12)",
    title: "#0d1322",
    artist: "#45526b",
    quiet: "#66738c",
    accent: "#0b7a6c",
    star: "#2f7fb8",
    edge: "rgba(13,19,34,.1)",
    lift: ".22",
    aura: ".1",
    "cover-a": "#e6eefb",
    "cover-b": "#c9d8f2",
    "cover-ink": "#2f7fb8",
  },
} as const;

const DISPLAY_FONT =
  `"Space Grotesk", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif`;
const MONO_FONT = `"JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`;

const SPOTIFY_GLYPH =
  "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z";

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Scrobble text is third party input: escape it and drop what XML forbids. */
function escape(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .slice(0, 160)
    .replace(/[&<>"']/g, (char) => ENTITIES[char]);
}

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
] as const;

function timeAgo(then: Date, now: Date): string {
  const seconds = (now.getTime() - then.getTime()) / 1000;
  for (const [unit, size] of UNITS) {
    if (seconds >= size) return RELATIVE.format(-Math.floor(seconds / size), unit);
  }
  return "just now";
}

/** Same song, same sky: the stars are seeded from the track. */
function seededRandom(seedText: string): () => number {
  let seed = 2166136261;
  for (const char of seedText) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

function stars(seedText: string): string {
  const random = seededRandom(seedText);
  return Array.from({ length: 18 }, () => {
    const x = round(TEXT_X - 10 + random() * (WIDTH - TEXT_X));
    const y = round(10 + random() * (HEIGHT - 20));
    const radius = round(0.4 + random() * 0.8);
    const opacity = (0.12 + random() * 0.33).toFixed(2);
    const twinkle = random() > 0.55
      ? ` class="twinkle" style="animation-duration:${round(2.5 + random() * 3)}s;animation-delay:-${round(random() * 4)}s"`
      : "";
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill-opacity="${opacity}"${twinkle}/>`;
  }).join("");
}

function palette(theme: CardTheme): string {
  const declare = (values: Record<string, string>) =>
    `:root{${Object.entries(values).map(([key, value]) => `--${key}:${value}`).join(";")}}`;
  if (theme !== CardTheme.Auto) return declare(PALETTES[theme]);
  return `${declare(PALETTES[CardTheme.Dark])}@media (prefers-color-scheme:light){${declare(PALETTES[CardTheme.Light])}}`;
}

function styles(theme: CardTheme): string {
  return `${palette(theme)}
.frame{fill:var(--frame);stroke:var(--line)}
.stars{fill:var(--star)}
.aura stop{stop-color:var(--accent)}
.aura .core{stop-opacity:var(--aura)}
.lift{flood-color:#000;flood-opacity:var(--lift)}
.edge{fill:none;stroke:var(--edge)}
.cover-a{stop-color:var(--cover-a)}
.cover-b{stop-color:var(--cover-b)}
.cover-ink{fill:var(--cover-ink)}
.label{font:600 10.5px ${MONO_FONT};letter-spacing:.14em;fill:var(--quiet)}
.title{font:600 20px ${DISPLAY_FONT};fill:var(--title)}
.artist{font:400 14px ${DISPLAY_FONT};fill:var(--artist)}
.album{font:400 12px ${DISPLAY_FONT};fill:var(--quiet)}
.mark,.bars{fill:var(--quiet)}
.live .label,.live .mark,.live .bars{fill:var(--accent)}
.live .vinyl{animation:slide 1.4s cubic-bezier(.16,1,.3,1) both}
.live .disc{transform-origin:0 0;animation:spin 2.4s linear infinite}
.live .bars rect{transform-box:fill-box;transform-origin:50% 100%;animation:bar .9s ease-in-out infinite}
.live .bars rect:nth-child(2){animation-duration:.7s;animation-delay:-.4s}
.live .bars rect:nth-child(3){animation-duration:1.1s;animation-delay:-.2s}
.live .bars rect:nth-child(4){animation-duration:.8s;animation-delay:-.55s}
.twinkle{animation:twinkle 4s ease-in-out infinite}
@keyframes slide{from{transform:translateX(${DISC.parked * 2}px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes bar{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
@keyframes twinkle{50%{opacity:.2}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;
}

/** Four bars: dancing while live, resting at uneven heights otherwise. */
function bars(live: boolean): string {
  const heights = live ? [12, 12, 12, 12] : [3, 6, 4.5, 2.5];
  return heights
    .map((height, index) => {
      const x = round(TEXT_X + index * 5.5);
      return `<rect x="${x}" y="${round(40 - height)}" width="3" height="${height}" rx="1"/>`;
    })
    .join("");
}

function coverPlaceholder(): string {
  const { x, y, size } = COVER;
  const center = `translate(${x + size / 2} ${y + size / 2})`;
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="url(#cover-fill)"/>
<g class="cover-ink" transform="${center}">
<ellipse cx="-9" cy="11" rx="6.5" ry="4.8" transform="rotate(-20 -9 11)"/>
<ellipse cx="12" cy="6" rx="6.5" ry="4.8" transform="rotate(-20 12 6)"/>
<rect x="-4" y="-15" width="2.6" height="26"/><rect x="17" y="-20" width="2.6" height="26"/>
<path d="M-4 -15 L19.6 -20 V-14 L-4 -9 Z"/></g>`;
}

function disc(artwork: string | null): string {
  const scale = (DISC.label * 2) / COVER.size;
  const label = artwork
    ? `<g clip-path="url(#label)"><use href="#art" transform="translate(${-DISC.label} ${-DISC.label}) scale(${scale.toFixed(4)})"/></g>`
    : `<circle r="${DISC.label}" class="cover-ink" fill-opacity=".85"/>`;
  const grooves = [40.5, 37, 33.5, 30, 26.5, 23]
    .map((radius) => `<circle r="${radius}"/>`)
    .join("");
  return `<g class="disc">
<circle r="${DISC.radius}" fill="#05070c"/>
<g fill="none" stroke="#e9f1ff" stroke-opacity=".07" stroke-width=".6">${grooves}</g>
${label}
<circle r="${DISC.label}" fill="none" stroke="#000" stroke-opacity=".35"/>
<circle r="1.6" fill="#c9d4e6"/></g>
<circle r="${DISC.radius}" fill="url(#sheen)"/>`;
}

interface Copy {
  readonly label: string;
  readonly title: string;
  readonly artist: string;
  readonly album: string;
  readonly summary: string;
}

function copyFor(listening: Listening, now: Date): Copy {
  switch (listening.state) {
    case ListeningState.Playing:
      return {
        label: "NOW PLAYING",
        ...listening.track,
        summary: `Now playing on Spotify: ${listening.track.title} by ${listening.track.artist}`,
      };
    case ListeningState.Recent: {
      const { track } = listening;
      const age = track.playedAt ? ` · ${timeAgo(track.playedAt, now).toUpperCase()}` : "";
      return {
        label: `LAST PLAYED${age}`,
        ...track,
        summary: `Last played on Spotify: ${track.title} by ${track.artist}`,
      };
    }
    case ListeningState.Silent:
      return {
        label: "OFF AIR",
        title: "Not listening right now",
        artist: "Spotify, by way of Last.fm",
        album: "",
        summary: "Not listening to anything on Spotify right now",
      };
  }
}

export function renderCard({ listening, artwork, theme, now }: CardInput): string {
  const live = listening.state === ListeningState.Playing;
  const copy = copyFor(listening, now);
  const { x, y, size } = COVER;
  const discOffset = live ? 0 : DISC.parked;

  const cover = artwork
    ? `<g clip-path="url(#cover)"><use href="#art" x="${x}" y="${y}"/></g>`
    : `<g clip-path="url(#cover)">${coverPlaceholder()}</g>`;
  const aura = live
    ? `<ellipse cx="${DISC.x}" cy="${DISC.y}" rx="150" ry="96" fill="url(#aura)"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="summary">
<title id="summary">${escape(copy.summary)}</title>
<defs>
<style>${styles(theme)}</style>
${artwork ? `<image id="art" href="${artwork}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice"/>` : ""}
<clipPath id="card"><rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="14"/></clipPath>
<clipPath id="cover"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="8"/></clipPath>
<clipPath id="label"><circle r="${DISC.label}"/></clipPath>
<radialGradient id="aura" class="aura"><stop offset="0" class="core"/><stop offset="1" stop-opacity="0"/></radialGradient>
<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".09"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="cover-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="cover-a"/><stop offset="1" class="cover-b"/></linearGradient>
<linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="${RIGHT - 40}" y1="0" x2="${RIGHT}" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<mask id="overflow" maskUnits="userSpaceOnUse" x="0" y="0" width="${WIDTH}" height="${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" fill="url(#fade)"/></mask>
<filter id="lift" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow class="lift" dx="0" dy="5" stdDeviation="7"/></filter>
</defs>
<g class="${live ? "live" : "idle"}">
<rect class="frame" x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="14"/>
<g clip-path="url(#card)">${aura}<g class="stars">${stars(`${copy.title}|${copy.artist}`)}</g></g>
<g class="vinyl"><g transform="translate(${DISC.x + discOffset} ${DISC.y})">${disc(artwork)}</g></g>
<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="8" filter="url(#lift)"/>
${cover}
<rect class="edge" x="${x + 0.5}" y="${y + 0.5}" width="${size - 1}" height="${size - 1}" rx="7.5"/>
<g class="bars">${bars(live)}</g>
<text class="label" x="${TEXT_X + 28}" y="40">${escape(copy.label)}</text>
<path class="mark" transform="translate(${RIGHT - 16} 28) scale(.6667)" d="${SPOTIFY_GLYPH}"/>
<g mask="url(#overflow)">
<text class="title" x="${TEXT_X}" y="72">${escape(copy.title)}</text>
<text class="artist" x="${TEXT_X}" y="96">${escape(copy.artist)}</text>
${copy.album ? `<text class="album" x="${TEXT_X}" y="116">${escape(copy.album)}</text>` : ""}
</g>
</g>
</svg>`;
}
