/**
 * Core vocabulary of the star map.
 *
 * The whole site is a directed graph of stars. Depth one stars are the
 * sections of the site and the only nodes the scroll journey visits. Depth two
 * stars are satellites (currently projects) that hang off a depth one star and
 * are reachable by clicking them.
 */

/** Stable identifier of every star in the map. Used in URLs and analytics. */
export enum StarId {
  // Depth one: the sections.
  Sirius = "sirius",
  Vega = "vega",
  Polaris = "polaris",
  Betelgeuse = "betelgeuse",
  Rigel = "rigel",
  Antares = "antares",
  Aldebaran = "aldebaran",
  Proxima = "proxima",
  Canopus = "canopus",

  // Depth two: project satellites of Betelgeuse.
  Alnitak = "alnitak",
  Alnilam = "alnilam",
  Mintaka = "mintaka",
  Deneb = "deneb",
  Spica = "spica",
  Arcturus = "arcturus",
}

/** How deep in the graph a star sits. Scroll paging only walks `Primary`. */
export enum StarDepth {
  /** Section level. Part of the scroll journey. */
  Primary = 1,
  /** Satellite level. Reachable by click or from its parent panel. */
  Satellite = 2,
}

/** Visual and behavioural archetype of a star. */
export enum StarClass {
  /** Ordinary section star. */
  Sequence = "sequence",
  /** The origin star: the brightest thing on the map. */
  Anchor = "anchor",
  /** Contact star: twinkles a little more so the eye is drawn to it. */
  Beacon = "beacon",
  /** Not lit yet (the blog). Dimmer, cooler, no panel content. */
  Dormant = "dormant",
  /** Project satellite. */
  Satellite = "satellite",
}

/** Runtime interaction state of a single star, used by the renderer. */
export enum StarPhase {
  Idle = "idle",
  Hovered = "hovered",
  Focused = "focused",
}

/** Why a link exists between two stars. Drives its rendered weight. */
export enum LinkKind {
  /** Backbone of the journey: primary star to the next primary star. */
  Spine = "spine",
  /** Parent to satellite. */
  Branch = "branch",
  /** Loose associative link, drawn faint, purely decorative meaning. */
  Whisper = "whisper",
}

/** Where a star's panel content comes from. */
export enum PanelKind {
  Origin = "origin",
  About = "about",
  Journey = "journey",
  Projects = "projects",
  Studio = "studio",
  Toolkit = "toolkit",
  Passions = "passions",
  Blog = "blog",
  Contact = "contact",
  Project = "project",
}

/** A point in world space. Tuple keeps the data serialisable and cheap. */
export type Vec3 = readonly [x: number, y: number, z: number];

/** A node of the map. */
export interface StarNode {
  readonly id: StarId;
  /** Proper name of the real star, e.g. "Betelgeuse". */
  readonly star: string;
  /** Section title, e.g. "Projects". Rendered as "star - section". */
  readonly section: string;
  /** One line shown in the hover tooltip. */
  readonly tagline: string;
  readonly depth: StarDepth;
  readonly kind: StarClass;
  readonly panel: PanelKind;
  readonly position: Vec3;
  /** Base radius in world units before phase scaling. */
  readonly radius: number;
  /** Core colour in hex. Cool blues for sequence stars, warm for satellites. */
  readonly color: string;
  /** Parent star for satellites. */
  readonly parent?: StarId;
  /** Payload key for satellites (e.g. project slug). */
  readonly ref?: string;
}

/** An edge of the map. */
export interface StarLink {
  readonly from: StarId;
  readonly to: StarId;
  readonly kind: LinkKind;
}

/** Full display label of a star: "Betelgeuse - Projects". */
export function starLabel(node: StarNode): string {
  return `${node.star} - ${node.section}`;
}
