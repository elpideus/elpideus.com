<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# elpideus.com

Personal site of Stefan Narcis Cucoranu, built as a scroll driven 3D star map. One page, nine
section stars, six project satellites, a WebGL sky and a DOM overlay.

## Read on demand

Load the file that matches the work; do not read them all up front.

| When you are | Read |
| --- | --- |
| Touching components, state or the render loop | `.agents/architecture.md` |
| Writing any code at all | `.agents/conventions.md` |
| Editing copy, projects, the timeline or the graph | `.agents/content.md` |
| Running, testing or navigating the codebase | `.agents/workflows.md` |
| Deciding scope, or tempted to add a feature | `.agents/preferences.md` |

Long form documentation lives in `docs/` (Astro Starlight) and is the place to record anything a
future reader would need. Keep it current when behaviour changes.

## Shape of the repository

```
src/app          Next.js App Router: the single page, API routes, metadata
src/components   canvas/ (WebGL), overlay/ (chrome), sections/ (panel bodies), ui/ (primitives)
src/lib          graph/ (the map), content/ (all copy), state/, three/ (math and shaders),
                 hooks/, cv/ (curriculum PDF)
docs             Astro Starlight documentation site, its own package
public/media     Project imagery, one folder per project slug
```

## Non negotiables

1. Scroll paging walks depth one stars only. Satellites are reached by click.
2. The canvas renders no readable text.
3. Nothing that updates every frame goes through React state.
4. Live data degrades silently to fallbacks and logs to the console; only a visitor's own
   submission is allowed to fail visibly.
5. No em-dashes anywhere.
