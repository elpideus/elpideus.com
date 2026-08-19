---
title: The overlay
description: Panels, tooltips, the star chart, and the custom cursor.
---

## Anchoring

`useAnchoredElement` reads the star's screen anchor and writes a transform. It runs from
`flushAnchors()`, which the canvas calls at the end of the frame that produced those positions,
rather than from an animation frame loop of its own: two independent loops read each other's
results one frame late and drift in and out of step, which reads as the panel shaking. It clamps per side, so the panel never slides under the header or the star chart.

One rule matters: the anchored element must not also carry a CSS animation on `transform`. The
entrance animation therefore lives on an inner element, and the anchor on the wrapper.

## Panels

`FocusPanel.tsx` renders one panel for the focused star and picks its body from `PanelKind`. A
tether line runs from the panel back towards the star, so the relationship stays explicit even
after clamping.

Panel bodies live in `src/components/sections`, one file per section.

## Moving the panel

The header is a drag handle. Dragging it accumulates into `panelOffset` in `src/lib/state/panel.ts`,
which the anchoring hook adds to the projected position on every frame, so the window ends up where
the visitor put it while still following its star and still clamped inside the viewport.

Three details make the gesture behave:

- The offset is shared, not per star, so travelling to the next waypoint keeps the chosen placement.
- The handle carries `data-panel-drag`, which `useNavigationInput` treats as interactive, so moving
  the window never orbits the sky at the same time.
- The tether hides once the panel has been moved, since it would point at nothing, and a Recentre
  control appears in the header. Double clicking the header does the same thing.

## Tooltips

Hovering any star shows its full label and a one line description, plus a hint that clicking
travels there. The tooltip is skipped for the star that already has focus.

## Star chart

The rail on the right lists depth one stars in journey order. It doubles as a progress indicator
and as direct navigation. Satellites are deliberately absent: the rail mirrors the scroll journey,
and the scroll journey only walks depth one.

## Projections and the viewer

Project images live in `MediaStrip`, a horizontal scroller with three ways in:

- A wheel over the strip moves it sideways. The listener is attached natively rather than through
  React, because React registers wheel handlers as passive and `preventDefault` is ignored there.
- Previous and next controls step one card at a time and disable themselves at each end.
- Clicking a projection opens `Lightbox`, the full size viewer.

The viewer is deliberately inert: it can be moved by its header, closed by the cross, by clicking
the space around it or with escape, and it does nothing else. Its backdrop carries `data-modal`, so
`wheelScopeOf` in the navigation input swallows wheel gestures over it and the map cannot move
underneath.

Both the viewer and the cursor render through a portal into the body. The waypoint panel carries a
transform, and a transformed ancestor becomes the containing block for fixed positioning, which
would otherwise trap a full screen layer inside the panel.

## Custom cursor

`Cursor.tsx` replaces the native cursor with a reticle: a dot that tracks exactly and a ring that
lags and reshapes according to `CursorMode`. Interactive elements set the mode through
`interactiveCursorProps`, stars set it to `Target` and dragging sets it to `Grabbing`. The custom
cursor only activates for fine pointers, and it is portalled to the body so it stays above every
other layer, the image viewer included.

## Holograms

Every image and video is presented as a projection: cyan tinted, scanlined, framed by brackets. The
YouTube frame only creates its iframe after the visitor asks for it, so the page never pays for a
third party player it may not need.

`HologramVideo` wears its own controls on top of the IFrame Player API (`useYouTubePlayer`): scrub
bar with a buffered track, volume that survives reloads, captions, playback speed, quality capped at
1080p while fullscreen, and the keyboard set visitors expect (space or `k`, arrows, `j` and `l`, `m`,
`c`, `f`).

The embed paints its own chrome (centre glyph, share, watch later, logo link) in every moment it is
not actively playing, and no player parameter turns that off. Two rules keep it out of sight. The
iframe never receives pointer events, so hover chrome cannot be summoned, and a veil covers the
projection whenever the player is not playing: before the first frame, while paused, while scrubbing
and for a beat after a seek. Buffering inherits the previous veil state, so a stall mid playback does
not drop a curtain. Playback position is sampled on a 250ms timer rather than per frame, so nothing
about the player pushes React state every frame.
