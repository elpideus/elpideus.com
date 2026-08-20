import { llmsFull } from "@/lib/seo/llms";

/** Every word on the site in one file, so a model can read it in one request. */
export const revalidate = 86400;

export function GET(): Response {
  return new Response(llmsFull(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
