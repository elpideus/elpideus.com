"use client";

/**
 * Holographic media frame.
 *
 * Every image and video on the site is presented as a projection rather than a
 * flat picture: cyan tinted, scanlined, framed by brackets and lifted slightly
 * off the panel. The effect is pure CSS so it costs nothing next to the canvas.
 */

import Image from "next/image";
import clsx from "clsx";
import { forwardRef, useEffect, useRef, useState } from "react";

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
import { useYouTubePlayer } from "@/lib/hooks/useYouTubePlayer";

/** How long the control bar stays up after the last pointer activity while playing. */
const CONTROLS_IDLE_MS = 2500;

/** What is being projected. */
export enum HologramKind {
  Image = "image",
  Video = "video",
}

interface HologramFrameProps {
  readonly label?: string;
  readonly className?: string;
  readonly children: React.ReactNode;
  /** Drops the scanline, tint and bracket dressing, for example while fullscreen. */
  readonly plain?: boolean;
}

const HologramFrame = forwardRef<HTMLElement, HologramFrameProps>(function HologramFrame(
  { label, className, children, plain = false },
  ref,
) {
  return (
    <figure
      ref={ref}
      className={clsx(
        "group relative overflow-hidden rounded-[3px] border border-signal/25 bg-signal/[0.04]",
        "shadow-[0_0_28px_-12px_var(--color-signal)]",
        className,
      )}
    >
      {/* Projected content, tinted so it reads as light rather than paper. */}
      <div
        className={clsx(
          "relative",
          !plain && "[&_img]:mix-blend-screen [&_img]:saturate-[1.15] [&_img]:contrast-[1.05]",
        )}
      >
        {children}
      </div>

      {plain ? null : (
        <>
          {/* Scanlines and a soft vertical sweep. */}
          <div
            className="u-scanlines pointer-events-none absolute inset-0 opacity-60 mix-blend-screen"
            style={{ animation: "hologram-drift 7s ease-in-out infinite" }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-signal/12 via-transparent to-signal/8" />

          {/* Corner brackets. */}
          {[
            "left-0 top-0 border-l border-t",
            "right-0 top-0 border-r border-t",
            "left-0 bottom-0 border-l border-b",
            "right-0 bottom-0 border-r border-b",
          ].map((position) => (
            <span
              key={position}
              className={clsx("pointer-events-none absolute h-3 w-3 border-signal/70", position)}
            />
          ))}

          {label ? (
            <figcaption className="pointer-events-none absolute bottom-1.5 left-2 font-mono text-[9px] uppercase tracking-[0.2em] text-signal/80">
              {label}
            </figcaption>
          ) : null}
        </>
      )}
    </figure>
  );
});

export function HologramImage({
  src,
  alt,
  label,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  label?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <HologramFrame label={label} className={className}>
      <div className="relative aspect-[16/10] w-full">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1280px) 420px, 320px"
          className="object-cover"
          priority={priority}
        />
      </div>
    </HologramFrame>
  );
}

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

/**
 * YouTube projection with a custom control bar in the site's own voice.
 *
 * The player is only mounted once the visitor asks for it, so the page never
 * pays for the IFrame API it may not need. Controls talk to the player
 * through the YouTube IFrame Player API rather than the stock chrome.
 */
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
  const videoBoxRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [player, controls] = useYouTubePlayer(mountRef, videoId, active);

  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The CRT dressing reads wrong blown up to a whole screen, so it only
  // belongs on the small, panel-bound projection. Fullscreen also earns the
  // best quality the video has up to 1080p; back at panel size that
  // bandwidth is wasted, so playback reverts to YouTube's own pick.
  //
  // `contains` rather than a strict equality check because the "native
  // fullscreen" button below swaps the fullscreen target from the frame to
  // the iframe inside it; both count as this player being fullscreen.
  useEffect(() => {
    function handleFullscreenChange() {
      const target = document.fullscreenElement;
      const isFullscreen = !!target && !!frameRef.current && frameRef.current.contains(target);
      setFullscreen(isFullscreen);
      controls.preferQuality(isFullscreen ? "hd1080" : "default");
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function wake() {
    setControlsVisible(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (player.playing) {
      idleTimer.current = setTimeout(() => setControlsVisible(false), CONTROLS_IDLE_MS);
    }
  }

  // Syncs the idle timer to the player's own playing state, which can flip
  // without a fresh pointer move (autoplay, YouTube's own end-of-video pause).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors external player state, not a derived value
    wake();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.playing]);

  const progress = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;

  function handleScrub(event: React.ChangeEvent<HTMLInputElement>) {
    const fraction = Number(event.target.value) / 100;
    controls.seek(fraction * player.duration);
  }

  function handleFullscreen() {
    if (fullscreen) {
      document.exitFullscreen().catch((error: unknown) => {
        console.error("[youtube player] exit fullscreen request rejected:", error);
      });
      return;
    }
    frameRef.current?.requestFullscreen().catch((error: unknown) => {
      console.error("[youtube player] fullscreen request rejected:", error);
    });
  }

  function handleOpenOnYouTube() {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank", "noopener,noreferrer");
  }

  return (
    <HologramFrame ref={frameRef} label={label} className={className} plain={fullscreen}>
      <div
        className={clsx(
          "relative w-full",
          fullscreen ? "flex h-full items-center justify-center bg-void" : "aspect-video",
        )}
        onPointerMove={active ? wake : undefined}
        onPointerLeave={() => player.playing && setControlsVisible(false)}
      >
        {/*
          Fullscreen: sized by width, capped so the derived 16:9 height never
          exceeds the viewport, then centered by the flex row above. That
          keeps the video whole with letterboxing instead of the browser's
          default of stretching it to fill (and cropping on ultrawide).
        */}
        <div
          ref={videoBoxRef}
          className={clsx("relative", fullscreen ? "aspect-video" : "absolute inset-0 h-full w-full")}
          style={fullscreen ? { width: "min(100%, calc(100vh * 16 / 9))" } : undefined}
        >
          {active ? (
            <>
              <div
                className="absolute inset-0 h-full w-full [&_iframe]:h-full [&_iframe]:w-full"
                ref={mountRef}
              />
              {/*
                YouTube shows its own hover chrome (pause glyph, share, watch
                later, its logo) the moment the pointer reaches the iframe
                itself, regardless of the controls=0 param. A transparent
                button on top keeps the pointer off the iframe entirely so
                only the custom control bar below is ever visible.
              */}
              <button
                type="button"
                onClick={controls.toggle}
                aria-label={player.playing ? "Pause" : "Play"}
                className="absolute inset-0 z-[5] cursor-pointer"
                {...interactiveCursorProps}
              />
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
                controlsVisible ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progress}
                onChange={handleScrub}
                aria-label="Seek"
                className="u-scrub h-1 w-full cursor-pointer appearance-none rounded-full bg-signal/25 accent-signal"
                {...interactiveCursorProps}
              />
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={controls.toggle}
                  aria-label={player.playing ? "Pause" : "Play"}
                  className="text-signal transition-colors hover:text-frost"
                  {...interactiveCursorProps}
                >
                  {player.playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
                </button>

                <button
                  type="button"
                  onClick={controls.toggleMute}
                  aria-label={player.muted ? "Unmute" : "Mute"}
                  className="text-signal transition-colors hover:text-frost"
                  {...interactiveCursorProps}
                >
                  {player.muted || player.volume === 0 ? <MuteIcon size={15} /> : <VolumeIcon size={15} />}
                </button>

                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={player.muted ? 0 : player.volume}
                  onChange={(event) => controls.setVolume(Number(event.target.value))}
                  aria-label="Volume"
                  className="u-scrub h-1 w-16 cursor-pointer appearance-none rounded-full bg-signal/25 accent-signal"
                  {...interactiveCursorProps}
                />

                <span className="font-mono text-[10px] tabular-nums text-mist">
                  {formatTime(player.currentTime)} / {formatTime(player.duration)}
                </span>

                <button
                  type="button"
                  onClick={controls.toggleCaptions}
                  aria-label={player.captionsOn ? "Hide captions" : "Show captions"}
                  aria-pressed={player.captionsOn}
                  className={clsx(
                    "ml-auto transition-colors hover:text-frost",
                    player.captionsOn ? "text-frost" : "text-signal",
                  )}
                  {...interactiveCursorProps}
                >
                  <CaptionsIcon size={15} />
                </button>

                <button
                  type="button"
                  onClick={handleOpenOnYouTube}
                  aria-label="Watch on YouTube"
                  className="text-signal transition-colors hover:text-frost"
                  {...interactiveCursorProps}
                >
                  <YouTubeIcon size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleFullscreen}
                  aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                  className="text-signal transition-colors hover:text-frost"
                  {...interactiveCursorProps}
                >
                  <FullscreenIcon size={15} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </HologramFrame>
  );
}
