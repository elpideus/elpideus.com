---
title: The 3D layer
description: Sky, stars, links, camera and effects.
---

## Sky

`Starfield.tsx` renders three point layers, each one draw call:

| Layer | Job |
| --- | --- |
| `Distant` | Parented to the camera, so it can never be reached: the sky is infinite in every direction. |
| `Field` | Fixed in world space across the whole journey. This is what actually produces parallax. |
| `Dust` | Small, close and slowly drifting, so travel feels like moving through something. |

Size and colour are per point attributes. The twinkle term is wired but held at zero for every sky
layer on purpose: thousands of flickering points read as noise, so only the section stars, which
are few and meaningful, are allowed to pulse.

## Nebula

`Nebula.tsx` draws the inside of a very large sphere that rides with the camera. The fragment
shader samples domain warped value noise along the view direction only, so clouds never shift when
the camera translates, exactly as something impossibly far away should behave, while orbiting still
reveals new parts of the sky.

## Stars

Each star in `StarNodes.tsx` is three objects:

1. An emissive core sphere.
2. A camera facing halo drawn by a shader, with a radial falloff, diffraction spikes and a twinkle
   term.
3. An oversized invisible sphere that catches the pointer, so hit areas are comfortable without
   making the visible star bigger.

Per class tuning lives in one `CLASS_STYLE` record: the beacon twinkles hardest, the dormant star
is dim and spike free, satellites are small and calm.

## Links

`Constellation.tsx` builds one geometry for every link, subdivided into segments so a travelling
pulse can run along each one in the fragment shader. Link weight comes from `LinkKind`.

## Camera

`CameraRig.tsx` places the camera on a sphere around the focused star, offset laterally so the
star sits off centre and leaves room for its panel. Smoothing is frame rate independent
(`damp()` in `lib/three/math.ts`), and flight easing tightens as a flight progresses so arrivals
settle rather than snap.

Two rules the rig has learned the hard way:

- The look at point carries the framing offset, never the camera position.
- Roll is tracked in the rig and applied with `camera.rotateZ` after `lookAt`. Damping
  `camera.rotation.z` instead reads back a value `lookAt` recomputes every frame, which is zero
  only while the pitch is: once the visitor tilts the view the two fight each frame, and because a
  roll moves an off centre star mostly vertically, the waypoint panel appears to shake.

## Effects

Bloom is what makes the spheres read as stars. Vignette and a whisper of noise stop large dark
gradients from banding. The whole stack drops to bloom only, or to nothing, based on the device
profile and the reduced motion preference.
