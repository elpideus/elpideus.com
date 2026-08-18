---
title: Roadmap
description: What is deliberately unfinished, and what must not be broken along the way.
---

## Planned

- **A separate mobile experience.** Touch deserves a different interaction model rather than a
  squeezed version of this one. Keep layout assumptions inside components, not inside the graph.
- **The journal.** A dark, custom, small CMS. Proxima Centauri is already on the map as a dormant
  star; lighting it should be a class change plus a route.
- **Project case studies.** Today a project satellite links straight to its repository or site. The
  panel is already the right place for a longer story when one exists.
- **Localisation.** English only for now. All copy already lives in typed modules, so a second
  language is a data change.

## Invariants

Things that should stay true as the site grows:

1. Scroll paging walks depth one only.
2. The canvas holds no readable text.
3. Live data degrades to fallbacks silently; only a visitor's own submission may fail loudly.
4. Content stays in `src/lib/content`, never inline in components.
5. Enums describe anything with more than two states.
