/**
 * The map itself: every star, where it sits and how the stars connect.
 *
 * Positions are hand authored rather than generated so the constellation reads
 * well from the default camera path. Keep the primary stars roughly on a
 * forward drift along -Z with lateral variation; the camera rig assumes the
 * journey moves away from the origin.
 */

import {
  LinkKind,
  PanelKind,
  StarClass,
  StarDepth,
  StarId,
  type StarLink,
  type StarNode,
} from "./types";

/** Order the scroll journey walks. Depth one only, by design. */
export const JOURNEY: readonly StarId[] = [
  StarId.Sirius,
  StarId.Vega,
  StarId.Polaris,
  StarId.Betelgeuse,
  StarId.Rigel,
  StarId.Antares,
  StarId.Aldebaran,
  StarId.Proxima,
  StarId.Canopus,
] as const;

export const STARS: readonly StarNode[] = [
  {
    id: StarId.Sirius,
    star: "Sirius",
    section: "Origin",
    tagline: "Who is speaking, and from where.",
    depth: StarDepth.Primary,
    kind: StarClass.Anchor,
    panel: PanelKind.Origin,
    position: [0, 0, 0],
    radius: 1.5,
    color: "#d8ecff",
  },
  {
    id: StarId.Vega,
    star: "Vega",
    section: "About",
    tagline: "The person behind the code, and how he thinks.",
    depth: StarDepth.Primary,
    kind: StarClass.Sequence,
    panel: PanelKind.About,
    position: [14, 5, -26],
    radius: 1.15,
    color: "#bcd4ff",
  },
  {
    id: StarId.Polaris,
    star: "Polaris",
    section: "Trajectory",
    tagline: "Ten years of learning, one year at a time.",
    depth: StarDepth.Primary,
    kind: StarClass.Sequence,
    panel: PanelKind.Journey,
    position: [-11, -4, -52],
    radius: 1.2,
    color: "#dbe8ff",
  },
  {
    id: StarId.Betelgeuse,
    star: "Betelgeuse",
    section: "Projects",
    tagline: "Shipped work, live repositories and clients.",
    depth: StarDepth.Primary,
    kind: StarClass.Sequence,
    panel: PanelKind.Projects,
    position: [6, 9, -80],
    radius: 1.35,
    color: "#ff9b6a",
  },
  {
    id: StarId.Rigel,
    star: "Rigel",
    section: "Studio",
    tagline: "Video, editing and the elpideus channel.",
    depth: StarDepth.Primary,
    kind: StarClass.Sequence,
    panel: PanelKind.Studio,
    position: [23, -7, -112],
    radius: 1.2,
    color: "#a8c6ff",
  },
  {
    id: StarId.Antares,
    star: "Antares",
    section: "Toolkit",
    tagline: "Languages, runtimes, data and shipping.",
    depth: StarDepth.Primary,
    kind: StarClass.Sequence,
    panel: PanelKind.Toolkit,
    position: [-7, -12, -140],
    radius: 1.2,
    color: "#ff7a5c",
  },
  {
    id: StarId.Aldebaran,
    star: "Aldebaran",
    section: "Passions",
    tagline: "Music, games, writing and the things that fuel the rest.",
    depth: StarDepth.Primary,
    kind: StarClass.Sequence,
    panel: PanelKind.Passions,
    position: [-21, 4, -168],
    radius: 1.15,
    color: "#ffb27a",
  },
  {
    id: StarId.Proxima,
    star: "Proxima Centauri",
    section: "Journal",
    tagline: "A writing space that has not been lit yet.",
    depth: StarDepth.Primary,
    kind: StarClass.Dormant,
    panel: PanelKind.Blog,
    position: [2, 14, -194],
    radius: 0.85,
    color: "#b8737f",
  },
  {
    id: StarId.Canopus,
    star: "Canopus",
    section: "Contact",
    tagline: "Say hello. Messages are read and answered.",
    depth: StarDepth.Primary,
    kind: StarClass.Beacon,
    panel: PanelKind.Contact,
    position: [16, -2, -222],
    radius: 1.4,
    color: "#fff1d4",
  },

  // Satellites of Betelgeuse: one star per project.
  {
    id: StarId.Alnitak,
    star: "Alnitak",
    section: "Demido Studio",
    tagline: "An agentic LLM harness that codes, plans and researches.",
    depth: StarDepth.Satellite,
    kind: StarClass.Satellite,
    panel: PanelKind.Project,
    position: [14.5, 12.1, -77],
    radius: 0.62,
    color: "#8fe6d8",
    parent: StarId.Betelgeuse,
    ref: "demido-studio",
  },
  {
    id: StarId.Alnilam,
    star: "Alnilam",
    section: "Agrisense",
    tagline: "IoT platform for agriculture, currently under NDA.",
    depth: StarDepth.Satellite,
    kind: StarClass.Satellite,
    panel: PanelKind.Project,
    position: [7.6, 17.9, -84],
    radius: 0.58,
    color: "#9fe0a8",
    parent: StarId.Betelgeuse,
    ref: "agrisense",
  },
  {
    id: StarId.Mintaka,
    star: "Mintaka",
    section: "LiSpizzicusi.it",
    tagline: "WordPress theme and plugin for a Puglian folk group.",
    depth: StarDepth.Satellite,
    kind: StarClass.Satellite,
    panel: PanelKind.Project,
    position: [-0.9, 14.8, -76],
    radius: 0.58,
    color: "#ffc98f",
    parent: StarId.Betelgeuse,
    ref: "lispizzicusi",
  },
  {
    id: StarId.Deneb,
    star: "Deneb",
    section: "TeleVault",
    tagline: "Telegram infrastructure turned into a personal cloud vault.",
    depth: StarDepth.Satellite,
    kind: StarClass.Satellite,
    panel: PanelKind.Project,
    position: [-2.5, 5.9, -85],
    radius: 0.6,
    color: "#8fc9ff",
    parent: StarId.Betelgeuse,
    ref: "televault",
  },
  {
    id: StarId.Spica,
    star: "Spica",
    section: "PeakPlay",
    tagline: "The global top one hundred songs, refreshed daily.",
    depth: StarDepth.Satellite,
    kind: StarClass.Satellite,
    panel: PanelKind.Project,
    position: [4.4, 0.1, -75],
    radius: 0.58,
    color: "#c8a6ff",
    parent: StarId.Betelgeuse,
    ref: "peakplay",
  },
  {
    id: StarId.Arcturus,
    star: "Arcturus",
    section: "Breakout Schematics",
    tagline: "A TradingView indicator built on independent state machines.",
    depth: StarDepth.Satellite,
    kind: StarClass.Satellite,
    panel: PanelKind.Project,
    position: [12.9, 3.2, -84],
    radius: 0.58,
    color: "#ffd88f",
    parent: StarId.Betelgeuse,
    ref: "breakout-schematics",
  },
] as const;

/** Fast lookup by id. */
export const STAR_BY_ID: ReadonlyMap<StarId, StarNode> = new Map(
  STARS.map((star) => [star.id, star]),
);

export function getStar(id: StarId): StarNode {
  const star = STAR_BY_ID.get(id);
  if (!star) throw new Error(`Unknown star: ${id}`);
  return star;
}

/** Satellites of a given parent, in declaration order. */
export function satellitesOf(parent: StarId): readonly StarNode[] {
  return STARS.filter((star) => star.parent === parent);
}

/**
 * Edges of the constellation. The spine follows the journey order, branches
 * connect satellites to their parent and whispers add a few faint cross links
 * so the map reads as a web rather than a chain.
 */
export const LINKS: readonly StarLink[] = [
  ...JOURNEY.slice(0, -1).map((from, index) => ({
    from,
    to: JOURNEY[index + 1],
    kind: LinkKind.Spine,
  })),
  ...satellitesOf(StarId.Betelgeuse).map((satellite) => ({
    from: StarId.Betelgeuse,
    to: satellite.id,
    kind: LinkKind.Branch,
  })),
  { from: StarId.Sirius, to: StarId.Canopus, kind: LinkKind.Whisper },
  { from: StarId.Vega, to: StarId.Betelgeuse, kind: LinkKind.Whisper },
  { from: StarId.Polaris, to: StarId.Antares, kind: LinkKind.Whisper },
  { from: StarId.Rigel, to: StarId.Aldebaran, kind: LinkKind.Whisper },
  { from: StarId.Aldebaran, to: StarId.Proxima, kind: LinkKind.Whisper },
  { from: StarId.Antares, to: StarId.Canopus, kind: LinkKind.Whisper },
] as const;

/** Index of a star inside the scroll journey, or -1 for satellites. */
export function journeyIndexOf(id: StarId): number {
  return JOURNEY.indexOf(id);
}

/**
 * URL fragment for a star.
 *
 * Sections use their own name (`#about`), satellites use the slug of the thing
 * they hold (`#televault`), which keeps every fragment readable and unique
 * without a nested syntax.
 */
export function starSlug(id: StarId): string {
  const star = getStar(id);
  return star.ref ?? star.section.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

const STAR_BY_SLUG = new Map<string, StarId>(STARS.map((star) => [starSlug(star.id), star.id]));

/** The star a fragment points at, if it points at one. */
export function starFromSlug(slug: string): StarId | null {
  return STAR_BY_SLUG.get(slug.toLowerCase()) ?? null;
}
