"use client";

/**
 * Bridge between the mobile deck and the mobile sky.
 *
 * Two kinds of state live here for two different consumers. `telemetry` is a
 * plain mutable object read inside `useFrame`: scroll position and device tilt
 * change on every frame and must never reach React. `useMobileUi` is an
 * ordinary store for the handful of things that genuinely re-render, which
 * change at most a few times per visit.
 */

import { create } from "zustand";

/** Whether the tilt sensor is usable, and whether the visitor allowed it. */
export enum TiltStatus {
  /** Not asked for yet. */
  Idle = "idle",
  /** Listening, values are flowing. */
  Live = "live",
  /** The device has no orientation sensor, or it never reported anything. */
  Unsupported = "unsupported",
  /** iOS asked and the visitor said no. */
  Denied = "denied",
}

/**
 * Everything the sky reads per frame.
 *
 * `progress` is a float index into `JOURNEY`: 2.5 means halfway between the
 * third and fourth star. `warp` is the camera speed of the last frame,
 * normalised into 0..1, written by the rig and read by the streak layer.
 */
export interface SkyTelemetry {
  progress: number;
  warp: number;
  /** Tilt in radians, already smoothed and clamped. */
  tiltX: number;
  tiltY: number;
  /**
   * Where on the screen the focused star should sit, as a fraction of the
   * viewport: 0.5 is dead centre, 0 is the left or top edge. The chrome owns
   * this because only the chrome knows how much glass it is covering, and the
   * rig turns it into a look at offset once it knows the camera frustum. The
   * resting value frames the star in the upper middle, which is where the deck
   * wants it.
   */
  focusX: number;
  focusY: number;
  /**
   * Free look, in radians, added on top of the flight path exactly like tilt.
   * The bridge writes it from a drag on the open sky; the deck never does,
   * because on a phone the whole screen belongs to the scroll.
   */
  lookX: number;
  lookY: number;
  reducedMotion: boolean;
}

export const telemetry: SkyTelemetry = {
  progress: 0,
  warp: 0,
  tiltX: 0,
  tiltY: 0,
  focusX: 0.5,
  focusY: 0.28,
  lookX: 0,
  lookY: 0,
  reducedMotion: false,
};

export interface MobileUiState {
  /** The star chart sheet is open. */
  chartOpen: boolean;
  tilt: TiltStatus;
  setChartOpen: (open: boolean) => void;
  setTilt: (status: TiltStatus) => void;
}

export const useMobileUi = create<MobileUiState>((set, get) => ({
  chartOpen: false,
  tilt: TiltStatus.Idle,

  setChartOpen(open) {
    if (get().chartOpen === open) return;
    set({ chartOpen: open });
  },

  setTilt(status) {
    if (get().tilt === status) return;
    set({ tilt: status });
  },
}));
