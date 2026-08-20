/**
 * The map's addresses.
 *
 * Every star owns a real path rather than a fragment, so each section and each
 * project is a document a search engine can index, quote and rank on its own.
 * The map itself does not navigate: paths are written with the history API and
 * read back on arrival, which keeps one canvas alive for the whole visit.
 *
 * Satellites nest under their parent (`/projects/televault`) because the parent
 * is genuinely a category of the child, and search engines read that hierarchy.
 */

import { STARS, getStar } from "@/lib/graph/nodes";
import { StarDepth, StarId } from "@/lib/graph/types";

/** Path of the origin star. Everything else hangs off it. */
export const ORIGIN_PATH = "/";

/** Section paths, hand written so they read as words rather than star names. */
const SECTION_PATHS: Readonly<Record<StarId, string | null>> = {
  [StarId.Sirius]: ORIGIN_PATH,
  [StarId.Vega]: "/about",
  [StarId.Polaris]: "/trajectory",
  [StarId.Betelgeuse]: "/projects",
  [StarId.Rigel]: "/studio",
  [StarId.Antares]: "/toolkit",
  [StarId.Aldebaran]: "/passions",
  [StarId.Proxima]: "/journal",
  [StarId.Canopus]: "/contact",

  // Satellites derive their path from the parent, so they hold no entry here.
  [StarId.Alnitak]: null,
  [StarId.Alnilam]: null,
  [StarId.Mintaka]: null,
  [StarId.Deneb]: null,
  [StarId.Spica]: null,
  [StarId.Arcturus]: null,
};

/** Canonical path of a star, always absolute and without a trailing slash. */
export function starPath(id: StarId): string {
  const star = getStar(id);
  if (star.depth === StarDepth.Satellite) {
    const parent = star.parent ? starPath(star.parent) : "/projects";
    return `${parent}/${star.ref ?? id}`;
  }
  const path = SECTION_PATHS[id];
  if (!path) throw new Error(`Star has no path: ${id}`);
  return path;
}

const STAR_BY_PATH: ReadonlyMap<string, StarId> = new Map(
  STARS.map((star) => [starPath(star.id), star.id]),
);

/** Trailing slashes and casing are noise; strip them before matching. */
function normalisePath(path: string): string {
  const trimmed = path.replace(/\/+$/, "").toLowerCase();
  return trimmed === "" ? ORIGIN_PATH : trimmed;
}

/** The star a path points at, if it points at one. */
export function starFromPath(path: string): StarId | null {
  return STAR_BY_PATH.get(normalisePath(path)) ?? null;
}

/** Every indexable path on the site, in journey order. */
export const STAR_PATHS: readonly string[] = STARS.map((star) => starPath(star.id));
