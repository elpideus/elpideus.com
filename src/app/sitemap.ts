import type { MetadataRoute } from "next";

import { SITE } from "@/lib/content/links";

/**
 * The site is a single document, so the sitemap is short by design. Sections
 * are stars inside that document rather than routes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
