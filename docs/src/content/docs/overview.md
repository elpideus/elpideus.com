---
title: Overview
description: What the site is, what it is made of and why it is shaped this way.
---

## What this is

The personal site of Stefan Narcis Cucoranu, built as an immersive map of stars rather than a
stack of scrolling sections. Each section of the site is a star; the stars are connected into a
constellation; scrolling travels along that constellation.

## Shape of the experience

- **Depth one stars** are the sections: Origin, About, Trajectory, Projects, Studio, Toolkit,
  Passions, Journal and Contact. Scrolling only ever walks these.
- **Depth two stars** are satellites. Today they are the six projects orbiting Betelgeuse. They are
  reachable by clicking the star, or by picking the project from its parent panel.
- **The contact star, Canopus, twinkles harder** than the rest so the eye finds it without a call
  to action shouting from a corner.
- **The journal star, Proxima Centauri, is dormant**: dimmer and cooler, because the blog is not
  written yet. Nothing in the code assumes it will stay that way.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js App Router with React 19 |
| 3D | three.js through React Three Fiber, with drei and postprocessing |
| State | Zustand for intent, plain modules for per frame data |
| Styling | Tailwind CSS v4 with design tokens in `globals.css` |
| Documents | `@react-pdf/renderer` for the curriculum |
| Docs | Astro Starlight, in `docs/` |

## Design constraints

1. **Desktop first.** A separate mobile experience is planned; nothing here should make that
   harder, but nothing here targets touch as the primary input either.
2. **Dark only.** There is one palette and it is cold, so the light in the scene reads as light.
3. **English only for now.** Everything readable lives in `src/lib/content`, so a translation
   layer later is a data change rather than a rewrite.
4. **Silent degradation.** Live data such as channel statistics falls back to static values and
   reports failures to the console, never to the visitor.
