import { StarMap } from "@/components/canvas/StarMap";
import { Overlay } from "@/components/overlay/Overlay";

/**
 * The whole site is one page: a 3D map behind a DOM overlay. Sections are
 * stars, not scroll positions, so there is nothing else to route.
 */
export default function HomePage() {
  return (
    <main className="relative h-dvh w-screen overflow-hidden">
      <StarMap />
      <Overlay />
    </main>
  );
}
