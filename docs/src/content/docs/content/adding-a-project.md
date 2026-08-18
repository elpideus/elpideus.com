---
title: Adding a project
description: A project is a record plus a satellite star.
---

## 1. Add the record

Append to `PROJECTS` in `src/lib/content/projects.ts`:

```ts
{
  slug: "example",
  name: "Example",
  period: "2026 - now",
  summary: "One sentence, shown in the index and the tooltip.",
  body: ["A paragraph.", "Another paragraph."],
  status: ProjectStatus.Active,
  stack: ["TypeScript", "Next.js"],
  links: [{ kind: ProjectLinkKind.Repository, href: "https://github.com/..." }],
  media: [{ src: "/media/example/cover.png", alt: "Example cover" }],
}
```

## 2. Add the satellite star

In `src/lib/graph/nodes.ts`, add a star with `depth: StarDepth.Satellite`,
`parent: StarId.Betelgeuse`, `panel: PanelKind.Project` and `ref` set to the project slug. The
`ref` is what connects the star to its record.

Branch links are derived, so nothing else needs editing.

## 3. Add the media

Drop images into `public/media/<slug>/` using lowercase, dash separated file names. They are
rendered inside the holographic frame, in a horizontally scrollable strip.

Projects without public links render a short line explaining why, which is how work under NDA is
handled today.
