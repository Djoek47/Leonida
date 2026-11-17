import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mission Briefing", description: "Insights into every GTA VI mission, for Street, Hustler and Kingpin members.", alternates: { canonical: "/edge/briefing" } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
