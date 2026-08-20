import type { MetadataRoute } from "next";

import { SITE } from "@/lib/content/links";

/**
 * Who may read the map.
 *
 * Everything readable is open, to search engines and to language models alike:
 * being quotable by an assistant is the same kind of discovery as ranking in a
 * result page, and this site has nothing to hide from either. The AI crawlers
 * are named one by one rather than left to the wildcard, because several of
 * them only look for their own user agent and because naming them makes the
 * decision explicit rather than accidental.
 *
 * Only two things are closed: the API, which returns data rather than
 * documents, and the shader lab, which is a workbench.
 */

/** Crawlers that feed answer engines, model training or both. */
const AI_AGENTS: readonly string[] = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "DuckAssistBot",
  "meta-externalagent",
  "MistralAI-User",
  "YouBot",
];

const CLOSED_PATHS: readonly string[] = ["/api/", "/galaxy-lab"];

export default function robots(): MetadataRoute.Robots {
  // The curriculum is a document rather than data, and a PDF that ranks for the
  // name is worth having, so it is carved back out of the closed API.
  const allowance = { allow: ["/", "/api/cv"], disallow: [...CLOSED_PATHS] };

  return {
    rules: [
      { userAgent: "*", ...allowance },
      ...AI_AGENTS.map((userAgent) => ({ userAgent, ...allowance })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
