"use client";

/**
 * Hidden cheat code, in the spirit of the Konami one.
 *
 * Typing `404BH` anywhere on the map falls through to the black hole page.
 * The sequence is matched against a rolling buffer rather than an index, so a
 * mistyped key never dead ends the visitor: they simply keep typing until the
 * tail of what they typed is the code.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** The keys that open the black hole, in order. */
const CHEAT_CODE = "404BH";

/**
 * A path with no route, so Next serves `app/not-found.tsx`: the black hole
 * lives there rather than at a page of its own, and a visitor who types the
 * code lands on the same 404 a wrong coordinate would give them.
 */
const LOST_PATH = "/404bh";

/** Keys pressed while typing into a field belong to the field, not the map. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export function useCheatCode(): void {
  const router = useRouter();

  useEffect(() => {
    let typed = "";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      // Single character keys only: Shift, arrows and the rest are not letters
      // and must not poison the buffer.
      if (event.key.length !== 1) return;

      typed = (typed + event.key.toUpperCase()).slice(-CHEAT_CODE.length);
      if (typed !== CHEAT_CODE) return;

      typed = "";
      router.push(LOST_PATH);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);
}
