---
title: Content model
description: Where every word on the site lives.
---

All copy lives in `src/lib/content`, as typed modules rather than markdown, so it is validated by
the compiler and imported directly by the components that render it.

| Module | Contents |
| --- | --- |
| `profile.ts` | Identity, location, lede, operating principles, facts. Age is computed from the birth date at render time. |
| `links.ts` | Social links with their icon keys, plus site level metadata. |
| `journey.ts` | Two timelines: engineering and craft, sharing one entry shape. |
| `projects.ts` | Project records: summary, body, status, stack, links, media. |
| `kit.ts` | The toolkit, grouped by purpose. |
| `passions.ts` | Gaming, music, editing, writing. |
| `studio.ts` | Channel copy, featured video and fallback statistics. |
| `contact.ts` | Contact copy and the dormant journal copy. |

## Conventions

- Nothing derived is stored. Age, years of experience and link labels are computed.
- Enums describe states with more than two options: `ProjectStatus`, `Track`, `StackFocus`,
  `KitGroup`, `PassionKind`, `LinkIcon`.
- Arrays are `as const` so the compiler keeps literal types and rejects typos at the call site.
- Media paths point at `public/media/<project-slug>/`.
