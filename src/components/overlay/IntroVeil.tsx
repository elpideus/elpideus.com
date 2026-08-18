"use client";

/**
 * Opening veil.
 *
 * Covers the first moments while shaders compile and the camera settles, then
 * lifts on its own. It carries a single line of text so the first thing the
 * visitor reads is a sentence rather than a loading spinner.
 */

import { useEffect, useState } from "react";
import clsx from "clsx";

import { useJourney } from "@/lib/state/journey";

/** How long the veil lingers after the scene reports itself ready. */
const LINGER_MS = 420;

export function IntroVeil() {
  const ready = useJourney((state) => state.ready);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => setHidden(true), LINGER_MS);
    return () => window.clearTimeout(timer);
  }, [ready]);

  return (
    <div
      className={clsx(
        "pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-void transition-opacity duration-[1200ms] ease-[var(--ease-out-expo)]",
        hidden ? "opacity-0" : "opacity-100",
      )}
      aria-hidden={hidden}
    >
      <div className="text-center">
        <p className="font-display text-[13px] tracking-[0.42em] text-frost uppercase">elpideus</p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.24em] text-dim">
          Charting the map
        </p>
      </div>
    </div>
  );
}
