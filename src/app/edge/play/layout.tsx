import type { Metadata, Viewport } from "next";

export const metadata: Metadata = { title: "Perfect Play", description: "Mission by mission through GTA VI: what to do next, the choices that matter and when to save.", alternates: { canonical: "/edge/play" } };
export const viewport: Viewport = { themeColor: "#0d0718" };

export default function L({ children }: { children: React.ReactNode }) { return children; }
