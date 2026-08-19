---
title: The handheld build
description: The separate, touch first version of the site, how it is chosen and how it works.
---

The site ships as two builds. The desktop build is the scroll driven star map flown with a mouse.
The handheld build is a deck of waypoints scrolled with a thumb, with its own 3D sky behind it.

They are peers, not breakpoints. Neither is a responsive variant of the other: they share content,
the star graph and the journey store, and nothing else.

## Choosing a build

`src/app/page.tsx` reads the user agent on the server and renders `SiteRoot` with a `handheld`
flag. `SiteRoot` code splits the two builds behind `next/dynamic`, so a phone never downloads the
desktop scene and a laptop never downloads the deck.

`useHandheld` then refines that verdict in the browser, and may only add to it: a coarse pointer on
a screen whose short edge is 1100 CSS pixels or less counts as handheld whatever the user agent
claimed. That is what makes device emulation, in app browsers and tablets behave. Tablets are
deliberately included: the desktop build is flown with hover and drag, and a touch screen has
neither.

## Shape of the build

```
src/components/mobile
  MobileApp.tsx        root: sky, deck, chrome, sheets
  MobileDeck.tsx       the scroll container and the journey sync
  Waypoint.tsx         one section: an open sky window plus its panel
  MobileHud.tsx        fixed chrome, the nine rung ladder
  StarChart.tsx        the whole map as a sheet, projected from above
  SatelliteSheet.tsx   a project satellite, opened over the deck
  sky/                 the WebGL layer
```

Every panel body is the same component the desktop build uses, straight out of
`src/components/sections`. The handheld build owns its chrome and its scene, never its copy.

## Scroll is the journey

The desktop map pages: one gesture, one flight, one star. The deck maps scrolling continuously onto
the same path instead.

`MobileDeck` writes `telemetry.progress`, a float index into `JOURNEY`, from an animation frame.
`MobileRig` reads it inside `useFrame` and parks the camera on the matching point of the polyline
through the real star positions. Progress `2.5` is halfway between the third and fourth star, and
the camera is genuinely there.

Two positions are tracked, not one:

- **Progress** drives the camera. It reaches a whole number when a waypoint's sky window fills the
  top of the screen.
- **The waypoint being read** drives the chrome, and is whichever panel covers the reading line at
  45% of the viewport. A long panel holds the reader in place while the camera drifts on.

The journey store stays the single source of truth. The deck reports arrivals into it with
`goToIndex` and listens for jumps out of it, so the chart sheet, the hash route and the in panel
links keep working without knowing a deck exists. A satellite focus is ignored by the deck on
purpose: its sheet covers the deck, and leaving the deck parked on Betelgeuse is what makes closing
the sheet feel like stepping back.

## Tilt

`src/lib/hooks/useDeviceTilt.ts` turns the device orientation sensor into two numbers, published
two ways:

- into `telemetry`, for the rig, which applies them with `rotateX`, `rotateY` and `rotateZ` after
  `lookAt`, on top of the flight path rather than mixed into it;
- onto the root element as `--tilt-x` and `--tilt-y` in degrees, plus `--tilt-nx` and `--tilt-ny`
  as raw fractions for anything that has to multiply a length inside `calc`. The panel sheen and
  the ladder parallax are pure CSS reading those variables, so no React render is involved.

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

Nothing in the sky answers to touch. The whole surface belongs to the deck scrolling above it, and
stars are chosen from the chart sheet instead of aimed at.

## Rules that carry over

- Nothing that updates every frame goes through React state.
- The canvas renders no readable text.
- `damp()` is frame rate independent; do not replace it with a raw lerp.
- Roll is applied with `rotateZ` after `lookAt`, never damped as an Euler component.
- The `react-hooks/immutability` rule is off for `src/components/mobile/sky/**`, for the same
  reason it is off for the desktop canvas: those objects belong to three.js.
