---
title: Now playing card
description: The Spotify card on the GitHub profile, drawn as an SVG from Last.fm scrobbles.
---

`GET /api/now-playing` returns an SVG card showing what is playing on Spotify, for the GitHub
profile README rather than the site itself.

| Query | Effect |
| --- | --- |
| `theme=dark` | Dark palette, for GitHub's dark themes. |
| `theme=light` | Light palette, for GitHub's light themes. |
| `theme=auto` (default) | Follows the viewer's colour scheme. |
| `open` | Redirects to the current track on Spotify instead of drawing the card. |

The README pairs the two palettes with a `<picture>` element so each GitHub theme gets its own, and
wraps the card in a link to `?open`.

## Why Last.fm

Since February 2026 Spotify only serves Development Mode apps whose owner has Premium, and
extended access is reserved for organisations. Spotify scrobbles to Last.fm, and Last.fm's
`user.getRecentTracks` answers with the latest track and a "now playing" flag. It does not report
the playback position, so the card shows a spinning record and a moving equalizer instead of a
progress bar.

## States

1. **Playing**: the record slides out and spins, the equalizer moves, the label reads
   `NOW PLAYING`.
2. **Recent**: nothing is playing; the last scrobble is shown with its age, the record parked.
3. **Off air**: no credentials, no history or Last.fm is down. This is the fallback for every
   failure, logged to the server console and never shown as an error.

Last.fm now and then answers with error 8, "operation failed", even when nothing is down, and a
second request usually goes through. Error 8 and error 16, its temporary error, get one retry
inside the same four second budget before the card falls back to off air.

## Artwork

An SVG shown through `<img>` cannot load anything, so the cover is fetched on the server and
inlined as a data URI. Last.fm's own artwork comes first; when a scrobble only has Last.fm's
placeholder star, Deezer's keyless search fills in. Cover fetches are cached for a day. Without any
cover, the card draws its own.

## Caching

GitHub serves README images through its Camo proxy, which honours `cache-control`. The route
answers `no-cache, no-store` so neither Camo nor the browser keeps a copy and a reload shows the
current track. `vercel-cdn-cache-control: max-age=10` lets Vercel's edge absorb bursts, so a busy
profile still costs one Last.fm call every ten seconds at most.

## Configuration

| Variable | Purpose |
| --- | --- |
| `LASTFM_API_KEY` | From [last.fm/api/account/create](https://www.last.fm/api/account/create). The shared secret is not needed. |
| `LASTFM_USERNAME` | The Last.fm account Spotify scrobbles to. |

Spotify is connected once under Last.fm settings, Applications.
