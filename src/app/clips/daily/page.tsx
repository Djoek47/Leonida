import { Suspense } from "react";
import type { Metadata } from "next";
import { ClipsHub } from "@/components/ClipsHub";

export const metadata: Metadata = { title: "Daily GTA 6 clips", description: "GTA 6 clips published today or in the last hour on Live From Leonida.", alternates: { canonical: "/clips/daily" } };

export default function Page() {
  return <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-24 text-haze">Loading clips…</div>}><ClipsHub cat="daily" /></Suspense>;
}
