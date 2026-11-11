import { Suspense } from "react";
import type { Metadata } from "next";
import { ClipsHub } from "@/components/ClipsHub";

export const metadata: Metadata = { title: "Featured GTA 6 clips", description: "The best GTA 6 clips picked by Live From Leonida: weekly winners and staff favorites, ready to watch and download.", alternates: { canonical: "/clips/featured" } };

export default function Page() {
  return <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-24 text-haze">Loading clips…</div>}><ClipsHub cat="featured" /></Suspense>;
}
