"use client";

/**
 * The 3D layer of the 404, built the same way the map is: one canvas that
 * fills the viewport with the DOM copy laid over it.
 *
 * The camera orbits the hole and the visitor owns that orbit. Dragging turns
 * the view all the way around and almost over the poles, the wheel pulls in
 * and out, and the slow drift returns once the pointer has been still for a
 * moment. Because the lensing shader reads this same camera, every one of
 * those moves changes the image: the arcs swing, the disc opens from an edge
 * into a ring, and the debris in front slides against the background.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import * as THREE from "three";

import { BlackHoleField } from "./BlackHoleField";
import { Debris } from "./Debris";
import { EffectTier } from "@/components/canvas/Effects";
import { useDeviceProfile } from "@/lib/hooks/useDeviceProfile";
import { CursorMode, setCursorMode } from "@/lib/state/cursor";
import { clamp, damp } from "@/lib/three/math";

/** Distance the camera starts at, and how close or far it may be pulled. */
const DISTANCE_START = 44;
const DISTANCE_MIN = 12;
const DISTANCE_MAX = 150;

/**
 * Pitch stops just short of the poles. Looking straight down the axis leaves
 * the orbit no meaningful yaw and the view rolls, which reads as a lurch.
 */
const PITCH_LIMIT = Math.PI * 0.49;

/**
 * Field of view, matching the map's. It leaves the shadow small in frame,
 * which is the point: the hole is far away and the debris is not.
 */
const FOV = 52;
/** A click counts as hitting the hole inside this fraction of the frame height. */
const HOLE_HIT_RADIUS = 0.15;
/** True when a pointer position falls inside the shadow of the hole. */
function overHole(clientX: number, clientY: number, bounds: DOMRect): boolean {
  const dx = (clientX - (bounds.left + bounds.width / 2)) / bounds.height;
  const dy = (clientY - (bounds.top + bounds.height / 2)) / bounds.height;
  return Math.hypot(dx, dy) <= HOLE_HIT_RADIUS;
}

/** A press that travels further than this is a drag, not a click. */
const CLICK_SLOP = 5;
/** How long the view stays where it was put before the drift picks up again. */
const IDLE_DELAY_MS = 2600;

/**
 * Where the visitor has put the camera.
 *
 * Module level and mutable, the way the map keeps its own view intent: a drag
 * writes to it many times a second and nothing needs to re-render because of
 * it. Only one 404 can be on screen at a time.
 */
const orbit = {
  /** Angles the camera is easing towards. */
  yaw: 0,
  pitch: 0.08,
  distance: DISTANCE_START,
  /** Angles it is actually at, damped behind the targets. */
  currentYaw: 0,
  currentPitch: 0.08,
  currentDistance: DISTANCE_START,
  lastInteraction: 0,
};

function noteInteraction(): void {
  orbit.lastInteraction = performance.now();
}

/** Apply a drag delta expressed in pixels. Yaw is free, pitch is not. */
function orbitBy(deltaX: number, deltaY: number): void {
  orbit.yaw -= deltaX * 0.005;
  orbit.pitch = clamp(orbit.pitch + deltaY * 0.004, -PITCH_LIMIT, PITCH_LIMIT);
  noteInteraction();
}

/** Pull the camera in or push it out. Multiplicative, so it feels even. */
function dollyBy(delta: number): void {
  orbit.distance = clamp(orbit.distance * Math.exp(delta), DISTANCE_MIN, DISTANCE_MAX);
  noteInteraction();
}

/**
 * Drives the camera from the orbit above.
 *
 * The targets are damped rather than applied, which is what gives a drag its
 * weight and lets the idle drift blend back in without a jump.
 */
function CameraOrbit({ frozen }: { frozen: boolean }) {
  const { camera } = useThree();
  const aim = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    // The drift only picks up once the visitor has let go of the view.
    const idle = performance.now() - orbit.lastInteraction > IDLE_DELAY_MS;
    if (idle && !frozen) orbit.yaw += delta * 0.045;

    orbit.currentYaw = damp(orbit.currentYaw, orbit.yaw, 0.0015, delta);
    orbit.currentPitch = damp(orbit.currentPitch, orbit.pitch, 0.0015, delta);
    orbit.currentDistance = damp(orbit.currentDistance, orbit.distance, 0.002, delta);

    // A slow breath on the height, so a still view is never quite still.
    const breath = frozen ? 0 : Math.sin(state.clock.elapsedTime * 0.11) * 0.012;
    const pitch = clamp(orbit.currentPitch + breath, -PITCH_LIMIT, PITCH_LIMIT);
    const radius = orbit.currentDistance;

    camera.position.set(
      Math.sin(orbit.currentYaw) * Math.cos(pitch) * radius,
      Math.sin(pitch) * radius,
      Math.cos(orbit.currentYaw) * Math.cos(pitch) * radius,
    );
    camera.lookAt(aim);
  });

  return null;
}

export function LostScene({ onHoleClick }: { onHoleClick?: () => void }) {
  const profile = useDeviceProfile();
  const drag = useRef({ active: false, x: 0, y: 0, travelled: 0 });

  /** Arrow keys mirror the drag, so the view is reachable without a pointer. */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case "ArrowLeft":
          orbitBy(-40, 0);
          break;
        case "ArrowRight":
          orbitBy(40, 0);
          break;
        case "ArrowUp":
          orbitBy(0, -30);
          break;
        case "ArrowDown":
          orbitBy(0, 30);
          break;
        case "+":
        case "=":
          dollyBy(-0.12);
          break;
        case "-":
        case "_":
          dollyBy(0.12);
          break;
        default:
          return;
      }
      event.preventDefault();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    // Anything the visitor can actually press keeps its own behaviour.
    if (event.target instanceof HTMLElement && event.target.closest("a, button, [data-modal]")) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { active: true, x: event.clientX, y: event.clientY, travelled: 0 };
    setCursorMode(CursorMode.Grabbing);
    noteInteraction();
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) {
      // The reticle locks on over the hole, the way it does over a star.
      const bounds = event.currentTarget.getBoundingClientRect();
      setCursorMode(
        overHole(event.clientX, event.clientY, bounds) ? CursorMode.Target : CursorMode.Default,
      );
      return;
    }

    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    drag.current.x = event.clientX;
    drag.current.y = event.clientY;
    drag.current.travelled += Math.hypot(dx, dy);

    orbitBy(dx, dy);
  }, []);

  const endDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current.active = false;
    setCursorMode(
      overHole(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect())
        ? CursorMode.Target
        : CursorMode.Default,
    );
    noteInteraction();
  }, []);

  const onWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    dollyBy(clamp(event.deltaY * 0.0012, -0.35, 0.35));
  }, []);

  /** Only the hole is clickable, and only when the press was not a drag. */
  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!onHoleClick || drag.current.travelled > CLICK_SLOP) return;

      const bounds = event.currentTarget.getBoundingClientRect();
      if (overHole(event.clientX, event.clientY, bounds)) onHoleClick();
    },
    [onHoleClick],
  );

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => setCursorMode(CursorMode.Default)}
      onWheel={onWheel}
      onClick={handleClick}
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      /* Without WebGL the canvas paints nothing, so the element keeps a ring. */
      style={{
        background:
          "radial-gradient(closest-side, #000 38%, rgba(255,178,122,0.55) 41%, rgba(255,120,60,0.14) 52%, transparent 70%), radial-gradient(circle at 50% 50%, #0a0714, #03040a 70%)",
      }}
    >
      <Canvas
        /*
         * Capped below the map's range. Every pixel here raymarches the hole,
         * so resolution is the most expensive dial on the page, and the shot
         * has no readable detail that supersampling would rescue.
         */
        dpr={[1, profile.tier === EffectTier.Rich ? 1.5 : 1] as [number, number]}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
          depth: true,
        }}
        camera={{ fov: FOV, near: 0.1, far: 4000, position: [0, 2, DISTANCE_START] }}
      >
        <color attach="background" args={["#03040a"]} />
        <BlackHoleField quality={profile.tier === EffectTier.Rich ? 1 : 0.55} />
        <Debris frozen={profile.reducedMotion} />
        <CameraOrbit frozen={profile.reducedMotion} />
      </Canvas>
    </div>
  );
}
