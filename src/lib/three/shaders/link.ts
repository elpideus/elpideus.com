/**
 * Constellation link.
 *
 * Drawn as line segments with a travelling highlight so the graph feels alive
 * without moving. `aProgress` runs 0..1 along each segment.
 */
export const LINK_VERTEX = /* glsl */ `
  precision highp float;

  attribute float aProgress;
  attribute float aWeight;
  attribute float aSeed;

  varying float vProgress;
  varying float vWeight;
  varying float vSeed;

  void main() {
    vProgress = aProgress;
    vWeight = aWeight;
    vSeed = aSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const LINK_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vProgress;
  varying float vWeight;
  varying float vSeed;

  void main() {
    // A soft pulse walking from one star to the other.
    float head = fract(uTime * 0.08 + vSeed);
    float pulse = smoothstep(0.12, 0.0, abs(vProgress - head));

    // Fade both ends so links appear to emerge from the stars themselves.
    float ends = smoothstep(0.0, 0.18, vProgress) * smoothstep(1.0, 0.82, vProgress);

    float alpha = uOpacity * vWeight * (0.35 + ends * 0.65) + pulse * 0.55 * vWeight;
    gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
  }
`;
