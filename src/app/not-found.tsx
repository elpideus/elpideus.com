import type { Metadata } from "next";

import { LostView } from "@/components/lost/LostView";

export const metadata: Metadata = {
  title: "Lost signal",
  description: "This coordinate is not on the map.",
  robots: { index: false, follow: true },
};

/** A 404 that stays inside the fiction of the map, and hides a small game. */
export default function NotFound() {
  return <LostView />;
}
