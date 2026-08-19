"use client";

/**
 * Root of the handheld 3D layer.
 *
 * A deliberately short list of things: clouds, stars, the constellation and a
 * warp tunnel. No post processing, no pointer picking, no orbit gesture and no
 * satellites of satellites. Everything cut was cut because a phone renders this
 * at three times the pixel density of a laptop on a tenth of the power budget.
 *
 * The canvas is inert to touch: the whole surface belongs to the deck scrolling
 * above it, and stars are chosen from the chart sheet instead.
 */

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import { MobileNebula } from "./MobileNebula";
import { MobileRig } from "./MobileRig";
import { MobileStarfield } from "./MobileStarfield";
import { MobileStars } from "./MobileStars";
import { SkyLinks } from "./SkyLinks";
import { WarpStreaks } from "./WarpStreaks";

/**
 * Pixel ratio bounds. The upper bound is well under what modern phones report:
 * a 3x buffer of nebula fragments is the difference between a smooth deck and a
 * warm phone, and at this scale the sky is all soft gradients anyway.
 */
const DPR: [number, number] = [1, 1.5];

export function MobileSky() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={DPR}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
          depth: true,
        }}
        camera={{ fov: 60, near: 0.1, far: 1800, position: [0, 2.2, 15] }}
      >
        <color attach="background" args={["#03040a"]} />
        <Suspense fallback={null}>
          <MobileNebula />
          <MobileStarfield />
          <SkyLinks />
          <MobileStars />
          <WarpStreaks />
        </Suspense>
        <MobileRig />
      </Canvas>
    </div>
  );
}
