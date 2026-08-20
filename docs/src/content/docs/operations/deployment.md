---
title: Deployment
description: Building, hosting and what needs configuring in production.
---

## Build

```bash
npm run build
npm run start
```

The site prerenders to static output apart from the contact route, which is dynamic by nature, and
the two cached routes for the curriculum and channel statistics.

## Hosting

Vercel is the intended target: the App Router, the image optimiser and the cached route handlers
all work without configuration there. Any Node host works too, since nothing depends on platform
specific APIs.

## Environment in production

| Variable | Effect if missing |
| --- | --- |
| `YOUTUBE_API_KEY` | Static channel numbers, logged once per request on the server. |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL` | The contact form reports it cannot deliver and points at the email address. |

## Analytics

`@vercel/analytics` is mounted in the root layout. Stars are counted as page views because
`usePathRoute` writes the path through the history API and Next.js reports that to the router, so
the numbers describe sections rather than one endless visit to `/`.

Speed Insights is a separate switch in the Vercel dashboard and is not wired yet. Turn it on there
first, then add `@vercel/speed-insights`: field Core Web Vitals are a ranking input, and the map
is a WebGL scene, so the real numbers are worth having.

## Documentation site

`docs/` is a separate package and builds independently:

```bash
npm run docs:build
```

It is intended for a subdomain, so nothing in the main bundle grows when the documentation does.
