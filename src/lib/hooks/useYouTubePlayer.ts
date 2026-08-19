"use client";

/**
 * YouTube IFrame Player API, wrapped so the site can wear its own controls.
 *
 * Three decisions are encoded here. The API script loads once per page behind a
 * shared promise. Every failure degrades silently to `PlaybackPhase.Error`, so
 * the visitor still has the "watch on YouTube" path. Playback position is
 * sampled on a timer rather than once per frame, because nothing that updates
 * every frame is allowed through React state.
 *
 * The player is mounted into a throwaway node the hook creates itself: the API
 * replaces the element it is handed with an iframe, and React must never own a
 * node that vanishes behind its back.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/** Raw player states as the IFrame API reports them. */
export enum YTPlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5,
}

/** What the player is doing, in the site's own vocabulary. */
export enum PlaybackPhase {
  Loading = "loading",
  Unstarted = "unstarted",
  Playing = "playing",
  Paused = "paused",
  Buffering = "buffering",
  Ended = "ended",
  Error = "error",
}

export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  setVolume(volume: number): void;
  getVolume(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoLoadedFraction(): number;
  getPlayerState(): YTPlayerState;
  getPlaybackRate(): number;
  setPlaybackRate(rate: number): void;
  getOption(module: string, option: string): unknown;
  setOption(module: string, option: string, value: unknown): void;
  loadModule(module: string): void;
  getAvailableQualityLevels(): string[];
  setPlaybackQuality(suggestedQuality: string): void;
  destroy(): void;
}

interface YTPlayerEvent {
  target: YTPlayer;
}

interface YTStateChangeEvent extends YTPlayerEvent {
  data: YTPlayerState;
}

interface YTErrorEvent extends YTPlayerEvent {
  data: number;
}

interface YTCaptionsTrack {
  languageCode: string;
}

interface YTPlayerOptions {
  videoId: string;
  host?: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: YTPlayerEvent) => void;
    onStateChange?: (event: YTStateChangeEvent) => void;
    onApiChange?: (event: YTPlayerEvent) => void;
    onError?: (event: YTErrorEvent) => void;
  };
}

type YTPlayerConstructor = new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer;

declare global {
  interface Window {
    YT?: {
      Player: YTPlayerConstructor;
      PlayerState: typeof YTPlayerState;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const PHASE_BY_STATE: Record<YTPlayerState, PlaybackPhase> = {
  [YTPlayerState.UNSTARTED]: PlaybackPhase.Unstarted,
  [YTPlayerState.ENDED]: PlaybackPhase.Ended,
  [YTPlayerState.PLAYING]: PlaybackPhase.Playing,
  [YTPlayerState.PAUSED]: PlaybackPhase.Paused,
  [YTPlayerState.BUFFERING]: PlaybackPhase.Buffering,
  [YTPlayerState.CUED]: PlaybackPhase.Unstarted,
};

/** How often playback position is sampled while the video runs. */
const SAMPLE_MS = 250;

/** Volume and mute survive reloads so the visitor sets them once. */
const VOLUME_KEY = "elpideus.player.volume";
const MUTED_KEY = "elpideus.player.muted";

/** YouTube's quality labels, best to worst. */
const QUALITY_LADDER = [
  "highres",
  "hd2160",
  "hd1440",
  "hd1080",
  "hd720",
  "large",
  "medium",
  "small",
  "tiny",
] as const;

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

function readStoredNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const value = raw === null ? Number.NaN : Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function writeStored(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode and quota failures are not worth a broken player.
  }
}

/** Picks the visitor's language if the video has it, else the first track. */
function pickCaptionsTrack(player: YTPlayer): YTCaptionsTrack | null {
  const tracklist = player.getOption("captions", "tracklist") as YTCaptionsTrack[] | undefined;
  if (!tracklist || tracklist.length === 0) return null;
  const preferred = typeof navigator === "undefined" ? "" : navigator.language.split("-")[0];
  return tracklist.find((track) => track.languageCode === preferred) ?? tracklist[0];
}

/** Highest quality the video actually offers, capped at `ceiling`. */
function pickCappedQuality(available: readonly string[], ceiling: string): string | null {
  const ceilingRank = QUALITY_LADDER.indexOf(ceiling as (typeof QUALITY_LADDER)[number]);
  if (ceilingRank === -1) return null;
  return QUALITY_LADDER.slice(ceilingRank).find((level) => available.includes(level)) ?? null;
}

let apiPromise: Promise<void> | null = null;

function loadApi(): Promise<void> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => reject(new Error("failed to load youtube iframe api"));
    document.head.appendChild(script);
  });

  return apiPromise;
}

export interface YouTubePlayerState {
  readonly phase: PlaybackPhase;
  readonly ready: boolean;
  readonly playing: boolean;
  readonly muted: boolean;
  readonly volume: number;
  readonly currentTime: number;
  readonly duration: number;
  /** Fraction of the video downloaded so far, 0 to 1. */
  readonly loaded: number;
  readonly rate: number;
  readonly captionsOn: boolean;
}

export interface YouTubePlayerControls {
  readonly play: () => void;
  readonly pause: () => void;
  readonly toggle: () => void;
  readonly seek: (seconds: number) => void;
  readonly seekBy: (delta: number) => void;
  readonly setVolume: (volume: number) => void;
  readonly nudgeVolume: (delta: number) => void;
  readonly toggleMute: () => void;
  readonly toggleCaptions: () => void;
  readonly setRate: (rate: number) => void;
  readonly preferQuality: (ceiling: string) => void;
}

const INITIAL_STATE: YouTubePlayerState = {
  phase: PlaybackPhase.Loading,
  ready: false,
  playing: false,
  muted: false,
  volume: 100,
  currentTime: 0,
  duration: 0,
  loaded: 0,
  rate: 1,
  captionsOn: false,
};

/** Mounts a YouTube player inside `containerRef` once `active` turns true. */
export function useYouTubePlayer(
  containerRef: React.RefObject<HTMLElement | null>,
  videoId: string,
  active: boolean,
): [YouTubePlayerState, YouTubePlayerControls] {
  const [state, setState] = useState<YouTubePlayerState>(INITIAL_STATE);
  const playerRef = useRef<YTPlayer | null>(null);
  const captionsWantedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) return;

    let cancelled = false;
    const mount = document.createElement("div");
    mount.style.width = "100%";
    mount.style.height = "100%";
    container.appendChild(mount);

    loadApi()
      .then(() => {
        if (cancelled || !window.YT) return;

        playerRef.current = new window.YT.Player(mount, {
          videoId,
          // The privacy enhanced host still speaks the full JS API.
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            autoplay: 1,
            rel: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              const volume = Math.round(readStoredNumber(VOLUME_KEY, 100));
              const muted = window.localStorage.getItem(MUTED_KEY) === "true";
              event.target.setVolume(volume);
              if (muted) event.target.mute();
              else event.target.unMute();

              setState((previous) => ({
                ...previous,
                ready: true,
                muted,
                volume,
                duration: event.target.getDuration(),
                rate: event.target.getPlaybackRate(),
              }));
              event.target.playVideo();
            },
            onStateChange: (event) => {
              const phase = PHASE_BY_STATE[event.data] ?? PlaybackPhase.Unstarted;
              setState((previous) => ({
                ...previous,
                phase,
                playing: phase === PlaybackPhase.Playing,
                duration: event.target.getDuration() || previous.duration,
                currentTime: event.target.getCurrentTime(),
                rate: event.target.getPlaybackRate(),
              }));
            },
            // The caption track list only exists once the captions module has
            // finished loading, which happens after loadModule() returns.
            onApiChange: (event) => {
              if (!captionsWantedRef.current) return;
              const track = pickCaptionsTrack(event.target);
              if (track) event.target.setOption("captions", "track", track);
            },
            onError: (event) => {
              console.error("[youtube player] playback error", event.data);
              setState((previous) => ({ ...previous, phase: PlaybackPhase.Error, playing: false }));
            },
          },
        });
      })
      .catch((error: unknown) => {
        console.error("[youtube player] falling back, could not load api:", error);
        if (!cancelled) setState((previous) => ({ ...previous, phase: PlaybackPhase.Error }));
      });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      container.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, videoId]);

  // Sampling on a timer keeps the scrub bar honest without pushing a React
  // update every frame. Buffering counts: the download bar still grows.
  useEffect(() => {
    if (state.phase !== PlaybackPhase.Playing && state.phase !== PlaybackPhase.Buffering) return;

    const id = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      setState((previous) => ({
        ...previous,
        currentTime: player.getCurrentTime(),
        duration: player.getDuration() || previous.duration,
        loaded: player.getVideoLoadedFraction(),
      }));
    }, SAMPLE_MS);

    return () => window.clearInterval(id);
  }, [state.phase]);

  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);

  const toggle = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const playing = player.getPlayerState() === YTPlayerState.PLAYING;
    if (playing) player.pauseVideo();
    else player.playVideo();
  }, []);

  const seek = useCallback((seconds: number) => {
    const player = playerRef.current;
    if (!player) return;
    const target = Math.max(0, Math.min(seconds, player.getDuration() || seconds));
    player.seekTo(target, true);
    setState((previous) => ({ ...previous, currentTime: target }));
  }, []);

  const seekBy = useCallback(
    (delta: number) => {
      const player = playerRef.current;
      if (!player) return;
      seek(player.getCurrentTime() + delta);
    },
    [seek],
  );

  const applyVolume = useCallback((volume: number) => {
    const player = playerRef.current;
    if (!player) return;
    const clamped = Math.max(0, Math.min(100, Math.round(volume)));
    player.setVolume(clamped);
    const muted = clamped === 0;
    if (muted) player.mute();
    else if (player.isMuted()) player.unMute();
    writeStored(VOLUME_KEY, String(clamped));
    writeStored(MUTED_KEY, String(muted));
    setState((previous) => ({ ...previous, volume: clamped, muted }));
  }, []);

  const nudgeVolume = useCallback(
    (delta: number) => {
      const player = playerRef.current;
      if (!player) return;
      applyVolume((player.isMuted() ? 0 : player.getVolume()) + delta);
    },
    [applyVolume],
  );

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const muted = !player.isMuted();
    if (muted) player.mute();
    else {
      player.unMute();
      // Unmuting out of a zero volume would be silent, so give it a floor.
      if (player.getVolume() === 0) applyVolume(50);
    }
    writeStored(MUTED_KEY, String(muted));
    setState((previous) => ({ ...previous, muted }));
  }, [applyVolume]);

  const toggleCaptions = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    setState((previous) => {
      const captionsOn = !previous.captionsOn;
      captionsWantedRef.current = captionsOn;
      if (captionsOn) {
        // loadModule() is a no-op when the module is already there, in which
        // case the track list can be applied straight away.
        player.loadModule("captions");
        const track = pickCaptionsTrack(player);
        if (track) player.setOption("captions", "track", track);
      } else {
        // An empty track hides captions without discarding the module, so the
        // track list survives and the button keeps working.
        player.setOption("captions", "track", {});
      }
      return { ...previous, captionsOn };
    });
  }, []);

  const setRate = useCallback((rate: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.setPlaybackRate(rate);
    setState((previous) => ({ ...previous, rate }));
  }, []);

  const preferQuality = useCallback((ceiling: string) => {
    const player = playerRef.current;
    if (!player) return;
    if (ceiling === "default") {
      player.setPlaybackQuality("default");
      return;
    }
    const target = pickCappedQuality(player.getAvailableQualityLevels(), ceiling);
    if (target) player.setPlaybackQuality(target);
  }, []);

  return [
    state,
    {
      play,
      pause,
      toggle,
      seek,
      seekBy,
      setVolume: applyVolume,
      nudgeVolume,
      toggleMute,
      toggleCaptions,
      setRate,
      preferQuality,
    },
  ];
}
