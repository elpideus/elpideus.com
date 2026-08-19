/**
 * Real companions, planets and discs of the stars on the map.
 *
 * Two levels are described here. A body may orbit a star (`star`), or it may
 * orbit another body (`parentBody`), which is how a companion that is itself a
 * pair gets drawn as one. Nothing invented gets a slot: several stars on the
 * map genuinely carry nothing, and they stay bare.
 *
 * `look` is the visual archetype, kept apart from `kind` because `kind` is what
 * the tooltip calls the thing and `look` is how the canvas draws it. A white
 * dwarf and a blue subgiant are both companion stars and look nothing alike.
 */

import { StarId } from "@/lib/graph/types";

export type OrbitalKind = "planet" | "star" | "disc";

/** How the canvas draws a body. */
export enum OrbitalLook {
  /** Earth sized, blue white, absurdly bright for its size. */
  WhiteDwarf = "white-dwarf",
  /** Hot B type companion: small, blue, hard edged glow. */
  BlueStar = "blue-star",
  /** F to G type companion: warm white. */
  SunLike = "sun-like",
  /** Banded hydrogen giant. */
  GasGiant = "gas-giant",
  /** Smoother, colder, methane blue. */
  IceGiant = "ice-giant",
  /** Cratered and mottled rock. */
  Rocky = "rocky",
  /** Dust and rubble in a plane. */
  DebrisDisc = "debris-disc",
}

export interface OrbitalBody {
  readonly id: string;
  /** The star this body belongs to, directly or through `parentBody`. */
  readonly star: StarId;
  /** Set when the body orbits another body rather than the star itself. */
  readonly parentBody?: string;
  readonly name: string;
  readonly kind: OrbitalKind;
  readonly look: OrbitalLook;
  /** Body colour. For a planet this is the base of the surface. */
  readonly color: string;
  /** Second surface colour: band, continent or dust accent. */
  readonly accent?: string;
  /** Visual radius in world units. For a disc, the outer radius. */
  readonly radius: number;
  /** Orbit radius in world units. Unused (0) for a disc, which is static. */
  readonly orbitRadius: number;
  readonly tilt: number;
  readonly phase: number;
  /** Decorative angular speed. Farther, real companions move slower. */
  readonly speed: number;
  readonly tagline: string;
  readonly fact: string;
}

export const ORBITALS: readonly OrbitalBody[] = [
  {
    id: "sirius-b",
    star: StarId.Sirius,
    name: "Sirius B",
    kind: "star",
    look: OrbitalLook.WhiteDwarf,
    color: "#eaf3ff",
    radius: 0.11,
    orbitRadius: 3.4,
    tilt: 0.5,
    phase: 0.4,
    speed: 0.09,
    tagline: "The Pup: a white dwarf companion, once the brighter of the pair.",
    fact: "Orbits Sirius A once every 50.1 years, packed to the density of a diamond the size of Earth.",
  },
  {
    id: "vega-disc",
    star: StarId.Vega,
    name: "Vega's debris disc",
    kind: "disc",
    look: OrbitalLook.DebrisDisc,
    color: "#cfe0ff",
    accent: "#ffd2a8",
    radius: 2.8,
    orbitRadius: 0,
    tilt: 0.42,
    phase: 0,
    /*
     * Rate of the dust, not of a point mass: read at the cold belt, which is
     * where most of the visible area is. Sits with the companions that orbit at
     * a similar distance on this map (Sirius B at 0.09, Polaris B at 0.05),
     * because anything faster reads as a spinning plate rather than an orbit.
     */
    speed: 0.07,
    tagline: "Two belts of dust and rubble left over from planet formation, seen almost face on.",
    fact: "Found by IRAS in 1983. A warm inner belt near 14 AU, a cold outer belt past 80 AU, and a wide clean gap between them where a planet should be.",
  },
  {
    id: "polaris-ab",
    star: StarId.Polaris,
    name: "Polaris Ab",
    kind: "star",
    look: OrbitalLook.SunLike,
    color: "#fff2d8",
    radius: 0.15,
    orbitRadius: 1.9,
    tilt: 0.55,
    phase: 4.6,
    speed: 0.3,
    tagline: "A dwarf star tucked close in, only resolved by Hubble in 2005.",
    fact: "About 18 AU out on a 29 year orbit, lost in the supergiant's glare until then.",
  },
  {
    id: "polaris-b",
    star: StarId.Polaris,
    name: "Polaris B",
    kind: "star",
    look: OrbitalLook.SunLike,
    color: "#fff0dd",
    radius: 0.19,
    orbitRadius: 3.8,
    tilt: -0.3,
    phase: 2.1,
    speed: 0.05,
    tagline: "A companion star wide enough to see in a small telescope.",
    fact: "About 2,400 AU out, first resolved by William Herschel in 1780.",
  },
  {
    id: "betelgeuse-b",
    star: StarId.Betelgeuse,
    name: "Alpha Orionis B",
    kind: "star",
    look: OrbitalLook.SunLike,
    color: "#e6ecff",
    radius: 0.16,
    orbitRadius: 3.1,
    tilt: 0.25,
    phase: 1.7,
    speed: 0.11,
    tagline: "A faint companion buried inside the supergiant's own atmosphere.",
    fact: "Inferred from Betelgeuse's six year brightness cycle, then directly imaged from Gemini North in 2025 and nicknamed Siwarha.",
  },
  {
    id: "rigel-b",
    star: StarId.Rigel,
    name: "Rigel B",
    kind: "star",
    look: OrbitalLook.BlueStar,
    color: "#cfe0ff",
    radius: 0.2,
    orbitRadius: 3.6,
    tilt: 0.2,
    phase: 4.0,
    speed: 0.045,
    tagline: "A hot blue star, dwarfed by Rigel's glare and itself not alone.",
    fact: "Orbits Rigel A at roughly 2,200 AU, wide enough to take millennia to complete.",
  },
  {
    id: "rigel-bb",
    star: StarId.Rigel,
    parentBody: "rigel-b",
    name: "Rigel Bb",
    kind: "star",
    look: OrbitalLook.BlueStar,
    color: "#bcd6ff",
    radius: 0.12,
    orbitRadius: 0.62,
    tilt: 0.9,
    phase: 2.4,
    speed: 1.1,
    tagline: "The second half of Rigel B: a spectroscopic pair too tight to resolve.",
    fact: "The two components circle each other every 9.86 days, which is why Rigel B never splits in a telescope.",
  },
  {
    id: "antares-b",
    star: StarId.Antares,
    name: "Antares B",
    kind: "star",
    look: OrbitalLook.BlueStar,
    color: "#a9c8ff",
    radius: 0.17,
    orbitRadius: 3.2,
    tilt: -0.4,
    phase: 5.2,
    speed: 0.03,
    tagline: "A hot blue companion hidden in the red giant's glare.",
    fact: "Roughly 529 AU out, completing one orbit every 880 years or so.",
  },
  {
    id: "aldebaran-b",
    star: StarId.Aldebaran,
    name: "Aldebaran b",
    kind: "planet",
    look: OrbitalLook.GasGiant,
    color: "#c08a5e",
    accent: "#f4d7a6",
    radius: 0.26,
    orbitRadius: 2.4,
    tilt: 0.15,
    phase: 1.1,
    speed: 0.22,
    tagline: "A confirmed gas giant, one of the few planets found around a giant star.",
    fact: "About 6.5 Jupiter masses on a 629 day orbit, close enough that the swollen giant has already scorched it.",
  },
  {
    id: "proxima-b",
    star: StarId.Proxima,
    name: "Proxima b",
    kind: "planet",
    look: OrbitalLook.Rocky,
    color: "#7d5647",
    accent: "#c9a389",
    radius: 0.15,
    orbitRadius: 1.5,
    tilt: 0.1,
    phase: 0.6,
    speed: 0.6,
    tagline: "A rocky world in Proxima's habitable zone, the nearest known exoplanet to the Sun.",
    fact: "About 1.07 Earth masses, orbiting every 11.2 days, almost certainly locked with one face to the star.",
  },
  {
    id: "proxima-c",
    star: StarId.Proxima,
    name: "Proxima c",
    kind: "planet",
    look: OrbitalLook.IceGiant,
    color: "#5d86b6",
    accent: "#bcd9ef",
    radius: 0.2,
    orbitRadius: 2.5,
    tilt: -0.2,
    phase: 3.3,
    speed: 0.28,
    tagline: "A cold mini-Neptune much further out from the same star.",
    fact: "Roughly 7 Earth masses, orbiting every 5.2 years, far outside anything the star can warm.",
  },
  {
    id: "proxima-d",
    star: StarId.Proxima,
    name: "Proxima d",
    kind: "planet",
    look: OrbitalLook.Rocky,
    color: "#615b53",
    accent: "#a39684",
    radius: 0.1,
    orbitRadius: 1.0,
    tilt: 0.3,
    phase: 5.6,
    speed: 0.9,
    tagline: "A sub-Earth skimming close in, the smallest of the three.",
    fact: "About a quarter of Earth's mass, orbiting every 5.1 days.",
  },

  // Companions of the project satellites. Those are real stars too, and three
  // of the six have documented company of their own.
  {
    id: "alnitak-b",
    star: StarId.Alnitak,
    name: "Alnitak B",
    kind: "star",
    look: OrbitalLook.BlueStar,
    color: "#bcd4ff",
    radius: 0.1,
    orbitRadius: 1.35,
    tilt: 0.4,
    phase: 0.9,
    speed: 0.34,
    tagline: "A hot blue giant orbiting the easternmost star of Orion's belt.",
    fact: "Roughly 400 AU from Alnitak A, which hides a closer companion of its own found in 1998.",
  },
  {
    id: "mintaka-c",
    star: StarId.Mintaka,
    name: "Mintaka C",
    kind: "star",
    look: OrbitalLook.BlueStar,
    color: "#c6dbff",
    radius: 0.1,
    orbitRadius: 1.45,
    tilt: -0.35,
    phase: 3.7,
    speed: 0.28,
    tagline: "One member of a system that resolves into at least five stars.",
    fact: "Sits 52 arcseconds from Mintaka A, whose brightest pair eclipse each other every 5.7 days.",
  },
  {
    id: "spica-b",
    star: StarId.Spica,
    name: "Spica B",
    kind: "star",
    look: OrbitalLook.BlueStar,
    color: "#cfd9ff",
    radius: 0.09,
    orbitRadius: 1.1,
    tilt: 0.6,
    phase: 5.1,
    speed: 0.75,
    tagline: "So close to Spica A that tides pull both stars into eggs.",
    fact: "One orbit every 4.01 days, the pair separated by about a tenth of the Earth to Sun distance.",
  },
] as const;

/** Lookup used when a body orbits another body. */
export const ORBITAL_BY_ID: ReadonlyMap<string, OrbitalBody> = new Map(
  ORBITALS.map((body) => [body.id, body]),
);

export function orbitalsOf(star: StarId): readonly OrbitalBody[] {
  return ORBITALS.filter((body) => body.star === star);
}
