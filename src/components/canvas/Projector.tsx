"use client";

/**
 * Projects every star into screen space once per frame for the DOM overlay.
 *
 * Fifteen projections per frame is nothing, and doing them all keeps the
 * overlay logic free of special cases.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

import { STARS } from "@/lib/graph/nodes";
import { flushAnchors, writeAnchor } from "@/lib/state/anchors";

export function Projector() {
  const { camera, size } = useThree();
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const cameraForward = useMemo(() => new THREE.Vector3(), []);
  const toStar = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    // The rig writes camera position and rotation in an earlier callback, and
    // three.js only refreshes the world matrix at render time, so project
    // against a matrix that is up to date rather than one frame stale.
    camera.updateMatrixWorld();
    camera.getWorldDirection(cameraForward);

    for (const star of STARS) {
      scratch.set(...star.position);
      toStar.copy(scratch).sub(camera.position);
      const distance = toStar.length();
      const inFront = toStar.dot(cameraForward) > 0;

      scratch.project(camera);
      const x = (scratch.x * 0.5 + 0.5) * size.width;
      const y = (-scratch.y * 0.5 + 0.5) * size.height;
      const onScreen =
        inFront && x > -400 && x < size.width + 400 && y > -400 && y < size.height + 400;

      writeAnchor(star.id, x, y, onScreen, distance);
    }

    // Same frame as the render that produced these positions: anchored chrome
    // must never be a frame behind the stars it belongs to.
    flushAnchors();
  });

  return null;
}
