import { Suspense } from "react";
import type { Metadata } from "next";
import { ClipsHub } from "@/components/ClipsHub";

export const metadata: Metadata = { title: "All GTA 6 clips", description: "Browse every GTA 6 clip on Live From Leonida: filter by category and platform, sort by most viewed or newest, and play them in HD.", alternates: { canonical: "/clips/all" } };

export default function Page() {
  return <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-24 text-haze">Loading clips…</div>}><ClipsHub cat="all" /></Suspense>;
}
