"use client";
import Link from "@/components/A";
import { useUser } from "@/lib/useUser";
import { useTrophies } from "@/lib/trophies";
import { TrophyMuseum } from "@/components/museum/TrophyMuseum";

export default function TrophiesPage() {
  const { user, loading } = useUser();
  const rows = useTrophies();
  const preview = process.env.NODE_ENV !== "production" && typeof location !== "undefined" && location.search.includes("preview");
  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
        <div>
          <p className="dash-kicker">Your collection</p>
          <h1 className="display text-4xl sm:text-5xl">Trophy museum</h1>
        </div>
        <Link href="/dashboard" className="text-sm font-bold underline underline-offset-4">← Back to your dashboard</Link>
      </div>
      {!preview && !loading && !user ? (
        <div className="mz-empty">
          <p className="display text-2xl">Sign in to walk your museum</p>
          <p className="text-haze mt-1">Every trophy you unlock gets its own spot in the hall.</p>
          <Link href="/login?next=/trophies" className="btn btn-hot mt-4">Sign in</Link>
        </div>
      ) : rows === null ? (
        <div className="mz mz-skel" aria-busy="true"><div className="mz-loading"><span className="mz-spin" />Opening the museum…</div></div>
      ) : rows.length === 0 ? (
        <div className="mz-empty"><p className="display text-2xl">The museum is being set up</p><p className="text-haze mt-1">Your trophies will appear here soon.</p></div>
      ) : (
        <TrophyMuseum rows={rows} />
      )}
      <p className="mt-4 text-xs text-haze">Trophies are achievements only. They never pay money, votes or credits. Money, votes given and votes received stay private to you.</p>
    </main>
  );
}
