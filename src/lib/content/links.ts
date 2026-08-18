/** Outbound links and the social graph. */

/** Icon key resolved by the icon registry in `components/ui/Icon.tsx`. */
export enum LinkIcon {
  YouTube = "youtube",
  GitHub = "github",
  Discord = "discord",
  Instagram = "instagram",
  LinkedIn = "linkedin",
  Telegram = "telegram",
  Email = "email",
}

export interface SocialLink {
  readonly label: string;
  readonly handle: string;
  readonly href: string;
  readonly icon: LinkIcon;
}

export const SOCIALS: readonly SocialLink[] = [
  { label: "YouTube", handle: "@elpideus", href: "https://youtube.com/@elpideus", icon: LinkIcon.YouTube },
  { label: "GitHub", handle: "elpideus", href: "https://github.com/elpideus", icon: LinkIcon.GitHub },
  { label: "Discord", handle: "LUMI", href: "https://discord.gg/qMaZ2dpSHP", icon: LinkIcon.Discord },
  { label: "Instagram", handle: "@elpideus", href: "https://instagram.com/elpideus", icon: LinkIcon.Instagram },
  { label: "LinkedIn", handle: "in/elpideus", href: "https://www.linkedin.com/in/elpideus/", icon: LinkIcon.LinkedIn },
  { label: "Telegram", handle: "@elpideus", href: "https://t.me/elpideus", icon: LinkIcon.Telegram },
  { label: "Email", handle: "elpideus@gmail.com", href: "mailto:elpideus@gmail.com", icon: LinkIcon.Email },
] as const;

export const SITE = {
  url: "https://elpideus.com",
  repository: "https://github.com/elpideus/elpideus.com",
  title: "elpideus - Stefan Narcis Cucoranu",
  description:
    "Full stack developer, designer and video maker from Ostuni, Italy. A scroll driven star map of projects, tools and story.",
} as const;
