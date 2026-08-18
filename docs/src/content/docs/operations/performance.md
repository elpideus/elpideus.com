---
title: Performance
description: Where the frame budget goes and how the site protects it.
---

## Draw calls

The scene is intentionally cheap: three point layers, one line geometry for every link, one nebula
sphere and three objects per star. Nothing is instanced yet because nothing needs to be.

## Avoiding React in the hot path

- Camera, halo intensity and star scale are updated inside `useFrame`, reading the store with
  `getState()` rather than subscribing.
- Screen anchors are written to a plain map and read in the overlay's own animation frame.
- Pointer position and orbit intent live in a module, not in state.

The result is that hovering stars and flying across the map produce no re-renders at all; React
only runs when the focused star or the hovered star actually changes.

## Device profile

`useDeviceProfile` reads device memory, core count and the reduced motion preference, then picks:

| Tier | Effects | Pixel ratio |
| --- | --- | --- |
| `Rich` | Bloom, vignette, noise | up to 1.75 |
| `Lean` | Bloom only, smaller kernel | up to 1.25 |
| `Off` | None | up to 1.25 |

Reduced motion also lowers nebula intensity and shortens every CSS transition to nothing.

## Media

Images go through `next/image` with AVIF and WebP output. The YouTube player is only mounted after
a click, so the third party player never loads for visitors who do not want it.
