import type { Metadata } from "next";

export const metadata: Metadata = { title: "The edge", description: "Tools and trends for GTA VI creators.", alternates: { canonical: "/edge" } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
