import Link from "next/link";

import { SITE } from "@/lib/content/links";

export const metadata = {
  title: "Lost signal",
  description: "This coordinate is not on the map.",
};

/** A quiet 404 that stays inside the fiction of the map. */
export default function NotFound() {
  return (
    <main className="flex h-dvh w-screen flex-col items-center justify-center gap-4 bg-void px-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">Error 404</p>
      <h1 className="font-display text-[28px] tracking-tight text-frost">
        No star at these coordinates
      </h1>
      <p className="max-w-md text-[13px] leading-relaxed text-mist">
        The address you followed does not correspond to anything on the chart. The map itself is
        still out there, and everything on it is one link away.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 rounded-[3px] border border-signal/45 bg-signal/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-frost transition-colors hover:bg-signal/20"
      >
        Return to Sirius
      </Link>
      <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">{SITE.url}</p>
    </main>
  );
}
