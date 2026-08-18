---
title: The star graph
description: How stars, links and sections are described in data.
---

Everything about the map lives in `src/lib/graph`.

## Vocabulary

`types.ts` defines the enums the rest of the codebase speaks in. Enums are used instead of loose
booleans wherever a thing has more than two meaningful states.

| Enum | Meaning |
| --- | --- |
| `StarId` | Stable identifier of every star. |
| `StarDepth` | `Primary` (a section, part of the scroll journey) or `Satellite`. |
| `StarClass` | `Anchor`, `Sequence`, `Beacon`, `Dormant`, `Satellite`. Drives the visuals. |
| `LinkKind` | `Spine`, `Branch`, `Whisper`. Drives how strongly a link is drawn. |
| `PanelKind` | Which panel component a star opens. |

## Nodes

`nodes.ts` holds the data: position, radius, colour, tagline, class and panel for each star, plus
the `JOURNEY` array which fixes scroll order.

Positions are hand authored rather than generated, so the constellation reads well from the
default camera path. Primary stars drift along negative Z with lateral variation; satellites sit
in a loose ring around their parent.

## Links

Links are derived rather than written twice:

- One `Spine` link between consecutive journey stars.
- One `Branch` link from each satellite to its parent.
- A handful of `Whisper` links added by hand, drawn faintly, so the map reads as a web rather than
  a chain.

## Labels

A star is displayed as `star - section`, for example `Betelgeuse - Projects`. The helper
`starLabel()` exists so that format is defined in exactly one place.

## Depth rules

Scroll paging walks `JOURNEY` only. Focusing a satellite keeps the journey index of its parent, so
scrolling away from a project satellite continues from the Projects star rather than restarting.
