"use client";

/**
 * Thin wrapper around the YouTube IFrame Player API.
 *
 * The API script is loaded once per page (a global promise guards against
 * double injection) and every failure degrades silently: the caller gets
 * `ready: false` forever and the visitor still has the thumbnail button as
 * a fallback play path.
 */

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal shape of the parts of the YouTube IFrame API this hook touches.
export enum YTPlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5,
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
  getPlayerState(): YTPlayerState;
  getOption(module: string, option: string): unknown;
  setOption(module: string, option: string, value: unknown): void;
  loadModule(module: string): void;
  unloadModule(module: string): void;
  getAvailableQualityLevels(): string[];
  getPlaybackQuality(): string;
  setPlaybackQuality(suggestedQuality: string): void;
  destroy(): void;
}

interface YTPlayerEvent {
  target: YTPlayer;
}

interface YTOnStateChangeEvent extends YTPlayerEvent {
  data: YTPlayerState;
}

interface YTCaptionsTrack {
  languageCode: string;
}

interface YTPlayerOptions {
  videoId: string;
  playerVars?: Record<string, number>;
  events?: {
    onReady?: (event: YTPlayerEvent) => void;
    onStateChange?: (event: YTOnStateChangeEvent) => void;
    onApiChange?: (event: YTPlayerEvent) => void;
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

/** Picks the visitor's language if the video has it, else the first available track. */
function pickCaptionsTrack(player: YTPlayer): YTCaptionsTrack | null {
  const tracklist = player.getOption("captions", "tracklist") as YTCaptionsTrack[] | undefined;
  if (!tracklist || tracklist.length === 0) return null;
  const preferred = typeof navigator === "undefined" ? "" : navigator.language.split("-")[0];
  return tracklist.find((track) => track.languageCode === preferred) ?? tracklist[0];
}

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

/** Highest quality the video actually offers, capped at `ceiling` (for example "hd1080"). */
function pickCappedQuality(available: string[], ceiling: string): string | null {
  const ceilingRank = QUALITY_LADDER.indexOf(ceiling as (typeof QUALITY_LADDER)[number]);
  if (ceilingRank === -1) return null;
  const allowed = QUALITY_LADDER.slice(ceilingRank);
  return allowed.find((level) => available.includes(level)) ?? null;
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
  readonly ready: boolean;
  readonly playing: boolean;
  readonly muted: boolean;
  readonly volume: number;
  readonly currentTime: number;
  readonly duration: number;
  readonly captionsOn: boolean;
}

export interface YouTubePlayerControls {
  readonly play: () => void;
  readonly pause: () => void;
  readonly toggle: () => void;
  readonly seek: (seconds: number) => void;
  readonly setVolume: (volume: number) => void;
  readonly toggleMute: () => void;
  readonly toggleCaptions: () => void;
  readonly preferQuality: (ceiling: string) => void;
}

const INITIAL_STATE: YouTubePlayerState = {
  ready: false,
  playing: false,
  muted: false,
  volume: 100,
  currentTime: 0,
  duration: 0,
  captionsOn: false,
};

/** Mounts a YouTube player into `containerRef` once `active` is true. */
export function useYouTubePlayer(
  containerRef: React.RefObject<HTMLDivElement | null>,
  videoId: string,
  active: boolean,
): [YouTubePlayerState, YouTubePlayerControls] {
  const [state, setState] = useState<YouTubePlayerState>(INITIAL_STATE);
  const playerRef = useRef<YTPlayer | null>(null);
  const rafRef = useRef<number | null>(null);
  const captionsWantedRef = useRef(false);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    let cancelled = false;

    loadApi()
      .then(() => {
        if (cancelled || !containerRef.current || !window.YT) return;

        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId,
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            controls: 0,
            disablekb: 1,
            iv_load_policy: 3,
            fs: 0,
          },
          events: {
            onReady: (event: YTPlayerEvent) => {
              setState((previous) => ({
                ...previous,
                ready: true,
                duration: event.target.getDuration(),
                volume: event.target.getVolume(),
              }));
              event.target.playVideo();
            },
            onStateChange: (event: YTOnStateChangeEvent) => {
              setState((previous) => ({
                ...previous,
                playing: event.data === window.YT!.PlayerState.PLAYING,
                duration: event.target.getDuration() || previous.duration,
              }));
            },
            // The caption track list only exists once the captions module has
            // loaded, which happens asynchronously after loadModule() is called.
            onApiChange: (event: YTPlayerEvent) => {
              if (!captionsWantedRef.current) return;
              const track = pickCaptionsTrack(event.target);
              if (track) event.target.setOption("captions", "track", track);
            },
          },
        });
      })
      .catch((error: unknown) => {
        console.error("[youtube player] falling back, could not load api:", error);
      });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, videoId]);

  // Poll playback position while playing; cheap and avoids a postMessage
  // listener for something the API does not push on its own.
  useEffect(() => {
    if (!state.playing) return;

    const tick = () => {
      const player = playerRef.current;
      if (player) {
        setState((previous) => ({ ...previous, currentTime: player.getCurrentTime() }));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [state.playing]);

  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);
  const toggle = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.getPlayerState() === window.YT?.PlayerState.PLAYING) player.pauseVideo();
    else player.playVideo();
  }, []);
  const seek = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
    setState((previous) => ({ ...previous, currentTime: seconds }));
  }, []);
  const setVolume = useCallback((volume: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.setVolume(volume);
    if (volume === 0) player.mute();
    else if (player.isMuted()) player.unMute();
    setState((previous) => ({ ...previous, volume, muted: volume === 0 }));
  }, []);
  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isMuted()) {
      player.unMute();
      setState((previous) => ({ ...previous, muted: false }));
    } else {
      player.mute();
      setState((previous) => ({ ...previous, muted: true }));
    }
  }, []);

  const toggleCaptions = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    setState((previous) => {
      const captionsOn = !previous.captionsOn;
      captionsWantedRef.current = captionsOn;
      if (captionsOn) {
        // loadModule() is a no-op if the module is already loaded, in which
        // case the track list is already there and can be applied directly.
        player.loadModule("captions");
        const track = pickCaptionsTrack(player);
        if (track) player.setOption("captions", "track", track);
      } else {
        // An empty track turns captions off without discarding the module,
        // so the track list survives and the button keeps working.
        player.setOption("captions", "track", {});
      }
      return { ...previous, captionsOn };
    });
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
    { play, pause, toggle, seek, setVolume, toggleMute, toggleCaptions, preferQuality },
  ];
}
