"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { platformName } from "@/lib/api";

type Row = {
  clip_id: string; title: string; gamertag: string; platform: string; tags: string[]; published_at: string;
  views_total: number; views_period: number; downloads_period: number; downloads_total: number; convert_pct: number | null;
};
const SORTS = [["views", "Most viewed"], ["downloads", "Most downloaded"], ["convert", "Best view-to-download rate"]] as const;
const SPANS = [[1, "24 hours"], [7, "7 days"], [30, "30 days"], [0, "All time"]] as const;
const DEMO: Row[] = [
  { clip_id: "d1", title: "Helicopter through the billboard", gamertag: "ViceCityVandal", platform: "ps5", tags: ["stunt", "funny"], published_at: new Date().toISOString(), views_total: 4210, views_period: 1880, downloads_period: 41, downloads_total: 63, convert_pct: 2.2 },
  { clip_id: "d2", title: "Swamp drift, no brakes", gamertag: "BayouKid", platform: "xbox", tags: ["drift"], published_at: new Date().toISOString(), views_total: 2980, views_period: 1210, downloads_period: 22, downloads_total: 30, convert_pct: 1.8 },
];

/** Clip Performance Lab. A Kingpin tool for people who buy clips: which ones are
 *  actually performing right now. Views and downloads come straight from the site's
 *  own counts. Vote totals stay private. */
export default function Lab() {
  const { user, tier, paying, profile, loading } = useUser();
  const [days, setDays] = useState<number>(7);
  const [sort, setSort] = useState<string>("views");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");
  const allowed = Boolean(profile?.is_admin || (paying && tier.id === "kingpin"));

  const load = useCallback(async () => {
    const c = sb(); setErr("");
    if (!c) { setRows(DEMO); return; }
    const { data, error } = await c.rpc("lab_top_clips", { p_days: days, p_sort: sort, p_limit: 25 });
    if (error) { setErr(error.message.includes("KINGPIN_ONLY") ? "Kingpin members only." : "Couldn't load the numbers. Try again."); setRows([]); return; }
    setRows((data ?? []) as Row[]);
  }, [days, sort]);
  useEffect(() => { if (user && allowed) load(); }, [user, allowed, load]);

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-24 text-haze">Loading…</div>;
  if (!user || !allowed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="display text-[clamp(2rem,7vw,3rem)] leading-none">Clip Performance Lab</h1>
        <p className="mt-4 text-haze">See which clips are performing the best, ranked by views, downloads and how often a view turns into a download. A Kingpin tool.</p>
        <Link href={user ? "/pricing" : "/login?next=/edge/lab"} className="btn btn-hot mt-6">{user ? "See Kingpin" : "Sign in"}</Link>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 [&>*]:min-w-0">
      <h1 className="display text-[clamp(2rem,7vw,3.2rem)] leading-none">Clip Performance Lab</h1>
      <p className="mt-2 text-haze">What is actually performing. Counts are real views and real paid downloads, updated live.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {SPANS.map(([d, l]) => <button key={d} onClick={() => setDays(d)} className={`btn btn-ghost !py-1.5 !px-4 text-sm${days === d ? " is-on" : ""}`} aria-pressed={days === d}>{l}</button>)}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {SORTS.map(([k, l]) => <button key={k} onClick={() => setSort(k)} className={`btn btn-ghost !py-1.5 !px-4 text-sm${sort === k ? " is-on" : ""}`} aria-pressed={sort === k}>{l}</button>)}
      </div>

      {err && <p className="mt-6 text-sm font-bold text-haze">{err}</p>}
      {rows === null ? <p className="mt-8 text-haze">Loading…</p> : rows.length === 0 && !err ? <p className="mt-8 text-haze">No clips in that window yet.</p> : (
        <ol className="mt-6 grid gap-3">
          {rows.map((r, i) => (
            <li key={r.clip_id} className="set-card !mt-0 grid gap-2 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center">
              <span className="display text-2xl text-haze">{i + 1}</span>
              <div className="min-w-0">
                <Link href={`/clips/all?play=${r.clip_id}`} className="font-black hover:underline">{r.title}</Link>
                <p className="text-xs text-haze">{r.gamertag} · {platformName[r.platform as keyof typeof platformName] ?? r.platform}{r.tags.length ? ` · ${r.tags.join(", ")}` : ""}</p>
              </div>
              <dl className="flex gap-5 text-sm [&_dt]:text-[.65rem] [&_dt]:uppercase [&_dt]:tracking-wide [&_dt]:text-haze [&_dd]:font-black">
                <div><dt>Views</dt><dd>{Number(r.views_period).toLocaleString()}</dd></div>
                <div><dt>Downloads</dt><dd>{Number(r.downloads_period).toLocaleString()}</dd></div>
                <div><dt>View → download</dt><dd>{r.convert_pct == null ? "–" : `${r.convert_pct}%`}</dd></div>
              </dl>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-8 text-xs text-haze">Watch-through and drop-off curves need player tracking we don&apos;t collect yet. Until then the Lab ranks on views and downloads.</p>
    </div>
  );
}
