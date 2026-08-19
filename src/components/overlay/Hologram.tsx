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
import { forwardRef } from "react";

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

export const HologramFrame = forwardRef<HTMLElement, HologramFrameProps>(function HologramFrame(
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
