"use client";
import { useCallback, useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import type { Clip } from "@/lib/api";

type Allowance = { per_month: number; used: number; remaining: number; enabled: boolean };
type Placement = { id: string; clip_id: string; status: string; starts_at: string | null; ends_at: string | null; requested_at: string };

/** Featured Clips, from the member's side: how many they have this month,
 *  which of their approved clips can go up, and where each placement stands.
 *  Times come from the server, so a refresh never restarts a clock. */
export function FeaturedClips({ clips }: { clips: Clip[] }) {
  const [a, setA] = useState<Allowance | null>(null);
  const [rows, setRows] = useState<Placement[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const c = sb();
    if (!c) return;
    const [{ data: al }, { data: ps }] = await Promise.all([
      c.rpc("my_feature_allowance"),
      c.from("featured_placements").select("id, clip_id, status, starts_at, ends_at, requested_at")
        .order("requested_at", { ascending: false }).limit(12),
    ]);
    setA(((al ?? [])[0] as Allowance) ?? null);
    setRows((ps ?? []) as Placement[]);
  }, []);
  useEffect(() => { load(); const id = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(id); }, [load]);

  // Not on this plan, or not switched on yet: nothing to show.
  if (!a || !a.enabled || a.per_month === 0) return null;

  const eligible = clips.filter((c) => ["approved", "featured"].includes(c.status)
    && !rows.some((r) => r.clip_id === c.id && ["scheduled", "active"].includes(r.status)));
  const title = (id: string) => clips.find((c) => c.id === id)?.title ?? "Clip";
  const fmt = (t: string | null) => (t ? new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—");
  const left = (t: string | null) => {
    if (!t) return "";
    const ms = new Date(t).getTime() - now;
    if (ms <= 0) return "ending";
    const h = Math.floor(ms / 36e5), m = Math.floor((ms % 36e5) / 6e4);
    return `${h}h ${m}m left`;
  };

  async function feature(id: string) {
    const c = sb(); if (!c) return;
    setBusy(id); setMsg("");
    const { error } = await c.rpc("request_feature", { p_clip: id });
    setBusy(null);
    if (error) {
      const m = error.message;
      setMsg(m.includes("NO_ALLOWANCE") ? "You've used this month's featured placements."
        : m.includes("ALREADY_FEATURED") ? "That clip is already featured or waiting its turn."
        : m.includes("NOT_ELIGIBLE") ? "Only your own approved clips can be featured."
        : "That didn't go through. Try again.");
      return;
    }
    setMsg("Done. It goes live in the Featured Clips row as soon as a slot is free, for 24 hours.");
    load();
  }

  return (
    <section className="mt-10">
      <h2 className="money-h">Featured Clips<span className="tail">{a.remaining} of {a.per_month} left this month</span></h2>
      <p className="text-sm text-haze max-w-2xl">
        A featured clip sits in the Featured Clips row near Trending for 24 hours, starting the moment it goes live.
        After that it stays everywhere else it already appears.
      </p>

      {rows.length > 0 && (
        <ul className="roll mt-3">
          {rows.map((r) => (
            <li key={r.id}>
              <span className="what">
                <b>{title(r.clip_id)}</b>
                <small>
                  {r.status === "scheduled" && "Scheduled · waiting for a free slot"}
                  {r.status === "active" && `Live since ${fmt(r.starts_at)} · ends ${fmt(r.ends_at)} · ${left(r.ends_at)}`}
                  {r.status === "expired" && `Ran ${fmt(r.starts_at)} – ${fmt(r.ends_at)}`}
                  {r.status === "cancelled" && "Cancelled"}
                </small>
              </span>
              <span className={`feat-chip ${r.status}`}>{r.status}</span>
            </li>
          ))}
        </ul>
      )}

      {a.remaining > 0 && (
        eligible.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {eligible.slice(0, 8).map((c) => (
              <button key={c.id} disabled={busy !== null} onClick={() => feature(c.id)} className="btn btn-ghost !py-2 text-sm disabled:opacity-60">
                {busy === c.id ? "Featuring…" : `Feature “${c.title}”`}
              </button>
            ))}
          </div>
        ) : <p className="mt-3 text-sm text-haze">Once a clip of yours is approved, you can feature it here.</p>
      )}
      {msg && <p role="status" className="mt-3 text-sm font-semibold text-gulf">{msg}</p>}
    </section>
  );
}
