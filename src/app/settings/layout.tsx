import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings", description: "Your account settings.", alternates: { canonical: "/settings" }, robots: { index: false } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
