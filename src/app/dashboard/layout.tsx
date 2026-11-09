import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard", description: "Your clips, votes, badges and wallet.", alternates: { canonical: "/dashboard" }, robots: { index: false } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
