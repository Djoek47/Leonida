"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { useUser } from "@/lib/useUser";
import { CHAPTERS } from "@/lib/missions";
import { ENGINES } from "@/lib/economy";
import { FORKS, SAVE_PLAN } from "@/lib/choiceTree";

/** The Edge: a fork in the road. Left to Mission Briefing (and The Road), right to the
 *  Leonida Economist. Each lane shows where you left off, read from this browser's progress. */
const BACKDROP = "/media/video/edge-loop.mp4";
const POSTER = "/media/art/jason_lucia_motel_portrait.webp";
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

type Session = { ch: number; done: number; total: number; last: string | null; next: string | null; at: number | null; forks: number; forksOpen: number; slot: number | null };
function readSession(): Session {
  let ch = 1, doneList: string[] = [], at: number | null = null, picks: Record<string, unknown> = {};
  try { const v = Number(localStorage.getItem("lfl-chapter")); if (Number.isInteger(v) && v >= 0) ch = v; } catch {}
  try { doneList = JSON.parse(localStorage.getItem("lfl-mb-progress") ?? "{}").done ?? []; } catch {}
  try { const a = Number(localStorage.getItem("lfl-mb-at")); if (a > 0) at = a; } catch {}
  try { picks = JSON.parse(localStorage.getItem("lfl-road") ?? "{}"); } catch {}
  const c = CHAPTERS[Math.min(ch, CHAPTERS.length - 1)];
  const story = c.missions.filter((m) => !m.optional);
  const done = new Set(doneList);
  const last = [...doneList].reverse().find((n) => c.missions.some((m) => m.name === n)) ?? null;
  const next = story.find((m) => !done.has(m.name))?.name ?? null;
  const open = FORKS.filter((f) => f.ch <= Math.max(1, ch));
  const slot = SAVE_PLAN.find((s) => s.ch === ch && next && s.before.startsWith(next))?.slot ?? null;
  return { ch, done: story.filter((m) => done.has(m.name)).length, total: story.length, last, next, at, forks: open.filter((f) => picks[f.id] !== undefined).length, forksOpen: open.length, slot };
}
const ago = (t: number | null) => {
  if (!t) return null;
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
};

export default function Edge() {
  const { user, profile, paying, tier } = useUser();
  const [s, setS] = useState<Session | null>(null);
  const [film, setFilm] = useState(false);
  useEffect(() => { setS(readSession()); fetch(BACKDROP, { method: "HEAD" }).then((r) => setFilm(r.ok)).catch(() => {}); }, []);
  const rank = profile?.is_admin ? 9 : paying ? tier.rank : 0;
  const ch = Math.max(1, s?.ch ?? 1);
  const open = ENGINES.filter((e) => e.ch <= ch);
  const top = open.reduce((m, e) => Math.max(m, e.top ?? 0), 0);
  const bestRep = open.filter((e) => e.repeat).sort((a, b) => (b.top ?? 0) - (a.top ?? 0))[0];
  const fresh = ENGINES.filter((e) => e.ch === ch).length;
  const pct = s && s.total ? Math.round((s.done / s.total) * 100) : 0;

  return (
    <div className={`edge-road is-open${film ? " has-film" : ""}`}>
      {film && <video className="edge-film" src={BACKDROP} poster={POSTER} autoPlay muted loop playsInline preload="metadata" aria-hidden />}
      <div className="edge-horizon" aria-hidden />
      <div className="edge-lane" aria-hidden><i /><i /><i /><i /><i /><i /></div>
      <div className="edge-beam" aria-hidden />
      <div className="edge-motes" aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ "--m": i } as React.CSSProperties} />)}</div>
      <div className="edge-vig" aria-hidden />

      <main className="edge-scene eg">
        <p className="edge-k"><i className="edge-dot" aria-hidden />State route 6 · Leonida · Road open</p>
        <h1 className="eg-title">The <span>Edge</span></h1>
        <p className="eg-sub">Your co-pilot for GTA VI. Pick a lane: know every mission and choice before you play it, or make the most money the fastest.</p>

        <div className="eg-signs" aria-hidden>
          <span className="eg-sign l"><i>←</i>MISSION BRIEFING</span>
          <span className="eg-post" />
          <span className="eg-sign r">ECONOMIST<i>→</i></span>
        </div>

        {s && (s.at || s.done > 0) && (
          <div className="eg-resume">
            <span className="eg-resume-dot" aria-hidden />
            <p><b>Where you left off:</b> Chapter {s.ch}{s.last ? <>, finished <i>{s.last}</i></> : null}{s.next ? <>. Up next: <i>{s.next}</i></> : null}{s.at ? ` · saved ${ago(s.at)}` : ""}</p>
            <Link href="/edge/briefing" className="eg-resume-go">Resume →</Link>
          </div>
        )}

        <div className="eg-paths">
          <Link href="/edge/briefing" className="eg-path is-brief">
            <span className="eg-path-k">Lane A · Street and up {rank < 1 && <em>🔒</em>}</span>
            <b className="eg-path-t">Mission Briefing</b>
            <span className="eg-path-d">Every mission, step by step, with payouts, missables, choices and where to save.</span>
            <span className="eg-prev">
              <span className="eg-prev-row"><span>Chapter {ch} · {CHAPTERS[ch].title}</span><b>{s ? `${s.done}/${s.total}` : "—"}</b></span>
              <span className="eg-bar"><i style={{ width: `${pct}%` }} /></span>
              <span className="eg-prev-row"><span>Up next</span><b>{s?.next ?? "Pick your chapter"}</b></span>
              {s?.slot && <span className="eg-prev-row is-save"><span>💾 Save first</span><b>Slot {s.slot}</b></span>}
              <span className="eg-prev-row"><span>The Road</span><b>{s ? `${s.forks}/${s.forksOpen} choices made` : "—"}</b></span>
            </span>
            <span className="eg-go">Open the briefing →</span>
          </Link>

          <Link href="/edge/economist" className="eg-path is-econ">
            <span className="eg-path-k">Lane B · Hustler and up {rank < 2 && <em>🔒</em>}</span>
            <b className="eg-path-t">Leonida Economist</b>
            <span className="eg-path-d">Every way to earn, how it grows chapter by chapter, where to sell and how to keep it.</span>
            <span className="eg-prev">
              <span className="eg-prev-row"><span>Biggest score open, Ch. {ch}</span><b className="is-gold">{usd(top)}</b></span>
              <span className="eg-prev-row"><span>Money engines open</span><b>{open.length}{fresh ? ` (+${fresh} new)` : ""}</b></span>
              <span className="eg-prev-row"><span>Best you can repeat</span><b>{bestRep?.name ?? "—"}</b></span>
            </span>
            <span className="eg-go">Open the Economist →</span>
          </Link>
        </div>

        <Link href="/edge/archive" className={`eg-archive${rank >= 3 ? " is-open" : ""}`}>
          <span className="eg-archive-ico" aria-hidden>{rank >= 3 ? "🎞" : "🔒"}</span>
          <span><b>Clip archive</b><small>Every clip from every closed week, with podiums and downloads. {rank >= 3 ? "Yours with Kingpin." : "Kingpin only."}</small></span>
          <span className="eg-go">{rank >= 3 ? "Open the archive →" : "Take a look →"}</span>
        </Link>

        <div className="eg-access">
          <p><b>How you get the Edge:</b> it comes with membership.</p>
          <ul>
            <li className={rank >= 1 ? "is-have" : ""}><span>Street</span>Mission Briefing and The Road</li>
            <li className={rank >= 2 ? "is-have" : ""}><span>Hustler</span>Adds the Leonida Economist</li>
            <li className={rank >= 3 ? "is-have" : ""}><span>Kingpin</span>Everything, plus the <Link href="/edge/archive" className="underline">clip archive</Link></li>
          </ul>
          {rank < 1 && <Link href={user ? "/pricing" : "/login?next=/edge"} className="btn btn-hot">{user ? "See the plans" : "Sign in"}</Link>}
        </div>
      </main>
    </div>
  );
}
