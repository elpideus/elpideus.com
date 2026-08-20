---
title: The handheld build
description: The separate, touch first version of the site, how it is chosen and how it works.
---

The site ships as two builds. The desktop build is the scroll driven star map flown with a mouse.
The handheld build is the touch first version, with its own 3D sky and its own chrome.

They are peers, not breakpoints. Neither is a responsive variant of the other: they share content,
the star graph and the journey store, and nothing else.

Inside the handheld build there are two chrome layouts, which is a different thing from a third
build. Both ship in the same bundle and run the same scene, the same camera, the same scroll engine
and the same panel bodies:

- **The deck**, for phones. One column, with an open sky window cut in above each panel, because a
  phone screen has room for exactly one thing at a time.
- **The bridge**, for tablets. A sky that never scrolls away, with the reading in a console docked
  against one edge of it, because a tablet has room for both and showing one at a time wastes half
  the glass.

## Choosing a build

`src/app/page.tsx` reads the user agent on the server and renders `SiteRoot` with a `handheld`
flag. `SiteRoot` code splits the two builds behind `next/dynamic`, so a phone never downloads the
desktop scene and a laptop never downloads the deck.

`useHandheld` then refines that verdict in the browser, and may only add to it: a coarse pointer on
a screen whose short edge is 1100 CSS pixels or less counts as handheld whatever the user agent
claimed. That is what makes device emulation, in app browsers and tablets behave. Tablets are
deliberately included: the desktop build is flown with hover and drag, and a touch screen has
neither.

## Choosing a layout

The page also passes a `layout`, seeded from `device.type === "tablet"`, so a tablet does not paint
the phone deck for a frame before correcting itself. `useFormFactor` then measures the screen: a
short edge of 620 CSS pixels or more is the bridge. The threshold sits above every phone in either
orientation and below every tablet in portrait, so turning a device never changes the answer. The
enums themselves live in `src/lib/state/layout.ts`, without a client directive, because the page
reads them on the server.

## Shape of the build

```
src/components/mobile
  MobileApp.tsx        root: the sky, and whichever layout was chosen
  useJourneyScroll.ts  scroll to journey binding, shared by both layouts
  panelBody.tsx        panel kind to section body, shared by both layouts
  Waypoint.tsx         one section, in either the deck or the dossier frame
  ChartMap.tsx         the map projected from above, shared by both layouts
  MobileDeck.tsx       phone: the scrolling column
  MobileHud.tsx        phone: fixed chrome, the nine rung ladder
  StarChart.tsx        phone: the whole map as a sheet
  SatelliteSheet.tsx   phone: a project satellite, opened over the deck
  bridge/
    Bridge.tsx         tablet: where the console docks, and where the star is framed
    BridgeDossier.tsx  tablet: the reading, and the satellite that covers it
    BridgeMasthead.tsx tablet: the mark and the curriculum, hung per orientation
    BridgeRail.tsx     tablet: the ladder, stood upright beside the sky
    BridgeChart.tsx    tablet: the map, pinned, with a live marker
    useSkyLook.ts      tablet: drag the sky to look around
  sky/                 the WebGL layer
```

Every panel body is the same component the desktop build uses, straight out of
`src/components/sections`. The handheld build owns its chrome and its scene, never its copy.

## Scroll is the journey

The desktop map pages: one gesture, one flight, one star. The deck maps scrolling continuously onto
the same path instead.

`useJourneyScroll` writes `telemetry.progress`, a float index into `JOURNEY`, from an animation
frame. It is the engine both layouts fly on: all it needs is a scrolling box and one element per
waypoint inside it, so the phone's full screen column and the tablet's narrow dossier are the same
code.

`MobileRig` reads it inside `useFrame` and parks the camera on the matching point of the polyline
through the real star positions. Progress `2.5` is halfway between the third and fourth star, and
the camera is genuinely there.

Two positions are tracked, not one:

- **Progress** drives the camera. It reaches a whole number when a waypoint reaches the top of the
  scrolling box.
- **The waypoint being read** drives the chrome, and is whichever panel covers the reading line:
  45% down the phone deck, 35% down the tablet dossier, which is narrower and therefore runs
  longer. A long panel holds the reader in place while the camera drifts on.

The journey store stays the single source of truth. The deck reports arrivals into it with
`goToIndex` and listens for jumps out of it, so the chart sheet, the hash route and the in panel
links keep working without knowing which layout is mounted. A satellite focus is ignored by the
scroll engine on purpose: its sheet or dossier covers the reading, and leaving the column parked on
Betelgeuse is what makes closing it feel like stepping back.

## Framing is the chrome's decision

Where the star lands on the glass is not the rig's business. The chrome writes `telemetry.focusX`
and `focusY`, a position on the screen as a fraction of it, and the rig turns that into a look at
offset once it knows how wide the frustum is at its parking distance. Aiming away from a point is
what pushes it towards the opposite edge, so the offset is subtracted from the look at target.

| Layout | focusX | focusY | Why |
| --- | --- | --- | --- |
| Deck | 0.5 | 0.28 | The middle of the sky window, once the header is allowed for |
| Bridge, landscape | 0.71 | 0.44 | The middle of the sky the console leaves, clear of the chart |
| Bridge, portrait | 0.5 | 0.19 | The middle of the open sky above the console |

One camera therefore serves three arrangements, and moving a panel never means editing the rig.

## The bridge

There is no layout to keep in step. The sky is a single full bleed layer, and the console is laid
over the part of it that belongs to the reading, so whatever the console does not cover is the
window. Only the edge it docks against changes with orientation: the left of the screen in
landscape at 42% of the width, the bottom in portrait at 58% of the height, with rounded shoulders
and a lit seam so the screen reads as sky with an instrument panel slid up into it rather than as
two stacked halves of equal weight.

- The console is one continuous surface, not a stack of floating cards. The sky is already a
  permanent viewport beside it and the console is already glass, so a card around each section
  would be glass on glass. The waypoints run as a single document instead.
- What divides them is the transit rule: a mark in the colour of the star being approached, the leg
  readout, and a hairline out to the edge. It is the divider and the instrument at once, which is
  why no empty air is needed between sections.
- The masthead caps the console in landscape and hangs over the open sky in portrait, where the
  console starts halfway down the screen and would otherwise put the mark in the middle of it.
- A satellite takes over the reading and nothing else. The masthead sits outside it, so the way
  back to the origin never disappears, and the camera genuinely leaves the corridor: the project is
  on one side of the screen and its star is on the other. It is opaque, unlike the console, because
  the reading would otherwise show straight through it.
- The chart is pinned rather than opened. A live marker slides along the route inside it, written
  straight into the SVG from an animation frame, which turns the map from a menu into an
  instrument: scroll position, camera and chart all say the same thing at once.
- The ladder stands upright along the edge of the screen at full touch size and names the star it
  is on. The rung is the whole touch target; the name floats beside it out of the flow, so the rail
  never swallows a drag meant for the sky next to it. In portrait it crosses the console, which
  leaves it a gutter to cross and paints underneath it.

## Drag the sky

`useSkyLook` gives the tablet the desktop orbit gesture back in touch form, over the sky window
only. The phone has nothing like it and should not: every pixel there belongs to the deck
scrolling.

The offset goes straight into `telemetry.lookX/lookY`, never into React state, and the rig damps
towards it, so releasing the drag drifts the sky back onto the flight path instead of snapping it.
A quarter of the offset survives the release, which gives a flick a trailing lean. The sky follows
the hand rather than the camera following it, the same grab and pull the desktop gesture uses.

## Tilt

`src/lib/hooks/useDeviceTilt.ts` turns the device motion sensors into two numbers, published
two ways:

- into `telemetry`, for the rig, which applies them with `rotateX`, `rotateY` and `rotateZ` after
  `lookAt`, on top of the flight path rather than mixed into it;
- onto the root element as `--tilt-x` and `--tilt-y` in degrees, plus `--tilt-nx` and `--tilt-ny`
  as raw fractions for anything that has to multiply a length inside `calc`. The panel sheen and
  the ladder parallax are pure CSS reading those variables, so no React render is involved.

Two sensors can supply the pose. `deviceorientation` is the good one, but a browser only fires it
when the hardware can be fused into a pose, which takes a gyroscope or a magnetometer, and plenty
of phones ship neither. Those carry a bare accelerometer, so `devicemotion` is attached alongside
and its `accelerationIncludingGravity` vector is turned into the same pitch and roll: at rest that
vector is one gravity pointing out of whichever face is up, and its direction alone fixes both
angles. The yaw an accelerometer cannot give is never asked for. Real acceleration from waving the
phone about lands in the same reading, so the vector runs through a low pass before the angles are
taken, and a sample too short to point anywhere is dropped. Both sensors are armed together and the
first to speak owns the stream; orientation may take it over from motion later, never the other way
round, and the neutral pose is recalibrated when it does. On iOS both permission gates are asked in
the same gesture, and one grant is enough to run on.

Tilt is always on and has no control. `useTiltEngine` arms the sensor when the mobile build
mounts; where the platform gates it behind a gesture, iOS being the only one, the permission call
is parked on the first event Safari counts as activation, which `touchend` after an ordinary scroll
satisfies, so nobody has to find a button. `pointerdown` is not used for this: it fires first but
does not activate, and spending the gesture on it gets the call thrown out. A call that throws
decided nothing, so the next gesture retries, up to four. The first sample becomes the neutral pose, so however
the phone is being held at that moment counts as level. A device that exposes the event and never
fires it is recorded as having no sensor after a second or so, and then re-registered on a slow
timer, twenty times before it gives up, starting over whenever the tab is shown again. Registering
is what asks the browser to start the sensor, and a browser that had nothing to give at that moment
never comes back to that listener by itself: a desktop answers no and keeps answering no even after
DevTools starts emulating one. Re-registering is the only way to ask again. On a phone the first
sample lands at once and none of this runs. Reduced motion is the only thing that switches the whole
thing off, and it eases back to level rather than snapping.

Nothing in the chrome mentions any of this. `TiltStatus` is still tracked in `useMobileUi` because
the engine has to know whether a sample ever arrived, but no component reads it: tilt either works,
in which case the sky says so, or it does not, in which case a control would only advertise a
disappointment.

## The sky

`src/components/mobile/sky` is a shorter list than the desktop canvas, and every omission is
deliberate:

| Piece | What it does | Difference from desktop |
| --- | --- | --- |
| `MobileNebula` | The cloud shell | `NEBULA_FRAGMENT_LEAN`: no domain warp, fewer octaves, coarser sphere |
| `MobileStarfield` | The still sky | Two layers instead of three, roughly half the points |
| `SkyLinks` | The constellation | Plain additive lines, one draw call, no pulse shader |
| `MobileStars` | The section stars | Faked bloom with a second wide halo quad, no pointer picking |
| `WarpStreaks` | Speed | New: line segments stretched by the camera speed of the last frame |

There is no post processing. Bloom is the single most expensive thing on the desktop screen, so the
glow is drawn per star instead: three transparent quads beat a full screen convolution. The pixel
ratio is capped at 1.5 for the same reason.

Nothing in the sky answers to a tap, in either layout: stars are chosen from the chart rather than
aimed at. On the deck the whole surface belongs to the scroll; on the bridge the sky window answers
to a drag, and to nothing else.

## Rules that carry over

- Nothing that updates every frame goes through React state.
- The canvas renders no readable text.
- `damp()` is frame rate independent; do not replace it with a raw lerp.
- Roll is applied with `rotateZ` after `lookAt`, never damped as an Euler component.
- The `react-hooks/immutability` rule is off for `src/components/mobile/sky/**`, for the same
  reason it is off for the desktop canvas: those objects belong to three.js.

## Two traps worth knowing

- `.u-ticks` carries `position: relative`, and it is declared after Tailwind's own `absolute` in
  the utilities layer. An element wearing both ends up back in flow, quietly, with its `bottom`
  read as a relative offset. Pin such an element from a wrapper instead.
- An `<svg>` with `width: auto` does not honour its `viewBox` ratio: it falls back to filling its
  container, and a container sized by its contents then resolves to the whole available width. Give
  the drawing a width and let the height follow.
