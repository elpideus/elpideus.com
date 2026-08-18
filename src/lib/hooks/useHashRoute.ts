"use client";

/**
 * Keeps the address bar and the map in step.
 *
 * The fragment is the only piece of routing this site has: every star owns one
 * (`#about`, `#televault`), arriving with one flies straight there, and moving
 * around rewrites it. History entries are replaced rather than pushed, because
 * the map is a place rather than a stack of pages, but the browser's back
 * button still works: it changes the fragment and the hashchange listener
 * flies to whatever it now names.
 */

import { useEffect } from "react";

import { getStar, starFromSlug, starSlug } from "@/lib/graph/nodes";
import { StarDepth } from "@/lib/graph/types";
import { TravelIntent, useJourney } from "@/lib/state/journey";

/** The star named by the current fragment, if any. */
function starInHash(): ReturnType<typeof starFromSlug> {
  return starFromSlug(window.location.hash.replace(/^#/, ""));
}

export function useHashRoute(): void {
  useEffect(() => {
    const { focusStar } = useJourney.getState();

    /** Fly to whatever the fragment names, from a cold load or a back press. */
    function travelToHash() {
      const target = starInHash();
      if (!target || target === useJourney.getState().focus) return;
      focusStar(target, TravelIntent.Deeplink);
    }

    // A satellite deep link needs its parent's panel index too, which
    // `focusStar` already handles; the origin needs nothing but a hash clear.
    travelToHash();

    /*
     * Write the fragment on every change of focus. The first state the store
     * ever reports is the origin, and rewriting the URL for a visit nobody
     * asked for would be noise, so the origin only claims the fragment once
     * the visitor has actually been somewhere else.
     */
    let written = false;

    const unsubscribe = useJourney.subscribe((state, previous) => {
      if (state.focus === previous.focus) return;

      const slug = starSlug(state.focus);
      const atOrigin = getStar(state.focus).depth === StarDepth.Primary && state.index === 0;
      if (atOrigin && !written) return;

      written = true;
      const next = `${window.location.pathname}${window.location.search}#${slug}`;
      if (next === `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        return;
      }
      window.history.replaceState(null, "", next);
    });

    window.addEventListener("hashchange", travelToHash);

    return () => {
      unsubscribe();
      window.removeEventListener("hashchange", travelToHash);
    };
  }, []);
}
