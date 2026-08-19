"use client";

/**
 * Root of the handheld build.
 *
 * A different shape of site from the desktop map, sharing its content, its
 * graph and its journey store but none of its interaction model. There is no
 * cursor, no orbit gesture, no pointer picking and no paging: a phone gets a
 * deck it can scroll, a chart it can jump from, and a sky that answers the way
 * the phone is being held.
 *
 * The three layers stack in the same order as the desktop build: canvas at the
 * bottom, readable things above it, veil over everything until the first frames
 * have been drawn.
 */

import { MobileDeck } from "./MobileDeck";
import { MobileHud } from "./MobileHud";
import { MobileSky } from "./sky/MobileSky";
import { SatelliteSheet } from "./SatelliteSheet";
import { StarChart } from "./StarChart";
import { IntroVeil } from "@/components/overlay/IntroVeil";
import { useTiltEngine } from "@/lib/hooks/useDeviceTilt";
import { useHashRoute } from "@/lib/hooks/useHashRoute";

export function MobileApp() {
  useHashRoute();
  useTiltEngine();

  return (
    <main className="relative h-dvh w-screen overflow-hidden">
      <MobileSky />
      <MobileDeck />
      <MobileHud />
      <StarChart />
      <SatelliteSheet />
      <IntroVeil />
    </main>
  );
}
