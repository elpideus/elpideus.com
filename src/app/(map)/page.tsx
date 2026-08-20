import type { Metadata } from "next";

import { StarDocument } from "@/components/seo/StarDocument";
import { StarId } from "@/lib/graph/types";
import { starMetadata } from "@/lib/seo/metadata";

/**
 * Sirius, the origin star, and the front door of the site. The map is mounted
 * by the layout above, so the page carries only the readable twin.
 */
export const metadata: Metadata = starMetadata(StarId.Sirius);

export default function HomePage() {
  return <StarDocument id={StarId.Sirius} />;
}
