"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Fav = { id: string; title: string; gamertag: string; owner_id: string | null; duration_seconds: number | null; view_count: number };
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;

/** Your private playlist. Paid plans only; the records stay if a plan lapses and come back on resubscribing. */
export default function Favorites() {
  const { user, paying, tier, loading } = useUser();
  const [rows, setRows] = useState<Fav[] | null>(null);
  const [err, setErr] = useState(false);
  async function load() {
    const c = sb(); if (!c) { setRows([]); return; }
    setErr(false);
    const { data, error } = await c.rpc("my_favorites");
    if (error) { setErr(true); return; }
    setRows((data ?? []) as Fav[]);
  }
  useEffect(() => { if (user && paying) load(); }, [user, paying]);
  async function remove(id: string) {
    const prev = rows; setRows((r) => r?.filter((x) => x.id !== id) ?? r);
    const { error } = await sb()!.rpc("set_favorite", { p_clip: id, p_on: false });
    if (error) setRows(prev);
  }

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-24 text-haze">Loading…</div>;
  return (
    <div className={`dash dash-${paying ? tier.id : "free"}`}>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="dash-kicker">Private playlist</p>
        <h1 className="display text-[clamp(2.4rem,8vw,4.6rem)] leading-none">Favorites</h1>
        {!user ? (
          <div className="hub-empty"><p className="display text-3xl">Sign in to see your favorites</p><Link href="/login?next=/favorites" className="btn btn-hot mt-5">Sign in</Link></div>
        ) : !paying ? (
          <div className="hub-empty"><p className="display text-3xl">Favorites are for members</p><p className="text-haze mt-2">Street, Hustler and Kingpin Tiers can save clips here.</p><Link href="/pricing" className="btn btn-hot mt-5">See the plans</Link></div>
        ) : err ? (
          <div className="hub-empty"><p className="display text-3xl">Couldn&apos;t load your favorites</p><button className="btn btn-hot mt-5" onClick={load}>Try again</button></div>
        ) : rows === null ? (
          <div className="hub-grid mt-8">{Array.from({ length: 4 }, (_, i) => <div key={i} className="hub-skel" />)}</div>
        ) : rows.length === 0 ? (
          <div className="hub-empty"><p className="display text-3xl">Nothing saved yet</p><p className="text-haze mt-2">Your saved clips will appear here. Tap Favorite on any clip to save it.</p><Link href="/clips/all" className="btn btn-hot mt-5">Browse All Videos</Link></div>
        ) : (
          <div className="hub-grid mt-8">
            {rows.map((r) => (
              <article key={r.id} className="hub-card">
                <Link href={`/clips/all?play=${r.id}`} className="hub-thumb" aria-label={`Play ${r.title}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {SUPA && r.owner_id && <img src={`${SUPA}/storage/v1/object/public/thumbs/${r.owner_id}/${r.id}.jpg`} alt="" loading="lazy" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />}
                  <span className="hub-noimg -z-10">{r.gamertag.slice(0, 2).toUpperCase()}</span>
                </Link>
                <div className="hub-meta">
                  <div className="min-w-0 flex-1"><p className="hub-title">{r.title}</p><p className="hub-by">{r.gamertag} · {r.view_count} views</p></div>
                  <button className="btn btn-ghost !py-1.5 !px-3 text-sm" onClick={() => remove(r.id)} aria-label={`Remove ${r.title} from favorites`}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
