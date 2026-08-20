"use client";

/**
 * Which section body belongs to which panel kind.
 *
 * Shared by both touch layouts so the deck and the bridge can never drift into
 * showing different content for the same star. The bodies themselves are the
 * desktop ones, unchanged: only the frame around them differs per layout.
 */

import type { ReactNode } from "react";

import { AboutSection } from "@/components/sections/About";
import { ContactSection } from "@/components/sections/Contact";
import { JournalSection } from "@/components/sections/Journal";
import { OriginSection } from "@/components/sections/Origin";
import { PassionsSection } from "@/components/sections/Passions";
import { ProjectsSection } from "@/components/sections/Projects";
import { StudioSection } from "@/components/sections/Studio";
import { ToolkitSection } from "@/components/sections/Toolkit";
import { TrajectorySection } from "@/components/sections/Trajectory";
import { PanelKind } from "@/lib/graph/types";

/** Gesture legend for a phone, where the whole screen belongs to the scroll. */
export const DECK_HINT = "Scroll to travel · tilt to look around · open the chart to jump";

/** Gesture legend for a tablet, which has a sky it can actually reach into. */
export const BRIDGE_HINT = "Scroll the dossier to travel · drag the sky to look around";

export function panelBody(kind: PanelKind, hint: string): ReactNode {
  switch (kind) {
    case PanelKind.Origin:
      return <OriginSection hint={hint} />;
    case PanelKind.About:
      return <AboutSection />;
    case PanelKind.Journey:
      return <TrajectorySection />;
    case PanelKind.Projects:
      return <ProjectsSection />;
    case PanelKind.Studio:
      return <StudioSection />;
    case PanelKind.Toolkit:
      return <ToolkitSection />;
    case PanelKind.Passions:
      return <PassionsSection />;
    case PanelKind.Blog:
      return <JournalSection />;
    case PanelKind.Contact:
      return <ContactSection />;
    default:
      return null;
  }
}
