import type { Metadata } from "next";

export const metadata: Metadata = { title: "Stream overlay", robots: { index: false, follow: false } };

/** Overlays run as an OBS browser source: transparent, no chrome, no scroll.
 *  Nothing from the site's own layout belongs here. */
export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="overlay-root">
      {children}
    </div>
  );
}
