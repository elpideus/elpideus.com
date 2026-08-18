"use client";

/**
 * Full size projection viewer.
 *
 * A deliberately quiet window: it can be moved by its header and closed by the
 * cross or by clicking the space around it, and it does nothing else. There is
 * no scrolling and no gesture inside it, so opening a picture can never leave
 * the visitor somewhere unexpected on the map.
 *
 * The backdrop carries `data-modal`, which the navigation input treats as
 * interactive, so wheel and drag gestures over the viewer never reach the sky.
 *
 * It renders through a portal into the body because its opener lives inside the
 * waypoint panel, and that panel carries a transform: a transformed ancestor
 * becomes the containing block for fixed positioning, which would trap this
 * viewer inside the panel instead of covering the viewport.
 */

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

import { CloseIcon } from "@/components/ui/Icon";
import { interactiveCursorProps } from "@/components/ui/primitives";
import { useWindowDrag, type DragOffset } from "@/lib/hooks/useWindowDrag";

export interface LightboxMedia {
  readonly src: string;
  readonly alt: string;
  /** Caption shown in the header, typically "Project / 03 of 09". */
  readonly label: string;
}

export function Lightbox({ media, onClose }: { media: LightboxMedia; onClose: () => void }) {
  const frame = useRef<HTMLDivElement>(null);
  // Created once and mutated by the drag gesture: a stable object rather than a
  // ref, so nothing reads a ref during render.
  const [offset] = useState<DragOffset>(() => ({ x: 0, y: 0 }));
  const [dragging, setDragging] = useState(false);

  const applyOffset = useCallback((next: DragOffset) => {
    const element = frame.current;
    if (!element) return;
    element.style.transform = `translate3d(${Math.round(next.x)}px, ${Math.round(next.y)}px, 0)`;
  }, []);

  const startDrag = useWindowDrag(offset, {
    onStart: () => setDragging(true),
    onMove: applyOffset,
    onEnd: () => setDragging(false),
  });

  // Escape closes as well. Clicking is what the viewer asks for, but a keyboard
  // visitor still needs a way out of a dialog.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  /** Only a press that both starts and ends on the backdrop counts as outside. */
  const onBackdropClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const viewer = (
    <div
      data-modal
      role="dialog"
      aria-modal="true"
      aria-label={media.alt}
      onClick={onBackdropClick}
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-void/70 backdrop-blur-[3px]"
      style={{ animation: "panel-in 240ms var(--ease-out-expo) both" }}
    >
      <div
        ref={frame}
        className="u-glass u-ticks max-h-[86vh] w-[min(1080px,86vw)] overflow-hidden rounded-[var(--radius-panel)]"
      >
        <header
          data-panel-drag
          onPointerDown={startDrag}
          style={{ cursor: dragging ? "grabbing" : "grab" }}
          title="Drag to move the viewer"
          className="flex select-none items-center justify-between gap-3 border-b border-[var(--panel-rule)] px-4 py-2.5"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span aria-hidden="true" className="grid shrink-0 grid-cols-2 gap-[3px] opacity-45">
              {Array.from({ length: 6 }).map((_, dot) => (
                <span key={dot} className="block h-[2px] w-[2px] rounded-full bg-mist" />
              ))}
            </span>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-mist">
              {media.label}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close the viewer"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-signal/25 text-mist transition-colors hover:border-signal/60 hover:text-signal"
            {...interactiveCursorProps}
          >
            <CloseIcon size={14} />
          </button>
        </header>

        <div className="relative bg-void/40">
          {/* Lighter treatment than the strip: at this size the picture itself
              is the point, so the projection styling stays to a whisper. */}
          <div className="relative mx-auto flex max-h-[74vh] w-full items-center justify-center">
            <Image
              src={media.src}
              alt={media.alt}
              width={1600}
              height={1000}
              sizes="86vw"
              className="max-h-[74vh] w-auto max-w-full object-contain"
              priority
            />
          </div>
          <div className="u-scanlines pointer-events-none absolute inset-0 opacity-20 mix-blend-screen" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-signal/[0.06] via-transparent to-transparent" />
        </div>
      </div>
    </div>
  );

  return createPortal(viewer, document.body);
}
