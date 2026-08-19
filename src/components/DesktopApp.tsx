"use client";

/**
 * Root of the desktop build: the scroll driven star map.
 *
 * Lifted out of the page so the two builds are peers, chosen at runtime by
 * `SiteRoot`, rather than one being the site and the other an exception to it.
 */

import { StarMap } from "@/components/canvas/StarMap";
import { Overlay } from "@/components/overlay/Overlay";

export function DesktopApp() {
  return (
    <main className="relative h-dvh w-screen overflow-hidden">
      <StarMap />
      <Overlay />
    </main>
  );
}
