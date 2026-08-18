---
title: Navigation and state
description: Scroll charge, camera flights and the store that ties them together.
---

## The store

`src/lib/state/journey.ts` is a Zustand store holding intent only:

| Field | Meaning |
| --- | --- |
| `index` | Position inside `JOURNEY`. Satellites keep their parent's index. |
| `focus` | The star the camera is looking at. May be a satellite. |
| `hovered` | The star under the pointer, if any. |
| `phase` | `TravelPhase.Settled` or `TravelPhase.Traveling`. |
| `direction` | `Forward`, `Backward` or `Lateral`, for entrance animations. |
| `travelStart`, `travelEnd` | Timestamps that describe the current flight. |

Flights are described by time rather than by a boolean lock. That makes two things easy: knowing
how far along a flight is (`travelProgress`), and deciding whether a fresh gesture may interrupt
it (`canOvertake`, which opens after 55 percent of the flight).

## Scroll charge

Wheel input is accumulated rather than mapped one to one. A trackpad flick emits dozens of tiny
deltas and a mouse notch emits a handful of large ones; charge makes both feel identical.

- Deltas accumulate into a charge.
- The charge resets after 140 ms of quiet, or when the direction reverses.
- Crossing the threshold moves exactly one star.
- Gesture speed maps onto flight duration, from 1600 ms for a gentle scroll down to 900 ms for a
  hard flick.

## Free orbit

`src/lib/state/view.ts` holds the view intent: yaw, pitch, dolly and the last interaction time. It
is a plain module, not React state, because pointer movement updates it many times per second and
nothing needs to re-render.

- Dragging orbits around the focused star, clamped so the visitor cannot end up behind the panel.
- Shift, control or command plus wheel dollies closer or further.
- After a flight starts, the orbit eases back towards neutral so arrivals are always well framed.
- When the pointer has been still for a moment, a slow idle drift fades back in.

## Keyboard

Every gesture has a keyboard equivalent: arrows, page up and page down, space, home and end, and
escape to return from a satellite to its parent.
