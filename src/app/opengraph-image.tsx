import { SITE } from "@/lib/content/links";
import { StarId } from "@/lib/graph/types";
import { OG_CONTENT_TYPE, OG_SIZE, starCard } from "@/lib/seo/ogCard";

/**
 * The site wide social card, and the fallback for anything without its own.
 * The drawing lives in `lib/seo/ogCard` so every star can share it.
 */
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = SITE.title;

export default function OpengraphImage() {
  return starCard(StarId.Sirius);
}
