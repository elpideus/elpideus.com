/**
 * Deterministic galaxy population, shared by the map and the 404.
 *
 * Both skies draw galaxies with the same shader function, so the only thing
 * left to agree on is what kinds of galaxy exist and how big they look. That
 * is this file. It hands back plain numbers; the caller decides whether they
 * become billboard quads in world space or blobs read off a bent ray.
 *
 * Two things the previous field got wrong and this one does not:
 *
 * 1. Angular size is drawn log uniformly across better than an order of
 *    magnitude, so a field really does contain a few big close ones and many
 *    faint far ones. A cubed roll piles almost everything on the floor of the
 *    range and gives a wall of identical smudges.
 * 2. Angular size is independent of distance. Scaling world size by distance,
 *    which is what a naive "make far ones bigger" does, cancels out exactly
 *    and leaves every galaxy the same size on screen.
 *
 * Everything is seeded off `hashNoise`, so the sky is identical on every
 * visit and the two pages can be reasoned about from the code alone.
 */

import * as THREE from "three";

import { hashNoise } from "./math";

export enum GalaxyKind {
  Spiral = 0,
  Barred = 1,
  Elliptical = 2,
  Lenticular = 3,
  Irregular = 4,
}

/** Everything the shader needs to draw one galaxy, minus where it is. */
export interface GalaxyForm {
  readonly kind: GalaxyKind;
  /** Projected minor over major axis: 1 face on, ~0.1 edge on. */
  readonly squash: number;
  /** Position angle on the sky. */
  readonly roll: number;
  readonly armCount: number;
  /** Pitch of the log spiral. Higher is more tightly wound. */
  readonly winding: number;
  readonly bulgeRadius: number;
  readonly barLength: number;
  readonly armStrength: number;
  readonly dustStrength: number;
  readonly knotStrength: number;
  readonly haloStrength: number;
  readonly seed: number;
  readonly core: THREE.Color;
  readonly arm: THREE.Color;
  /** Overall multiplier, before the caller's own opacity. */
  readonly brightness: number;
  /** Half width on the sky, in radians. */
  readonly angularRadius: number;
}

/**
 * How common each kind is. Loosely the real mix in a deep field, nudged so the
 * shapes that read as something at a glance are not crowded out by the ones
 * that read as a smudge.
 */
const KIND_MIX: readonly [GalaxyKind, number][] = [
  [GalaxyKind.Spiral, 0.3],
  [GalaxyKind.Barred, 0.22],
  [GalaxyKind.Elliptical, 0.2],
  [GalaxyKind.Lenticular, 0.13],
  [GalaxyKind.Irregular, 0.15],
];

function pickKind(roll: number): GalaxyKind {
  let acc = 0;
  for (const [kind, weight] of KIND_MIX) {
    acc += weight;
    if (roll < acc) return kind;
  }
  return GalaxyKind.Spiral;
}

/** Old stellar population, from a metal rich elliptical to a young disc bulge. */
const CORE_OLD = new THREE.Color("#ffcf9a");
const CORE_YOUNG = new THREE.Color("#fff2dc");
/** Young population, from a barely blue early disc to a hot starburst. */
const ARM_EARLY = new THREE.Color("#cfd8ff");
const ARM_LATE = new THREE.Color("#7fb0ff");
const ARM_STARBURST = new THREE.Color("#6ff0ff");

/**
 * One galaxy, derived from a single morphology parameter where the Hubble
 * sequence says it should be.
 *
 * `hubble` runs 0 (Sa: big bulge, tight arms, little star formation) to 1
 * (Sd: no bulge, loose knotty arms). Pulling bulge size, winding, arm strength
 * and colour off the same number is what keeps a galaxy internally consistent
 * instead of being a random draw per knob, which is how you end up with a
 * bulgeless galaxy with tightly wound arms and no star formation.
 */
export function buildGalaxyForm(index: number, angularRange: readonly [number, number]): GalaxyForm {
  const seed = index * 37 + 11;
  const kind = pickKind(hashNoise(seed));
  const hubble = hashNoise(seed + 1);

  /*
   * Angular size, log uniform over the whole range with a mild bias to small.
   * The bias is the exponent, not a cube of the roll, so the large end still
   * gets drawn every dozen galaxies or so instead of effectively never.
   */
  const [minAngle, maxAngle] = angularRange;
  const sizeRoll = Math.pow(hashNoise(seed + 2), 1.7);
  let angularRadius = minAngle * Math.pow(maxAngle / minAngle, sizeRoll);
  /* Ellipticals run large and irregulars are dwarfs, which is most of why a
     real field has any size spread at all. */
  if (kind === GalaxyKind.Elliptical) angularRadius *= 1.25;
  if (kind === GalaxyKind.Irregular) angularRadius *= 0.55;

  /*
   * Inclination. A disc is a thin circle at a random orientation, so the
   * projected axis ratio is |cos i| floored at the intrinsic thickness; that
   * floor is what stops an edge on spiral collapsing to a zero width line.
   * Ellipticals are not thin and never present edge on, so they get their own
   * narrower range.
   */
  const cosInclination = Math.pow(hashNoise(seed + 3), 0.75);
  const squash =
    kind === GalaxyKind.Elliptical
      ? 0.55 + hashNoise(seed + 4) * 0.42
      : kind === GalaxyKind.Irregular
        ? Math.max(0.45, cosInclination)
        : Math.max(kind === GalaxyKind.Lenticular ? 0.14 : 0.11, cosInclination);

  const isDisc = kind === GalaxyKind.Spiral || kind === GalaxyKind.Barred;

  const armCountRoll = hashNoise(seed + 5);
  const armCount = armCountRoll < 0.62 ? 2 : armCountRoll < 0.84 ? 3 : 4;

  /*
   * Effective radius of the bulge, and the reason it stays small: with a
   * de Vaucouleurs profile the light reaches a long way out, so an elliptical
   * with a large effective radius is still bright at the edge of the space it
   * was given. Half of the visible size of an elliptical comes from the
   * profile's tail, not from this number.
   */
  const bulgeRadius =
    kind === GalaxyKind.Elliptical
      ? 0.16 + hashNoise(seed + 6) * 0.14
      : kind === GalaxyKind.Lenticular
        ? 0.13 + hashNoise(seed + 6) * 0.11
        : 0.05 + (1 - hubble) * 0.19;

  /* Only a bar on a barred spiral, and a long bar goes with a lazy spiral. */
  const barLength = kind === GalaxyKind.Barred ? 0.2 + hashNoise(seed + 7) * 0.24 : 0;

  const armStrength = isDisc ? 0.42 + hubble * 0.65 : 0;
  const knotStrength = isDisc ? 0.12 + hubble * 0.75 : kind === GalaxyKind.Irregular ? 0.9 : 0;
  const dustStrength = isDisc
    ? 0.35 + hubble * 0.5
    : kind === GalaxyKind.Lenticular
      ? 0.3 + hashNoise(seed + 8) * 0.35
      : 0;

  const haloStrength =
    kind === GalaxyKind.Elliptical
      ? 0.5 + hashNoise(seed + 9) * 0.3
      : kind === GalaxyKind.Lenticular
        ? 0.18
        : 0.1 + hashNoise(seed + 9) * 0.12;

  /*
   * Colour follows the same sequence. An elliptical has no young stars left,
   * so both of its tones are the old population and it comes out uniformly
   * warm; a late disc has a hot blue arm colour against a warm core, which is
   * the contrast that makes a spiral read as a spiral.
   */
  const core = CORE_OLD.clone().lerp(CORE_YOUNG, kind === GalaxyKind.Elliptical ? 0.05 : hubble * 0.7);
  const arm =
    kind === GalaxyKind.Elliptical
      ? CORE_OLD.clone().lerp(CORE_YOUNG, 0.25)
      : kind === GalaxyKind.Irregular
        ? ARM_LATE.clone().lerp(ARM_STARBURST, hashNoise(seed + 10))
        : ARM_EARLY.clone().lerp(ARM_LATE, hubble).lerp(ARM_STARBURST, hubble * 0.3);

  /*
   * Surface brightness, not total light: a big galaxy is not a small one
   * scaled up on screen, it is a fainter and smoother one, so brightness runs
   * the other way from size.
   */
  const sizeFraction = (angularRadius - minAngle) / Math.max(maxAngle - minAngle, 1e-6);
  const brightness =
    (kind === GalaxyKind.Elliptical ? 0.72 : kind === GalaxyKind.Irregular ? 0.8 : 1) *
    (0.95 - Math.min(sizeFraction, 1) * 0.35) *
    (0.75 + hashNoise(seed + 11) * 0.45);

  return {
    kind,
    squash,
    roll: hashNoise(seed + 12) * Math.PI * 2,
    armCount,
    winding: 1.7 + (1 - hubble) * 3.1,
    bulgeRadius,
    barLength,
    armStrength,
    dustStrength,
    knotStrength,
    haloStrength,
    seed: hashNoise(seed + 13) * 12,
    core,
    arm,
    brightness,
    angularRadius,
  };
}

/** A whole field, in index order so a smaller count is a subset of a larger one. */
export function buildGalaxyField(
  count: number,
  angularRange: readonly [number, number],
): GalaxyForm[] {
  return Array.from({ length: count }, (_, index) => buildGalaxyForm(index, angularRange));
}

/** `form` uniform for `gxGalaxy`: kind, arm count, winding, bulge radius. */
export function galaxyFormVector(form: GalaxyForm): THREE.Vector4 {
  return new THREE.Vector4(form.kind, form.armCount, form.winding, form.bulgeRadius);
}

/** `detail` uniform for `gxGalaxy`: bar length, arm strength, dust, knots. */
export function galaxyDetailVector(form: GalaxyForm): THREE.Vector4 {
  return new THREE.Vector4(form.barLength, form.armStrength, form.dustStrength, form.knotStrength);
}

/** `extra` uniform for `gxGalaxy`: halo strength, seed, two spares. */
export function galaxyExtraVector(form: GalaxyForm): THREE.Vector4 {
  return new THREE.Vector4(form.haloStrength, form.seed, 0, 0);
}

/**
 * An even spread of directions over the sphere, flattened a little in the
 * vertical so the field reads as a sky rather than a shell.
 */
export function galaxyDirection(index: number, flatten = 1): THREE.Vector3 {
  const seed = index * 37 + 11;
  const theta = hashNoise(seed + 14) * Math.PI * 2;
  const phi = Math.acos(hashNoise(seed + 15) * 2 - 1);
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi) * flatten,
    Math.sin(phi) * Math.sin(theta),
  ).normalize();
}

/** Distance from the origin for a map galaxy. Independent of its size on sky. */
export function galaxyDistance(index: number, radiusRange: readonly [number, number]): number {
  const [minR, maxR] = radiusRange;
  return minR + hashNoise(index * 37 + 16) * (maxR - minR);
}
