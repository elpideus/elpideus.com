import type { MetadataRoute } from "next";

import { SITE } from "@/lib/content/links";

/**
 * Installability is not the point here: the manifest exists so the name, the
 * colours and the icon are declared once, in the place search engines and
 * mobile browsers look for them.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.title,
    short_name: "elpideus",
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#03040a",
    theme_color: "#03040a",
    lang: "en",
    categories: ["portfolio", "developer", "design"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
