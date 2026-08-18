---
title: Contact delivery
description: Validation, spam handling and what happens when delivery is not configured.
---

`POST /api/contact` accepts `{ name, email, message, company }`.

## Validation

Server side, always. Name and message must be present, the message must be at least ten characters,
lengths are capped, and the email has to look like an address.

## Spam

`company` is a honeypot: it is hidden from people and from assistive technology, so only a bot
fills it in. A submission with it filled is answered with success and dropped. Telling a bot it was
caught only helps the bot.

## Delivery

With `RESEND_API_KEY` and `CONTACT_TO_EMAIL` set, the message is sent through Resend with the
sender's address as reply to. Without them the route answers 503 and logs what is missing.

That failure is deliberately visible in the interface: passive data can degrade silently, but a
message somebody took the time to write must never disappear without telling them. The form shows
a short failure line with the email address as a fallback.
