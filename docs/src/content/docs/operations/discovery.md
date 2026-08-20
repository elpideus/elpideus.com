---
title: Discovery
description: How a canvas gets found: routes, structured data, social cards and llms.txt.
---

A WebGL scene is a blank page to anything that does not run a GPU. Search engines, AI overviews
and language models all read HTML, so the map ships a second, readable copy of itself alongside
the scene. Nothing here changes what a visitor sees.

## Every star is a URL

`src/lib/seo/routes.ts` is the single table of addresses. Sections use their own word, satellites
nest under their parent because that is where they sit on the map and because a search engine
reads the same hierarchy out of the path.

| Star | Path |
| --- | --- |
| Sirius | `/` |
| Vega | `/about` |
| Polaris | `/trajectory` |
| Betelgeuse | `/projects` |
| Rigel | `/studio` |
| Antares | `/toolkit` |
| Aldebaran | `/passions` |
| Proxima Centauri | `/journal` |
| Canopus | `/contact` |
| Satellites | `/projects/<slug>` |

The map does not navigate between them. `usePathRoute` writes the path with
`history.replaceState` when focus changes, and flies to whatever the path names on a cold load or
a back press. Entries are replaced rather than pushed, because the map is a place rather than a
stack of pages.

The canvas is mounted by `src/app/(map)/layout.tsx`. A layout is the one part of the tree Next.js
keeps across a navigation, so a route change can never tear the scene down mid flight. The pages
under it carry only the readable twin of their star.

Links shared before this existed still work: a `#about` fragment is translated to `/about` once on
entry and never written again.

## The readable twin

`src/components/seo/StarDocument.tsx` server renders the section's real copy: same words, same
links, same order as the panel. It is clipped to a single pixel, and marked `inert` and
`aria-hidden` because the overlay panels are already the accessible copy of that text. Without
that, a screen reader would read the site twice and the keyboard would tab through invisible
links.

Every word comes from `src/lib/content`, so the document cannot drift from the panels.

## Structured data

`src/lib/seo/jsonLd.ts` emits one `@graph` per page. Entities carry stable `@id` values
(`#person`, `#website`), so nine pages describe one person rather than nine strangers:

- `Person`, with `sameAs` pointing at every social account, `knowsAbout` built from the toolkit,
  and `seeks` carrying the availability line.
- `WebSite`, with the licence and the author.
- A page node typed to what the star holds: `ProfilePage`, `CollectionPage`, `ContactPage` or
  `AboutPage`, each with a `BreadcrumbList`.
- `SoftwareApplication` or `WebSite` per project, plus an `ItemList` on `/projects`.

## Social cards

`src/lib/seo/ogCard.tsx` draws one card, and every star fills it with its own copy. Section routes
and project routes each have a six line `opengraph-image.tsx` that calls it, so a shared link to
any star previews as that star.

## Machine readable copies

| Route | What it is |
| --- | --- |
| `/llms.txt` | The index: what the site is, one line per star, all outbound links. |
| `/llms-full.txt` | Every word on the site as one markdown file. |
| `/sitemap.xml` | One entry per star, with project imagery attached. |
| `/robots.txt` | Open to search engines and to AI crawlers, both named explicitly. |
| `/api/cv` | The curriculum as a PDF, deliberately left crawlable. |

Both `llms` routes are generated from `src/lib/content` and cached for a day.

## What stays out

The shader lab at `/galaxy-lab` is a workbench and carries `noindex`; the 404 does too. The API is
closed to crawlers apart from the curriculum.

## After a content change

Nothing needs regenerating by hand: routes, cards, structured data, the sitemap and both `llms`
files all read the content modules. Add a star and everything follows, as long as the star has an
entry in `src/lib/seo/routes.ts` and copy in `src/lib/seo/pages.ts`.
