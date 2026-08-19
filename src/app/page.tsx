import { headers } from "next/headers";
import { userAgent } from "next/server";

import { SiteRoot } from "@/components/SiteRoot";

/**
 * The whole site is one page, in two shapes.
 *
 * Sections are stars rather than scroll positions, so there is nothing to route
 * here either way. All this page decides is which of the two builds the visitor
 * gets, and it decides it from the user agent so a phone never starts loading
 * the desktop scene.
 */
export default async function HomePage() {
  const { device } = userAgent({ headers: await headers() });
  // Tablets count too: the desktop build is flown with hover and drag, neither
  // of which a touch screen has, whatever size it is.
  const handheld = device.type === "mobile" || device.type === "tablet";
  return <SiteRoot handheld={handheld} />;
}
