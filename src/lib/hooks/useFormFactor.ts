"use client";

/**
 * Which shape the touch build takes.
 *
 * The touch build is one build with two chrome layouts, not two builds. A phone
 * gets the deck: sky windows and panels interleaved in a single scroll, because
 * a phone screen only has room for one thing at a time. A tablet gets the
 * bridge: the sky is a fixed viewport and the reading is a column beside it,
 * because a tablet has room for both and stacking them wastes half the glass.
 *
 * The split is a hardware question, not a breakpoint: it is decided once from
 * the short edge of the screen and never re-flows mid gesture beyond an
 * orientation change. Both layouts share the scene, the scroll engine, the
 * panels and the journey store.
 */

import { useEffect, useState } from "react";

import { BridgeOrientation, TouchLayout } from "@/lib/state/layout";

export { BridgeOrientation, TouchLayout };

/**
 * Shortest screen edge, in CSS pixels, from which the bridge is worth showing.
 * Set above every phone in either orientation (the widest is around 440) and
 * below every tablet in portrait (the smallest is around 740), so the answer
 * never changes when a device is turned.
 */
const BRIDGE_SHORT_EDGE_MIN = 620;

function looksLikeBridge(): boolean {
  return Math.min(window.innerWidth, window.innerHeight) >= BRIDGE_SHORT_EDGE_MIN;
}

/**
 * `fromUserAgent` is the server's guess, which is all the first paint has. The
 * client corrects it once the viewport can actually be measured, which is what
 * makes an iPad asking for the desktop site still land on the bridge.
 */
export function useFormFactor(fromUserAgent: TouchLayout): TouchLayout {
  const [layout, setLayout] = useState(fromUserAgent);

  useEffect(() => {
    const evaluate = () => setLayout(looksLikeBridge() ? TouchLayout.Bridge : TouchLayout.Deck);
    evaluate();

    window.addEventListener("resize", evaluate);
    window.addEventListener("orientationchange", evaluate);
    return () => {
      window.removeEventListener("resize", evaluate);
      window.removeEventListener("orientationchange", evaluate);
    };
  }, []);

  return layout;
}

/**
 * Orientation of the bridge. The two arrangements are the same components in a
 * different grid direction: sky beside the dossier, or sky above it.
 */
export function useBridgeOrientation(): BridgeOrientation {
  const [orientation, setOrientation] = useState(BridgeOrientation.Landscape);

  useEffect(() => {
    const query = window.matchMedia("(orientation: portrait)");
    const evaluate = () =>
      setOrientation(query.matches ? BridgeOrientation.Portrait : BridgeOrientation.Landscape);
    evaluate();

    query.addEventListener("change", evaluate);
    return () => query.removeEventListener("change", evaluate);
  }, []);

  return orientation;
}
