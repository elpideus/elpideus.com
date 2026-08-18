"use client";

/**
 * Hover detection for the background sky.
 *
 * Raycasting fourteen thousand points with three.js means a world space
 * threshold, which makes near stars enormous targets and far ones untouchable.
 * This instead compares directions: the angle between the pointer ray and the
 * direction to each point is a constant size on screen whatever the distance,
 * which is exactly how a hit area should behave. One pass is a few tens of
 * thousands of multiply adds, cheaper than the raycast it replaces.
 *
 * The map always wins: anywhere near a constellation star, and while the camera
 * is travelling, the sky simply does not respond. Navigation must never have to
 * compete with decoration.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { STARS } from "@/lib/graph/nodes";
import { designationForSlot } from "@/lib/content/starNames";
import { readAnchor } from "@/lib/state/anchors";
import {
  clearSkyHover,
  readSkyHover,
  setSkyHover,
  skyLayers,
  type SkyLayerIndex,
} from "@/lib/state/sky";
import { TravelPhase, useJourney } from "@/lib/state/journey";

/** Angular radius of the hit area, in radians. Roughly eight pixels at 900p. */
const HIT_ANGLE = 0.009;
/** A hovered point keeps its hover until it is this much further out. */
const RELEASE_ANGLE = HIT_ANGLE * 1.8;
/** Keep out radius around every constellation star, in CSS pixels. */
const MAP_KEEP_OUT_PX = 96;

export function SkyPicker() {
  const { camera, size, gl } = useThree();
  const pointer = useRef({ x: 0, y: 0, clientX: 0, clientY: 0, overCanvas: false });

  const ndc = useMemo(() => new THREE.Vector3(), []);
  const rayDirection = useMemo(() => new THREE.Vector3(), []);
  const toPoint = useMemo(() => new THREE.Vector3(), []);
  const projected = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.clientX = event.clientX;
      pointer.current.clientY = event.clientY;
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
      // Overlay chrome sits above the canvas; when the pointer is over a panel
      // or a modal the event target is that element, not the canvas.
      pointer.current.overCanvas = event.target === gl.domElement;
    };

    const onLeave = () => {
      pointer.current.overCanvas = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      clearSkyHover();
    };
  }, [gl]);

  /** True when the pointer sits on or near any star of the map. */
  const nearMapStar = (clientX: number, clientY: number) => {
    for (const star of STARS) {
      const anchor = readAnchor(star.id);
      if (!anchor || !anchor.visible) continue;
      const dx = anchor.x - clientX;
      const dy = anchor.y - clientY;
      if (dx * dx + dy * dy < MAP_KEEP_OUT_PX * MAP_KEEP_OUT_PX) return true;
    }
    return false;
  };

  useFrame(() => {
    const { x, y, clientX, clientY, overCanvas } = pointer.current;
    const journey = useJourney.getState();

    if (
      !overCanvas ||
      journey.phase === TravelPhase.Traveling ||
      journey.hovered !== null ||
      nearMapStar(clientX, clientY)
    ) {
      clearSkyHover();
      return;
    }

    // Pointer ray in world space.
    ndc.set(x, y, 0.5).unproject(camera);
    rayDirection.copy(ndc).sub(camera.position).normalize();

    const current = readSkyHover();
    const hitCos = Math.cos(HIT_ANGLE);
    const keepCos = Math.cos(RELEASE_ANGLE);

    let bestCos = -2;
    let best: { layer: SkyLayerIndex; index: number; slot: number } | null = null;
    let currentCos = -2;
    let held: { layer: SkyLayerIndex; index: number; slot: number } | null = null;

    for (const layer of skyLayers()) {
      const { positions, indices, seed, cameraLocked } = layer;

      for (let cursor = 0; cursor < indices.length; cursor += 1) {
        const index = indices[cursor];
        toPoint.set(positions[index], positions[index + 1], positions[index + 2]);
        if (!cameraLocked) toPoint.sub(camera.position);

        const length = toPoint.length();
        if (length < 1e-4) continue;

        const cos =
          (toPoint.x * rayDirection.x + toPoint.y * rayDirection.y + toPoint.z * rayDirection.z) /
          length;

        if (cos > bestCos) {
          bestCos = cos;
          best = { layer, index, slot: layer.slotBase + cursor };
        }

        if (current.key && `${seed}:${index}` === current.key) {
          currentCos = cos;
          held = { layer, index, slot: layer.slotBase + cursor };
        }
      }
    }

    // Hysteresis: the point already under the pointer holds on a little longer,
    // so a dense patch of sky does not flicker between neighbours.
    const chosen = bestCos > hitCos ? best : currentCos > keepCos ? held : null;
    if (!chosen) {
      clearSkyHover();
      return;
    }

    const { layer, index, slot } = chosen;
    projected.set(
      layer.positions[index],
      layer.positions[index + 1],
      layer.positions[index + 2],
    );
    if (layer.cameraLocked) projected.add(camera.position);
    projected.project(camera);

    const designation = designationForSlot(slot);
    if (!designation) {
      clearSkyHover();
      return;
    }

    setSkyHover(
      `${layer.seed}:${index}`,
      designation.primary,
      designation.aliases,
      (projected.x * 0.5 + 0.5) * size.width,
      (-projected.y * 0.5 + 0.5) * size.height,
    );
  });

  return null;
}
