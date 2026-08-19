"use client";

/**
 * Picks the build.
 *
 * Two separate sites live in this repository by choice: a desktop star map that
 * is flown with a mouse, and a handheld deck that is scrolled with a thumb.
 * They share content, graph and state, and nothing else. Neither is a responsive
 * variant of the other, so the choice is made once, here, and each build is
 * code split behind it: a phone never downloads the desktop scene and a laptop
 * never downloads the deck.
 *
 * The server makes the first call from the user agent, which is what keeps the
 * heavy build off phones entirely. The client may only add to that verdict.
 */

import dynamic from "next/dynamic";

import { useHandheld } from "@/lib/hooks/useHandheld";

const DesktopApp = dynamic(() =>
  import("@/components/DesktopApp").then((module) => module.DesktopApp),
);

const MobileApp = dynamic(() =>
  import("@/components/mobile/MobileApp").then((module) => module.MobileApp),
);

export function SiteRoot({ handheld }: { handheld: boolean }) {
  return useHandheld(handheld) ? <MobileApp /> : <DesktopApp />;
}
