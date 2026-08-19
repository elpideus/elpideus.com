/**
 * Shared galaxy morphology, as one GLSL function used by both skies.
 *
 * The map draws its galaxies as billboard quads and the 404 draws its own off
 * the bent ray direction, but a galaxy should not look like two different
 * objects depending on which page it is on, so both call `gxGalaxy` with the
 * same parameters and get the same body back.
 *
 * The parameters follow the Hubble sequence rather than being free knobs: one
 * morphology value slides a disc galaxy from a tight armed, big bulged Sa to a
 * loose, knotty, bulgeless Sd, and the kinds off that sequence (ellipticals,
 * lenticulars, irregulars) are separate branches with their own light
 * profiles. Everything is analytic plus value noise, so it costs a few dozen
 * instructions and no textures.
 *
 * Coordinates: `local` is the sky offset from the galaxy centre in units of
 * its angular radius, before roll and inclination. The function applies both,
 * so the caller only has to say where the pixel is.
 */
export const GLSL_GALAXY_SHAPE = /* glsl */ `
  float gxHash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  float gxValue(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(mix(gxHash(i), gxHash(i + vec3(1.0, 0.0, 0.0)), u.x),
          mix(gxHash(i + vec3(0.0, 1.0, 0.0)), gxHash(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
      mix(mix(gxHash(i + vec3(0.0, 0.0, 1.0)), gxHash(i + vec3(1.0, 0.0, 1.0)), u.x),
          mix(gxHash(i + vec3(0.0, 1.0, 1.0)), gxHash(i + vec3(1.0, 1.0, 1.0)), u.x), u.y),
      u.z
    );
  }

  float gxFbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      if (i >= octaves) break;
      value += amplitude * gxValue(p);
      p *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }

  /*
   * Sersic light profile, the one real galaxies actually follow. n = 1 is the
   * exponential disc, n = 4 the de Vaucouleurs law an elliptical obeys, and
   * the difference between the two is exactly why an elliptical reads as a
   * body with no edge while a disc reads as something with a rim.
   *
   * The raw profile diverges at the centre, so callers saturate it rather than
   * clamp it: x / (1 + x) pins the peak at one and leaves the falloff alone.
   */
  float gxSersic(float r, float re, float n) {
    float bn = 2.0 * n - 0.327;
    float x = pow(max(r, 1e-4) / max(re, 1e-4), 1.0 / n);
    return exp(-bn * clamp(x - 1.0, -3.0, 24.0));
  }

  float gxSaturate(float x) {
    return x / (1.0 + x);
  }

  /*
   * How much room a galaxy needs around its angular radius before its light is
   * certainly gone. A caller drawing onto a quad has to give it this much or
   * the profile gets clipped by the border and the galaxy renders as a square.
   */
  #define GX_EXTENT 1.5

  /*
   * One galaxy.
   *
   *   local   sky offset from the centre, in units of the angular radius
   *   squash  projected minor over major axis: 1 face on, 0.1 edge on
   *   roll    position angle on the sky
   *   form    (kind, arm count, winding, bulge radius)
   *   detail  (bar length, arm strength, dust, knots)
   *   extra   (halo strength, seed, spare, spare)
   *
   * kind: 0 spiral, 1 barred spiral, 2 elliptical, 3 lenticular, 4 irregular.
   *
   * Returns emission to be added over whatever is behind it; the alpha comes
   * back through the out parameter for callers that blend rather than add.
   */
  vec3 gxGalaxy(
    vec2 local,
    float squash,
    float roll,
    vec4 form,
    vec4 detail,
    vec4 extra,
    vec3 coreColour,
    vec3 armColour,
    out float alpha
  ) {
    alpha = 0.0;

    float ca = cos(roll);
    float sa = sin(roll);
    /* Sky plane coordinates, aligned to the galaxy's major axis. */
    vec2 sky = vec2(local.x * ca - local.y * sa, local.x * sa + local.y * ca);
    /* Deprojected disc coordinates: the circle the inclined ellipse came from. */
    vec2 disc = vec2(sky.x, sky.y / max(squash, 0.06));

    float r = length(disc);
    float skyRadius = length(sky);
    if (r > 1.6 || skyRadius > 1.5) return vec3(0.0);

    float kind = form.x;
    float armCount = form.y;
    float winding = form.z;
    float bulgeRadius = form.w;
    float barLength = detail.x;
    float armStrength = detail.y;
    float dustStrength = detail.z;
    float knotStrength = detail.w;
    float haloStrength = extra.x;
    float seed = extra.y;

    float isDisc = kind < 1.5 ? 1.0 : 0.0;
    float isBarred = (kind > 0.5 && kind < 1.5) ? 1.0 : 0.0;
    float isElliptical = (kind > 1.5 && kind < 2.5) ? 1.0 : 0.0;
    float isLenticular = (kind > 2.5 && kind < 3.5) ? 1.0 : 0.0;
    float isIrregular = kind > 3.5 ? 1.0 : 0.0;

    /* Bulge. Steeper for the pressure supported kinds, flatter for late discs. */
    float bulgeIndex = isElliptical > 0.5 ? 4.0 : (isLenticular > 0.5 ? 3.0 : 2.0);
    float bulge = gxSaturate(gxSersic(r, bulgeRadius, bulgeIndex)) * (1.0 - isIrregular);

    /* Exponential disc, faded at the rim so it has somewhere to end. */
    float discScale = mix(0.30, 0.40, fract(seed * 3.7));
    float discLight = gxSaturate(gxSersic(r, discScale, 1.0) * 0.85)
      * smoothstep(1.30, 0.55, r) * (isDisc + isLenticular);

    /*
     * Arms. The winding sets the pitch angle of the log spiral, the count sets
     * how many there are, and a first harmonic term makes one side heavier
     * than the other the way most real discs are lopsided.
     *
     * On a barred galaxy the arms do not reach the centre: they spring from
     * the ends of the bar, so the spiral is measured from the bar radius
     * outward and everything inside it belongs to the bar.
     */
    float angle = atan(disc.y, disc.x);
    float armRadius = max(r - barLength * 0.85, 0.02);
    float phase = angle * armCount - winding * log(armRadius + 0.09) + seed * 6.2831;
    float wave = sin(phase) * 0.5 + 0.5;
    float arms = pow(wave, 2.4);
    arms *= 0.72 + 0.56 * (sin(angle + seed * 5.1) * 0.5 + 0.5);

    float clump = gxFbm(vec3(disc * 3.1, seed * 9.0), 3);
    arms *= 0.30 + 1.45 * clump;
    arms *= smoothstep(barLength * 0.7, barLength + 0.22, r) * smoothstep(1.15, 0.30, r);
    arms *= armStrength * isDisc;

    /* Star forming knots strung along the arms, hotter than the arms carrying them. */
    float knotNoise = gxFbm(vec3(disc * 8.5, seed * 4.0), 2);
    float knots = smoothstep(0.60, 0.80, knotNoise) * arms * knotStrength * 2.4;

    /*
     * Bar. Boxy rather than gaussian, because a real bar has a flat top and
     * ends abruptly; a fourth power in the exponent is what gives it that.
     */
    float barX = disc.x / max(barLength, 1e-3);
    float barY = disc.y / max(barLength * 0.30, 1e-3);
    float bar = exp(-pow(length(vec2(barX, barY)), 4.0) * 1.1) * isBarred;

    /*
     * Irregular: no symmetry to speak of. Offset noise blobs inside a soft
     * envelope, so it reads as a knot of star formation with no centre.
     */
    vec2 irrOffset = vec2(gxHash(vec3(seed, 1.7, 2.3)), gxHash(vec3(seed, 5.1, 0.9))) * 0.44 - 0.22;
    float irrNoise = gxFbm(vec3((disc + irrOffset) * 2.4, seed * 6.0), 4);
    float irregular = smoothstep(0.30, 0.70, irrNoise) * smoothstep(1.15, 0.10, r) * isIrregular;
    float irrKnots = smoothstep(0.66, 0.84, gxFbm(vec3(disc * 7.0, seed * 2.0), 2)) * irregular * 1.8;

    /* Faint outer envelope. An elliptical is mostly this. */
    float halo = exp(-r * mix(3.8, 2.9, isElliptical)) * haloStrength;

    /*
     * Dust. Two kinds, because they look nothing alike: lanes that trail just
     * inside each arm on a face on disc, and the single hard lane that splits
     * an edge on disc down the middle.
     */
    float lanes = pow(sin(phase + 0.62) * 0.5 + 0.5, 5.0)
      * smoothstep(0.06, 0.30, r) * smoothstep(1.05, 0.45, r) * dustStrength * isDisc;

    float edgeOn = smoothstep(0.34, 0.11, squash);
    float laneWidth = 0.05 + 0.10 * squash;
    float laneOffset = sky.y / laneWidth;
    float edgeLane = edgeOn * exp(-laneOffset * laneOffset)
      * smoothstep(1.15, 0.05, abs(sky.x)) * dustStrength * (isDisc + isLenticular);

    float extinction = clamp(1.0 - lanes * 0.55 - edgeLane * 0.85, 0.10, 1.0);

    /*
     * Assembly. The old stars in the bulge and the bar carry the core colour,
     * the disc sits between the two, and the arms and their knots are the
     * young population, which is why they are the blue half of every palette.
     */
    vec3 emission = vec3(0.0);
    emission += coreColour * (bulge * 1.15 + bar * 0.85);
    emission += mix(armColour, coreColour, 0.45) * discLight * 0.55;
    emission += armColour * arms * 0.9;
    emission += mix(armColour, vec3(1.0), 0.35) * (knots + irrKnots) * 0.8;
    emission += armColour * irregular * 0.85;
    emission += mix(armColour, coreColour, 0.55) * halo;

    /* Dust reddens as well as dims, so what survives it leans to the core tone. */
    emission *= mix(1.0, extinction, 0.9);
    emission = mix(emission, emission * mix(vec3(1.0), coreColour, 0.5), 1.0 - extinction);

    /*
     * The quad the map draws this on is finite, and every profile above is
     * still worth something when it reaches the border: an elliptical is a
     * third as bright at r = 1 as at its centre, which is exactly how a galaxy
     * ends up rendered as a glowing square.
     *
     * Two windows close it off. One in disc space ends the body, and one in
     * sky space guarantees the light is gone before the border whatever the
     * inclination did to the disc radius, since a steeply inclined disc runs
     * out to a large r inside a small sky footprint. Callers give the quad
     * GX_EXTENT radii of room so this lands well inside it.
     *
     * The edge is also broken up by noise, because a real galaxy does not end
     * on a circle, and a perfectly circular fade is its own kind of tell.
     */
    float ragged = 0.86 + 0.28 * gxFbm(vec3(normalize(disc + 1e-4) * 2.2, seed * 3.0), 2);

    /*
     * The body window is squared. A single smoothstep is flat at both ends and
     * steepest in the middle, which puts the whole falloff into a narrow band
     * of radius and leaves a soft ring the eye can still find; squaring it
     * pulls the knee inward and stretches the tail, so the last of the light
     * dies away over twice the distance.
     */
    float body = smoothstep(1.34 * ragged, 0.62 * ragged, r);
    float border = smoothstep(1.46 * ragged, 0.92 * ragged, skyRadius);
    emission *= body * body * border;

    alpha = clamp(max(emission.r, max(emission.g, emission.b)), 0.0, 1.0);
    return emission;
  }
`;
