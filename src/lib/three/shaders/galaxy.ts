import { GLSL_GALAXY_SHAPE } from "./galaxyShape";

/**
 * Distant galaxy billboard.
 *
 * One plane per galaxy, turned to face the camera by the component rather than
 * by this shader, so the vertex stage is a plain projection. All of the shape
 * lives in `gxGalaxy`, which the 404 also calls, so a spiral looks like the
 * same spiral on either page.
 *
 * The plane is deliberately larger than the galaxy: `GX_EXTENT` radii of room
 * on every side, so the light profile has faded out well before it reaches the
 * border. A quad cut to the galaxy's own radius clips a profile that is still
 * bright there, and the result reads as a glowing square.
 */
export const GALAXY_VERTEX = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const GALAXY_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec3 uColorCore;
  uniform vec3 uColorArm;
  uniform float uSquash;
  uniform float uRoll;
  uniform vec4 uForm;
  uniform vec4 uDetail;
  uniform vec4 uExtra;
  uniform float uOpacity;

  varying vec2 vUv;

  ${GLSL_GALAXY_SHAPE}

  void main() {
    vec2 local = (vUv * 2.0 - 1.0) * GX_EXTENT;

    float alpha;
    vec3 emission = gxGalaxy(
      local, uSquash, uRoll, uForm, uDetail, uExtra, uColorCore, uColorArm, alpha
    );

    /*
     * Additive blending multiplies by alpha on the way in, so the brightness
     * is carried once, in the colour, and alpha stays at one. Carrying it in
     * both is what dims a faint galaxy twice over until it disappears.
     */
    emission *= uOpacity;

    /*
     * Soft knee, because nothing here may clip. These materials opt out of
     * tone mapping, so anything over one is cut flat, and a cut core is a
     * plateau with a hard rim exactly where the clipping stops; the bloom pass
     * then finds that rim and draws it as an outline. Rolling the top off
     * leaves the core the brightest thing on screen without ever reaching the
     * ceiling.
     */
    emission = emission / (1.0 + emission * 0.8);

    float level = max(emission.r, max(emission.g, emission.b));
    if (level < 0.0006) discard;

    /*
     * Dither. The outer envelope is a ramp from a few percent of full
     * brightness down to nothing over a hundred or more pixels, which in eight
     * bit output is a dozen steps: those steps are the contour rings that read
     * as a hard edge however smooth the maths underneath is. Noise below one
     * output level breaks them into grain the eye reads as nothing at all.
     *
     * It is faded out with the galaxy rather than applied flat, so the far
     * corners of the quad stay exactly empty instead of picking up a faint
     * rectangle of noise.
     */
    float dither = (gxHash(vec3(gl_FragCoord.xy, 1.0)) - 0.5) * (1.3 / 255.0);
    emission += dither * min(level * 300.0, 1.0);

    gl_FragColor = vec4(max(emission, 0.0), 1.0);
  }
`;
