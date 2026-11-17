"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

type Brief = { id: string; title: string; mission: string | null; summary: string | null; body: string; published_at: string | null };
type Teaser = { id: string; title: string; mission: string | null; published_at: string | null };
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

/** Mission Briefing: GTA VI mission insights written by the team in the console.
 *  Street, Hustler and Kingpin members read them; everyone else sees the titles, locked. */
export default function MissionBriefing() {
  const { user, profile, paying, tier, loading } = useUser();
  const allowed = Boolean(profile?.is_admin || (paying && tier.rank >= 1));
  const [rows, setRows] = useState<Brief[] | null>(null);
  const [teasers, setTeasers] = useState<Teaser[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    const c = sb(); if (!c) { setRows([]); return; }
    if (allowed) {
      c.from("mission_briefings").select("id, title, mission, summary, body, published_at").eq("published", true).order("published_at", { ascending: false })
        .then(({ data }) => { const r = (data ?? []) as Brief[]; setRows(r); setOpen(r[0]?.id ?? null); });
    } else {
      c.rpc("briefing_titles").then(({ data }) => setTeasers((data ?? []) as Teaser[]));
      setRows([]);
    }
  }, [allowed, loading]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 [&>*]:min-w-0">
      <p className="dash-kicker"><Link href="/edge" className="underline underline-offset-4">The Edge</Link> · Street, Hustler and Kingpin</p>
      <h1 className="display text-5xl md:text-6xl mt-1">Mission Briefing</h1>
      <p className="mt-2 text-haze max-w-2xl">Get all insights into GTA VI Missions, don&apos;t miss a thing.</p>

      {loading || rows === null ? (
        <p className="mt-10 text-haze font-semibold" role="status">Loading the briefings…</p>
      ) : !allowed ? (
        <section className="brief-locked mt-8">
          <div className="brief-lock-head">
            <span className="brief-lock-ico" aria-hidden>🔒</span>
            <div>
              <p className="font-extrabold text-lg">Mission Briefing comes with Street, Hustler and Kingpin.</p>
              <p className="text-haze text-sm">{user ? "Upgrade your plan to read every briefing." : "Sign in with a Street, Hustler or Kingpin plan to read every briefing."}</p>
            </div>
            <Link href={user ? "/pricing" : "/login?next=/edge/briefing"} className="btn btn-hot ml-auto">{user ? "See the plans" : "Sign in"}</Link>
          </div>
          {teasers.length > 0 && (
            <ul className="brief-teasers" aria-label="Latest briefings">
              {teasers.map((t) => <li key={t.id}><b>{t.title}</b><span>{t.mission ? `${t.mission} · ` : ""}{day(t.published_at)}</span></li>)}
            </ul>
          )}
        </section>
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-line bg-ink p-8 text-center">
          <p className="display text-2xl">First briefings are on the way</p>
          <p className="text-haze mt-1">They land once Leonida&apos;s been played. You&apos;ll find them here.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3">
          {rows.map((b) => {
            const on = open === b.id;
            return (
              <li key={b.id} className={`brief${on ? " is-open" : ""}`}>
                <button className="brief-head" onClick={() => setOpen(on ? null : b.id)} aria-expanded={on}>
                  <span className="min-w-0">
                    {b.mission && <span className="brief-mission">{b.mission}</span>}
                    <span className="brief-title">{b.title}</span>
                    {b.summary && <span className="brief-sum">{b.summary}</span>}
                  </span>
                  <span className="brief-date">{day(b.published_at)}</span>
                </button>
                {on && <div className="brief-body">{b.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
