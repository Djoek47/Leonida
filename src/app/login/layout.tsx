import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in", description: "Sign in or create your Live From Leonida account.", alternates: { canonical: "/login" } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
