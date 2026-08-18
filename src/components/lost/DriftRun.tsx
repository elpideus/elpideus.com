"use client";

/**
 * Drift Run: the endless runner hidden behind the black hole.
 *
 * It is the Chrome dinosaur, moved into the fiction of the map: a rover runs
 * the Martian regolith, hops boulders and ducks under solar flares while the
 * horizon scrolls. The whole game lives in one canvas and one frame loop,
 * with React holding nothing but the two numbers a human reads between runs,
 * because a runner that re-rendered a component tree per frame would stutter.
 */

import { useEffect, useRef, useState } from "react";

import { interactiveCursorProps } from "@/components/ui/primitives";

/** Logical play field. The canvas is scaled to it, so layout cannot warp play. */
const VIEW_W = 760;
const VIEW_H = 190;
const GROUND_Y = 148;

const GRAVITY = 2600;
const JUMP_V = -780;
const DUCK_GRAVITY_BOOST = 2.4;

const SPEED_START = 330;
const SPEED_MAX = 820;
const SPEED_GAIN = 9;

const ROVER_X = 74;
const ROVER_W = 38;
const ROVER_H = 22;
const DUCK_H = 13;

const HI_SCORE_KEY = "elpideus:drift-run-best";

/** What the lander is doing right now. */
enum RunPhase {
  Ready = "ready",
  Running = "running",
  Lost = "lost",
}

/** Hazards come in two flavours, one for each of the two controls. */
enum HazardKind {
  Debris = "debris",
  Flare = "flare",
}

interface Hazard {
  kind: HazardKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Rock silhouettes are generated once so they do not shimmer while moving. */
  seed: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  /** Parallax factor: distant stars crawl, near ones stream past. */
  depth: number;
}

const COLOUR = {
  sky: "#05040a",
  haze: "rgba(179, 156, 255, 0.16)",
  star: "#93a4c4",
  /* Martian dust hanging over the horizon, warm where the surface begins. */
  dust: "rgba(198, 106, 62, 0.22)",
  ridge: "#8c4526",
  dune: "#3f1d10",
  ground: "#5d2c18",
  groundDeep: "#33170d",
  regolith: "#7a3a20",
  crater: "#43200f",
  hull: "#dfe6f2",
  hullShade: "#98a3b8",
  panel: "#2c3f6b",
  panelEdge: "#7f92c4",
  glass: "#b39cff",
  wheel: "#1b1622",
  wheelRim: "#8f8aa6",
  kick: "rgba(198, 118, 74, 0.5)",
  hazard: "#964a29",
  hazardEdge: "#c9714a",
  flare: "#ff8f6a",
  text: "#e9f1ff",
  dim: "#62718f",
} as const;

function readBest(): number {
  if (typeof window === "undefined") return 0;
  const stored = Number(window.localStorage.getItem(HI_SCORE_KEY));
  return Number.isFinite(stored) ? stored : 0;
}

export function DriftRun() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [phase, setPhase] = useState<RunPhase>(RunPhase.Ready);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;

    const ctx = element.getContext("2d");
    if (!ctx) return;

    /*
     * Everything below is frame state. It is deliberately plain mutable data in
     * the effect closure: the loop touches it sixty times a second and React
     * only hears about the score, and only when its rounded value changes.
     */
    let phaseNow = RunPhase.Ready;
    let speed = SPEED_START;
    let distance = 0;
    let shownScore = -1;
    let bestNow = readBest();
    /*
     * The best score lives in localStorage, which the server cannot see, so it
     * is published from the first frame rather than during hydration: the
     * markup React renders on both sides starts identical.
     */
    let bestPublished = false;

    let roverY = GROUND_Y - ROVER_H;
    let roverV = 0;
    let ducking = false;
    let grounded = true;

    let hazards: Hazard[] = [];
    let nextHazardIn = 420;
    let groundScroll = 0;
    /** Frame counter, used only to animate the flare wobble. */
    let ticks = 0;
    let last = performance.now();

    const stars: Star[] = Array.from({ length: 70 }, () => ({
      x: Math.random() * VIEW_W,
      y: Math.random() * (GROUND_Y - 24),
      size: Math.random() < 0.18 ? 1.8 : 1,
      depth: 0.08 + Math.random() * 0.5,
    }));

    /**
     * Dune line of the regolith, sampled in world space rather than stored per
     * screen column: the terrain has to slide past the rover, and a wrapping
     * buffer would pin the same hills under it forever.
     */
    function duneAt(worldX: number): number {
      // Biased fully negative, so the dunes only ever rise off the driving
      // line: a dip below it would open a slot of raw sky and drop the rover
      // onto nothing, since the rover rides a flat GROUND_Y.
      return (
        Math.sin(worldX * 0.017) * 3 +
        Math.sin(worldX * 0.0061 + 1.4) * 2.6 +
        Math.sin(worldX * 0.043) * 1.1 -
        6.7
      );
    }

    /**
     * Surface litter: pebbles and crater scars strewn over the regolith. They
     * scroll with the ground and wrap, which is what sells the speed close up.
     */
    const litter = Array.from({ length: 34 }, () => ({
      x: Math.random() * VIEW_W,
      y: GROUND_Y + 5 + Math.random() * (VIEW_H - GROUND_Y - 7),
      size: 1.4 + Math.random() * 3.4,
      crater: Math.random() < 0.35,
    }));

    function reset() {
      speed = SPEED_START;
      distance = 0;
      roverY = GROUND_Y - ROVER_H;
      roverV = 0;
      ducking = false;
      grounded = true;
      hazards = [];
      nextHazardIn = 420;
    }

    function launch() {
      if (phaseNow === RunPhase.Running) return;
      reset();
      phaseNow = RunPhase.Running;
      setPhase(RunPhase.Running);
      setScore(0);
    }

    function jump() {
      if (phaseNow !== RunPhase.Running) {
        launch();
        return;
      }
      if (!grounded) return;
      roverV = JUMP_V;
      grounded = false;
    }

    function spawn() {
      // Flares only appear once the run is fast enough to make ducking read.
      const flare = speed > 430 && Math.random() < 0.32;

      if (flare) {
        hazards.push({
          kind: HazardKind.Flare,
          x: VIEW_W + 40,
          y: GROUND_Y - 52,
          w: 46,
          h: 16,
          seed: Math.random(),
        });
      } else {
        const rocks = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < rocks; i++) {
          const w = 16 + Math.random() * 10;
          const h = 22 + Math.random() * 20;
          hazards.push({
            kind: HazardKind.Debris,
            x: VIEW_W + 40 + i * (w + 4),
            y: GROUND_Y - h,
            w,
            h,
            seed: Math.random(),
          });
        }
      }

      // Gap shrinks with speed but never below what a jump can clear.
      nextHazardIn = Math.max(280, 900 - speed * 0.55) + Math.random() * 260;
    }

    function hits(hazard: Hazard): boolean {
      const height = ducking && grounded ? DUCK_H : ROVER_H;
      const top = ducking && grounded ? GROUND_Y - DUCK_H : roverY;
      // A little forgiveness on every side, which is what makes it feel fair.
      const pad = 4;
      return (
        ROVER_X + pad < hazard.x + hazard.w &&
        ROVER_X + ROVER_W - pad > hazard.x &&
        top + pad < hazard.y + hazard.h &&
        top + height - pad > hazard.y
      );
    }

    function drawRover() {
      const duck = ducking && grounded;
      const h = duck ? DUCK_H : ROVER_H;
      const y = duck ? GROUND_Y - DUCK_H : roverY;
      const wheelR = Math.min(5, h * 0.3);
      const axle = h - wheelR;
      /* Wheels turn with the ground, not with time, so a stall reads as a stall. */
      const spin = groundScroll / wheelR;

      ctx!.save();
      ctx!.translate(ROVER_X, y);

      // Dust kicked out from under the rear wheel while it is on the surface.
      if (grounded) {
        ctx!.fillStyle = COLOUR.kick;
        for (let i = 0; i < 3; i++) {
          const puff = Math.random();
          ctx!.globalAlpha = 0.45 - i * 0.12;
          ctx!.beginPath();
          ctx!.arc(-4 - i * 5 - puff * 4, axle + wheelR * 0.6, 2 + puff * 2.4, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.globalAlpha = 1;
      }

      // Chassis: a flat deck slung between the axles.
      ctx!.fillStyle = COLOUR.hull;
      ctx!.beginPath();
      ctx!.moveTo(3, axle - wheelR * 0.4);
      ctx!.lineTo(ROVER_W - 5, axle - wheelR * 0.4);
      ctx!.lineTo(ROVER_W - 2, axle - wheelR * 1.5);
      ctx!.lineTo(ROVER_W * 0.78, axle - wheelR * 2.1);
      ctx!.lineTo(5, axle - wheelR * 2.1);
      ctx!.lineTo(1, axle - wheelR * 1.3);
      ctx!.closePath();
      ctx!.fill();

      ctx!.fillStyle = COLOUR.hullShade;
      ctx!.fillRect(3, axle - wheelR * 0.7, ROVER_W - 8, 1.6);

      // Solar deck, tilted to the sun that sits off frame ahead of the rover.
      ctx!.fillStyle = COLOUR.panel;
      ctx!.beginPath();
      ctx!.moveTo(4, axle - wheelR * 2.1);
      ctx!.lineTo(ROVER_W * 0.82, axle - wheelR * 2.1);
      ctx!.lineTo(ROVER_W * 0.86, axle - wheelR * 2.9);
      ctx!.lineTo(6, axle - wheelR * 2.9);
      ctx!.closePath();
      ctx!.fill();
      ctx!.strokeStyle = COLOUR.panelEdge;
      ctx!.lineWidth = 0.8;
      ctx!.stroke();

      if (!duck) {
        // Mast and camera head, folded flat while ducking.
        ctx!.strokeStyle = COLOUR.hullShade;
        ctx!.lineWidth = 1.6;
        ctx!.beginPath();
        ctx!.moveTo(ROVER_W * 0.66, axle - wheelR * 2.9);
        ctx!.lineTo(ROVER_W * 0.72, 1.5);
        ctx!.stroke();

        ctx!.fillStyle = COLOUR.hull;
        ctx!.fillRect(ROVER_W * 0.62, 0, 9, 4.5);
        ctx!.fillStyle = COLOUR.glass;
        ctx!.fillRect(ROVER_W * 0.62 + 6, 1, 2.4, 2.4);

        // High gain antenna, angled back over the deck.
        ctx!.strokeStyle = COLOUR.panelEdge;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.arc(9, axle - wheelR * 3.6, 3.4, Math.PI * 0.15, Math.PI * 1.15);
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.moveTo(9, axle - wheelR * 3.2);
        ctx!.lineTo(10, axle - wheelR * 2.9);
        ctx!.stroke();
      }

      // Rocker bogie suspension, which reads from the side as three wheels.
      for (const wx of [5, ROVER_W * 0.5, ROVER_W - 5]) {
        ctx!.strokeStyle = COLOUR.hullShade;
        ctx!.lineWidth = 1.2;
        ctx!.beginPath();
        ctx!.moveTo(wx, axle - wheelR * 1.2);
        ctx!.lineTo(wx, axle);
        ctx!.stroke();

        ctx!.fillStyle = COLOUR.wheel;
        ctx!.beginPath();
        ctx!.arc(wx, axle, wheelR, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.strokeStyle = COLOUR.wheelRim;
        ctx!.lineWidth = 1;
        ctx!.stroke();

        // Two spokes are enough to show rotation at this size.
        ctx!.beginPath();
        for (let i = 0; i < 2; i++) {
          const angle = spin + (i / 2) * Math.PI;
          ctx!.moveTo(wx - Math.cos(angle) * wheelR, axle - Math.sin(angle) * wheelR);
          ctx!.lineTo(wx + Math.cos(angle) * wheelR, axle + Math.sin(angle) * wheelR);
        }
        ctx!.stroke();
      }

      ctx!.restore();
    }

    function drawHazard(hazard: Hazard) {
      if (hazard.kind === HazardKind.Flare) {
        ctx!.save();
        ctx!.strokeStyle = COLOUR.flare;
        ctx!.lineWidth = 2;
        ctx!.globalAlpha = 0.9;
        ctx!.beginPath();
        for (let i = 0; i <= 10; i++) {
          const t = i / 10;
          const x = hazard.x + t * hazard.w;
          const y = hazard.y + hazard.h / 2 + Math.sin(t * 7 + ticks * 0.15 + hazard.seed * 6) * 5;
          if (i === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
        ctx!.globalAlpha = 0.28;
        ctx!.lineWidth = 6;
        ctx!.stroke();
        ctx!.restore();
        return;
      }

      // Debris: an irregular rock, its silhouette fixed by its seed.
      ctx!.save();
      ctx!.translate(hazard.x + hazard.w / 2, hazard.y + hazard.h / 2);
      ctx!.fillStyle = COLOUR.hazard;
      ctx!.strokeStyle = COLOUR.hazardEdge;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      const points = 7;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wobble = 0.72 + ((Math.sin(i * 12.9898 + hazard.seed * 78.233) + 1) / 2) * 0.42;
        const x = Math.cos(angle) * (hazard.w / 2) * wobble;
        const y = Math.sin(angle) * (hazard.h / 2) * wobble;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.closePath();
      ctx!.fill();
      ctx!.stroke();
      ctx!.restore();
    }

    /** Seconds covered by the frame being drawn, so parallax matches motion. */
    let frameSeconds = 1 / 60;

    function draw() {
      ctx!.fillStyle = COLOUR.sky;
      ctx!.fillRect(0, 0, VIEW_W, VIEW_H);

      // Nebula band, the only thing in the scene that does not scroll.
      const haze = ctx!.createRadialGradient(VIEW_W * 0.7, 40, 10, VIEW_W * 0.7, 40, 260);
      haze.addColorStop(0, COLOUR.haze);
      haze.addColorStop(1, "rgba(179, 156, 255, 0)");
      ctx!.fillStyle = haze;
      ctx!.fillRect(0, 0, VIEW_W, GROUND_Y);

      // Nothing drifts while the run is stopped: a frozen horizon under a
      // sliding sky would read as the rover, not the world, being in motion.
      const scrolled = phaseNow === RunPhase.Running ? speed * frameSeconds : 0;

      ctx!.fillStyle = COLOUR.star;
      for (const star of stars) {
        star.x -= scrolled * star.depth;
        if (star.x < -2) {
          star.x = VIEW_W + 2;
          star.y = Math.random() * (GROUND_Y - 24);
        }
        ctx!.globalAlpha = 0.25 + star.depth;
        ctx!.fillRect(star.x, star.y, star.size, star.size);
      }
      ctx!.globalAlpha = 1;

      // Dust suspended just above the regolith, the warm edge of the horizon.
      const airglow = ctx!.createLinearGradient(0, GROUND_Y - 46, 0, GROUND_Y);
      airglow.addColorStop(0, "rgba(198, 106, 62, 0)");
      airglow.addColorStop(1, COLOUR.dust);
      ctx!.fillStyle = airglow;
      ctx!.fillRect(0, GROUND_Y - 46, VIEW_W, 46);

      // Far dunes: a silhouette that scrolls behind the driving line and never
      // crosses it, so the terrain reads as uneven without moving the floor.
      ctx!.beginPath();
      ctx!.moveTo(0, GROUND_Y + 1);
      const step = VIEW_W / 89;
      for (let x = 0; x <= VIEW_W + step; x += step) {
        ctx!.lineTo(x, GROUND_Y + duneAt(x + groundScroll));
      }
      ctx!.lineTo(VIEW_W, GROUND_Y + 1);
      ctx!.closePath();
      ctx!.fillStyle = COLOUR.dune;
      ctx!.fill();

      // Regolith the rover actually rides: flat at GROUND_Y, filled to the
      // bottom edge, which leaves no seam for the sky to show through.
      ctx!.save();
      ctx!.beginPath();
      ctx!.rect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);

      const soil = ctx!.createLinearGradient(0, GROUND_Y, 0, VIEW_H);
      soil.addColorStop(0, COLOUR.regolith);
      soil.addColorStop(0.45, COLOUR.ground);
      soil.addColorStop(1, COLOUR.groundDeep);
      ctx!.fillStyle = soil;
      ctx!.fill();

      ctx!.strokeStyle = COLOUR.ridge;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(0, GROUND_Y + 0.5);
      ctx!.lineTo(VIEW_W, GROUND_Y + 0.5);
      ctx!.stroke();

      // Litter is clipped to the surface so nothing floats over the horizon.
      ctx!.beginPath();
      ctx!.rect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
      ctx!.clip();
      for (const speck of litter) {
        speck.x -= scrolled;
        if (speck.x < -6) {
          speck.x = VIEW_W + Math.random() * 40;
          speck.y = GROUND_Y + 5 + Math.random() * (VIEW_H - GROUND_Y - 7);
        }
        if (speck.crater) {
          ctx!.strokeStyle = COLOUR.crater;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.ellipse(speck.x, speck.y, speck.size * 1.8, speck.size * 0.7, 0, 0, Math.PI * 2);
          ctx!.stroke();
        } else {
          ctx!.fillStyle = COLOUR.crater;
          ctx!.beginPath();
          ctx!.ellipse(speck.x, speck.y, speck.size, speck.size * 0.6, 0, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
      ctx!.restore();

      for (const hazard of hazards) drawHazard(hazard);
      drawRover();

      if (phaseNow !== RunPhase.Running) {
        ctx!.fillStyle = "rgba(5, 4, 10, 0.72)";
        ctx!.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx!.textAlign = "center";
        ctx!.fillStyle = COLOUR.text;
        ctx!.font = "600 15px ui-monospace, monospace";
        ctx!.fillText(
          phaseNow === RunPhase.Lost ? "SIGNAL LOST" : "DRIFT RUN",
          VIEW_W / 2,
          VIEW_H / 2 - 8,
        );
        ctx!.fillStyle = COLOUR.dim;
        ctx!.font = "500 11px ui-monospace, monospace";
        ctx!.fillText(
          phaseNow === RunPhase.Lost
            ? "space to relaunch, down to duck"
            : "space or click to launch, down to duck",
          VIEW_W / 2,
          VIEW_H / 2 + 12,
        );
      }
    }

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      frameSeconds = dt;
      ticks += 1;

      if (!bestPublished) {
        bestPublished = true;
        setBest(bestNow);
      }

      if (phaseNow === RunPhase.Running) {
        speed = Math.min(SPEED_MAX, speed + SPEED_GAIN * dt);
        distance += speed * dt;
        groundScroll += speed * dt;

        roverV += GRAVITY * (ducking && !grounded ? DUCK_GRAVITY_BOOST : 1) * dt;
        roverY += roverV * dt;

        if (roverY >= GROUND_Y - ROVER_H) {
          roverY = GROUND_Y - ROVER_H;
          roverV = 0;
          grounded = true;
        }

        nextHazardIn -= speed * dt;
        if (nextHazardIn <= 0) spawn();

        for (const hazard of hazards) hazard.x -= speed * dt;
        hazards = hazards.filter((hazard) => hazard.x + hazard.w > -20);

        if (hazards.some(hits)) {
          phaseNow = RunPhase.Lost;
          setPhase(RunPhase.Lost);
          const final = Math.floor(distance / 12);
          if (final > bestNow) {
            bestNow = final;
            setBest(final);
            window.localStorage.setItem(HI_SCORE_KEY, String(final));
          }
        }

        const rounded = Math.floor(distance / 12);
        if (rounded !== shownScore) {
          shownScore = rounded;
          setScore(rounded);
        }
      }

      draw();
      loop = requestAnimationFrame(tick);
    }

    let loop = requestAnimationFrame(tick);

    function onKeyDown(event: KeyboardEvent) {
      if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
        event.preventDefault();
        jump();
      }
      if (event.code === "ArrowDown" || event.code === "KeyS") {
        event.preventDefault();
        ducking = true;
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.code === "ArrowDown" || event.code === "KeyS") ducking = false;
    }

    function onPointerDown(event: PointerEvent) {
      event.preventDefault();
      jump();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    element.addEventListener("pointerdown", onPointerDown);

    return () => {
      cancelAnimationFrame(loop);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      element.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <div className="select-none">
      <canvas
        ref={canvas}
        width={VIEW_W}
        height={VIEW_H}
        className="block w-full rounded-[6px] border border-[var(--panel-rule)] bg-[#05040a]"
        aria-label="Drift Run, a small endless runner across Mars. Space to jump, down arrow to duck."
        role="img"
        {...interactiveCursorProps}
      />

      <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
        <span>
          {phase === RunPhase.Lost ? "wreck logged" : "distance"}{" "}
          <span className="text-frost">{String(score).padStart(5, "0")}</span>
        </span>
        <span>
          best <span className="text-halo">{String(best).padStart(5, "0")}</span>
        </span>
      </div>
    </div>
  );
}
