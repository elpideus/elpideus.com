/**
 * Point based starfield.
 *
 * One draw call per layer. Each point carries its own size, colour and twinkle
 * phase, so the whole sky animates on the GPU with no per frame CPU work.
 */
export const STARFIELD_VERTEX = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSizeScale;
  uniform float uTwinkle;
  uniform float uMinSize;

  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;

    // Slow asymmetric twinkle: mostly steady with occasional brightening.
    float pulse = sin(uTime * 0.6 + aPhase * 6.2831) * 0.5 + 0.5;
    float twinkle = mix(1.0, 0.55 + pulse * 0.9, uTwinkle);

    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    float size = aSize * uSizeScale * uPixelRatio * twinkle * (300.0 / max(-viewPosition.z, 1.0));
    float minSize = uMinSize * uPixelRatio;

    // A point smaller than a pixel cannot be drawn smaller, only unstable: it
    // lands on a different pixel every time the camera drifts, which is what
    // reads as sparkling across a sky of thousands of stars. Hold the size at
    // the floor and take the brightness down instead, so distant stars fade
    // out smoothly rather than scintillating.
    vAlpha = twinkle * clamp(size / minSize, 0.0, 1.0);
    gl_PointSize = max(size, minSize);
  }
`;

export const STARFIELD_FRAGMENT = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv) * 2.0;
    if (dist > 1.0) discard;

    // A gaussian falloff rather than a peaked core. A sharp two pixel dot
    // changes brightness every time it crosses the pixel grid, and with a sky
    // of thousands of them that reads as sparkling; a smooth profile spreads
    // the same energy over its neighbours, so drifting past a pixel boundary
    // barely changes what is drawn.
    float falloff = exp(-4.6 * dist * dist);
    float alpha = clamp(falloff, 0.0, 1.0) * vAlpha;

    gl_FragColor = vec4(vColor, alpha);
  }
`;
