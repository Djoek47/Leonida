import type { Metadata } from "next";

export const metadata: Metadata = { title: "Trophy museum", description: "Walk through every trophy you've unlocked on Live From Leonida.", alternates: { canonical: "/trophies" }, robots: { index: false } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
