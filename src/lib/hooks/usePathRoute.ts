"use client";

/**
 * Keeps the address bar and the map in step.
 *
 * Every star owns a real path (`/about`, `/projects/televault`), so each one is
 * a document a search engine can index rather than a fragment it has to guess
 * at. Arriving at one flies straight there, and moving around rewrites the URL.
 *
 * The rewrite goes through the history API rather than the router on purpose:
 * the map is one continuous scene, and a router navigation would tear the
 * canvas down and rebuild it mid flight. Next.js listens to `replaceState`, so
 * its own idea of the current URL stays correct without any of that.
 *
 * History entries are replaced rather than pushed, because the map is a place
 * rather than a stack of pages. The back button still works: it changes the
 * path and the `popstate` listener flies to whatever it now names.
 *
 * Fragments from the old scheme (`#about`) still arrive from links shared
 * before this existed, so they are translated to their path once on entry and
 * never written again.
 */

import { useEffect } from "react";

import { starFromSlug } from "@/lib/graph/nodes";
import { ORIGIN_PATH, starFromPath, starPath } from "@/lib/seo/routes";
import { TravelIntent, useJourney } from "@/lib/state/journey";

export function usePathRoute(): void {
  useEffect(() => {
    const { focusStar } = useJourney.getState();

    /** Fly to whatever the current path names, from a cold load or a back press. */
    function travelToPath() {
      const target = starFromPath(window.location.pathname);
      if (!target || target === useJourney.getState().focus) return;
      focusStar(target, TravelIntent.Deeplink);
    }

    const legacy = starFromSlug(window.location.hash.replace(/^#/, ""));
    if (legacy) {
      window.history.replaceState(null, "", starPath(legacy));
      focusStar(legacy, TravelIntent.Deeplink);
    } else {
      travelToPath();
    }

    /*
     * Write the path on every change of focus. The first state the store ever
     * reports is the origin, and rewriting the URL for a visit nobody asked for
     * would be noise, so the origin only claims the URL once the visitor has
     * actually been somewhere else.
     */
    let written = false;

    const unsubscribe = useJourney.subscribe((state, previous) => {
      if (state.focus === previous.focus) return;

      const path = starPath(state.focus);
      if (path === ORIGIN_PATH && !written) return;
      written = true;

      const next = `${path}${window.location.search}`;
      if (next === `${window.location.pathname}${window.location.search}`) return;
      window.history.replaceState(null, "", next);
    });

    window.addEventListener("popstate", travelToPath);

    return () => {
      unsubscribe();
      window.removeEventListener("popstate", travelToPath);
    };
  }, []);
}
