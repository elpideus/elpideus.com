// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

/**
 * Documentation site for elpideus.com.
 *
 * It lives beside the application rather than inside it so the site bundle
 * never carries documentation code, and so the docs can be deployed on their
 * own subdomain later without moving anything.
 */
export default defineConfig({
  site: "https://docs.elpideus.com",
  integrations: [
    starlight({
      title: "elpideus.com",
      description:
        "How the star map is built: architecture, the 3D layer, content model and operations.",
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/elpideus/elpideus.com" },
      ],
      customCss: ["./src/styles/custom.css"],
      sidebar: [
        {
          label: "Start here",
          items: [
            { label: "Overview", slug: "overview" },
            { label: "Getting started", slug: "getting-started" },
          ],
        },
        {
          label: "Architecture",
          items: [
            { label: "Layers", slug: "architecture/layers" },
            { label: "The star graph", slug: "architecture/star-graph" },
            { label: "Navigation and state", slug: "architecture/navigation" },
            { label: "The 3D layer", slug: "architecture/canvas" },
            { label: "The overlay", slug: "architecture/overlay" },
            { label: "The handheld build", slug: "architecture/handheld" },
          ],
        },
        {
          label: "Content",
          items: [
            { label: "Content model", slug: "content/model" },
            { label: "Adding a star", slug: "content/adding-a-star" },
            { label: "Adding a project", slug: "content/adding-a-project" },
          ],
        },
        {
          label: "Services",
          items: [
            { label: "Curriculum PDF", slug: "services/curriculum" },
            { label: "Channel statistics", slug: "services/channel-stats" },
            { label: "Contact delivery", slug: "services/contact" },
          ],
        },
        {
          label: "Operations",
          items: [
            { label: "Design system", slug: "operations/design-system" },
            { label: "Performance", slug: "operations/performance" },
            { label: "Deployment", slug: "operations/deployment" },
            { label: "Roadmap", slug: "operations/roadmap" },
          ],
        },
      ],
    }),
  ],
});
