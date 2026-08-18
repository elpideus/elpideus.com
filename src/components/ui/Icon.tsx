"use client";

/**
 * Icon set.
 *
 * Drawn inline rather than pulled from a package: the whole set is small, the
 * strokes match the rest of the interface, and there is no runtime cost beyond
 * the markup itself. Everything lives on a 24 unit grid.
 */

import type { SVGProps } from "react";

import { LinkIcon } from "@/lib/content/links";
import { KitGroup } from "@/lib/content/kit";
import { PassionKind } from "@/lib/content/passions";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/* Social and contact marks. */

const YouTubeIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
    <path d="M10.3 9.4 15.4 12l-5.1 2.6z" fill="currentColor" stroke="none" />
  </Svg>
);

const GitHubIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9 20.2c-4 1.2-4-2.1-5.6-2.6M15.5 22v-3.4c0-1 .1-1.4-.5-2 2.6-.3 5-1.3 5-5.5a4.3 4.3 0 0 0-1.2-3 4 4 0 0 0-.1-3s-1-.3-3.3 1.2a11.3 11.3 0 0 0-6 0C7.1 4.8 6.1 5.1 6.1 5.1a4 4 0 0 0-.1 3 4.3 4.3 0 0 0-1.2 3c0 4.2 2.4 5.2 5 5.5-.6.6-.6 1.2-.5 2V22" />
  </Svg>
);

const DiscordIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M8.5 6.5a13 13 0 0 1 7 0l.9-1.5c1.7.3 3.3 1 4.2 1.7 1.2 3.2 1.8 6.7 1.6 10.3-1.6 1.2-3.4 2-5.3 2.5l-1-1.6" />
    <path d="M8.2 17.9l-1 1.6a15 15 0 0 1-5.3-2.5c-.2-3.6.4-7.1 1.6-10.3.9-.7 2.5-1.4 4.2-1.7" />
    <circle cx="9" cy="13" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="15" cy="13" r="1.4" fill="currentColor" stroke="none" />
  </Svg>
);

const InstagramIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
  </Svg>
);

const LinkedInIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M8 10.5V17M8 7.4v.1M12 17v-3.6a2 2 0 0 1 4 0V17" />
  </Svg>
);

const TelegramIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="m21 4.5-2.8 14.8c-.2 1-.8 1.2-1.6.8l-4.4-3.3-2.1 2c-.3.3-.5.5-1 .5l.4-4.6L18 6.8c.4-.3-.1-.5-.6-.2L7.2 13.2 2.8 11.9c-1-.3-1-1 .2-1.4l17-6.5c.8-.3 1.4.2 1 1.5z" />
  </Svg>
);

const EmailIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="m3.5 7.5 7.4 5.2c.7.5 1.6.5 2.2 0l7.4-5.2" />
  </Svg>
);

/* Interface glyphs. */

export const DownloadIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3.5v11M8 11l4 3.5 4-3.5M4.5 19h15" />
  </Svg>
);

export const ExternalIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M14 4.5h5.5V10M19 5l-8 8M18 14.5v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4" />
  </Svg>
);

export const CloseIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);

export const ArrowIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4.5 12h15M14 6.5l5.5 5.5L14 17.5" />
  </Svg>
);

export const PlayIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M8.5 5.8 18 12l-9.5 6.2z" fill="currentColor" stroke="none" />
  </Svg>
);

export const SendIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20.5 3.5 10 14M20.5 3.5 14 20.5l-4-6.5-6.5-4z" />
  </Svg>
);

/* Domain glyphs used by the toolkit and passions panels. */

const CodeIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.5 5.5l-3 13" />
  </Svg>
);

const StackIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="m12 3.5 8 4.2-8 4.3-8-4.3zM4 12l8 4.3 8-4.3M4 16.2l8 4.3 8-4.3" />
  </Svg>
);

const DatabaseIcon = (props: IconProps) => (
  <Svg {...props}>
    <ellipse cx="12" cy="6.5" rx="7.5" ry="3" />
    <path d="M4.5 6.5v11c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-11M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" />
  </Svg>
);

const ServerIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3.5" y="4" width="17" height="6.5" rx="2" />
    <rect x="3.5" y="13.5" width="17" height="6.5" rx="2" />
    <path d="M7 7.2v.1M7 16.8v.1" />
  </Svg>
);

const PaletteIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 2-.9 2-1.9 0-1.4-1.2-1.7-1.2-2.8 0-.8.7-1.4 1.6-1.4h1.6a4.5 4.5 0 0 0 4.5-4.5c0-3.6-3.8-6.4-8.5-6.4z" />
    <circle cx="8" cy="11" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="8" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
  </Svg>
);

const GamepadIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M7.5 7.5h9a5 5 0 0 1 5 5.4l-.3 3a2.6 2.6 0 0 1-4.7 1.3l-1.3-1.9H8.8L7.5 17a2.6 2.6 0 0 1-4.7-1.3l-.3-3a5 5 0 0 1 5-5.2z" />
    <path d="M7 11v2.5M5.7 12.2h2.6M15.5 11.5v.1M17.5 13.5v.1" />
  </Svg>
);

const MusicIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9 18V6.5l10-2V16" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="16" r="2.5" />
  </Svg>
);

const FilmIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M7.5 5v14M16.5 5v14M3 12h18M3 8.5h4.5M3 15.5h4.5M16.5 8.5H21M16.5 15.5H21" />
  </Svg>
);

const BookIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 5.5A2 2 0 0 1 6 3.5h13v14H6a2 2 0 0 0-2 2z" />
    <path d="M4 19.5a2 2 0 0 1 2-2h13v3H6a2 2 0 0 1-2-1z" />
  </Svg>
);

export const CompassIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15 9-1.6 4.4L9 15l1.6-4.4z" />
  </Svg>
);

export const SparkIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6.4 6.4l3 3M14.6 14.6l3 3M17.6 6.4l-3 3M9.4 14.6l-3 3" />
  </Svg>
);

const SOCIAL_ICONS: Record<LinkIcon, (props: IconProps) => React.ReactElement> = {
  [LinkIcon.YouTube]: YouTubeIcon,
  [LinkIcon.GitHub]: GitHubIcon,
  [LinkIcon.Discord]: DiscordIcon,
  [LinkIcon.Instagram]: InstagramIcon,
  [LinkIcon.LinkedIn]: LinkedInIcon,
  [LinkIcon.Telegram]: TelegramIcon,
  [LinkIcon.Email]: EmailIcon,
};

const KIT_ICONS: Record<KitGroup, (props: IconProps) => React.ReactElement> = {
  [KitGroup.Languages]: CodeIcon,
  [KitGroup.Frameworks]: StackIcon,
  [KitGroup.Data]: DatabaseIcon,
  [KitGroup.Systems]: ServerIcon,
  [KitGroup.Design]: PaletteIcon,
};

const PASSION_ICONS: Record<PassionKind, (props: IconProps) => React.ReactElement> = {
  [PassionKind.Gaming]: GamepadIcon,
  [PassionKind.Music]: MusicIcon,
  [PassionKind.Editing]: FilmIcon,
  [PassionKind.Writing]: BookIcon,
};

export function SocialGlyph({ icon, ...props }: IconProps & { icon: LinkIcon }) {
  const Component = SOCIAL_ICONS[icon];
  return <Component {...props} />;
}

export function KitGlyph({ group, ...props }: IconProps & { group: KitGroup }) {
  const Component = KIT_ICONS[group];
  return <Component {...props} />;
}

export function PassionGlyph({ kind, ...props }: IconProps & { kind: PassionKind }) {
  const Component = PASSION_ICONS[kind];
  return <Component {...props} />;
}
