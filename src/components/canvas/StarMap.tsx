"use client";

/**
 * Root of the 3D layer.
 *
 * Everything visual lives under one canvas that fills the viewport and sits
 * behind the DOM overlay. The canvas owns no content: it renders the sky, the
 * graph and the camera, and publishes screen anchors the overlay reads.
 */

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import { Asteroids } from "./Asteroids";
import { CameraRig } from "./CameraRig";
import { Constellation } from "./Constellation";
import { Effects } from "./Effects";
import { Galaxies } from "./Galaxies";
import { Nebula } from "./Nebula";
import { Orbitals } from "./Orbitals";
import { Projector } from "./Projector";
import { SkyPicker } from "./SkyPicker";
import { StarNodes } from "./StarNodes";
import { Starfield } from "./Starfield";
import { useDeviceProfile } from "@/lib/hooks/useDeviceProfile";
import { useJourney } from "@/lib/state/journey";
import { CursorMode, setCursorMode } from "@/lib/state/cursor";
import { filterThreeConsole } from "@/lib/three/console";

/*
 * Before any canvas builds its store: three warns about a deprecated class that
 * @react-three/fiber constructs, and no call site here can answer for it.
 */
filterThreeConsole();

export function StarMap() {
  const profile = useDeviceProfile();

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={profile.dpr as [number, number]}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
          depth: true,
        }}
        camera={{ fov: 52, near: 0.1, far: 2400, position: [0, 2, 24] }}
        onPointerMissed={() => {
          useJourney.getState().setHovered(null);
          setCursorMode(CursorMode.Default);
        }}
      >
        <color attach="background" args={["#03040a"]} />
        <Suspense fallback={null}>
          <Nebula intensity={profile.reducedMotion ? 0.5 : 0.7} />
          <Galaxies tier={profile.tier} radiusRange={[260, 900]} />
          <Starfield />
          <Asteroids tier={profile.tier} />
          <Constellation />
          <StarNodes />
          <Orbitals />
        </Suspense>
        <CameraRig />
        <SkyPicker />
        <Projector />
        <Effects tier={profile.tier} />
      </Canvas>
    </div>
  );
}
