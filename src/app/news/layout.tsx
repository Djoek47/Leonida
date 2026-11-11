import type { Metadata } from "next";

export const metadata: Metadata = { title: "GTA 6 news", description: "The latest GTA 6 news from Leonida, checked and dated: trailers, release date, map and more.", alternates: { canonical: "/news" } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
