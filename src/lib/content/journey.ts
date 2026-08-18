/** The year by year trajectory shown on Polaris. */

/** Which side of the story an entry belongs to. */
export enum Track {
  Engineering = "engineering",
  Craft = "craft",
}

/** Where the work sat on the stack at the time. */
export enum StackFocus {
  Backend = "Back end",
  BackendLeaning = "Mostly back end",
  Balanced = "Full stack",
  Agentic = "Full stack, agentic",
  Media = "Media",
}

export interface JourneyEntry {
  readonly year: string;
  readonly title: string;
  readonly body: string;
  readonly focus: StackFocus;
  readonly track: Track;
  readonly tags: readonly string[];
  readonly href?: string;
}

export const ENGINEERING_JOURNEY: readonly JourneyEntry[] = [
  {
    year: "2017",
    title: "PHP on a tablet",
    body: "The bot maker bot I used for Telegram was abandoned by its developer, so I wrote my own. I coded on a tablet and a phone because the family laptop belonged to my father.",
    focus: StackFocus.Backend,
    track: Track.Engineering,
    tags: ["PHP", "Telegram Bot API"],
  },
  {
    year: "2018",
    title: "Python enters the picture",
    body: "A year of experiments: scripts, small automations, and a much better feel for how a language should fit a problem.",
    focus: StackFocus.Backend,
    track: Track.Engineering,
    tags: ["Python"],
  },
  {
    year: "2019",
    title: "A laptop, C# and the first ugly websites",
    body: "The laptop became a gift and Unity became the goal, so I learned C#. On the side, small PHP and Python projects plus my first websites, which taught me HTML, CSS and a little JavaScript.",
    focus: StackFocus.BackendLeaning,
    track: Track.Engineering,
    tags: ["C#", "Unity", "HTML", "CSS"],
  },
  {
    year: "2020",
    title: "Java, Spigot and public questions",
    body: "I learned Java to write my own Minecraft server plugins. My early, slightly embarrassing questions about the tooling are still on the SpigotMC forums: proof of how learning looked before LLMs.",
    focus: StackFocus.Backend,
    track: Track.Engineering,
    tags: ["Java", "Spigot"],
    href: "https://www.spigotmc.org/search/295023700/",
  },
  {
    year: "2021 - 2022",
    title: "School first, code in the gaps",
    body: "I slowed down to focus on mathematics at school. It did not go as planned, but Java kept improving in my free time, and I genuinely loved the language.",
    focus: StackFocus.Backend,
    track: Track.Engineering,
    tags: ["Java"],
  },
  {
    year: "2023",
    title: "Turning towards the web",
    body: "JavaScript got serious. I revisited the first libraries I ever touched, Ajax and jQuery, poked at WordPress and Wix, and shipped my first WordPress plugins.",
    focus: StackFocus.BackendLeaning,
    track: Track.Engineering,
    tags: ["JavaScript", "jQuery", "WordPress"],
  },
  {
    year: "2024",
    title: "React, Next.js and the first client",
    body: "React clicked immediately, although I underestimated how far it goes. Back end and front end grew together, and Sartoria Il Baco from Castelfranco Veneto became my first paid freelance job. Mediocre by today's standards, right for the time.",
    focus: StackFocus.Balanced,
    track: Track.Engineering,
    tags: ["React", "Next.js", "Freelance"],
  },
  {
    year: "2025",
    title: "Depth: interface, motion, design",
    body: "Shadcn, Radix, TanStack Query, three.js, GSAP and a stack of design courses. The year the visual side caught up with the engineering side.",
    focus: StackFocus.Balanced,
    track: Track.Engineering,
    tags: ["three.js", "GSAP", "Radix", "Design"],
  },
  {
    year: "2026",
    title: "Agentic engineering",
    body: "Agentic tools folded into the daily workflow. The architecture instincts and problem solving habits built over the previous years are what make projects like Demido Studio possible.",
    focus: StackFocus.Agentic,
    track: Track.Engineering,
    tags: ["Agents", "Architecture", "TypeScript"],
  },
] as const;

export const CRAFT_JOURNEY: readonly JourneyEntry[] = [
  {
    year: "2019",
    title: "Bandicam and Movie Maker",
    body: "The first laptop also meant the first videos, made in the shadow of the Italian creators I watched: Favij, Gabby16Bit, St3pny and others.",
    focus: StackFocus.Media,
    track: Track.Craft,
    tags: ["Windows Movie Maker", "Bandicam"],
  },
  {
    year: "2020",
    title: "A thousand subscribers",
    body: "I closed the first channel at the end of 2019, opened a second one and passed a thousand subscribers before the end of 2020. PowerDirector, then Sony Vegas Pro for more than half a year.",
    focus: StackFocus.Media,
    track: Track.Craft,
    tags: ["Sony Vegas Pro", "Editing"],
  },
  {
    year: "2021",
    title: "The current channel opens",
    body: "Opened on 24 March 2021 and then left quiet: school, code, people, and a bit of burnout. I kept editing anyway, sometimes purely for fun.",
    focus: StackFocus.Media,
    track: Track.Craft,
    tags: ["YouTube"],
  },
  {
    year: "2022 - 2024",
    title: "The Adobe years",
    body: "Photoshop, Premiere Pro and After Effects, learned properly rather than by accident.",
    focus: StackFocus.Media,
    track: Track.Craft,
    tags: ["Photoshop", "Premiere Pro", "After Effects"],
  },
  {
    year: "2024",
    title: "elpideus goes live",
    body: "Around September 2024 the new channel started publishing, and especially streaming.",
    focus: StackFocus.Media,
    track: Track.Craft,
    tags: ["Streaming"],
  },
  {
    year: "2025 - 2026",
    title: "DaVinci Resolve, and an audience",
    body: "Resolve replaced everything else and still runs the pipeline today. The channel passed 1.4K subscribers and a million views.",
    focus: StackFocus.Media,
    track: Track.Craft,
    tags: ["DaVinci Resolve"],
  },
] as const;
