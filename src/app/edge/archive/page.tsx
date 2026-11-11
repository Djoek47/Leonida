"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Round = {
  contest_id: string; title: string; voting_closes_at: string; entries: number;
  winner_clip: string | null; winner_title: string | null; winner_gamertag: string | null; winner_views: number | null;
};
const DEMO: Round[] = [
  { contest_id: "a", title: "Week of Nov 19", voting_closes_at: new Date(Date.now() - 6 * 864e5).toISOString(), entries: 42, winner_clip: "x", winner_title: "Airboat through the billboard", winner_gamertag: "SwampSaint", winner_views: 5120 },
];

/** Kingpin archive: every finished weekly round and the clip that won it. */
export default function Archive() {
  const { user, tier, paying, profile, loading } = useUser();
  const [rows, setRows] = useState<Round[] | null>(null);
  const [err, setErr] = useState("");
  const allowed = Boolean(profile?.is_admin || (paying && tier.id === "kingpin"));

  useEffect(() => {
    if (!user || !allowed) return;
    const c = sb(); if (!c) { setRows(DEMO); return; }
    c.rpc("archive_rounds").then(({ data, error }) => {
      if (error) { setErr("Couldn't load the archive. Try again."); setRows([]); return; }
      setRows((data ?? []) as Round[]);
    });
  }, [user, allowed]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-24 text-haze">Loading…</div>;
  if (!user || !allowed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="display text-[clamp(2rem,7vw,3rem)] leading-none">Kingpin archive</h1>
        <p className="mt-4 text-haze">Every finished weekly round and its winning clip, kept in one place. A Kingpin perk.</p>
        <Link href={user ? "/pricing" : "/login?next=/edge/archive"} className="btn btn-hot mt-6">{user ? "See Kingpin" : "Sign in"}</Link>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 [&>*]:min-w-0">
      <h1 className="display text-[clamp(2rem,7vw,3.2rem)] leading-none">Kingpin archive</h1>
      <p className="mt-2 text-haze">Every finished weekly round and the clip that won it.</p>
      {err && <p className="mt-6 text-sm font-bold text-haze">{err}</p>}
      {rows === null ? <p className="mt-8 text-haze">Loading…</p> : rows.length === 0 && !err ? <p className="mt-8 text-haze">No finished rounds yet. The first one lands after the first Thursday round closes.</p> : (
        <ol className="mt-6 grid gap-3">
          {rows.map((r) => (
            <li key={r.contest_id} className="set-card !mt-0 grid gap-1">
              <p className="text-xs font-black uppercase tracking-wide text-haze">{r.title} · closed {new Date(r.voting_closes_at).toLocaleDateString()} · {r.entries} entries</p>
              {r.winner_clip
                ? <p><Link href={`/clips/all?play=${r.winner_clip}`} className="font-black hover:underline">★ {r.winner_title}</Link> <span className="text-haze">by {r.winner_gamertag}{r.winner_views != null ? ` · ${r.winner_views.toLocaleString()} views` : ""}</span></p>
                : <p className="text-haze">No winner declared for this round.</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
