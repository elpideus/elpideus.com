import { GLSL_NOISE } from "./noise";

/**
 * Nebula shell.
 *
 * Rendered on the inside of a very large sphere so it surrounds the camera in
 * every direction. The cloud shape comes from domain warped fbm sampled along
 * the view direction, which keeps it stable while the camera translates and
 * makes it feel infinitely far away.
 */
export const NEBULA_VERTEX = /* glsl */ `
  varying vec3 vDirection;

  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const NEBULA_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorHot;

  varying vec3 vDirection;

  ${GLSL_NOISE}

  void main() {
    vec3 dir = normalize(vDirection);
    float t = uTime * 0.012;

    // Domain warp: a slow low frequency field pushes the main cloud around.
    vec3 warp = vec3(
      fbm(dir * 1.6 + vec3(t, 0.0, 0.0), 3),
      fbm(dir * 1.6 + vec3(0.0, t, 5.2), 3),
      fbm(dir * 1.6 + vec3(3.1, 0.0, t), 3)
    );

    float clouds = fbm(dir * 2.6 + warp * 1.35 + vec3(0.0, t * 0.5, 0.0), 5);
    float filaments = fbm(dir * 7.5 + warp * 2.1, 4);

    // Two lobes so the sky is not uniform: one warm, one cold.
    float warmLobe = smoothstep(0.25, 1.0, dot(dir, normalize(vec3(0.55, 0.25, -0.8))));
    float coldLobe = smoothstep(0.15, 1.0, dot(dir, normalize(vec3(-0.7, -0.2, 0.35))));

    float density = clouds * 0.75 + filaments * 0.25;
    density = smoothstep(0.35, 0.92, density);

    vec3 color = uColorDeep;
    color = mix(color, uColorMid, density);
    color = mix(color, uColorHot, density * warmLobe * 0.85);
    color = mix(color, uColorMid * 1.35, density * coldLobe * 0.5);

    float glow = pow(density, 1.6) * uIntensity;
    gl_FragColor = vec4(color * (0.35 + glow), 1.0);
  }
`;

/**
 * Lean nebula for the handheld build.
 *
 * Same idea, a third of the arithmetic. Domain warping is dropped entirely and
 * the octave counts are cut, because a phone GPU pays for this shader on every
 * pixel of a full screen shell. What is left still reads as clouds, which is
 * all the mobile sky asks of it.
 */
export const NEBULA_FRAGMENT_LEAN = /* glsl */ `
  precision mediump float;

  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorHot;

  varying vec3 vDirection;

  ${GLSL_NOISE}

  void main() {
    vec3 dir = normalize(vDirection);
    float t = uTime * 0.01;

    float clouds = fbm(dir * 2.2 + vec3(0.0, t, 0.0), 3);
    float filaments = fbm(dir * 6.0 + vec3(t * 0.5, 0.0, 0.0), 2);

    float warmLobe = smoothstep(0.25, 1.0, dot(dir, normalize(vec3(0.55, 0.25, -0.8))));
    float coldLobe = smoothstep(0.15, 1.0, dot(dir, normalize(vec3(-0.7, -0.2, 0.35))));

    float density = smoothstep(0.34, 0.9, clouds * 0.78 + filaments * 0.22);

    vec3 color = uColorDeep;
    color = mix(color, uColorMid, density);
    color = mix(color, uColorHot, density * warmLobe * 0.85);
    color = mix(color, uColorMid * 1.3, density * coldLobe * 0.5);

    float glow = pow(density, 1.6) * uIntensity;
    gl_FragColor = vec4(color * (0.35 + glow), 1.0);
  }
`;
