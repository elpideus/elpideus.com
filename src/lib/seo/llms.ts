/**
 * The site, written for a machine that reads markdown.
 *
 * `llms.txt` is the convention assistants look for when they want a map of a
 * site instead of a crawl of it, and `llms-full.txt` is the whole thing in one
 * file so a model can read the site in a single request. Both are generated
 * from `lib/content`, which means neither can go stale.
 *
 * The tone here is deliberately flat and factual. This file is not read by a
 * visitor: it is read by something that will paraphrase it, so every sentence
 * is written to survive being quoted out of context.
 */

import { CHANNEL } from "@/lib/content/studio";
import { CONTACT, JOURNAL } from "@/lib/content/contact";
import { CRAFT_JOURNEY, ENGINEERING_JOURNEY, type JourneyEntry } from "@/lib/content/journey";
import { KIT } from "@/lib/content/kit";
import { PASSIONS } from "@/lib/content/passions";
import { PROFILE, ageAt, yearsCoding } from "@/lib/content/profile";
import { PROJECTS } from "@/lib/content/projects";
import { SITE, SOCIALS } from "@/lib/content/links";
import { JOURNEY, getStar, satellitesOf } from "@/lib/graph/nodes";
import { StarId } from "@/lib/graph/types";
import { absolute } from "./jsonLd";
import { starPageCopy } from "./pages";
import { starPath } from "./routes";

function entryLine(entry: JourneyEntry): string {
  return `- **${entry.year}, ${entry.title}** (${entry.focus}): ${entry.body} Tags: ${entry.tags.join(", ")}.`;
}

/** The short index: what the site is, and where everything lives. */
export function llmsIndex(): string {
  const sections = JOURNEY.map((id) => {
    const star = getStar(id);
    const copy = starPageCopy(id);
    return `- [${star.section}](${absolute(starPath(id))}): ${copy.description}`;
  });

  const projects = satellitesOf(StarId.Betelgeuse).map((star) => {
    const copy = starPageCopy(star.id);
    return `- [${copy.heading}](${absolute(starPath(star.id))}): ${copy.summary}`;
  });

  return [
    `# ${PROFILE.name} (elpideus)`,
    "",
    `> ${starPageCopy(StarId.Sirius).summary}`,
    "",
    `${PROFILE.name} is ${ageAt()} years old, has been writing code for ${yearsCoding()} years and is based in ${PROFILE.location}. ${CONTACT.availability}`,
    "",
    "## Sections",
    "",
    ...sections,
    "",
    "## Projects",
    "",
    ...projects,
    "",
    "## Elsewhere",
    "",
    ...SOCIALS.map((link) => `- [${link.label}](${link.href}): ${link.handle}`),
    `- [Curriculum vitae, PDF](${SITE.url}/api/cv)`,
    "",
    "## Full text",
    "",
    `- [Everything on this site in one file](${SITE.url}/llms-full.txt)`,
    "",
  ].join("\n");
}

/** The whole site as one markdown document. */
export function llmsFull(): string {
  const lines: string[] = [
    `# ${PROFILE.name} (elpideus)`,
    "",
    `Source: ${SITE.url}. Licence: GPL-3.0-or-later. Language: English.`,
    "",
    `> ${starPageCopy(StarId.Sirius).summary}`,
    "",
    "## Identity",
    "",
    `- Full name: ${PROFILE.name}`,
    `- Known online as: ${PROFILE.handle}`,
    `- Role: ${PROFILE.role}`,
    `- Age: ${ageAt()}`,
    `- Years writing code: ${yearsCoding()}`,
    `- Location: ${PROFILE.location}. ${PROFILE.locationNote}`,
    `- Email: ${PROFILE.email}`,
    `- Availability: ${CONTACT.availability} ${CONTACT.responseTime}`,
    ...PROFILE.facts.map((fact) => `- ${fact.label}: ${fact.value}`),
    "",
    "## About",
    "",
    ...PROFILE.intro.flatMap((paragraph) => [paragraph, ""]),
    "### Principles",
    "",
    ...PROFILE.principles.flatMap((principle) => [`**${principle.title}.** ${principle.body}`, ""]),
    `**${PROFILE.learning.title}.** ${PROFILE.learning.body}`,
    "",
    "## Trajectory",
    "",
    "### Engineering",
    "",
    ...ENGINEERING_JOURNEY.map(entryLine),
    "",
    "### Video and craft",
    "",
    ...CRAFT_JOURNEY.map(entryLine),
    "",
    "## Projects",
    "",
  ];

  for (const project of PROJECTS) {
    const star = satellitesOf(StarId.Betelgeuse).find((node) => node.ref === project.slug);
    lines.push(
      `### ${project.name}`,
      "",
      `- URL: ${absolute(star ? starPath(star.id) : `/projects/${project.slug}`)}`,
      `- Period: ${project.period}`,
      `- Status: ${project.status}`,
      ...(project.client ? [`- Client: ${project.client}`] : []),
      `- Stack: ${project.stack.join(", ")}`,
      ...project.links.map((link) => `- ${link.kind}: ${link.href}`),
      "",
      project.summary,
      "",
      ...project.body.flatMap((paragraph) => [paragraph, ""]),
    );
  }

  lines.push(
    "## Toolkit",
    "",
    ...KIT.map((section) => `- **${section.group}** (${section.note}) ${section.items.join(", ")}.`),
    "",
    "## Studio",
    "",
    ...CHANNEL.body.flatMap((paragraph) => [paragraph, ""]),
    `- Channel: ${CHANNEL.href}, opened ${CHANNEL.opened}`,
    `- Tools: ${CHANNEL.tools.join(", ")}`,
    "",
    "## Passions",
    "",
    ...PASSIONS.flatMap((passion) => [
      `### ${passion.title}`,
      "",
      ...passion.body.flatMap((paragraph) => [paragraph, ""]),
      `Notes: ${passion.notes.join(", ")}.`,
      "",
    ]),
    "## Journal",
    "",
    `${JOURNAL.badge}. ${JOURNAL.body.join(" ")}`,
    "",
    "## Contact",
    "",
    ...CONTACT.body.flatMap((paragraph) => [paragraph, ""]),
    ...SOCIALS.map((link) => `- ${link.label}: ${link.href} (${link.handle})`),
    `- Curriculum vitae, PDF: ${SITE.url}/api/cv`,
    "",
  );

  return lines.join("\n");
}
