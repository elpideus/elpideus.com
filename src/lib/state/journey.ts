"use client";

/**
 * Single source of truth for where the visitor is on the map.
 *
 * The store holds intent, never rendering state: React components read it to
 * decide what to show, and the camera rig reads it to decide where to fly. All
 * frame level interpolation lives inside the rig, outside React.
 */

import { create } from "zustand";
import { JOURNEY, getStar, journeyIndexOf } from "@/lib/graph/nodes";
import { StarDepth, StarId } from "@/lib/graph/types";

/** What the camera is doing right now. */
export enum TravelPhase {
  /** Parked on a star. Scroll input is accepted immediately. */
  Settled = "settled",
  /** Flying between stars. Further input is only accepted late in the flight. */
  Traveling = "traveling",
}

/** Which way the last move went, used for entrance animations. */
export enum TravelDirection {
  Forward = "forward",
  Backward = "backward",
  Lateral = "lateral",
}

/** How the visitor triggered the move. Useful for tuning flight timing. */
export enum TravelIntent {
  Scroll = "scroll",
  Keyboard = "keyboard",
  Pointer = "pointer",
  Deeplink = "deeplink",
}

/** Flight duration bounds in milliseconds. */
const TRAVEL_FAST_MS = 900;
const TRAVEL_SLOW_MS = 1600;
/** Fraction of the flight after which a new input may overtake the current one. */
const OVERTAKE_AT = 0.55;

export interface JourneyState {
  /** Index into `JOURNEY`. Satellites keep the index of their parent. */
  index: number;
  /** Star the camera is looking at. May be a satellite. */
  focus: StarId;
  /** Star under the pointer, if any. */
  hovered: StarId | null;
  phase: TravelPhase;
  direction: TravelDirection;
  intent: TravelIntent;
  /** Epoch milliseconds at which the current flight started and ends. */
  travelStart: number;
  travelEnd: number;
  /** True once the intro flight has finished and panels may appear. */
  ready: boolean;

  step: (delta: number, intent?: TravelIntent, speed?: number) => void;
  goToIndex: (index: number, intent?: TravelIntent, speed?: number) => void;
  focusStar: (id: StarId, intent?: TravelIntent) => void;
  setHovered: (id: StarId | null) => void;
  markSettled: () => void;
  markReady: () => void;
}

/**
 * Maps a gesture speed (0 slow, 1 fast) onto a flight duration. Faster input
 * means a shorter, snappier flight.
 */
function travelDuration(speed: number): number {
  const clamped = Math.min(Math.max(speed, 0), 1);
  return TRAVEL_SLOW_MS + (TRAVEL_FAST_MS - TRAVEL_SLOW_MS) * clamped;
}

export const useJourney = create<JourneyState>((set, get) => ({
  index: 0,
  focus: JOURNEY[0],
  hovered: null,
  phase: TravelPhase.Settled,
  direction: TravelDirection.Forward,
  intent: TravelIntent.Deeplink,
  travelStart: 0,
  travelEnd: 0,
  ready: false,

  step(delta, intent = TravelIntent.Scroll, speed = 0.5) {
    const { index } = get();
    get().goToIndex(index + delta, intent, speed);
  },

  goToIndex(nextIndex, intent = TravelIntent.Scroll, speed = 0.5) {
    const clamped = Math.min(Math.max(nextIndex, 0), JOURNEY.length - 1);
    const state = get();
    const target = JOURNEY[clamped];
    if (target === state.focus) return;

    const now = performance.now();
    const duration = travelDuration(speed);
    set({
      index: clamped,
      focus: target,
      phase: TravelPhase.Traveling,
      direction:
        clamped > state.index ? TravelDirection.Forward : TravelDirection.Backward,
      intent,
      travelStart: now,
      travelEnd: now + duration,
    });
  },

  focusStar(id, intent = TravelIntent.Pointer) {
    const state = get();
    if (state.focus === id) return;
    const star = getStar(id);
    const now = performance.now();
    const duration = travelDuration(0.35);
    const parentIndex =
      star.depth === StarDepth.Satellite && star.parent
        ? journeyIndexOf(star.parent)
        : journeyIndexOf(id);

    set({
      focus: id,
      index: parentIndex >= 0 ? parentIndex : state.index,
      phase: TravelPhase.Traveling,
      direction:
        star.depth === StarDepth.Satellite
          ? TravelDirection.Lateral
          : parentIndex > state.index
            ? TravelDirection.Forward
            : TravelDirection.Backward,
      intent,
      travelStart: now,
      travelEnd: now + duration,
    });
  },

  setHovered(id) {
    if (get().hovered === id) return;
    set({ hovered: id });
  },

  markSettled() {
    if (get().phase === TravelPhase.Settled) return;
    set({ phase: TravelPhase.Settled });
  },

  markReady() {
    if (get().ready) return;
    set({ ready: true });
  },
}));

/**
 * True when a new gesture is allowed to interrupt the current flight. Gives
 * scrolling a responsive feel without letting input queue up endlessly.
 */
export function canOvertake(state: JourneyState, now: number): boolean {
  if (state.phase === TravelPhase.Settled) return true;
  const span = state.travelEnd - state.travelStart;
  if (span <= 0) return true;
  return (now - state.travelStart) / span >= OVERTAKE_AT;
}

/** Progress of the current flight in the 0..1 range. */
export function travelProgress(state: JourneyState, now: number): number {
  const span = state.travelEnd - state.travelStart;
  if (span <= 0) return 1;
  return Math.min(Math.max((now - state.travelStart) / span, 0), 1);
}
