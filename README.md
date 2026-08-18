# elpideus.com

The personal site of [Stefan Narcis Cucoranu](https://github.com/elpideus), built as a scroll
driven 3D star map: every section is a star, the stars form a constellation, and scrolling flies
between them.

Live at [elpideus.com](https://elpideus.com).

## What is in here

- A WebGL scene (three.js through React Three Fiber): an infinite starfield, an animated nebula
  shell, constellation links and nine section stars with six project satellites.
- A DOM overlay carrying every readable word, anchored to the projected position of the star it
  belongs to, so content orbits its star while staying selectable and accessible.
- A curriculum generated on demand as an ATS friendly PDF from the same content the site uses.
- Live YouTube statistics that fall back silently to static values when the API is unavailable.
- A documentation site in `docs/`, built with Astro Starlight.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run docs:dev     # documentation
```

Configuration is optional. Copy `.env.example` to `.env.local` to enable live channel statistics
(`YOUTUBE_API_KEY`) and contact form delivery (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`). Without them
the site still runs, with static numbers and a contact form that points at email instead.

## Controls

| Gesture | Result |
| --- | --- |
| Scroll | Travel to the next or previous star |
| Drag | Orbit the view in three dimensions |
| Shift, control or command plus scroll | Move closer or further |
| Click a star | Jump straight to it |
| Scroll over a projection strip | Scroll through the project images |
| Previous and next controls | Step through the images by clicking |
| Click a projection | Open it full size in the viewer |
| Drag a window header | Move the waypoint panel or the image viewer |
| Double click the header, or Recentre | Send the window back beside its star |
| Arrows, page keys, space, home, end | Keyboard equivalents |
| Escape | Return from a project satellite to its parent |

## Structure

```
src/app          Next.js App Router: the page, API routes, metadata
src/components   canvas/ (WebGL), overlay/ (chrome), sections/ (panels), ui/ (primitives)
src/lib          graph/ (the map), content/ (all copy), state/, three/, hooks/, cv/
docs             Astro Starlight documentation
public/media     Project imagery
```

Deeper explanations live in [`docs/`](./docs). Contributor and agent notes live in
[`AGENTS.md`](./AGENTS.md) and [`.agents/`](./.agents).

## Stack

Next.js 16, React 19, TypeScript, three.js with React Three Fiber, drei and postprocessing,
Zustand, Tailwind CSS v4, `@react-pdf/renderer`, Astro Starlight.

## License

GNU General Public License v3.0 or later. See [LICENSE](./LICENSE).

The code is free to reuse. The written content, the curriculum and the project imagery are personal
material: please do not republish them as your own.
