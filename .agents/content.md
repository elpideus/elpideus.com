# Content map

All copy lives in `src/lib/content`. Never inline user facing prose in a component.

| File | Contents |
| --- | --- |
| `profile.ts` | Identity, lede, intro, operating principles, facts, learning note. Age is derived from `BIRTH_DATE`. |
| `links.ts` | Socials with icon keys, plus site metadata (title, description, repository). |
| `journey.ts` | `ENGINEERING_JOURNEY` and `CRAFT_JOURNEY`, same entry shape. |
| `projects.ts` | Project records keyed by slug; `PROJECT_BY_SLUG` for lookup. |
| `kit.ts` | Toolkit grouped by `KitGroup`. |
| `passions.ts` | Gaming, music, editing, writing. |
| `studio.ts` | Channel copy, featured video, fallback statistics. |
| `contact.ts` | Contact copy and the dormant journal copy. |

The graph in `src/lib/graph/nodes.ts` connects content to the map: a satellite star's `ref` is a
project slug, and `panel` selects the section component.

Media lives in `public/media/<project-slug>/` with lowercase dash separated names.

## Facts that must stay correct

- Born 9 February 2003; age is computed, never written down.
- Based in Ostuni, Puglia, Italy. Remote by default.
- Coding since 2017; the trajectory runs PHP, Python, C#, Java, JavaScript, React and Next.js,
  then agentic engineering in 2026.
- Channel opened 24 March 2021, active again since September 2024, over 1.4K subscribers and more
  than one million views. Those numbers are fallbacks; live values come from the API.
- Everything on the site is self taught unless stated otherwise.
