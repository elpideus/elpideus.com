"use client";

/**
 * Post processing.
 *
 * Bloom is what sells "these are stars, not spheres". Everything else is kept
 * deliberately gentle: a touch of vignette to focus the centre, and a whisper
 * of noise so large dark gradients do not band on cheap panels.
 */

import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";

/** Quality tiers, chosen once at mount from the device profile. */
export enum EffectTier {
  /** Full stack of effects. */
  Rich = "rich",
  /** Bloom only, smaller kernel. */
  Lean = "lean",
  /** Nothing, for reduced motion or very weak hardware. */
  Off = "off",
}

export function Effects({ tier = EffectTier.Rich }: { tier?: EffectTier }) {
  if (tier === EffectTier.Off) return null;

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={tier === EffectTier.Rich ? 0.82 : 0.6}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.6}
        kernelSize={tier === EffectTier.Rich ? KernelSize.LARGE : KernelSize.MEDIUM}
        mipmapBlur
      />
      {tier === EffectTier.Rich ? (
        <Vignette offset={0.24} darkness={0.72} blendFunction={BlendFunction.NORMAL} />
      ) : (
        <></>
      )}
      {tier === EffectTier.Rich ? (
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.22} />
      ) : (
        <></>
      )}
    </EffectComposer>
  );
}
