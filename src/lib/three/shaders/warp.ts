/**
 * Warp streaks.
 *
 * One line segment per star, drawn only while the visitor is actually moving.
 * The whole effect lives in the vertex shader: the layer rides with the camera
 * and each segment is scrolled along Z by an accumulated travel distance, then
 * stretched backwards by the current speed. At rest the stretch is zero, the
 * segments collapse to nothing and the layer fades out entirely, so the still
 * sky is left to the point based starfield.
 */
export const WARP_VERTEX = /* glsl */ `
  precision highp float;

  uniform float uTravel;
  uniform float uStreak;
  uniform float uSpan;
  uniform float uAlpha;

  /** 0 for the leading vertex of a segment, 1 for the trailing one. */
  attribute float aTail;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;

    vec3 local = position;
    // Wrap along the direction of travel so the layer never runs out of stars.
    local.z = mod(local.z + uTravel, uSpan) - uSpan * 0.5;
    local.z += aTail * uStreak;

    vec4 viewPosition = modelViewMatrix * vec4(local, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    // Fade the ends of the tunnel so segments appear and vanish out of sight
    // rather than popping at the wrap boundary.
    float depth = abs(local.z) / (uSpan * 0.5);
    vAlpha = uAlpha * (1.0 - depth * depth) * (1.0 - aTail * 0.75);
  }
`;

export const WARP_FRAGMENT = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(vColor, clamp(vAlpha, 0.0, 1.0));
  }
`;
