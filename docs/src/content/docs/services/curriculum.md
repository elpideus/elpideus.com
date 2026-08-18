---
title: Curriculum PDF
description: How the CV is generated, and the rules that keep it machine readable.
---

`GET /api/cv` renders the curriculum with `@react-pdf/renderer` and returns it as an attachment.
Generating rather than serving a static file means the document can never drift from the content
in the repository.

## Files

| File | Role |
| --- | --- |
| `src/lib/cv/data.ts` | The wording: profile, experience, projects, skills, education, other. |
| `src/lib/cv/document.tsx` | Typography and layout only. |
| `src/app/api/cv/route.ts` | Renders to a buffer and sets the download headers. |

## Rules that keep it ATS readable

Applicant tracking systems parse this file far more often than humans read it, so the layout is
deliberately conservative:

- Real text, never outlined or rasterised.
- Standard PDF core fonts (Helvetica), so nothing depends on embedded font parsing.
- A single reading column. Nothing important is split across two columns.
- No images, icons or decorative glyphs; hyphens rather than bullet characters.
- Section headings are plain uppercase words with letter spacing, not graphics.
- Metadata (title, author, subject, keywords) is filled in.

## Caching

The route is cached for a day and the response carries explicit cache headers, since the document
only changes when the repository does.
