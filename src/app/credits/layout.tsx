import type { Metadata } from "next";

export const metadata: Metadata = { title: "Credits", description: "Credits and sources for Live From Leonida: the official Rockstar Games material we link to, the tools we use and the people behind the site. A fan site, not affiliated with Rockstar Games.", alternates: { canonical: "/credits" } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
