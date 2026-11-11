import { Suspense } from "react";
import { ClipsHub } from "@/components/ClipsHub";

export default function Page() {
  return <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-24 text-haze">Loading clips…</div>}><ClipsHub cat="featured" /></Suspense>;
}
