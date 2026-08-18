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

## Documentation site

`docs/` is a separate package and builds independently:

```bash
npm run docs:build
```

It is intended for a subdomain, so nothing in the main bundle grows when the documentation does.
