/**
 * Structured data for the whole map.
 *
 * Two audiences read this and neither of them can see the canvas: search
 * engines building an entity for the person, and language models answering a
 * question about him. Everything here is derived from `lib/content`, so the
 * graph can never drift from the copy on the site.
 *
 * One entity is declared once and referenced by `@id` everywhere else, which is
 * what lets Google merge the pages into a single person rather than nine
 * unrelated documents.
 */

import { CHANNEL } from "@/lib/content/studio";
import { CONTACT } from "@/lib/content/contact";
import { KIT } from "@/lib/content/kit";
import { PROFILE } from "@/lib/content/profile";
import { PROJECTS, ProjectLinkKind, ProjectStatus, type Project } from "@/lib/content/projects";
import { SITE, SOCIALS } from "@/lib/content/links";
import { getStar, starByRef } from "@/lib/graph/nodes";
import { StarDepth, StarId } from "@/lib/graph/types";
import { starPageCopy } from "./pages";
import { ORIGIN_PATH, starPath } from "./routes";

/** A JSON-LD node. Values are whatever `JSON.stringify` accepts. */
export type JsonLdNode = Record<string, unknown>;

/** Stable identifiers, so every page points at the same entities. */
export const PERSON_ID = `${SITE.url}/#person`;
export const WEBSITE_ID = `${SITE.url}/#website`;

/** Absolute URL for a path on this site. */
export function absolute(path: string): string {
  return path === ORIGIN_PATH ? SITE.url : `${SITE.url}${path}`;
}

/** Everything the person is credibly an expert in, taken from the toolkit. */
function knowsAbout(): readonly string[] {
  const tools = KIT.flatMap((section) => section.items);
  return [
    "Full stack web development",
    "Front end architecture",
    "User interface design",
    "Video editing",
    ...tools,
  ];
}

export function personNode(): JsonLdNode {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: PROFILE.name,
    alternateName: ["elpideus", "Stefan Cucoranu"],
    url: SITE.url,
    mainEntityOfPage: SITE.url,
    image: `${SITE.url}/opengraph-image`,
    jobTitle: PROFILE.role,
    description: PROFILE.lede,
    email: `mailto:${PROFILE.email}`,
    knowsLanguage: ["Italian", "English", "Romanian", "Mandarin Chinese"],
    knowsAbout: knowsAbout(),
    nationality: { "@type": "Country", name: "Italy" },
    homeLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Ostuni",
        addressRegion: "Puglia",
        addressCountry: "IT",
      },
    },
    // The site says he is open to work, so the graph should say it too.
    seeks: {
      "@type": "Demand",
      name: CONTACT.availability,
    },
    sameAs: SOCIALS.filter((link) => link.href.startsWith("https://")).map((link) => link.href),
  };
}

export function websiteNode(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE.url,
    name: "elpideus",
    alternateName: SITE.title,
    description: SITE.description,
    inLanguage: "en",
    publisher: { "@id": PERSON_ID },
    author: { "@id": PERSON_ID },
    copyrightHolder: { "@id": PERSON_ID },
    license: "https://www.gnu.org/licenses/gpl-3.0.html",
  };
}

/** Schema type that fits a project, judged by what it links out to. */
function projectType(project: Project): string {
  if (project.links.some((link) => link.kind === ProjectLinkKind.Website)) return "WebSite";
  if (project.links.some((link) => link.kind === ProjectLinkKind.Repository)) {
    return "SoftwareApplication";
  }
  return "CreativeWork";
}

export function projectNode(project: Project): JsonLdNode {
  // Satellites carry the project slug in `ref`, which is the join between the
  // two datasets.
  const star = starByRef(project.slug);
  const url = absolute(starPath(star ? star.id : StarId.Betelgeuse));

  const node: JsonLdNode = {
    "@type": projectType(project),
    "@id": `${url}#project`,
    name: project.name,
    url,
    description: project.summary,
    abstract: project.body.join(" "),
    author: { "@id": PERSON_ID },
    creator: { "@id": PERSON_ID },
    keywords: project.stack.join(", "),
    inLanguage: "en",
  };

  if (projectType(project) === "SoftwareApplication") {
    node.applicationCategory = "DeveloperApplication";
    node.operatingSystem = "Any";
  }
  if (project.media.length > 0) {
    node.image = project.media.map((item) => `${SITE.url}${item.src}`);
  }
  if (project.links.length > 0) {
    node.sameAs = project.links.map((link) => link.href);
  }
  if (project.client) {
    node.sponsor = { "@type": "Person", name: project.client };
  }
  if (project.status === ProjectStatus.Shipped) {
    node.creativeWorkStatus = "Published";
  }
  return node;
}

/** Trail from the origin to a star, so results show a readable path. */
function breadcrumbNode(id: StarId): JsonLdNode {
  const star = getStar(id);
  const trail: StarId[] = [];
  if (star.parent) trail.push(star.parent);
  trail.push(id);

  const items = [
    { name: "Home", item: SITE.url },
    ...trail.map((step) => ({
      name: getStar(step).section,
      item: absolute(starPath(step)),
    })),
  ];

  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}

/** Page type that matches what the star actually holds. */
function pageType(id: StarId): string {
  switch (id) {
    case StarId.Sirius:
    case StarId.Vega:
      return "ProfilePage";
    case StarId.Canopus:
      return "ContactPage";
    case StarId.Betelgeuse:
      return "CollectionPage";
    case StarId.Antares:
    case StarId.Polaris:
      return "AboutPage";
    default:
      return "WebPage";
  }
}

/**
 * The full graph for one star's page: the page itself, the person, the site,
 * and whatever the star holds.
 */
export function starGraph(id: StarId): JsonLdNode {
  const star = getStar(id);
  const copy = starPageCopy(id);
  const url = absolute(starPath(id));

  const page: JsonLdNode = {
    "@type": pageType(id),
    "@id": `${url}#page`,
    url,
    name: copy.title,
    description: copy.description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
    inLanguage: "en",
    primaryImageOfPage: `${SITE.url}/opengraph-image`,
    breadcrumb: breadcrumbNode(id),
  };

  if (pageType(id) === "ProfilePage") {
    page.mainEntity = { "@id": PERSON_ID };
  }

  const graph: JsonLdNode[] = [page, personNode(), websiteNode()];

  if (id === StarId.Betelgeuse) {
    graph.push({
      "@type": "ItemList",
      "@id": `${url}#projects`,
      name: "Projects by Stefan Narcis Cucoranu",
      numberOfItems: PROJECTS.length,
      itemListElement: PROJECTS.map((project, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absolute(`/projects/${project.slug}`),
        name: project.name,
      })),
    });
    graph.push(...PROJECTS.map(projectNode));
  }

  if (star.depth === StarDepth.Satellite && star.ref) {
    const project = PROJECTS.find((entry) => entry.slug === star.ref);
    if (project) {
      page.mainEntity = { "@id": `${url}#project` };
      graph.push(projectNode(project));
    }
  }

  if (id === StarId.Rigel) {
    graph.push({
      "@type": "ProfilePage",
      "@id": `${url}#channel`,
      name: `${CHANNEL.name} on YouTube`,
      url: CHANNEL.href,
      about: { "@id": PERSON_ID },
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
