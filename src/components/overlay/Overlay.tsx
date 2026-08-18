"use client";

/**
 * The DOM layer that sits on top of the canvas.
 *
 * It owns every readable thing on the site plus the input wiring. The layer
 * itself never captures pointer events; individual pieces opt back in, so
 * dragging the sky works everywhere the visitor is not actually clicking text.
 */

import { Cursor } from "./Cursor";
import { FocusPanel } from "./FocusPanel";
import { Header } from "./Header";
import { HintBar } from "./HintBar";
import { IntroVeil } from "./IntroVeil";
import { NavRail } from "./NavRail";
import { SkyTooltip } from "./SkyTooltip";
import { StarTooltip } from "./StarTooltip";
import { useHashRoute } from "@/lib/hooks/useHashRoute";
import { useNavigationInput } from "@/lib/hooks/useNavigationInput";

export function Overlay() {
  useNavigationInput();
  useHashRoute();

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      <Header />
      <FocusPanel />
      <StarTooltip />
      <SkyTooltip />
      <NavRail />
      <HintBar />
      <IntroVeil />
      <Cursor />
    </div>
  );
}
