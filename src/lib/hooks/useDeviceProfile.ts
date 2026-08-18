"use client";

/**
 * Coarse capability detection used to pick a rendering tier.
 *
 * Deliberately simple: a rough device memory and core count read plus the
 * reduced motion preference. This site targets desktop, so the goal is only to
 * avoid melting weak laptops, not to build a full benchmark.
 */

import { useEffect, useState } from "react";

import { EffectTier } from "@/components/canvas/Effects";

export interface DeviceProfile {
  readonly tier: EffectTier;
  readonly dpr: readonly [number, number];
  readonly reducedMotion: boolean;
}

const DEFAULT_PROFILE: DeviceProfile = {
  tier: EffectTier.Rich,
  dpr: [1.5, 2],
  reducedMotion: false,
};

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const memory = (navigator as NavigatorWithMemory).deviceMemory ?? 8;
    const cores = navigator.hardwareConcurrency ?? 8;

    const weak = memory <= 4 || cores <= 4;
    // Capabilities can only be read in the browser, and the first paint has to
    // happen before that is known, so this state update is the whole point.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile({
      tier: reducedMotion ? EffectTier.Off : weak ? EffectTier.Lean : EffectTier.Rich,
      // The lower bound matters more than the upper one: on a plain 1x display
      // it supersamples, which is what stops the starfield from shimmering.
      dpr: weak ? [1, 1.25] : [1.5, 2],
      reducedMotion,
    });
  }, []);

  return profile;
}
