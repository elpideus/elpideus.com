import type { Metadata } from "next";

import { StarDocument } from "@/components/seo/StarDocument";
import { StarId } from "@/lib/graph/types";
import { starMetadata } from "@/lib/seo/metadata";

/**
 * Canopus, the contact star. The map itself lives in the root layout and is never
 * torn down, so a route only carries the readable twin of its star.
 */
export const metadata: Metadata = starMetadata(StarId.Canopus);

export default function ContactPage() {
  return <StarDocument id={StarId.Canopus} />;
}
