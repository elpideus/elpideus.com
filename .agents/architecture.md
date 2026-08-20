# Architecture

Read this before touching anything under `src/components` or `src/lib`.

## Two layers plus a bridge

| Layer | Directory | Owns |
| --- | --- | --- |
| Canvas | `src/components/canvas` | Nebula, starfield, constellation links, stars, camera, effects. No text, no content. |
| Overlay | `src/components/overlay`, `src/components/sections` | Everything readable: panels, tooltips, star chart, header, cursor. |
| Bridge | `src/lib/state` | `journey.ts` (intent), `anchors.ts` (screen positions), `view.ts` (orbit), `cursor.ts` (reticle mode). |

## Data flow

1. Input handlers in `src/lib/hooks/useNavigationInput.ts` write intent into the journey store.
2. `CameraRig` reads that store inside `useFrame` with `getState()`, never through a subscription.
3. `Projector` writes every star's screen position into `anchors.ts` once per frame.
4. `useAnchoredElement` reads anchors in its own animation frame and writes transforms.

React re-renders only when the focused or hovered star changes. Keep it that way: nothing that
updates per frame may live in React state.

## Known traps

- An anchored element must not carry a CSS animation on `transform`; the animation wins and the
  element sticks to a corner. Put the animation on an inner element (see `FocusPanel.tsx`).
- Never damp a camera Euler component that `lookAt` recomputes. `lookAt` rewrites the whole
  rotation every frame, and `rotation.z` is only zero while the pitch is, so damping it back
  towards a target fights `lookAt` and alternates each frame. Track the roll yourself and apply it
  with `camera.rotateZ` after `lookAt`.
- Overlay chrome is repositioned from `flushAnchors()` at the end of the canvas frame, not from its
  own animation frame loop. Two loops read each other's output one frame late and drift in and out
  of step, which looks like shaking.
- `damp()` in `src/lib/three/math.ts` is frame rate independent; do not replace it with a raw
  lerp against a fixed alpha.
- The distant starfield layer is parented to the camera on purpose. Do not "fix" it.
- three.js skips invisible objects when raycasting, so star hit targets are "visible" meshes with
  `colorWrite` off and zero opacity. Setting `visible={false}` silently kills hover and click.
- The canvas wrapper sits at `z-0` inside `main`, not behind it. A negative z-index puts the page
  box on top and swallows every pointer event before it reaches the scene.
- Framing offsets belong on the look at target, not on the camera position: moving the camera
  sideways changes nothing once it looks back at the star.
- A transformed ancestor becomes the containing block for `position: fixed`, and the waypoint panel
  carries a transform. Anything full screen opened from inside it (the image viewer, the cursor)
  must portal into the body, or it ends up trapped inside the panel.
- `wheelScopeOf` in `useNavigationInput` decides what a wheel gesture does: `[data-modal]` swallows
  it, `[data-native-scroll]` keeps native behaviour, everything else pages the map. Add the right
  attribute rather than special casing a component.
- `.u-ticks` sets `position: relative`, and it is declared after Tailwind's `absolute` in the
  utilities layer, so an element carrying both silently stays in flow. Pin it from a wrapper.
- An `<svg>` with `width: auto` ignores its `viewBox` ratio and fills its container instead. Give
  the drawing a width and let the height follow.
- The waypoint panel is draggable by its header. The gesture writes into `lib/state/panel.ts`,
  which `useAnchoredElement` reads through `liveOffset` every frame; it never becomes React state.
  Anything with `data-panel-drag` is excluded from the orbit gesture in `useNavigationInput`.

## The handheld build

`src/components/mobile` is a separate build for touch, chosen in `src/app/page.tsx` from the user
agent and refined by `useHandheld`. It reuses every panel body from `src/components/sections` and
the journey store, and owns its own chrome and its own leaner scene in `src/components/mobile/sky`.

Inside it are two chrome layouts, not two builds: the **deck** for phones (`MobileDeck`, sky
windows cut into one scrolling column) and the **bridge** for tablets (`bridge/`, a full bleed sky
with a console docked over one edge of it: left in landscape, bottom in portrait). `useFormFactor` picks between them from the short edge of the
screen, seeded on the server from the user agent. They share the scene, the camera, the scroll
engine (`useJourneyScroll`), the chart drawing (`ChartMap`) and every panel body.

- The scroll engine writes `telemetry.progress` (a float index into `JOURNEY`) from an animation
  frame; `MobileRig` reads it inside `useFrame`. Same rule as the desktop rig: no per frame React
  state.
- It reports arrivals into the journey store and listens for jumps out of it. Anything that calls
  `focusStar` or `goToIndex` moves the column, which is why the reused panels need no changes.
- Where the star sits on the glass is the chrome's decision, published as `telemetry.focusX/focusY`
  in screen fractions; the rig converts them into a look at offset using its own frustum. Do not
  add layout constants to the rig.
- Tilt reads `deviceorientation` where the phone can fuse a pose and falls back to the
  `devicemotion` gravity vector where it cannot, which is any device without a gyroscope or
  magnetometer. First sensor to report owns the stream.
- Tilt is published both into `telemetry` and as CSS variables on the root element, so the sheen
  and the parallax are pure CSS. Roll is applied with `rotateZ` after `lookAt`, never damped.
- The bridge adds a drag on the sky (`useSkyLook`), written into `telemetry.lookX/lookY` and damped
  back to zero by the rig. The deck has no such gesture: the whole screen is the scroll.
- In the console the waypoints are one document, not cards, and the divider between two of them is
  the transit rule that carries the leg readout. Do not put a panel frame back around them: the
  console is already the surface.
- There is no post processing on mobile. Star glow is a second wide halo quad instead of bloom.

Full prose version: `docs/src/content/docs/architecture/`.
