import { GLSL_NOISE } from "./noise";

/**
 * Distant galaxy billboard.
 *
 * One plane per galaxy, always faced to the camera by the component (not by
 * this shader), so the vertex stage is a plain projection. The fragment stage
 * draws either a spiral disc or an elliptical bulge from the same noise used
 * by the nebula, so a galaxy reads as a soft, slightly clumpy smudge rather
 * than a flat gradient.
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
  uniform float uSeed;
  uniform float uArmStrength;
  uniform float uSquash;
  uniform float uCoreSize;
  uniform float uOpacity;

  varying vec2 vUv;

  ${GLSL_NOISE}

  void main() {
    vec2 centered = vUv * 2.0 - 1.0;
    // Flatten one axis so the disc reads as inclined rather than face on.
    vec2 disc = vec2(centered.x, centered.y / uSquash);
    float r = length(disc);
    float angle = atan(disc.y, disc.x);

    float core = exp(-r * r * (5.0 / max(uCoreSize, 0.05)));

    float wind = log(r + 0.08) * 2.4;
    float armPhase = sin(angle * 2.0 - wind + uSeed);
    float clumps = fbm(vec3(disc * 3.0 + uSeed, uSeed * 0.5), 3);
    float arms = smoothstep(0.15, 0.9, armPhase * 0.5 + 0.5) * clumps;
    arms *= smoothstep(1.0, 0.15, r);

    float edge = smoothstep(1.0, 0.35, r);
    float glow = core + arms * uArmStrength * edge;
    glow *= edge;

    vec3 color = mix(uColorArm, uColorCore, core);
    float alpha = clamp(glow, 0.0, 1.0) * uOpacity;

    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color * glow, alpha);
  }
`;
