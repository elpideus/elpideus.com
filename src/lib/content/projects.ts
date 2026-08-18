/** Project satellites hanging off Betelgeuse. */

/** Lifecycle of a project, drives the badge shown on its panel. */
export enum ProjectStatus {
  Active = "Active",
  Shipped = "Shipped",
  UnderNda = "Under NDA",
}

/** What a project link points at. */
export enum ProjectLinkKind {
  Repository = "Repository",
  Website = "Website",
}

export interface ProjectLink {
  readonly kind: ProjectLinkKind;
  readonly href: string;
}

export interface ProjectMedia {
  readonly src: string;
  readonly alt: string;
}

export interface Project {
  /** Matches `StarNode.ref` of its satellite star. */
  readonly slug: string;
  readonly name: string;
  readonly period: string;
  readonly summary: string;
  readonly body: readonly string[];
  readonly status: ProjectStatus;
  readonly stack: readonly string[];
  readonly links: readonly ProjectLink[];
  readonly media: readonly ProjectMedia[];
  readonly client?: string;
}

export const PROJECTS: readonly Project[] = [
  {
    slug: "demido-studio",
    name: "Demido Studio",
    period: "June 2026 - now",
    summary: "An LLM harness that works as an agentic, multi purpose hub.",
    body: [
      "Demido Studio is a harness around large language models built as a general workspace rather than a chat window. It writes and reviews code, manages email and calendar events, analyses markets and keeps a knowledge graph of everything it touches.",
      "The architecture is the interesting part: sub agents with their own skills and permissions, a graph explorer over structured sources, and a side by side view that keeps the human in the loop while work happens.",
    ],
    status: ProjectStatus.Active,
    stack: ["TypeScript", "Agents", "Knowledge graphs", "Desktop UI"],
    links: [{ kind: ProjectLinkKind.Repository, href: "https://github.com/elpideus/demido-studio" }],
    media: [
      { src: "/media/demido-studio/main-page-home-page.jpeg", alt: "Demido Studio home page" },
      { src: "/media/demido-studio/knowledge-graph-window.png", alt: "Knowledge graph window" },
      { src: "/media/demido-studio/side-by-side-view-and-skill-system.png", alt: "Side by side view and skill system" },
      { src: "/media/demido-studio/code-reviewer-sub-agent-working.png", alt: "Code reviewer sub agent at work" },
      { src: "/media/demido-studio/market-analysis-window.png", alt: "Market analysis window" },
      { src: "/media/demido-studio/model-browser-window.png", alt: "Model browser window" },
      { src: "/media/demido-studio/sub-agents-edit-window.png", alt: "Sub agent editor" },
      { src: "/media/demido-studio/full-window-json-graph-explorer-viewer.png", alt: "JSON graph explorer" },
      { src: "/media/demido-studio/sources-details-panel-open.png", alt: "Source details panel" },
    ],
  },
  {
    slug: "lispizzicusi",
    name: "LiSpizzicusi.it",
    period: "August 2026 - now",
    summary: "A clean WordPress theme and plugin for the folk group I play tamburello in.",
    body: [
      "A custom theme paired with a purpose built plugin, written for a real group with real editorial needs rather than assembled from a page builder.",
      "The source lives in a private repository because of licensing, but the site itself is public.",
    ],
    status: ProjectStatus.Active,
    stack: ["WordPress", "PHP", "SCSS"],
    links: [{ kind: ProjectLinkKind.Website, href: "https://lispizzicusi.it" }],
    media: [
      { src: "/media/lispizzicusi/lispizzicusi.it-home-page.png", alt: "LiSpizzicusi.it home page" },
      { src: "/media/lispizzicusi/lispizzicusi.it-logo.png", alt: "Li Spizzicusi logo" },
    ],
  },
  {
    slug: "agrisense",
    name: "Agrisense",
    period: "February 2026 - now",
    summary: "An agricultural IoT platform, under NDA until release.",
    body: [
      "A web platform for agricultural IoT devices: farmers monitor and manage crops in real time, on connections that are often anything but reliable.",
      "I own the stack end to end, from the API and database layer to the interface, with a strong bias towards clarity and stability in rural conditions.",
    ],
    status: ProjectStatus.UnderNda,
    stack: ["Next.js", "React", "Supabase", "PostgreSQL"],
    links: [],
    media: [],
    client: "Alessandro Zago",
  },
  {
    slug: "televault",
    name: "TeleVault",
    period: "March 2026 - now",
    summary: "Self hosted cloud storage on top of Telegram infrastructure.",
    body: [
      "TeleVault turns Telegram into a personal cloud vault: upload, download and organise files while Telegram servers carry the bytes.",
      "It talks to MTProto directly, chunks large files and ships a web interface for browsing the contents.",
    ],
    status: ProjectStatus.Active,
    stack: ["TypeScript", "MTProto", "Node.js"],
    links: [{ kind: ProjectLinkKind.Repository, href: "https://github.com/elpideus/TeleVault" }],
    media: [],
  },
  {
    slug: "peakplay",
    name: "PeakPlay",
    period: "February 2026 - April 2026",
    summary: "The top one hundred songs worldwide, refreshed every day.",
    body: [
      "PeakPlay surfaces what the planet is actually listening to, ranked from millions of streams and updated daily.",
      "Open source, built with a deliberately small architecture and a lot of attention to load performance.",
    ],
    status: ProjectStatus.Shipped,
    stack: ["Next.js", "TypeScript", "Charts"],
    links: [{ kind: ProjectLinkKind.Repository, href: "https://github.com/elpideus/peakplay" }],
    media: [
      { src: "/media/peakplay/peakplay-og-image.png", alt: "PeakPlay cover" },
      { src: "/media/peakplay/peakplay-logo.png", alt: "PeakPlay logo" },
    ],
  },
  {
    slug: "breakout-schematics",
    name: "Breakout Schematics Indicator",
    period: "March 2026 - May 2026",
    summary: "A TradingView Pine Script indicator for high probability breakout patterns.",
    body: [
      "The indicator tracks a configurable consolidation session, locks reference levels at its close and then watches every candle for structured patterns with precise pip thresholds.",
      "Each pattern family runs as an independent state machine, which keeps the logic readable and the signals honest across timeframes and instruments.",
    ],
    status: ProjectStatus.Shipped,
    stack: ["Pine Script", "State machines"],
    links: [
      { kind: ProjectLinkKind.Repository, href: "https://github.com/elpideus/BreakoutSchematicsIndicator" },
    ],
    media: [],
    client: "Giovanni Roma",
  },
] as const;

export const PROJECT_BY_SLUG: ReadonlyMap<string, Project> = new Map(
  PROJECTS.map((project) => [project.slug, project]),
);
