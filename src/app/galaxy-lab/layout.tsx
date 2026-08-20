import type { Metadata } from "next";

/** A workbench, not a page. It stays out of every index. */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function GalaxyLabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
