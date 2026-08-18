"use client";

/**
 * Hover state for orbital bodies (planets, companion stars, debris discs).
 *
 * Kept separate from the journey store: orbitals are decoration hung off a
 * star rather than places the camera can travel to, so they need a hover flag
 * and nothing else.
 */

import { create } from "zustand";

interface OrbitalHoverState {
  hovered: string | null;
  setHovered: (id: string | null) => void;
}

export const useOrbitalHover = create<OrbitalHoverState>((set, get) => ({
  hovered: null,
  setHovered(id) {
    if (get().hovered === id) return;
    set({ hovered: id });
  },
}));
