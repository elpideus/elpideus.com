/**
 * What each star says to a machine.
 *
 * The panels on the map are written for a person who is already here. A search
 * result, an AI overview or a model citation gets one line and has to decide
 * from it, so every star also carries a title and a description written for
 * that reader: the name first, the role second, the section third.
 *
 * Copy lives here rather than inline in the routes for the same reason the rest
 * of the copy lives in `lib/content`: one place to edit, one place to translate.
 */

import { PROFILE } from "@/lib/content/profile";
import { PROJECT_BY_SLUG } from "@/lib/content/projects";
import { getStar } from "@/lib/graph/nodes";
import { StarDepth, StarId } from "@/lib/graph/types";

export interface StarPageCopy {
  /** Title tag, before the site template appends the brand. */
  readonly title: string;
  /** Meta description. One or two sentences, under 160 characters. */
  readonly description: string;
  /** H1 of the server rendered document for this star. */
  readonly heading: string;
  /** Opening paragraph, used when a model wants a single quotable line. */
  readonly summary: string;
}

const SECTION_COPY: Partial<Record<StarId, StarPageCopy>> = {
  [StarId.Sirius]: {
    title: `${PROFILE.name} (elpideus), ${PROFILE.role}`,
    description:
      "Stefan Narcis Cucoranu (elpideus) is a self taught full stack developer, designer and video maker from Ostuni, Italy, open to remote work. Projects, stack and contact.",
    heading: `${PROFILE.name}, ${PROFILE.role}`,
    summary:
      "Stefan Narcis Cucoranu, known online as elpideus, is a self taught full stack developer, designer and video maker based in Ostuni, Puglia, Italy, working remotely with distributed teams. He builds web products end to end: architecture, data, interface and motion, mostly in TypeScript, React and Next.js.",
  },
  [StarId.Vega]: {
    title: `About ${PROFILE.name}`,
    description:
      "How Stefan Narcis Cucoranu works and what he believes about software: self taught since 2017, problem first, detail obsessed, open source by default.",
    heading: `About ${PROFILE.name}`,
    summary:
      "Stefan Narcis Cucoranu has been building software since 2017, when he wrote his first PHP Telegram bot on a tablet. Almost everything on this site is self taught, and these are the principles the work is built on.",
  },
  [StarId.Polaris]: {
    title: `Trajectory: ${PROFILE.name}, 2017 to today`,
    description:
      "Year by year: PHP in 2017, Python, C#, Java, then JavaScript, React and Next.js, and a parallel decade of video editing from Movie Maker to DaVinci Resolve.",
    heading: "Trajectory, one year at a time",
    summary:
      "A year by year record of how Stefan Narcis Cucoranu learned to build software and to edit video, from a first PHP bot written on a tablet in 2017 to agentic engineering in TypeScript today.",
  },
  [StarId.Betelgeuse]: {
    title: `Projects by ${PROFILE.name}`,
    description:
      "Shipped work by Stefan Narcis Cucoranu: Demido Studio, Agrisense, TeleVault, PeakPlay, LiSpizzicusi.it and the Breakout Schematics indicator.",
    heading: "Projects",
    summary:
      "Six projects, from an agentic LLM harness to an agricultural IoT platform, a Telegram backed cloud vault, a daily music chart, a WordPress site for a folk group and a TradingView indicator.",
  },
  [StarId.Rigel]: {
    title: "Studio: video, editing and the elpideus channel",
    description:
      "Stefan Narcis Cucoranu has edited video since 2019, now in DaVinci Resolve. The elpideus YouTube channel passed 1.4K subscribers and a million views.",
    heading: "Studio",
    summary:
      "The other half of the craft: editing since 2019, through Windows Movie Maker, Sony Vegas and the Adobe suite, and now DaVinci Resolve, published on the elpideus YouTube channel.",
  },
  [StarId.Antares]: {
    title: `Toolkit and stack of ${PROFILE.name}`,
    description:
      "The full stack: TypeScript, JavaScript, Java, Kotlin, Python, PHP, React, Next.js, Node, PostgreSQL, Prisma, Linux, Vercel, DaVinci Resolve and Figma.",
    heading: "Toolkit",
    summary:
      "Languages, frameworks, databases, systems and creative tools that Stefan Narcis Cucoranu works with day to day, grouped by what they are actually for.",
  },
  [StarId.Aldebaran]: {
    title: "Passions: games, music, editing and writing",
    description:
      "What fuels the work: Genshin Impact and Cyberpunk 2077, tamburello with Li Spizzicusi, video editing, and a fantasy saga in progress.",
    heading: "Passions",
    summary:
      "Gaming, music, video editing and writing: the interests that shape how Stefan Narcis Cucoranu designs interfaces and paces a piece of work.",
  },
  [StarId.Proxima]: {
    title: "Journal, coming soon",
    description:
      "A writing space on engineering, design and video craft is coming, on a small custom CMS rather than someone else's platform.",
    heading: "Journal",
    summary:
      "The journal is not lit yet. It will hold notes on engineering, design and the craft behind the videos, published on a small custom CMS.",
  },
  [StarId.Canopus]: {
    title: `Contact ${PROFILE.name}`,
    description:
      "Open to remote work and distributed teams. Reach Stefan Narcis Cucoranu by email at elpideus@gmail.com, or on GitHub, LinkedIn, YouTube, Telegram and Discord.",
    heading: `Contact ${PROFILE.name}`,
    summary:
      "Stefan Narcis Cucoranu is open to remote roles, freelance work and collaborations, and usually answers within a day or two.",
  },
};

/** Title, description and heading for any star, satellites included. */
export function starPageCopy(id: StarId): StarPageCopy {
  const section = SECTION_COPY[id];
  if (section) return section;

  const star = getStar(id);
  if (star.depth !== StarDepth.Satellite || !star.ref) {
    throw new Error(`Star has no page copy: ${id}`);
  }

  const project = PROJECT_BY_SLUG.get(star.ref);
  if (!project) throw new Error(`Satellite has no project: ${star.ref}`);

  return {
    title: `${project.name} by ${PROFILE.name}`,
    description: `${project.summary} Built by Stefan Narcis Cucoranu with ${project.stack.slice(0, 3).join(", ")}.`,
    heading: project.name,
    summary: project.summary,
  };
}
