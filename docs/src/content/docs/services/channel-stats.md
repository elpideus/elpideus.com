---
title: Channel statistics
description: Live YouTube numbers, with a fallback that never shows a visitor an error.
---

`GET /api/youtube` returns subscriber, view and upload counts.

## Behaviour

1. With no `YOUTUBE_API_KEY`, the route returns the static fallback. This is a normal state for a
   local checkout, not an error.
2. With a key, it calls the YouTube Data API v3, resolving `YOUTUBE_CHANNEL_ID` if set and the
   `@elpideus` handle otherwise.
3. Any failure (network, quota, malformed response) is logged on the server and answered with the
   fallback payload.

The key never reaches the browser, and the response is cached for an hour so traffic cannot burn
the quota.

## On the client

`useChannelStats` starts from the fallback, then upgrades if the route answers with live numbers.
Failures go to `console.error` only. The visitor sees plausible numbers either way, which is the
point: a third party outage must never become visible damage on a personal site.

Formatting is handled by `formatCount`, which renders 1400 as `1.4K` and 1020000 as `1.02M`.
