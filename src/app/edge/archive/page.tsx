"use client";
import { playUrl } from "@/lib/media";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

/** Kingpin clip archive: every clip from every closed week, its placement and votes, playable and
 *  downloadable. Clips leave the open download shelf when their week closes; this room keeps them. */
type Week = { contest_id: string; title: string; closed_at: string; entries: number; finalized: boolean; winner_clip: string | null; winner_title: string | null; winner_gamertag: string | null; winner_owner: string | null };
type Clip = { id: string; owner_id: string | null; title: string; gamertag: string; platform: string | null; duration_seconds: number | null; view_count: number | null;
  watermark_path: string | null; storage_path: string | null; source_url: string | null; contest_id: string; contest_title: string; closed_at: string; place: number | null; votes: number; total: number };
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PAGE = 24;
const MEDAL = ["", "🥇", "🥈", "🥉"], PLACE = ["", "Gold", "Silver", "Bronze"];
const thumb = (c: Clip) => (SUPA && c.owner_id ? `${SUPA}/storage/v1/object/public/thumbs/${c.owner_id}/${c.id}.jpg` : undefined);
const mmss = (s: number | null) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "");
const day = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const SORTS = [["place", "Podium first"], ["new", "Newest week"], ["votes", "Most votes"], ["views", "Most views"]] as const;

const DEMO_W: Week[] = [{ contest_id: "w1", title: "Week 1: Vice City getaways", closed_at: new Date(Date.now() - 3 * 864e5).toISOString(), entries: 3, finalized: true, winner_clip: "c1", winner_title: "Airboat through the billboard", winner_gamertag: "SwampSaint", winner_owner: null }];
const DEMO_C: Clip[] = ["Airboat through the billboard", "Gas station pile-up", "Roof jump on Ocean Drive"].map((t, i) => ({ id: `c${i + 1}`, owner_id: null, title: t, gamertag: ["SwampSaint", "KeyLentoKid", "Mango"][i], platform: "PS5", duration_seconds: 38 + i * 11, view_count: [5120, 2210, 940][i],
  watermark_path: null, storage_path: null, source_url: null, contest_id: "w1", contest_title: DEMO_W[0].title, closed_at: DEMO_W[0].closed_at, place: i + 1, votes: [41, 27, 12][i], total: 3 }));

export default function Archive() {
  const { user, tier, paying, profile, loading } = useUser();
  const allowed = Boolean(profile?.is_admin || (paying && tier.id === "kingpin"));
  const [weeks, setWeeks] = useState<Week[] | null>(null);
  const [rows, setRows] = useState<Clip[] | null>(null);
  const [week, setWeek] = useState<string | null>(null);
  const [q, setQ] = useState(""), [qq, setQq] = useState("");
  const [sort, setSort] = useState<string>("place");
  const [open, setOpen] = useState<Clip | null>(null);
  const [err, setErr] = useState(""), [msg, setMsg] = useState("");
  const seq = useRef(0);

  useEffect(() => { const t = setTimeout(() => setQq(q), 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    if (!user || !allowed) return;
    const c = sb(); if (!c) { setWeeks(DEMO_W); return; }
    c.rpc("archive_weeks").then(({ data, error }) => { if (error) setErr("Couldn't load the archive. Try again."); setWeeks((data ?? []) as Week[]); });
  }, [user, allowed]);

  const load = useCallback(async (offset = 0) => {
    const c = sb(); const my = ++seq.current;
    if (!c) { setRows(DEMO_C.filter((r) => !qq || `${r.title}${r.gamertag}`.toLowerCase().includes(qq.toLowerCase()))); return; }
    const { data, error } = await c.rpc("archive_clips", { p_contest: week, p_q: qq || null, p_sort: sort, p_limit: PAGE, p_offset: offset });
    if (my !== seq.current) return;
    if (error) { setErr("Couldn't load the archive. Try again."); setRows((r) => r ?? []); return; }
    setRows((r) => (offset ? [...(r ?? []), ...((data ?? []) as Clip[])] : ((data ?? []) as Clip[])));
  }, [week, qq, sort]);
  useEffect(() => { if (user && allowed) load(0); }, [user, allowed, load]);

  const total = rows?.[0]?.total ?? 0;
  const sel = useMemo(() => weeks?.find((w) => w.contest_id === week) ?? null, [weeks, week]);
  const clipsAll = useMemo(() => (weeks ?? []).reduce((n, w) => n + Number(w.entries), 0), [weeks]);

  async function download(c: Clip) {
    const s = sb(); if (!s) { setMsg("Demo build: downloads need the live site."); return; }
    setMsg("Getting the file…");
    const token = (await s.auth.getSession()).data.session?.access_token;
    const res = await fetch("/api/download", { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ clipId: c.id }) });
    const j = (await res.json().catch(() => ({}))) as { file?: string; checkout?: string; error?: string; external?: boolean };
    if (j.checkout) { location.href = j.checkout; return; }
    if (!j.file) { setMsg(j.error ?? "Could not start the download."); return; }
    if (j.external) window.open(j.file, "_blank", "noopener"); else location.href = j.file;
    setMsg(c.owner_id !== user?.id ? `Downloading. ${c.gamertag} gets their share.` : "Downloading.");
  }

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-24 text-haze">Loading…</div>;
  if (!user || !allowed) return <Locked signedIn={Boolean(user)} />;

  return (
    <div className="ar mx-auto max-w-6xl px-4 py-12 [&>*]:min-w-0">
      <header className="ar-head">
        <div>
          <p className="ar-kicker">👑 Kingpin room</p>
          <h1 className="display text-[clamp(2.2rem,7vw,3.6rem)] leading-none">Clip archive</h1>
          <p className="mt-2 text-haze max-w-xl">Every clip from every closed week. Watch them, see how they placed, and download the ones you want after their week is over.</p>
        </div>
        <dl className="ar-stats">
          <div><dt>Weeks</dt><dd>{weeks?.length ?? "–"}</dd></div>
          <div><dt>Clips</dt><dd>{weeks ? clipsAll : "–"}</dd></div>
          <div><dt>Podiums</dt><dd>{weeks ? weeks.filter((w) => w.finalized && w.winner_clip).length : "–"}</dd></div>
        </dl>
      </header>

      {err && <p className="mt-6 text-sm font-bold text-haze">{err}</p>}

      <nav className="ar-weeks" aria-label="Weeks">
        <button className={!week ? "is-on" : ""} onClick={() => setWeek(null)}>All weeks</button>
        {(weeks ?? []).map((w) => (
          <button key={w.contest_id} className={week === w.contest_id ? "is-on" : ""} onClick={() => setWeek(w.contest_id)}>
            <b>{w.title}</b><small>{day(w.closed_at)} · {w.entries} clips</small>
          </button>
        ))}
      </nav>

      {sel && (
        <div className="ar-banner">
          <span className="ar-banner-medal" aria-hidden>{sel.winner_clip ? "🏆" : "⏳"}</span>
          <div><p className="ar-kicker">{sel.title} · closed {day(sel.closed_at)}</p>
            <p className="font-black text-lg">{sel.winner_clip ? <>Won by <span className="text-mango">{sel.winner_title}</span> from {sel.winner_gamertag}</> : sel.finalized ? "No winner was declared this week." : "Results are being checked. Placements show once they're final."}</p></div>
        </div>
      )}

      <div className="ar-bar">
        <label className="ar-search"><span aria-hidden>🔎</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a clip or gamertag" aria-label="Search the archive" /></label>
        <label className="ar-sort"><span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
      </div>
      {msg && <p className="ar-msg" role="status">{msg}</p>}

      {rows === null ? <p className="mt-8 text-haze">Loading…</p> : rows.length === 0 ? (
        <div className="ar-empty"><p className="font-black text-lg">{qq ? "Nothing matches that search." : "The archive fills up as weeks close."}</p><p className="text-haze">{qq ? "Try a gamertag or a shorter word." : "Each Thursday's round lands here when its voting ends."}</p></div>
      ) : (
        <ul className="ar-grid">
          {rows.map((c) => (
            <li key={c.id} className={`ar-card${c.place ? ` is-p${c.place}` : ""}`}>
              <button className="ar-thumb" onClick={() => setOpen(c)} aria-label={`Play ${c.title}`}>
                {thumb(c) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb(c)} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                ) : null}
                <span className="ar-play" aria-hidden>▶</span>
                {c.place && <span className="ar-medal">{MEDAL[c.place]} {PLACE[c.place]}</span>}
                {c.duration_seconds ? <span className="ar-dur">{mmss(c.duration_seconds)}</span> : null}
              </button>
              <div className="ar-body">
                <p className="ar-title">{c.title}</p>
                <p className="ar-meta">{c.gamertag}{c.platform ? ` · ${c.platform}` : ""}</p>
                {!week && <p className="ar-week">{c.contest_title}</p>}
                <div className="ar-foot">
                  <span>▲ {c.votes} votes</span><span>👁 {(c.view_count ?? 0).toLocaleString("en-US")}</span>
                  <button className="ar-dl" onClick={() => download(c)}>⬇ Download</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {rows && rows.length < total && <button className="ar-more" onClick={() => load(rows.length)}>Show more ({total - rows.length} left)</button>}
      <p className="ar-note">Archive downloads work like any other: you pay once per clip, the creator gets their share, and fetching it again later is free.</p>

      {open && <Player clip={open} onClose={() => setOpen(null)} onDownload={() => download(open)} />}
    </div>
  );
}

function Player({ clip, onClose, onDownload }: { clip: Clip; onClose: () => void; onDownload: () => void }) {
  const [url, setUrl] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const path = clip.watermark_path ?? clip.storage_path;
    if (!sb() || !path) { setUrl(null); return; }
    playUrl(clip).then(setUrl);
  }, [clip]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="ar-modal" role="dialog" aria-modal="true" aria-label={clip.title} onClick={onClose}>
      <div className="ar-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="ar-x" onClick={onClose} aria-label="Close">✕</button>
        <div className="ar-video">
          {url ? <video src={url} poster={thumb(clip)} controls autoPlay playsInline /> : url === null ? (
            clip.source_url ? <a href={clip.source_url} target="_blank" rel="noopener noreferrer" className="btn btn-hot">Watch on the original site ↗</a> : <p className="text-haze">No playable file for this clip.</p>
          ) : <p className="text-haze">Loading…</p>}
        </div>
        <div className="ar-sheet-body">
          <div><p className="ar-kicker">{clip.contest_title}{clip.place ? ` · ${MEDAL[clip.place]} ${PLACE[clip.place]}` : ""}</p>
            <p className="font-black text-xl">{clip.title}</p>
            <p className="text-haze text-sm">{clip.gamertag} · {clip.votes} votes · {(clip.view_count ?? 0).toLocaleString("en-US")} views</p></div>
          <button className="btn btn-hot" onClick={onDownload}>⬇ Download</button>
        </div>
      </div>
    </div>
  );
}

function Locked({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="ar mx-auto max-w-5xl px-4 py-16">
      <div className="ar-lock">
        <div className="ar-lock-copy">
          <p className="ar-kicker">👑 Kingpin perk</p>
          <h1 className="display text-[clamp(2.2rem,7vw,3.6rem)] leading-none">Clip archive</h1>
          <p className="mt-3 text-haze">When a week closes, its clips come off the download shelf. Kingpin members keep the key to the whole back catalogue.</p>
          <ul className="ar-lock-list">
            <li>🎞 Every clip from every closed week, not just the winners</li>
            <li>🥇 Podium placements and final vote counts</li>
            <li>⬇ Download any archived clip, and the creator still gets paid</li>
            <li>🔎 Search by clip or gamertag, sort by votes or views</li>
          </ul>
          <Link href={signedIn ? "/pricing" : "/login?next=/edge/archive"} className="btn btn-hot mt-6">{signedIn ? "Go Kingpin" : "Sign in"}</Link>
        </div>
        <div className="ar-lock-peek" aria-hidden>
          {[1, 2, 3, 0, 0, 0].map((p, i) => <span key={i} className={`ar-ghost${p ? ` is-p${p}` : ""}`}>{p ? MEDAL[p] : "▶"}</span>)}
          <span className="ar-lock-pad">🔒</span>
        </div>
      </div>
    </div>
  );
}
