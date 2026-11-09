import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contest rules", description: "How the Live From Leonida contest works: entry, votes, prizes and payouts.", alternates: { canonical: "/rules" } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
