import { starCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/ogCard";
import { StarId } from "@/lib/graph/types";
import { starPageCopy } from "@/lib/seo/pages";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = starPageCopy(StarId.Betelgeuse).title;

export default function Image() {
  return starCard(StarId.Betelgeuse);
}
