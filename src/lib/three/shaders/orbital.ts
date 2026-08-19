/**
 * Surfaces for the bodies that orbit the map's stars.
 *
 * Two shaders live here. `PLANET` lights a sphere from its own star and paints
 * it procedurally, because a planet with no terminator reads as a bead: the
 * dark limb is the whole reason the eye calls it a world. `DISC` draws a debris
 * disc as a pair of belts with a swept dust grain rather than a flat ring, so
 * Vega's disc reads as rubble in orbit instead of a decal.
 *
 * Both stay inside the map's palette: no albedo is fully saturated, the night
 * side falls to the nebula's blue rather than to black, and everything is
 * driven by the body's own two colours so the content file stays the source of
 * truth.
 */

import { GLSL_NOISE } from "./noise";

/** Values of `uMode` in the planet shader, matching `OrbitalLook`. */
export const PLANET_MODE = {
  rocky: 0,
  gasGiant: 1,
  iceGiant: 2,
} as const;

export const PLANET_VERTEX = /* glsl */ `
  varying vec3 vBody;
  varying vec3 vNormalW;
  varying vec3 vViewW;

  void main() {
    vBody = normalize(position);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vViewW = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const PLANET_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform vec3 uLight;
  uniform vec3 uLightColor;
  uniform float uTime;
  uniform float uSeed;
  uniform float uSpin;
  uniform int uMode;

  varying vec3 vBody;
  varying vec3 vNormalW;
  varying vec3 vViewW;

  ${GLSL_NOISE}

  /* Ambient the night side falls to: the nebula, not black. */
  const vec3 NIGHT = vec3(0.055, 0.075, 0.14);

  vec3 spun(vec3 d) {
    float a = uTime * uSpin;
    float c = cos(a);
    float s = sin(a);
    return vec3(d.x * c - d.z * s, d.y, d.z * c + d.x * s);
  }

  /* Cratered, weathered rock: broad provinces, then a finer grain over them. */
  vec3 rockAlbedo(vec3 d) {
    float provinces = fbm(d * 2.6 + uSeed, 5);
    float grain = fbm(d * 11.0 + uSeed * 2.7, 4);
    float basalt = smoothstep(0.36, 0.68, provinces);

    vec3 albedo = mix(uColor, uAccent, basalt);
    albedo *= 0.78 + 0.44 * grain;

    /* Craters: the ridges of a cellular field, kept shallow so they read as
       texture at the size these bodies are actually drawn. */
    float pits = fbm(d * 18.0 + 5.1, 3);
    albedo *= 1.0 - 0.22 * smoothstep(0.62, 0.86, pits);

    /* Ice at the poles, where any of these worlds would keep it. */
    float polar = smoothstep(0.74, 0.99, abs(d.y));
    return mix(albedo, mix(albedo, vec3(0.86, 0.9, 0.95), 0.65), polar * 0.7);
  }

  /* Banded giant: latitude bands, warped so they shear like a real flow. */
  vec3 bandAlbedo(vec3 d, float frequency, float contrast) {
    float warp = fbm(d * vec3(2.4, 6.0, 2.4) + uSeed, 4) - 0.5;
    float swirl = fbm(d * vec3(5.5, 14.0, 5.5) + uSeed * 1.7, 3) - 0.5;
    float lat = d.y + warp * 0.16 + swirl * 0.05;

    float bands = sin(lat * frequency) * 0.5 + 0.5;
    bands = mix(0.5, bands, contrast);
    vec3 albedo = mix(uColor, uAccent, smoothstep(0.25, 0.78, bands));

    /* One long lived storm, the way every banded giant seems to have one. */
    vec2 storm = vec2(atan(d.z, d.x) - 1.1, d.y + 0.24);
    storm.x = atan(sin(storm.x), cos(storm.x));
    float oval = 1.0 - smoothstep(0.0, 1.0, length(storm * vec2(0.55, 2.6)));
    albedo = mix(albedo, mix(uAccent, vec3(0.95, 0.62, 0.42), 0.55), oval * 0.5 * contrast);

    /* Darker towards the poles, brighter along the equator. */
    albedo *= 1.0 - 0.28 * smoothstep(0.35, 1.0, abs(d.y));
    return albedo;
  }

  void main() {
    vec3 d = spun(normalize(vBody));

    vec3 albedo;
    float atmosphere;
    if (uMode == 0) {
      albedo = rockAlbedo(d);
      atmosphere = 0.18;
    } else if (uMode == 1) {
      albedo = bandAlbedo(d, 17.0, 1.0);
      atmosphere = 0.7;
    } else {
      albedo = bandAlbedo(d, 8.0, 0.45);
      atmosphere = 0.85;
    }

    vec3 normal = normalize(vNormalW);
    float ndl = dot(normal, normalize(uLight));

    /* A soft terminator: a hard one looks like a cut on a body this small. */
    float day = smoothstep(-0.22, 0.42, ndl);
    float lambert = pow(clamp(ndl, 0.0, 1.0), 0.8);

    vec3 colour = albedo * uLightColor * (0.18 + 1.15 * lambert) * day;
    colour += albedo * NIGHT * (1.0 - day * 0.85);

    /* Limb: atmospheric scattering on the lit edge, and a thin cold rim that
       keeps the night side from dissolving into the background. */
    float fresnel = pow(1.0 - clamp(dot(normal, normalize(vViewW)), 0.0, 1.0), 3.2);
    colour += uLightColor * fresnel * atmosphere * (0.12 + 0.9 * day);
    colour += NIGHT * fresnel * 1.6;

    gl_FragColor = vec4(colour, 1.0);
  }
`;

export const DISC_VERTEX = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const DISC_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uTime;
  uniform float uSpin;
  uniform float uSeed;

  varying vec2 vUv;

  ${GLSL_NOISE}

  /* Belt centres and widths, as fractions of the outer radius. Modelled on the
     real system: a narrow warm belt well inside a much wider cold one, with a
     swept gap between them. */
  const float WARM_R = 0.34;
  const float WARM_W = 0.075;
  const float COLD_IN = 0.60;
  const float COLD_OUT = 0.97;

  float belt(float r) {
    float warm = exp(-pow((r - WARM_R) / WARM_W, 2.0)) * 0.75;
    float cold = smoothstep(COLD_IN - 0.12, COLD_IN + 0.09, r)
               * (1.0 - smoothstep(COLD_OUT - 0.22, COLD_OUT, r));
    return warm + cold;
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    if (r > 1.0) discard;

    float density = belt(r);
    if (density <= 0.0) discard;

    /*
     * Two rotations, for one reason: a truly Keplerian field winds itself to
     * death. Sample every radius at its own angular rate and the offset between
     * neighbouring radii grows without bound, so within a minute every clump is
     * smeared into a closed circle and the disc reads as a set of rings.
     *
     * So the clumps turn rigidly, which preserves their shape for as long as
     * anyone looks, and the differential is carried by a bounded oscillation on
     * the finer grain: the dust visibly slides against the clumps, faster near
     * the star, and never accumulates into a winding.
     */
    float a0 = atan(p.y, p.x);
    float rigid = uTime * uSpin;
    float slip = sin(uTime * uSpin * 0.55) * 0.9 * pow(0.34 / max(r, 0.14), 1.5);

    vec3 qc = vec3(cos(a0 + rigid), sin(a0 + rigid), 0.0) * (r * 7.0) + uSeed;
    vec3 qg = vec3(cos(a0 + rigid + slip), sin(a0 + rigid + slip), 0.0) * (r * 9.0) + 9.0;

    float clumps = fbm(qc * 1.1, 4);
    float grit = fbm(qg * 3.4, 3);
    float dust = mix(0.22, 1.0, smoothstep(0.36, 0.68, clumps * 0.75 + grit * 0.4));

    /* Warm belt is hot dust close in, cold belt is ice further out. */
    vec3 colour = mix(uAccent, uColor, smoothstep(WARM_R, COLD_IN, r));

    float alpha = density * dust * (0.34 + 0.5 * grit);
    /* Sharpen the inner edge of the cold belt: that boundary is the one thing
       a real image of this disc makes obvious. */
    alpha *= 0.75 + 0.55 * exp(-pow((r - COLD_IN) / 0.05, 2.0));

    gl_FragColor = vec4(colour, clamp(alpha, 0.0, 1.0) * 0.55);
  }
`;
