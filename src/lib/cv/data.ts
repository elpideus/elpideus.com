/**
 * Curriculum content.
 *
 * Kept separate from the PDF layout so the wording can be edited without
 * touching typography, and so the same data could feed a future HTML version.
 * Everything here is plain text on purpose: the generated file has to survive
 * being parsed by applicant tracking systems.
 */

import { PROFILE } from "@/lib/content/profile";

export interface CvEntry {
  readonly title: string;
  readonly meta: string;
  readonly subtitle?: string;
  readonly bullets: readonly string[];
}

export interface CvSection {
  readonly heading: string;
  readonly entries: readonly CvEntry[];
}

export interface CvSkillRow {
  readonly label: string;
  readonly items: readonly string[];
}

export const CV = {
  name: PROFILE.name,
  role: "Full Stack Web Developer & Designer",
  contact: [
    PROFILE.email,
    "github.com/elpideus",
    "linkedin.com/in/elpideus",
    "Ostuni, Italy · Available remotely",
  ],
  profile:
    "Self taught full stack web developer with experience in startup environments and freelance work, focused on fast, clean and maintainable digital products. I work across the whole stack, from database to interface, with a minimalist approach: no superfluous dependencies, light architectures, code that scales without becoming complex. Currently employed remotely at Agrisense, where I build the IoT web platform for agricultural devices with Next.js, React and Supabase. Active open source contributor with experience serving private clients across different technical domains.",

  experience: {
    heading: "Experience",
    entries: [
      {
        title: "Agrisense",
        meta: "Feb 2026 - present · Remote",
        subtitle: "Full Stack Developer",
        bullets: [
          "Development and maintenance of the web platform for agricultural IoT devices, used by farmers for real time crop monitoring and management.",
          "Responsible for the entire stack: API architecture with Supabase (authentication, PostgreSQL, realtime), front end with Next.js and React.",
          "Interfaces designed for rural contexts: data clarity, accessibility and stability under limited connectivity.",
          "Security, performance and scalability best practices inside an agile team.",
        ],
      },
      {
        title: "Breakout Schematics: TradingView Indicator",
        meta: "Mar 2026 - May 2026 · Remote · Private client",
        subtitle: "Pine Script Developer · commissioned work",
        bullets: [
          "Commissioned development of an advanced TradingView indicator that automatically detects high probability breakout patterns (SSA, S1, MUT) through an architecture of independent state machines.",
          "Tracks a configurable consolidation session, locks reference levels at close and inspects every candle for structured patterns with precise pip thresholds.",
          "Signal rendering with labels, triangular markers and native alert support; compatible with every timeframe and instrument (forex, indices, commodities).",
        ],
      },
      {
        title: "Social Media Manager",
        meta: "2021 - 2022 · Ostuni, Italy",
        subtitle: "Local company · channel management and content production",
        bullets: [
          "Direction and production of all visual content: video, photography and promotional graphics.",
          "Editorial calendar and publishing strategy defined to maximise reach and engagement.",
        ],
      },
      {
        title: "Freelance · Sartoria Il Baco",
        meta: "Late 2024 · Castelfranco Veneto, Italy",
        subtitle: "Web Designer & Developer",
        bullets: [
          "Design and development of an illustrated single page site built with React and custom CSS; UI prototyping in Figma.",
        ],
      },
    ],
  } satisfies CvSection,

  projects: {
    heading: "Selected projects",
    entries: [
      {
        title: "Demido Studio",
        meta: "2026 · github.com/elpideus/demido-studio",
        subtitle: "Agentic LLM harness and multi purpose workspace",
        bullets: [
          "Harness around large language models built as a general workspace: writes and reviews code, manages email and calendar, analyses markets and maintains a knowledge graph of every source it touches.",
          "Sub agent architecture with per agent skills and permissions, plus a graph explorer over structured data.",
        ],
      },
      {
        title: "TeleVault",
        meta: "2026 · github.com/elpideus/TeleVault",
        subtitle: "Self hosted cloud storage on Telegram infrastructure",
        bullets: [
          "Open source application that turns Telegram into a personal cloud vault: upload, download and organisation of files using Telegram servers as free storage.",
          "Direct integration of the Telegram APIs (MTProto), chunking for large files and a web interface for browsing content.",
        ],
      },
      {
        title: "PeakPlay",
        meta: "2026 · github.com/elpideus/peakplay",
        subtitle: "Daily top one hundred songs worldwide",
        bullets: [
          "Discover the top global songs updated daily, ranked from millions of streams.",
          "Open source project built with attention to performance and to architectural simplicity.",
        ],
      },
      {
        title: "LiSpizzicusi.it",
        meta: "2026 · lispizzicusi.it",
        subtitle: "Custom WordPress theme and plugin",
        bullets: [
          "Theme and companion plugin written for a folk group, with editorial needs handled in code rather than through a page builder.",
        ],
      },
    ],
  } satisfies CvSection,

  skills: [
    { label: "Languages", items: ["TypeScript", "JavaScript", "Java", "Kotlin", "Python", "PHP", "Bash"] },
    { label: "Front end", items: ["React", "Next.js", "Tailwind", "HTML5", "SCSS / CSS", "three.js"] },
    { label: "Back end", items: ["Node.js", "Bun", "Express", "REST APIs", "discord.js"] },
    { label: "Data", items: ["PostgreSQL", "MySQL", "SQLite", "MongoDB", "Prisma", "Supabase"] },
    { label: "Systems", items: ["Linux", "Nginx", "Vercel", "Git", "GitHub"] },
    { label: "Design & video", items: ["Figma", "Photoshop", "Illustrator", "DaVinci Resolve", "After Effects", "Premiere Pro"] },
  ] satisfies readonly CvSkillRow[],

  education: {
    heading: "Education",
    entries: [
      {
        title: "Scientific High School Diploma",
        meta: "2019 - 2022",
        subtitle: 'Liceo "L. Pepe - A. Calamo", Ostuni · scientific studies and computer science',
        bullets: [],
      },
      {
        title: "Technical Institute",
        meta: "2017 - 2019",
        subtitle: "Pantanelli-Monnet, Ostuni · technical and commercial IT disciplines",
        bullets: [],
      },
    ],
  } satisfies CvSection,

  other: [
    "Active contributor to open source projects.",
    "Fluent in Italian, English and Romanian. Currently learning Mandarin Chinese.",
    "Oriented towards remote work and distributed teams.",
    "Content creator: YouTube channel with more than 1.4K subscribers and over one million views.",
  ],
} as const;
