# Code conventions

- **TypeScript strict.** No `any` in application code; narrow at the boundary instead.
- **Enums over boolean piles.** Anything with more than two meaningful states gets a string enum:
  `StarClass`, `LinkKind`, `TravelPhase`, `CursorMode`, `ProjectStatus`, `EffectTier`.
- **Data is `as const`.** Content arrays keep literal types so typos fail at compile time.
- **Comments explain why.** Every module starts with a short block saying what it is for and what
  decision it encodes. Do not narrate what the next line obviously does.
- **No em-dashes anywhere**, including comments, copy and commit messages. Use a colon, a comma,
  parentheses or two sentences.
- **Imports**: `@/` alias for everything inside `src`. React first, then third party, then local.
- **Components**: one component per concern, named export, `"use client"` only where genuinely
  needed.
- **Styling**: Tailwind v4 with tokens from `globals.css`. Reach for a utility class in
  `@layer utilities` before writing a bespoke style block.
- **Accessibility**: interactive elements are real buttons and links, every icon only element has a
  label, and every gesture has a keyboard equivalent.
