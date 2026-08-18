---
title: Design system
description: Tokens, surfaces and the small set of primitives everything is built from.
---

## Tokens

Defined once in `src/app/globals.css` under Tailwind's `@theme`, named by role rather than by
colour.

| Token | Role |
| --- | --- |
| `--color-void`, `--color-abyss`, `--color-hull` | Backgrounds, darkest to lightest. |
| `--color-frost`, `--color-mist`, `--color-dim` | Text, strongest to quietest. |
| `--color-signal` | The cold accent. Interface, links, focus. |
| `--color-ember`, `--color-beacon`, `--color-verdant` | Warm accents for passions, the beacon star and satellites. |
| `--color-warning` | Dormant and failure states. |

Typography is three families: Space Grotesk for display, Inter for body, JetBrains Mono for labels
and metadata.

## Utilities

| Utility | Use |
| --- | --- |
| `.u-glass` | The frosted instrument surface used by every piece of chrome. |
| `.u-ticks` | Corner ticks that give a panel its heads up display feel. |
| `.u-eyebrow` | Uppercase micro label. |
| `.u-hairline` | Divider that fades at both ends. |
| `.u-scanlines` | Scanline sheen for holographic media. |

## Primitives

`src/components/ui/primitives.tsx` holds `ActionButton`, `ActionLink`, `Tag`, `Eyebrow`,
`Prose` and `Hairline`, plus `interactiveCursorProps`. Every interactive element spreads those
props so the custom cursor always knows what it is over.

Icons are drawn inline in `src/components/ui/Icon.tsx` on a 24 unit grid, so the stroke weight
matches the rest of the interface and no icon package ships to the browser.
