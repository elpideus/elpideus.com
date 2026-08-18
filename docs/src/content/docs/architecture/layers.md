---
title: Layers
description: The two layers the site is made of and the contract between them.
---

The site is two layers stacked on top of each other, plus a thin bridge between them.

## The canvas layer

`src/components/canvas` owns everything drawn in WebGL: the nebula shell, three starfield layers,
the constellation lines, the stars themselves, the camera rig and post processing. It renders no
text and holds no content.

## The overlay layer

`src/components/overlay` owns everything readable: panels, tooltips, the star chart on the right,
the header, the intro veil and the custom cursor. It is ordinary DOM, so text stays selectable and
assistive technology sees a normal document.

The overlay root does not capture pointer events. Individual pieces opt back in, which is what
lets a drag anywhere on the page orbit the camera.

## The bridge

Two modules connect the layers without either importing the other's components:

- `src/lib/state/journey.ts` holds intent: which star has focus, whether the camera is travelling,
  what is hovered. Both layers read it.
- `src/lib/state/panel.ts` holds the offset the visitor has dragged the waypoint panel by.
- `src/lib/state/anchors.ts` holds screen positions. The canvas projects every star once per frame
  and writes the result; the overlay reads it inside its own animation frame and positions panels
  with plain transforms.

Neither per frame path goes through React state, so flying across the map costs zero re-renders.

## Why a DOM overlay rather than text in the scene

Text drawn inside WebGL cannot be selected, is invisible to search engines, is expensive to lay
out and is difficult to make accessible. Anchoring DOM to projected positions keeps the magic of
content orbiting a star while keeping every advantage of a normal page.
