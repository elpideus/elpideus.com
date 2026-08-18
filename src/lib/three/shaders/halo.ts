/**
 * Billboard halo used around every section star.
 *
 * The mesh is a camera facing quad; the shader draws a radial falloff plus four
 * diffraction spikes, with a twinkle term the beacon star drives harder.
 */
export const HALO_VERTEX = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const HALO_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uTwinkle;
  uniform float uSpikes;
  uniform float uPhase;

  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float dist = length(p);
    if (dist > 1.0) discard;

    float glow = pow(1.0 - clamp(dist, 0.0, 1.0), 3.0);
    float core = pow(1.0 - clamp(dist * 2.4, 0.0, 1.0), 6.0);

    // Diffraction spikes along both axes, sharpened near the centre.
    float spikeH = pow(max(0.0, 1.0 - abs(p.y) * 14.0), 3.0) * (1.0 - abs(p.x));
    float spikeV = pow(max(0.0, 1.0 - abs(p.x) * 14.0), 3.0) * (1.0 - abs(p.y));
    float spikes = (spikeH + spikeV) * uSpikes;

    float twinkle = 1.0 + uTwinkle * sin(uTime * 1.7 + uPhase) * 0.5
                        + uTwinkle * sin(uTime * 0.63 + uPhase * 2.3) * 0.25;

    float alpha = clamp((glow * 0.75 + core + spikes * 0.55) * uIntensity * twinkle, 0.0, 1.0);
    gl_FragColor = vec4(uColor, alpha);
  }
`;
