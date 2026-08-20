import type { MetadataRoute } from "next";

import { PROJECTS } from "@/lib/content/projects";
import { SITE } from "@/lib/content/links";
import { JOURNEY, getStar, satellitesOf } from "@/lib/graph/nodes";
import { StarDepth, StarId } from "@/lib/graph/types";
import { absolute } from "@/lib/seo/jsonLd";
import { starPath } from "@/lib/seo/routes";

/**
 * One entry per star.
 *
 * The site is one continuous scene, but it is not one document: every star has
 * its own address, its own copy and its own social card, so every star belongs
 * here. Priority follows the journey, since the order the map walks is also the
 * order the sections matter in.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const satellites = satellitesOf(StarId.Betelgeuse);

  const stars = [...JOURNEY, ...satellites.map((star) => star.id)].map((id) => {
    const star = getStar(id);
    const satellite = star.depth === StarDepth.Satellite;
    const project = satellite ? PROJECTS.find((entry) => entry.slug === star.ref) : undefined;

    return {
      url: absolute(starPath(id)),
      lastModified,
      changeFrequency: (satellite ? "monthly" : "weekly") as "monthly" | "weekly",
      priority: id === StarId.Sirius ? 1 : satellite ? 0.6 : 0.8,
      images: project?.media.map((item) => `${SITE.url}${item.src}`),
    };
  });

  return [
    ...stars,
    {
      url: `${SITE.url}/api/cv`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];
}
