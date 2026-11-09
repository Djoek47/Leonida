import type { Metadata } from "next";

export const metadata: Metadata = { title: "This week's GTA VI clips", description: "Vote on this week's best GTA VI clips from across Leonida. Cash prizes every week, month and year.", alternates: { canonical: "/clips" } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
