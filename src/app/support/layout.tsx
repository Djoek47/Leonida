import type { Metadata } from "next";

export const metadata: Metadata = { title: "Support", description: "Get help with Live From Leonida: sign-in, payments and payouts, your clips, voting and rounds, or anything that is broken. Open a ticket and we answer.", alternates: { canonical: "/support" } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
