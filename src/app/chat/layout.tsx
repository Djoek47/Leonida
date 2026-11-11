import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chat", description: "Chat with Live From Leonida about GTA 6 clips, the weekly contest, the Leonida guide and anything else on your mind about GTA VI.", alternates: { canonical: "/chat" } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
