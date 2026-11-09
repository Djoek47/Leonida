import type { Metadata } from "next";

export const metadata: Metadata = { title: "GTA VI news", description: "The latest GTA VI news from Leonida, checked and dated.", alternates: { canonical: "/news" } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
