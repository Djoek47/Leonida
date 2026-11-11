import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in", description: "Sign in or create your free Live From Leonida account to enter the weekly GTA 6 clip contest, vote on clips and manage your plan.", alternates: { canonical: "/login" } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
