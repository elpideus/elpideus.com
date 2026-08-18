---
title: Adding a star
description: The five steps to put a new section on the map.
---

1. **Add the identifier** to `StarId` in `src/lib/graph/types.ts`.
2. **Add a `PanelKind`** for the new section, unless it reuses an existing panel.
3. **Describe the star** in `STARS` inside `src/lib/graph/nodes.ts`: proper name, section name,
   tagline, depth, class, panel, position, radius and colour.
4. **Insert it into `JOURNEY`** at the position it should occupy in the scroll order. Skip this
   step for satellites; give them a `parent` instead.
5. **Write the panel** in `src/components/sections` and register it in the `renderPanel` switch
   inside `FocusPanel.tsx`.

## Choosing a position

Primary stars follow the negative Z drift with roughly 26 to 30 units between neighbours, and
lateral variation of 10 to 20 units so the constellation is not a straight line. Satellites sit
between 12 and 16 units from their parent, spread around it rather than on one plane.

## Choosing a class

| Class | Use it for |
| --- | --- |
| `Anchor` | The origin star. There is one. |
| `Sequence` | Ordinary sections. |
| `Beacon` | Something that should attract attention, currently contact. |
| `Dormant` | Something announced but not ready, currently the journal. |
| `Satellite` | Anything at depth two. |
