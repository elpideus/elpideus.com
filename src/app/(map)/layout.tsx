import { headers } from "next/headers";
import { userAgent } from "next/server";

import { SiteRoot } from "@/components/SiteRoot";
import { TouchLayout } from "@/lib/state/layout";

/**
 * Mounts the map once, for every star.
 *
 * Each star owns a route, and a route change must never tear the scene down.
 * This layout is the one part of the tree Next.js keeps across a navigation, so
 * the canvas is built here and each page below contributes only the readable
 * twin of its star. Moving between stars does not navigate at all: the journey
 * store rewrites the URL through the history API instead.
 *
 * Which of the two builds a visitor gets is decided from the user agent, so a
 * phone never starts loading the desktop scene, and the client is free to
 * correct the verdict once it can measure the screen.
 */
export default async function MapLayout({ children }: { children: React.ReactNode }) {
  const { device } = userAgent({ headers: await headers() });
  // Tablets count too: the desktop build is flown with hover and drag, neither
  // of which a touch screen has, whatever size it is.
  const handheld = device.type === "mobile" || device.type === "tablet";
  const layout = device.type === "tablet" ? TouchLayout.Bridge : TouchLayout.Deck;

  return (
    <>
      <SiteRoot handheld={handheld} layout={layout} />
      {children}
    </>
  );
}
