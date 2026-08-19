"use client";

/**
 * Decides which of the two builds a visitor gets.
 *
 * The server makes the first call from the user agent, so a phone never
 * downloads or starts the desktop scene at all. The client then only ever adds
 * to that verdict: a coarse pointer on a small screen is a handheld even when
 * the user agent claims otherwise, which is what makes device emulation and
 * odd in app browsers behave.
 */

import { useEffect, useState } from "react";

/**
 * Longest short edge, in CSS pixels, that still counts as a handheld. Set above
 * every phone and through the tablet range on purpose: the desktop build is
 * flown with hover and drag, so a screen with no pointer to hover with is
 * better served by the deck however large it is.
 */
const SHORT_EDGE_MAX = 1100;

function looksHandheld(): boolean {
  if (!window.matchMedia("(pointer: coarse)").matches) return false;
  return Math.min(window.innerWidth, window.innerHeight) <= SHORT_EDGE_MAX;
}

export function useHandheld(fromUserAgent: boolean): boolean {
  const [handheld, setHandheld] = useState(fromUserAgent);

  useEffect(() => {
    if (fromUserAgent) return;

    // Reading the viewport is only possible in the browser, so the first paint
    // has to happen before the answer is known.
    const evaluate = () => setHandheld(looksHandheld());
    evaluate();

    window.addEventListener("resize", evaluate);
    window.addEventListener("orientationchange", evaluate);
    return () => {
      window.removeEventListener("resize", evaluate);
      window.removeEventListener("orientationchange", evaluate);
    };
  }, [fromUserAgent]);

  return handheld;
}
