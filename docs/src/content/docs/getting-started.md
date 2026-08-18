---
title: Getting started
description: Running the site and the docs locally.
---

## Requirements

- Node 20 or newer
- npm (the repository ships an npm lockfile)

## Install and run

```bash
npm install
npm run dev
```

The site runs at `http://localhost:3000`. There is a single page: the map.

## Documentation

```bash
npm run docs:dev     # from the repository root
# or
cd docs && npm install && npm run dev
```

## Environment

Everything is optional. Without any of it the site still runs, with static channel numbers and a
contact form that reports it cannot deliver.

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `YOUTUBE_API_KEY` | Enables live channel statistics through the YouTube Data API v3. |
| `YOUTUBE_CHANNEL_ID` | Optional override; by default the `@elpideus` handle is resolved. |
| `RESEND_API_KEY` | Enables contact form delivery. |
| `CONTACT_TO_EMAIL` | Destination inbox for the contact form. |

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server. |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run typecheck` | TypeScript with no emit. |
| `npm run lint` | ESLint across the repository. |
| `npm run docs:dev` | Starlight development server. |
