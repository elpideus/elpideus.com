/**
 * Real companions and planets of the nav stars, where any are actually known.
 *
 * Most of the bright stars on this map have nothing confirmed orbiting them:
 * supergiants shed or never held onto planets, and several are here for their
 * light rather than their neighbourhood. Only what is documented in real
 * astronomy gets drawn, so most stars carry none and a couple carry several.
 */

import { StarId } from "@/lib/graph/types";

export type OrbitalKind = "planet" | "star" | "disc";

export interface OrbitalBody {
  readonly id: string;
  readonly star: StarId;
  readonly name: string;
  readonly kind: OrbitalKind;
  readonly color: string;
  /** Visual radius in world units. For a disc, the ring's outer radius. */
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
    color: "#eaf3ff",
    radius: 0.24,
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
    color: "#bcd4ff",
    radius: 2.1,
    orbitRadius: 0,
    tilt: 0.35,
    phase: 0,
    speed: 0,
    tagline: "A ring of dust and rubble left over from planet formation.",
    fact: "Discovered by IRAS in 1983. No confirmed planet yet, but the disc says something built one.",
  },
  {
    id: "polaris-b",
    star: StarId.Polaris,
    name: "Polaris B",
    kind: "star",
    color: "#dbe8ff",
    radius: 0.2,
    orbitRadius: 3.8,
    tilt: -0.3,
    phase: 2.1,
    speed: 0.05,
    tagline: "A companion star wide enough to see in a small telescope.",
    fact: "About 2,400 AU out, first resolved by William Herschel in 1780.",
  },
  {
    id: "rigel-b",
    star: StarId.Rigel,
    name: "Rigel B",
    kind: "star",
    color: "#a8c6ff",
    radius: 0.22,
    orbitRadius: 3.6,
    tilt: 0.2,
    phase: 4.0,
    speed: 0.045,
    tagline: "Itself a close binary of two hot blue stars, dwarfed by Rigel's glare.",
    fact: "Orbits Rigel A at roughly 2,200 AU, wide enough to take millennia to complete.",
  },
  {
    id: "antares-b",
    star: StarId.Antares,
    name: "Antares B",
    kind: "star",
    color: "#9fd0ff",
    radius: 0.18,
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
    color: "#ffb27a",
    radius: 0.2,
    orbitRadius: 2.4,
    tilt: 0.15,
    phase: 1.1,
    speed: 0.22,
    tagline: "A confirmed gas giant, one of the few planets found around a giant star.",
    fact: "About 6.5 Jupiter masses, on a 629-day orbit.",
  },
  {
    id: "proxima-b",
    star: StarId.Proxima,
    name: "Proxima b",
    kind: "planet",
    color: "#b8737f",
    radius: 0.13,
    orbitRadius: 1.5,
    tilt: 0.1,
    phase: 0.6,
    speed: 0.6,
    tagline: "A rocky world in Proxima's habitable zone, the nearest known exoplanet to the Sun.",
    fact: "About 1.07 Earth masses, orbiting every 11.2 days.",
  },
  {
    id: "proxima-c",
    star: StarId.Proxima,
    name: "Proxima c",
    kind: "planet",
    color: "#8fb0ff",
    radius: 0.16,
    orbitRadius: 2.5,
    tilt: -0.2,
    phase: 3.3,
    speed: 0.28,
    tagline: "A cold mini-Neptune much further out from the same star.",
    fact: "Roughly 7 Earth masses, orbiting every 5.2 years.",
  },
  {
    id: "proxima-d",
    star: StarId.Proxima,
    name: "Proxima d",
    kind: "planet",
    color: "#e6c98f",
    radius: 0.1,
    orbitRadius: 1.0,
    tilt: 0.3,
    phase: 5.6,
    speed: 0.9,
    tagline: "A sub-Earth skimming close in, the smallest of the three.",
    fact: "About a quarter of Earth's mass, orbiting every 5.1 days.",
  },
] as const;

export function orbitalsOf(star: StarId): readonly OrbitalBody[] {
  return ORBITALS.filter((body) => body.star === star);
}
