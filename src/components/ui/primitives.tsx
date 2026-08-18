"use client";

/**
 * Small shared interface pieces.
 *
 * They exist so panels stay declarative and so every interactive element
 * remembers to tell the custom cursor what it is.
 */

import clsx from "clsx";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { ExternalIcon } from "./Icon";
import { CursorMode, setCursorMode } from "@/lib/state/cursor";

/** Visual weight of an action. */
export enum ActionTone {
  Primary = "primary",
  Ghost = "ghost",
  Quiet = "quiet",
}

const TONE_CLASS: Record<ActionTone, string> = {
  [ActionTone.Primary]:
    "border-signal/45 bg-signal/12 text-frost hover:bg-signal/22 hover:border-signal/70",
  [ActionTone.Ghost]:
    "border-signal/20 bg-transparent text-mist hover:text-frost hover:border-signal/50",
  [ActionTone.Quiet]: "border-transparent bg-transparent text-dim hover:text-frost",
};

const BASE_ACTION =
  "inline-flex items-center gap-2 rounded-[3px] border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors duration-200";

/** Hover handlers that keep the reticle in sync. */
export const interactiveCursorProps = {
  onPointerEnter: () => setCursorMode(CursorMode.Interactive),
  onPointerLeave: () => setCursorMode(CursorMode.Default),
} as const;

export function ActionButton({
  tone = ActionTone.Ghost,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ActionTone }) {
  return (
    <button
      type="button"
      className={clsx(BASE_ACTION, TONE_CLASS[tone], className)}
      {...interactiveCursorProps}
      {...props}
    >
      {children}
    </button>
  );
}

export function ActionLink({
  tone = ActionTone.Ghost,
  className,
  children,
  external = true,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { tone?: ActionTone; external?: boolean }) {
  return (
    <a
      className={clsx(BASE_ACTION, TONE_CLASS[tone], className)}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      {...interactiveCursorProps}
      {...props}
    >
      {children}
      {external ? <ExternalIcon size={13} className="opacity-70" /> : null}
    </a>
  );
}

/** Small static chip used for stack items and metadata. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-[2px] border border-signal/15 bg-signal/[0.06] px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.14em] text-mist",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Uppercase label above a block of content. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx("u-eyebrow", className)}>{children}</p>;
}

/** Body copy with the reading rhythm used across every panel. */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("space-y-3 text-[13.5px] leading-relaxed text-mist", className)}>
      {children}
    </div>
  );
}

/** Thin divider that fades at both ends. */
export function Hairline({ className }: { className?: string }) {
  return <div className={clsx("u-hairline h-px w-full", className)} />;
}
