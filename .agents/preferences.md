# Project preferences

These are the owner's standing decisions. Do not build against them.

- **Two builds, not breakpoints.** The desktop star map lives in `src/components/canvas` and
  `src/components/overlay`; the touch build lives in `src/components/mobile`. They share content,
  the star graph and the journey store, and nothing else. Do not add responsive layouts to the
  desktop build, and do not make one build import the other's chrome. `src/app/page.tsx` picks
  between them.
- **Dark only.** No light theme.
- **English only for now.** Other languages are possible later, so keep copy in
  `src/lib/content` rather than inline.
- **The journal is coming.** Proxima Centauri stays dormant until the blog exists. It will be dark
  mode with a small custom CMS. Do not build anything blog shaped yet, and do not make it harder.
- **Projects link out.** A project satellite links to its repository or site. Case studies come
  later; the panel is where they will go.
- **Open source.** The repository is public. Keep secrets in environment variables, keep the code
  readable by strangers, and keep the documentation honest.
- **No em-dashes** in code, copy, comments or commits.
- **Attention to detail is the point.** Form matters as much as content here.
