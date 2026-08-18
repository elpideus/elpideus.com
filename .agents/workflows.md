# Workflows

## Commands

```bash
npm run dev          # site at http://localhost:3000
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run docs:dev     # Starlight docs
npm run docs:build   # docs production build
```

## Browser testing

Use the `agent-browser` CLI. Do not use chrome-devtools or Playwright directly.

```bash
agent-browser open http://localhost:3000
agent-browser screenshot shot.png
agent-browser snapshot                 # accessibility tree
agent-browser console --level error
agent-browser mouse wheel 300          # page forward one star
agent-browser press ArrowUp            # page backward
agent-browser eval "document.querySelector('article h2').textContent"
```

Test only when a change is genuinely visual or interactive. Typecheck and build cover the rest.

## Navigating the codebase

A knowledge graph of `src/` already exists in `graphify-out/` (gitignored): 284 nodes, 660 edges,
eleven communities, plus `GRAPH_REPORT.md` and an interactive `graph.html`.

```bash
graphify query "how does scrolling reach the camera?"   # answer from the existing graph
/graphify src --update                                  # re-extract only changed files
```

Query the graph before grepping. Rebuild it after a structural change, not after every edit.

## Before finishing a change

1. `npm run typecheck`
2. `npm run build`
3. If the change is visual, one screenshot at 1440x900 and one console check.
4. Update `docs/` when behaviour or structure changed, not only when asked.
