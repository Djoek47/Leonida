import type { Metadata } from "next";

export const metadata: Metadata = { title: "The Road · GTA VI choice tree", description: "Every choice in GTA VI's story as one drive through Leonida. Pick your lane, see where your run ends up.", alternates: { canonical: "/edge/briefing/choices" } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
