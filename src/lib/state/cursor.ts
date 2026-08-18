"use client";

/**
 * Custom cursor state.
 *
 * Kept outside React for the same reason as the view intent: the cursor changes
 * often and nothing else in the tree cares. Components that need it subscribe
 * imperatively.
 */

/** What the cursor is currently pointing at. */
export enum CursorMode {
  /** Free space. Reticle with a soft ring. */
  Default = "default",
  /** Over a star. The reticle locks on. */
  Target = "target",
  /** Over ordinary interactive chrome such as a button or a link. */
  Interactive = "interactive",
  /** Dragging the view around. */
  Grabbing = "grabbing",
  /** Over text input. */
  Text = "text",
}

type CursorListener = (mode: CursorMode) => void;

let currentMode: CursorMode = CursorMode.Default;
const listeners = new Set<CursorListener>();

export function getCursorMode(): CursorMode {
  return currentMode;
}

export function setCursorMode(mode: CursorMode): void {
  if (mode === currentMode) return;
  currentMode = mode;
  for (const listener of listeners) listener(mode);
}

export function subscribeCursor(listener: CursorListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
