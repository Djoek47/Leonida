import type { Metadata } from "next";

export const metadata: Metadata = { title: "Credits", description: "Credits and sources.", alternates: { canonical: "/credits" } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
