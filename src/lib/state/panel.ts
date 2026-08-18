"use client";

/**
 * Where the visitor has dragged the waypoint panel.
 *
 * The panel still belongs to its star: this is an offset applied on top of the
 * star's projected anchor, not an absolute position. Dragging it therefore
 * parks it where the visitor wants it while it keeps following its star, and
 * the choice carries over when they travel to the next one.
 *
 * A plain mutable object rather than React state, for the usual reason: it is
 * written on every pointer move and read on every animation frame.
 */

/** How far the panel has been dragged from its anchor, in CSS pixels. */
export interface PanelOffset {
  x: number;
  y: number;
}

export const panelOffset: PanelOffset = { x: 0, y: 0 };

/** True once the visitor has moved the panel at all. */
export function panelWasMoved(): boolean {
  return panelOffset.x !== 0 || panelOffset.y !== 0;
}

/** Put the panel back beside its star. */
export function resetPanelOffset(): void {
  panelOffset.x = 0;
  panelOffset.y = 0;
}
