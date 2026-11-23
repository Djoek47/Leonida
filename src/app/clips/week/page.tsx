import { Suspense } from "react";
import type { Metadata } from "next";
import { ClipsHub } from "@/components/ClipsHub";

export const metadata: Metadata = { title: "This week's GTA 6 clips", description: "Watch and vote on this week's GTA 6 clip contest. The top three split the weekly prize pool.", alternates: { canonical: "/clips/week" } };

export default function WeekClips() {
  return <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-24 text-haze">Loading clips…</div>}><ClipsHub cat="week" /></Suspense>;
}
