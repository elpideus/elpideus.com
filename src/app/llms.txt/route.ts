import { llmsIndex } from "@/lib/seo/llms";

/**
 * The map of the site for anything that reads markdown rather than pixels.
 * Generated from the content modules, cached for a day.
 */
export const revalidate = 86400;

export function GET(): Response {
  return new Response(llmsIndex(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
