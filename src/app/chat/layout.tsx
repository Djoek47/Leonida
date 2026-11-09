import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chat", description: "Talk clips with Leonida.", alternates: { canonical: "/chat" } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
