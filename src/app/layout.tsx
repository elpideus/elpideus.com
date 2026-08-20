import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";

import "./globals.css";
import { SITE } from "@/lib/content/links";
import { PROFILE } from "@/lib/content/profile";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: "%s - elpideus",
  },
  description: SITE.description,
  applicationName: "elpideus",
  authors: [{ name: PROFILE.name, url: SITE.url }],
  creator: PROFILE.name,
  publisher: PROFILE.name,
  keywords: [
    "Stefan Narcis Cucoranu",
    "elpideus",
    "full stack developer",
    "full stack developer Italy",
    "remote React developer",
    "Next.js developer",
    "web developer Ostuni",
    "freelance web developer Puglia",
    "three.js",
    "portfolio",
  ],
  category: "technology",
  openGraph: {
    type: "website",
    url: SITE.url,
    title: SITE.title,
    description: SITE.description,
    siteName: "elpideus",
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    // Rich results and AI overviews only quote what they are allowed to show,
    // so nothing is capped here.
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#03040a",
  colorScheme: "dark",
  // The handheld build puts chrome against both edges of the screen, so it has
  // to be told about the notch rather than laid out inside it.
  viewportFit: "cover",
};

/**
 * The document shell only: fonts, tokens and the head.
 *
 * The map is mounted one level down, by the layout of the `(map)` group, so
 * pages that are not part of the map (the 404 and the shader lab) do not get a
 * star field behind them.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
