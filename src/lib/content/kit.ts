/** The toolkit shown on Antares. */

/** Groups of the stack, ordered the way they are rendered. */
export enum KitGroup {
  Languages = "Languages",
  Frameworks = "Frameworks and runtimes",
  Data = "Data",
  Systems = "Systems and shipping",
  Design = "Design and video",
}

export interface KitSection {
  readonly group: KitGroup;
  readonly note: string;
  readonly items: readonly string[];
}

export const KIT: readonly KitSection[] = [
  {
    group: KitGroup.Languages,
    note: "Nine years of picking the right one for the problem.",
    items: ["TypeScript", "JavaScript", "Java", "Kotlin", "Python", "PHP", "Bash", "HTML", "CSS", "Sass"],
  },
  {
    group: KitGroup.Frameworks,
    note: "Where most of the daily work happens.",
    items: ["Node", "Bun", "Next.js", "React", "Express", "Tailwind", "discord.js"],
  },
  {
    group: KitGroup.Data,
    note: "Relational by default, document when it earns it.",
    items: ["PostgreSQL", "MySQL", "SQLite", "MongoDB", "Prisma"],
  },
  {
    group: KitGroup.Systems,
    note: "Linux at home, everywhere from a VPS to the edge.",
    items: ["Linux", "Fedora", "Arch", "Debian", "Ubuntu", "Kali", "Windows", "Nginx", "Vercel", "Git", "GitHub"],
  },
  {
    group: KitGroup.Design,
    note: "The other half of the craft.",
    items: ["DaVinci Resolve", "Premiere Pro", "After Effects", "Photoshop", "Illustrator", "Figma"],
  },
] as const;
