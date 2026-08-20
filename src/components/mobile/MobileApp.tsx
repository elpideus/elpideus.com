"use client";

/**
 * Root of the touch build.
 *
 * A different shape of site from the desktop map, sharing its content, its
 * graph and its journey store but none of its interaction model. There is no
 * cursor, no pointer picking and no paging.
 *
 * Inside it there are two chrome layouts, not two builds: a phone gets the deck
 * (one column, sky windows cut into the reading), and a tablet gets the bridge
 * (a permanent sky window with the reading beside it). They share this scene,
 * this camera, the scroll engine and every panel body. `useFormFactor` picks
 * between them from the short edge of the screen.
 *
 * The three layers stack in the same order as the desktop build: canvas at the
 * bottom, readable things above it, veil over everything until the first frames
 * have been drawn.
 */

import { Bridge } from "./bridge/Bridge";
import { MobileDeck } from "./MobileDeck";
import { MobileHud } from "./MobileHud";
import { MobileSky } from "./sky/MobileSky";
import { SatelliteSheet } from "./SatelliteSheet";
import { StarChart } from "./StarChart";
import { IntroVeil } from "@/components/overlay/IntroVeil";
import { useTiltEngine } from "@/lib/hooks/useDeviceTilt";
import { TouchLayout, useFormFactor } from "@/lib/hooks/useFormFactor";
import { useHashRoute } from "@/lib/hooks/useHashRoute";

export function MobileApp({ layout }: { layout: TouchLayout }) {
  useHashRoute();
  useTiltEngine();
  const shape = useFormFactor(layout);

  return (
    <main className="relative h-dvh w-screen overflow-hidden">
      <MobileSky />

      {shape === TouchLayout.Bridge ? (
        /* The bridge carries its own chart, ladder and satellite view. */
        <Bridge />
      ) : (
        <>
          <MobileDeck />
          <MobileHud />
          <StarChart />
          <SatelliteSheet />
        </>
      )}

      <IntroVeil />
    </main>
  );
}
