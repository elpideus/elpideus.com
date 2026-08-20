/**
 * Per star metadata.
 *
 * Every star is a document, so every star gets its own title, description,
 * canonical URL and social card. Written once here and applied by the thin
 * route files, which keeps the nine routes free of copy pasted objects.
 */

import type { Metadata } from "next";

import { PROFILE } from "@/lib/content/profile";
import { PROJECT_BY_SLUG } from "@/lib/content/projects";
import { getStar } from "@/lib/graph/nodes";
import { StarDepth, type StarId } from "@/lib/graph/types";
import { absolute } from "./jsonLd";
import { starPageCopy } from "./pages";
import { starPath } from "./routes";

/** Keywords shared by every page, then narrowed per star. */
const BASE_KEYWORDS: readonly string[] = [
  "Stefan Narcis Cucoranu",
  "elpideus",
  "full stack developer",
  "full stack developer Italy",
  "remote React developer",
  "Next.js developer",
  "web developer Ostuni",
  "freelance web developer Puglia",
];

function keywordsFor(id: StarId): string[] {
  const star = getStar(id);
  if (star.depth === StarDepth.Satellite && star.ref) {
    const project = PROJECT_BY_SLUG.get(star.ref);
    return [...(project ? [project.name, ...project.stack] : []), ...BASE_KEYWORDS];
  }
  return [`${star.section} ${PROFILE.name}`, ...BASE_KEYWORDS];
}

export function starMetadata(id: StarId): Metadata {
  const copy = starPageCopy(id);
  const path = starPath(id);
  const url = absolute(path);

  return {
    title: copy.title,
    description: copy.description,
    keywords: keywordsFor(id),
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      title: copy.title,
      description: copy.description,
      siteName: "elpideus",
      locale: "en",
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
    },
  };
}
