/** Small frame rate independent math helpers shared by the canvas layer. */

/** Clamp a number into a range. */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Linear interpolation. */
export function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}

/**
 * Exponential smoothing that behaves the same at any frame rate.
 *
 * `smoothing` is the fraction of the remaining distance left after one second,
 * so smaller values converge faster.
 */
export function damp(current: number, target: number, smoothing: number, delta: number): number {
  return lerp(current, target, 1 - Math.pow(smoothing, delta));
}

/** Cubic ease in and out, used for camera flights. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Ease out with a soft landing, used for panel entrances. */
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/** Deterministic pseudo random in the 0..1 range, seeded by an integer. */
export function hashNoise(seed: number): number {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}
