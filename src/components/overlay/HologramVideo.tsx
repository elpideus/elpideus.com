"use client";

/**
 * The site's own YouTube player, dressed as a hologram projection.
 *
 * YouTube's embed insists on painting its own chrome (the big centre glyph,
 * share, watch later and the logo link) whenever the video is not actively
 * running, and no player parameter turns that off. Two rules keep it out of
 * sight. The iframe never receives pointer events, so hover chrome cannot be
 * summoned, and a veil covers the projection in every non playing moment:
 * before the first frame, while paused, while scrubbing and for a beat after a
 * seek, which is exactly when the embed shows its overlay. The veil is part of
 * the look rather than a patch, so the paused state reads as a held signal.
 */

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { HologramFrame } from "@/components/overlay/Hologram";
import {
  CaptionsIcon,
  FullscreenIcon,
  MuteIcon,
  PauseIcon,
  PlayIcon,
  VolumeIcon,
  YouTubeIcon,
} from "@/components/ui/Icon";
import { interactiveCursorProps } from "@/components/ui/primitives";
import {
  PLAYBACK_RATES,
  PlaybackPhase,
  useYouTubePlayer,
} from "@/lib/hooks/useYouTubePlayer";

/** How long the control bar stays up after the last pointer activity. */
const CONTROLS_IDLE_MS = 2500;

/** How long the veil holds after a seek, while the embed flashes its overlay. */
const SEEK_COVER_MS = 400;

/** Keyboard step sizes, matching what visitors expect from a video player. */
const SEEK_STEP_S = 5;
const SEEK_JUMP_S = 10;
const VOLUME_STEP = 5;

/** Zero padded `m:ss`, or `h:mm:ss` past the hour mark. */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
}

/** Track fill for a range input: played, then buffered, then the empty rest. */
function trackFill(played: number, buffered: number): string {
  const a = Math.max(0, Math.min(100, played));
  const b = Math.max(a, Math.min(100, buffered));
  return [
    "linear-gradient(to right,",
    `var(--color-signal) 0% ${a}%,`,
    `color-mix(in srgb, var(--color-signal) 45%, transparent) ${a}% ${b}%,`,
    `color-mix(in srgb, var(--color-signal) 18%, transparent) ${b}% 100%)`,
  ].join(" ");
}

function ControlButton({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={clsx(
        "flex items-center justify-center transition-colors hover:text-frost",
        active ? "text-frost" : "text-signal",
      )}
      {...interactiveCursorProps}
    >
      {children}
    </button>
  );
}

export function HologramVideo({
  videoId,
  title,
  label = "Transmission",
  className,
}: {
  videoId: string;
  title: string;
  label?: string;
  className?: string;
}) {
  const [active, setActive] = useState(false);
  const frameRef = useRef<HTMLElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [player, controls] = useYouTubePlayer(mountRef, videoId, active);
  const playing = player.playing;

  const [fullscreen, setFullscreen] = useState(false);
  const [idleHidden, setIdleHidden] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const [seekCover, setSeekCover] = useState(false);
  const [veiled, setVeiled] = useState(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Buffering inherits whatever the veil was doing: a stall mid playback should
  // not drop a curtain, and a stall while paused must not lift one.
  useEffect(() => {
    if (player.phase === PlaybackPhase.Buffering) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors the external player, not derived state
    setVeiled(player.phase !== PlaybackPhase.Playing);
  }, [player.phase]);

  const wake = useCallback(() => {
    setIdleHidden(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (playing) {
      idleTimer.current = setTimeout(() => setIdleHidden(true), CONTROLS_IDLE_MS);
    }
  }, [playing]);

  // Playback can start or stop without a pointer moving (autoplay, end of
  // video), so the idle countdown follows the player rather than the mouse.
  useEffect(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (!playing) return;
    idleTimer.current = setTimeout(() => setIdleHidden(true), CONTROLS_IDLE_MS);
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [playing]);

  useEffect(() => {
    return () => {
      if (coverTimer.current) clearTimeout(coverTimer.current);
    };
  }, []);

  // The CRT dressing reads wrong blown up to a whole screen, so it belongs on
  // the panel bound projection only. Fullscreen also earns the best quality the
  // video has up to 1080p; at panel size that bandwidth is wasted.
  //
  // `contains` rather than strict equality because a fullscreen request can
  // land on the frame or on the iframe inside it; both are this player.
  useEffect(() => {
    function handleFullscreenChange() {
      const target = document.fullscreenElement;
      const isFullscreen = !!target && !!frameRef.current && frameRef.current.contains(target);
      setFullscreen(isFullscreen);
      controls.preferQuality(isFullscreen ? "hd1080" : "default");
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [controls]);

  /** Holds the veil down while the embed decides whether to flash its overlay. */
  const coverSeek = useCallback(() => {
    setSeekCover(true);
    if (coverTimer.current) clearTimeout(coverTimer.current);
    coverTimer.current = setTimeout(() => setSeekCover(false), SEEK_COVER_MS);
  }, []);

  const seekTo = useCallback(
    (seconds: number) => {
      controls.seek(seconds);
      coverSeek();
    },
    [controls, coverSeek],
  );

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((error: unknown) => {
        console.error("[youtube player] exit fullscreen request rejected:", error);
      });
      return;
    }
    frameRef.current?.requestFullscreen().catch((error: unknown) => {
      console.error("[youtube player] fullscreen request rejected:", error);
    });
  }, []);

  const cycleRate = useCallback(() => {
    const index = PLAYBACK_RATES.indexOf(player.rate as (typeof PLAYBACK_RATES)[number]);
    controls.setRate(PLAYBACK_RATES[(index + 1) % PLAYBACK_RATES.length]);
  }, [controls, player.rate]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!player.ready) return;
    // Sliders and buttons own their own arrow and space behaviour.
    const onControl = event.target instanceof HTMLInputElement;
    const onButton = event.target instanceof HTMLButtonElement;

    switch (event.key) {
      case " ":
      case "k":
        if (onButton) return;
        controls.toggle();
        break;
      case "ArrowLeft":
        if (onControl) return;
        controls.seekBy(-SEEK_STEP_S);
        coverSeek();
        break;
      case "ArrowRight":
        if (onControl) return;
        controls.seekBy(SEEK_STEP_S);
        coverSeek();
        break;
      case "j":
        controls.seekBy(-SEEK_JUMP_S);
        coverSeek();
        break;
      case "l":
        controls.seekBy(SEEK_JUMP_S);
        coverSeek();
        break;
      case "ArrowUp":
        if (onControl) return;
        controls.nudgeVolume(VOLUME_STEP);
        break;
      case "ArrowDown":
        if (onControl) return;
        controls.nudgeVolume(-VOLUME_STEP);
        break;
      case "m":
        controls.toggleMute();
        break;
      case "c":
        controls.toggleCaptions();
        break;
      case "f":
        toggleFullscreen();
        break;
      default:
        return;
    }
    event.preventDefault();
    wake();
  }

  const played = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;
  const scrubPosition = scrubbing ? scrubValue : played;
  const showVeil = veiled || scrubbing || seekCover;
  const showControls = !idleHidden || !playing || showVeil;

  return (
    <HologramFrame ref={frameRef} label={label} className={className} plain={fullscreen}>
      <div
        className={clsx(
          "relative w-full outline-none",
          fullscreen ? "flex h-full items-center justify-center bg-void" : "aspect-video",
        )}
        tabIndex={active ? 0 : -1}
        onKeyDown={handleKeyDown}
        onPointerMove={active ? wake : undefined}
        onPointerLeave={() => playing && setIdleHidden(true)}
      >
        {/*
          Fullscreen sizes by width, capped so the derived 16:9 height never
          exceeds the viewport, then centres. That keeps the video whole with
          letterboxing instead of the browser stretching it to fill.
        */}
        <div
          className={clsx(
            "relative",
            fullscreen ? "aspect-video" : "absolute inset-0 h-full w-full",
          )}
          style={fullscreen ? { width: "min(100%, calc(100vh * 16 / 9))" } : undefined}
        >
          {active ? (
            <>
              <div
                ref={mountRef}
                aria-hidden
                className="absolute inset-0 h-full w-full [&_iframe]:pointer-events-none [&_iframe]:h-full [&_iframe]:w-full"
              />

              {/*
                The veil doubles as the click target, so the pointer never
                reaches the iframe and YouTube never gets a hover to react to.
              */}
              <button
                type="button"
                onClick={controls.toggle}
                onDoubleClick={toggleFullscreen}
                aria-label={player.playing ? `Pause ${title}` : `Play ${title}`}
                className={clsx(
                  "absolute inset-0 z-[5] flex items-center justify-center transition-opacity duration-200",
                  showVeil ? "opacity-100" : "opacity-0",
                )}
                {...interactiveCursorProps}
              >
                <span className="absolute inset-0 bg-void/90 backdrop-blur-md" />
                <span className="u-scanlines absolute inset-0 opacity-40 mix-blend-screen" />
                {player.phase === PlaybackPhase.Buffering ||
                player.phase === PlaybackPhase.Loading ? (
                  <span
                    className="relative h-8 w-8 animate-spin rounded-full border border-signal/30 border-t-signal"
                    
                  />
                ) : (
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-signal/70 bg-void/60 text-signal">
                    {player.playing ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
                  </span>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setActive(true)}
              className="absolute inset-0 flex items-center justify-center"
              aria-label={`Play ${title}`}
              {...interactiveCursorProps}
            >
              <Image
                src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                alt=""
                fill
                sizes="(min-width: 1280px) 420px, 320px"
                className="object-cover opacity-80"
              />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-signal/70 bg-void/60 text-signal transition-transform duration-300 group-hover:scale-110">
                <PlayIcon size={18} />
              </span>
            </button>
          )}

          {active && player.ready ? (
            <div
              className={clsx(
                "absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 bg-gradient-to-t from-void/85 to-transparent px-2.5 pb-2 pt-6 transition-opacity duration-300",
                showControls ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <input
                type="range"
                min={0}
                max={100}
                step={0.05}
                value={scrubPosition}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setScrubValue(next);
                  if (scrubbing) return;
                  seekTo((next / 100) * player.duration);
                }}
                onPointerDown={() => setScrubbing(true)}
                onPointerUp={() => {
                  setScrubbing(false);
                  seekTo((scrubValue / 100) * player.duration);
                }}
                onKeyDown={(event) => {
                  if (event.key.startsWith("Arrow")) coverSeek();
                }}
                aria-label="Seek"
                aria-valuetext={`${formatTime(player.currentTime)} of ${formatTime(player.duration)}`}
                className="u-scrub h-1 w-full cursor-pointer appearance-none rounded-full"
                style={{ background: trackFill(scrubPosition, player.loaded * 100) }}
                {...interactiveCursorProps}
              />

              <div className="flex items-center gap-2.5">
                <ControlButton
                  label={player.playing ? "Pause" : "Play"}
                  onClick={controls.toggle}
                >
                  {player.playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
                </ControlButton>

                <ControlButton
                  label={player.muted ? "Unmute" : "Mute"}
                  onClick={controls.toggleMute}
                >
                  {player.muted || player.volume === 0 ? (
                    <MuteIcon size={15} />
                  ) : (
                    <VolumeIcon size={15} />
                  )}
                </ControlButton>

                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={player.muted ? 0 : player.volume}
                  onChange={(event) => controls.setVolume(Number(event.target.value))}
                  aria-label="Volume"
                  className="u-scrub h-1 w-16 cursor-pointer appearance-none rounded-full"
                  style={{ background: trackFill(player.muted ? 0 : player.volume, 0) }}
                  {...interactiveCursorProps}
                />

                <span className="font-mono text-[10px] tabular-nums text-mist">
                  {formatTime(scrubbing ? (scrubValue / 100) * player.duration : player.currentTime)}
                  {" / "}
                  {formatTime(player.duration)}
                </span>

                <button
                  type="button"
                  onClick={cycleRate}
                  aria-label={`Playback speed, ${player.rate} times`}
                  title="Playback speed"
                  className={clsx(
                    "ml-auto font-mono text-[10px] tabular-nums transition-colors hover:text-frost",
                    player.rate === 1 ? "text-signal" : "text-frost",
                  )}
                  {...interactiveCursorProps}
                >
                  {player.rate}x
                </button>

                <ControlButton
                  label={player.captionsOn ? "Hide captions" : "Show captions"}
                  onClick={controls.toggleCaptions}
                  active={player.captionsOn}
                >
                  <CaptionsIcon size={15} />
                </ControlButton>

                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Watch on YouTube"
                  title="Watch on YouTube"
                  className="text-signal transition-colors hover:text-frost"
                  {...interactiveCursorProps}
                >
                  <YouTubeIcon size={16} />
                </a>

                <ControlButton
                  label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                  onClick={toggleFullscreen}
                >
                  <FullscreenIcon size={15} />
                </ControlButton>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </HologramFrame>
  );
}
