"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { DEMO_CLIPS, DEMO_CONTEST, exactMoney, money, platformName, poolNow, type Clip, type Contest, type Pool } from "@/lib/api";
import { BRACKETS } from "@/lib/tiers";
import { DemoNote } from "@/components/DemoNote";
import NotFound from "@/app/not-found";

type Tab = "overview" | "cashouts" | "review" | "gamertags" | "contest" | "payouts" | "creators" | "wallets" | "people" | "claims" | "drops" | "staff";
type Row = Record<string, unknown> & { id: string };

export default function Admin() {
  const { profile, loading } = useUser();
  const [tab, setTab] = useState<Tab>("overview");
  if (loading) return <div className="mx-auto max-w-xl px-4 py-24 text-haze font-semibold" role="status">Loading your account…</div>;
  // Anyone who isn't staff gets the ordinary not-found page. Saying "staff
  // only" would confirm there's a console here to anyone who guessed the URL.
  if (!profile?.is_admin) return <NotFound />;
  const tabs: [Tab, string][] = [["overview", "Overview"], ["cashouts", "Cash-out requests"], ["review", "Clip queue"], ["gamertags", "Gamertags"], ["contest", "Weekly round"], ["people", "People"], ["payouts", "Prize payouts"], ["creators", "Creator payouts"], ["wallets", "Member money"], ["claims", "Claims"], ["drops", "Daily Drops"], ["staff", "Staff and settings"]];
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <DemoNote />
      <h1 className="display text-6xl">The Console</h1>
      <div role="tablist" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-4 py-2.5 font-bold text-sm border-b-2 -mb-px ${tab === k ? "border-flamingo text-foam" : "border-transparent text-haze"}`}>{l}</button>)}
      </div>
      <div className="mt-8">
        {tab === "overview" && <Overview go={setTab} />}
        {tab === "cashouts" && <Cashouts />}
        {tab === "review" && <Review />}
        {tab === "gamertags" && <Gamertags />}
        {tab === "people" && <People />}
        {tab === "contest" && <ContestAdmin />}
        {tab === "payouts" && <Table table="winnings" filter={["status", ["requested", "verifying", "held"]]} cols={["place", "amount_cents", "status", "owner_id"]}
          actions={[["verifying", "Checking gamertag"], ["sent", "Mark paid"], ["held", "Hold"]]} refField="payout_ref" />}
        {tab === "claims" && <Table table="claims" filter={["status", ["open"]]} cols={["clip_id", "claimant_id", "evidence"]} actions={[["approved", "Approve"], ["rejected", "Reject"]]} />}
        {tab === "staff" && <Staff isOwner={profile.role === "owner"} />}
        {tab === "creators" && <CreatorPayouts />}
        {tab === "drops" && <Drops />}
        {tab === "wallets" && <Wallets />}
      </div>
    </div>
  );
}

/** The state of the state, in one round trip. Numbers that need a hand
 *  jump straight to their queue. */
type Stats = Record<string, number> & { pool?: Pool & Record<string, number>;
  contest?: { id: string; title: string; status: string; pool_cents: number; voting_closes: string } };
function Overview({ go }: { go: (t: Tab) => void }) {
  const [st, setSt] = useState<Stats | null>(null);
  const [at, setAt] = useState<Date | null>(null);
  const load = useCallback(async () => {
    const c = sb();
    if (!c) { setSt({ clips_pending: 3, clips_today: 7, clips_week: 41, clips_approved: 128, gamertags_pending: 2, claims_open: 1, members: 412, members_new_week: 38, payers: 61, votes_today: 220, votes_week: 1430, downloads_today: 12, downloads_week: 96, sales_week_cents: 14300, owed_creators_cents: 52300, wallets_cents: 183000, prizes_waiting: 2 } as Stats); setAt(new Date()); return; }
    const { data } = await c.rpc("console_stats");
    setSt((data ?? {}) as Stats); setAt(new Date());
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, [load]);
  if (!st) return <p className="text-haze">Counting…</p>;
  const n = (k: string) => (st[k] ?? 0) as number;
  const queues: [string, number, Tab][] = [
    ["Clips waiting on review", n("clips_pending"), "review"],
    ["Gamertags to check", n("gamertags_pending"), "gamertags"],
    ["Cash-outs to send", n("cashouts_waiting"), "cashouts"],
    ["Prizes waiting to pay", n("prizes_waiting"), "payouts"],
    ["Open claims", n("claims_open"), "claims"],
  ];
  const facts: [string, string, string][] = [
    ["Members", String(n("members")), `+${n("members_new_week")} this week`],
    ["Paying members", String(n("payers")), "set the pool"],
    ["Clips in", `${n("clips_today")} today`, `${n("clips_week")} this week · ${n("clips_approved")} live`],
    ["Votes", `${n("votes_today")} today`, `${n("votes_week")} this week`],
    ["Downloads", `${n("downloads_today")} today`, `${n("downloads_week")} this week · ${money(n("sales_week_cents"))} of sales`],
    ["Owed to creators", money(n("owed_creators_cents")), "unpaid downloads"],
    ["Sitting in wallets", money(n("wallets_cents")), "the money you hold for members"],
    ["This week's pool", st.pool ? money(st.pool.weekly_cents) : "—", st.pool ? `${st.pool.paying_users} payers · ${st.pool.bracket}` : ""],
  ];
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {queues.map(([label, count, t]) => (
          <button key={label} onClick={() => go(t)}
            className={`set-card !mt-0 text-left transition hover:-translate-y-0.5 ${count > 0 ? "!border-flamingo" : ""}`}>
            <p className={`display text-5xl ${count > 0 ? "text-flamingo" : ""}`}>{count}</p>
            <p className="mt-1 font-bold">{label}</p>
            <p className="text-xs text-haze mt-1">{count > 0 ? "Open the queue →" : "All clear"}</p>
          </button>
        ))}
      </div>
      {st.contest && (
        <p className="mt-6 text-sm font-semibold">
          Round: <b>{st.contest.title}</b> · {st.contest.status} · pool {money(st.contest.pool_cents)} ·
          voting closes {new Date(st.contest.voting_closes).toLocaleString()}
        </p>
      )}
      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map(([t, v, d]) => (
          <div key={t} className="rounded-lg border-2 border-line bg-ink p-4">
            <dt className="text-xs font-black uppercase tracking-wider text-haze">{t}</dt>
            <dd className="display text-3xl mt-1">{v}</dd>
            {d && <dd className="text-xs text-haze mt-1">{d}</dd>}
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-haze">Refreshes every 30 seconds{at ? ` · last at ${at.toLocaleTimeString()}` : ""}.</p>
    </div>
  );
}

/** Gamertag proofs, oldest first. Code on the profile, or a photo of the
 *  username — either way it's approve or send back. */
type GtRow = { id: string; display_name: string; gamertag: string; platform: string;
  verify_method: string | null; verify_photo_path: string | null; verify_code: string | null;
  requested_at: string | null; clips: number };
function Gamertags() {
  const [rows, setRows] = useState<GtRow[] | null>(null);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const load = useCallback(async () => {
    const c = sb();
    if (!c) { setRows([{ id: "d1", display_name: "SwampSaint", gamertag: "SwampSaint", platform: "ps5", verify_method: "photo", verify_photo_path: null, verify_code: "K7Q2ZP", requested_at: new Date().toISOString(), clips: 4 }]); return; }
    const { data } = await c.rpc("console_gamertag_queue");
    const rs = (data ?? []) as GtRow[];
    setRows(rs);
    const withPhoto = rs.filter((r) => r.verify_photo_path);
    const signed = await Promise.all(withPhoto.map(async (r) => {
      const { data: u } = await c.storage.from("gamertags").createSignedUrl(r.verify_photo_path!, 3600);
      return [r.id, u?.signedUrl ?? ""] as const;
    }));
    setPhotos(Object.fromEntries(signed.filter(([, u]) => u)));
  }, []);
  useEffect(() => { load(); }, [load]);
  async function decide(r: GtRow, ok: boolean) {
    const why = ok ? null : (prompt("Tell them what was wrong (goes in the email):") ?? null);
    if (!ok && why === null) return;
    const c = sb();
    if (c) { const { error } = await c.rpc("decide_gamertag", { p_user: r.id, p_ok: ok, p_note: why }); if (error) { setNote(error.message); return; } }
    setRows((xs) => (xs ?? []).filter((x) => x.id !== r.id));
    setNote(`${r.gamertag} ${ok ? "verified" : "sent back"}. They get an email.`);
  }
  if (!rows) return <p className="text-haze">Loading…</p>;
  if (!rows.length) return <p className="text-haze">No gamertags waiting. {note}</p>;
  return (
    <div>
      {note && <p role="status" className="mb-4 font-semibold text-gulf">{note}</p>}
      <ul className="grid gap-4 lg:grid-cols-2">
        {rows.map((r) => (
          <li key={r.id} className="set-card !mt-0">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <p className="text-xl font-extrabold">{r.gamertag}</p>
              <p className="text-sm text-haze">{(platformName as Record<string, string>)[r.platform] ?? r.platform} · {r.display_name} · {r.clips} clip{r.clips === 1 ? "" : "s"}</p>
            </div>
            <p className="text-xs text-haze mt-1">Asked {r.requested_at ? new Date(r.requested_at).toLocaleString() : "—"}</p>
            {r.verify_method === "photo" ? (
              photos[r.id]
                // eslint-disable-next-line @next/next/no-img-element
                ? <a href={photos[r.id]} target="_blank" rel="noreferrer"><img src={photos[r.id]} alt={`Photo proof for ${r.gamertag}`} className="mt-3 max-h-64 w-full rounded-lg border border-line object-contain bg-black" /></a>
                : <p className="mt-3 text-sm text-flamingo font-semibold">Photo proof chosen, but no photo arrived — send it back.</p>
            ) : (
              <p className="mt-3 text-sm">Look for code <b className="gt-code !text-xl !tracking-[.2em] !p-1 !px-3">{r.verify_code}</b> in the {(platformName as Record<string, string>)[r.platform] ?? r.platform} profile bio of <b>{r.gamertag}</b>.</p>
            )}
            <div className="mt-4 flex gap-2">
              <button onClick={() => decide(r, true)} className="btn btn-hot !py-2">Approve</button>
              <button onClick={() => decide(r, false)} className="btn btn-ghost !py-2">Send back</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Everyone, with what they have left to spend today. */
type PersonRow = { id: string; display_name: string; gamertag: string | null; platform: string | null;
  gamertag_verified: boolean; verify_status: string; role: string; tier: string; subscription_status: string | null;
  credits_remaining: number; credits_per_month: number; votes_allowed: number; votes_used: number;
  daily_submissions: number; submitted_today: number;
  wallet_cents: number; pending_cents: number; lifetime_downloads: number; clips: number; created_at: string };
function People() {
  const [rows, setRows] = useState<PersonRow[] | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    const c = sb();
    if (!c) {
      setRows([
        { id: "d1", display_name: "ViceCityVandal", gamertag: "ViceCityVandal", platform: "ps5", gamertag_verified: true, verify_status: "approved", role: "owner", tier: "kingpin", subscription_status: "active", credits_remaining: 14, credits_per_month: 20, votes_allowed: 6, votes_used: 2, daily_submissions: 8, submitted_today: 1, wallet_cents: 4210, pending_cents: 1890, lifetime_downloads: 27, clips: 12, created_at: new Date(Date.now() - 60 * 864e5).toISOString() },
        { id: "d2", display_name: "KeysKingpin", gamertag: "KeysKingpin", platform: "xbox", gamertag_verified: true, verify_status: "approved", role: "member", tier: "hustler", subscription_status: "active", credits_remaining: 3, credits_per_month: 8, votes_allowed: 4, votes_used: 4, daily_submissions: 6, submitted_today: 6, wallet_cents: 1500, pending_cents: 2310, lifetime_downloads: 33, clips: 8, created_at: new Date(Date.now() - 20 * 864e5).toISOString() },
        { id: "d3", display_name: "SwampSaint", gamertag: "SwampSaint", platform: "ps5", gamertag_verified: false, verify_status: "pending", role: "member", tier: "free", subscription_status: null, credits_remaining: 0, credits_per_month: 0, votes_allowed: 1, votes_used: 0, daily_submissions: 2, submitted_today: 1, wallet_cents: 0, pending_cents: 0, lifetime_downloads: 2, clips: 4, created_at: new Date(Date.now() - 2 * 864e5).toISOString() },
      ]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await c.rpc("console_people", { p_q: q || null, p_limit: 60 });
      setRows((data ?? []) as PersonRow[]);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find someone by name, gamertag or id"
        aria-label="Search people" className="field max-w-md" />
      {!rows ? <p className="text-haze mt-4">Loading…</p> : !rows.length ? <p className="text-haze mt-4">Nobody matches.</p> : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="text-left text-haze">
              <tr>{["Member", "Plan", "Gamertag", "Votes left", "Clips left today", "Downloads left", "Wallet", "Owed", "Clips", "Joined"].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const votesLeft = Math.max(0, r.votes_allowed - r.votes_used);
                const clipsLeft = Math.max(0, r.daily_submissions - r.submitted_today);
                return (
                  <tr key={r.id}>
                    <td className="py-2.5 pr-4"><b>{r.display_name}</b>{r.role !== "member" && <span className="ml-1.5 text-[10px] font-black uppercase text-white bg-gulf px-1.5 py-0.5 rounded">{r.role}</span>}</td>
                    <td className="py-2.5 pr-4">{r.tier}{r.subscription_status && r.subscription_status !== "active" ? ` (${r.subscription_status})` : ""}</td>
                    <td className="py-2.5 pr-4">{r.gamertag ?? "—"} {r.gamertag_verified ? "✓" : r.verify_status === "pending" ? "⏳" : ""}</td>
                    <td className="py-2.5 pr-4">{votesLeft} of {r.votes_allowed}</td>
                    <td className="py-2.5 pr-4">{clipsLeft} of {r.daily_submissions}</td>
                    <td className="py-2.5 pr-4">{r.credits_remaining} of {r.credits_per_month}</td>
                    <td className="py-2.5 pr-4">{money(r.wallet_cents)}</td>
                    <td className="py-2.5 pr-4">{money(r.pending_cents)}</td>
                    <td className="py-2.5 pr-4">{r.clips}</td>
                    <td className="py-2.5 pr-4">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-haze">Votes are for the current round. Clips reset at midnight; downloads with the plan month. Money moves live in Member money.</p>
    </div>
  );
}

/** Members asking to be paid by PayPal, Venmo, Cash App, Interac or Wise.
 *  Send it outside the site, then mark it here with the reference — that
 *  sends them the receipt. If it can't go, return it to their wallet. */
type Cashout = { id: string; creator_id: string; amount_cents: number; method: string; handle: string | null;
  status: string; note: string | null; created_at: string };
function Cashouts() {
  const [rows, setRows] = useState<Cashout[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const load = useCallback(async () => {
    const c = sb();
    if (!c) { setRows([]); return; }
    const { data } = await c.from("payouts").select("*").eq("status", "requested").order("created_at");
    const rs = (data ?? []) as Cashout[];
    setRows(rs);
    const ids = [...new Set(rs.map((r) => r.creator_id))];
    if (ids.length) {
      const { data: ps } = await c.from("profiles").select("id, display_name, gamertag").in("id", ids);
      setNames(Object.fromEntries((ps ?? []).map((p: { id: string; display_name: string; gamertag: string | null }) =>
        [p.id, p.gamertag ? `${p.display_name} (${p.gamertag})` : p.display_name])));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  async function settle(r: Cashout, action: "sent" | "returned") {
    const ref = action === "sent"
      ? prompt(`Sent ${money(r.amount_cents)} to ${r.handle} on ${r.method}? Paste the transaction reference:`)
      : prompt("Why couldn't it go? (they'll see the money back in their wallet)");
    if (ref === null) return;
    const c = sb();
    if (c) { const { error } = await c.rpc("settle_payout", { p_payout: r.id, p_action: action, p_reference: ref || null });
      if (error) { setNote(error.message); return; } }
    setRows((xs) => (xs ?? []).filter((x) => x.id !== r.id));
    setNote(action === "sent" ? `Marked sent. They get the receipt by email.` : `Returned to their wallet.`);
  }
  if (!rows) return <p className="text-haze">Loading…</p>;
  return (
    <div>
      {note && <p role="status" className="mb-4 font-semibold text-gulf">{note}</p>}
      {!rows.length ? <p className="text-haze">No cash-outs waiting. Stripe-connected members are paid automatically.</p> : (
        <ul className="roll">
          {rows.map((r) => (
            <li key={r.id}>
              <span className="what">
                <b>{names[r.creator_id] ?? r.creator_id.slice(0, 8)}</b>
                <small>{r.method} · {r.handle ?? "no handle saved"} · asked {new Date(r.created_at).toLocaleString()}</small>
              </span>
              <span className="amt in">{money(r.amount_cents)}</span>
              <span className="flex gap-1.5">
                <button onClick={() => settle(r, "sent")} className="btn btn-hot !py-1.5 !px-3 text-sm">Mark sent</button>
                <button onClick={() => settle(r, "returned")} className="btn btn-ghost !py-1.5 !px-3 text-sm">Return</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-haze">Send only to the handle shown here — it is the one saved on their account. Never pay to details given in chat or by email.</p>
    </div>
  );
}

function Review() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [i, setI] = useState(0);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [done, setDone] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const vid = useRef<HTMLVideoElement>(null);

  const load = useCallback(async () => {
    const c = sb();
    if (!c) { setClips(DEMO_CLIPS.map((x) => ({ ...x, status: "pending" }))); return; }
    const { data } = await c.from("clips").select("*").eq("status", "pending").order("created_at");
    setClips((data as Clip[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const clip = clips[i];

  // Sign this clip and the next few, so moving down the queue never waits on
  // the network. At volume that's the difference between a review a minute
  // and a review every few seconds.
  useEffect(() => {
    const c = sb();
    if (!c) return;
    const want = clips.slice(i, i + 4).filter((x) => x.storage_path && !urls[x.id]);
    if (!want.length) return;
    let off = false;
    (async () => {
      const got = await Promise.all(want.map(async (x) => {
        const { data } = await c.storage.from("clips").createSignedUrl(x.storage_path!, 3600);
        return [x.id, data?.signedUrl ?? ""] as const;
      }));
      if (!off) setUrls((u) => ({ ...u, ...Object.fromEntries(got.filter(([, v]) => v)) }));
    })();
    return () => { off = true; };
  }, [clips, i, urls]);

  const move = useCallback((d: number) => {
    setI((n) => Math.min(Math.max(0, n + d), Math.max(0, clips.length - 1)));
  }, [clips.length]);

  const decide = useCallback(async (status: "approved" | "rejected", f?: FormData) => {
    const cur = clips[i];
    if (!cur || busy) return;
    setBusy(true);
    const c = sb();
    const patch: Record<string, unknown> = { status };
    if (f) { patch.edited_url = f.get("edited") || null; patch.youtube_timestamp = f.get("ts") ? Number(f.get("ts")) : null; patch.reject_reason = f.get("reason") || null; }
    if (c) { const { error } = await c.from("clips").update(patch).eq("id", cur.id);
      if (error) { setBusy(false); setNote(error.message); return; } }
    setClips((cs) => cs.filter((x) => x.id !== cur.id));
    setI((n) => Math.min(n, clips.length - 2 < 0 ? 0 : clips.length - 2));
    setDone((n) => n + 1);
    setNote(`${status === "approved" ? "Approved" : "Rejected"}: ${cur.title}`);
    setBusy(false);
  }, [clips, i, busy]);

  const act = useCallback(async (action: string) => {
    const cur = clips[i];
    if (!cur || busy) return;
    const note = prompt(`Why? (kept on the record, and shown to them where it matters)`) ?? null;
    if (note === null) return;
    setBusy(true);
    const c = sb();
    if (c) {
      const { error } = await c.rpc("console_clip_action", { p_clip: cur.id, p_action: action, p_note: note });
      if (error) { setBusy(false); setNote(error.message); return; }
    }
    setClips((cs) => cs.filter((x) => x.id !== cur.id));
    setI((n) => Math.min(n, clips.length - 2 < 0 ? 0 : clips.length - 2));
    setNote(`${cur.title}: ${action.replace(/_/g, " ")}.`);
    setBusy(false);
  }, [clips, i, busy]);

  if (!clip) return (
    <div>
      <p className="display text-4xl">Queue is empty.</p>
      <p className="text-haze mt-2">{done > 0 ? `${done} cleared this sitting. Nice work.` : "Nothing waiting on review."}</p>
      <button onClick={load} className="btn btn-ghost mt-4">Check again</button>
    </div>
  );

  const src = urls[clip.id];
  const waited = Math.round((Date.now() - new Date(clip.created_at).getTime()) / 36e5);

  return (
    <div>
      <div className="q-bar">
        <span><b>{clips.length}</b> waiting</span>
        <span><b>{done}</b> cleared this sitting</span>
        <span className={waited >= 24 ? "q-old" : ""}>oldest here: <b>{waited < 1 ? "under an hour" : `${waited}h`}</b></span>
        <span className="q-keys">A approve · R reject · J/K move · Space play</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] mt-5">
        <div>
          <div className="aspect-video bg-ink-2 rounded-lg overflow-hidden grid place-items-center">
            {src ? <video ref={vid} key={clip.id} src={src} controls autoPlay className="h-full w-full" /> :
              clip.source_url ? <a href={clip.source_url} target="_blank" rel="noreferrer" className="btn btn-ghost">Open the linked clip</a> :
              // eslint-disable-next-line @next/next/no-img-element
              clip.thumb ? <img src={clip.thumb} alt="" className="h-full w-full object-cover" /> :
              <span className="text-haze">Loading the video…</span>}
          </div>

          {clips.length > 1 && (
            <ul className="q-strip" aria-label="Queue">
              {clips.slice(0, 14).map((x, n) => (
                <li key={x.id}>
                  <button onClick={() => setI(n)} aria-current={n === i} title={x.title}
                    className={n === i ? "on" : ""}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {x.thumb ? <img src={x.thumb} alt="" /> : <span>{n + 1}</span>}
                  </button>
                </li>
              ))}
              {clips.length > 14 && <li className="q-more">+{clips.length - 14}</li>}
            </ul>
          )}
          <Keys onKey={(k) => {
            if (k === "j") move(1); if (k === "k") move(-1);
            if (k === "a") decide("approved"); if (k === "r") decide("rejected");
            if (k === " ") { const v = vid.current; if (v) { if (v.paused) v.play(); else v.pause(); } }
          }} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); decide("approved", new FormData(e.currentTarget)); }}
          className="grid gap-3 content-start" key={clip.id}>
          <h2 className="text-2xl font-extrabold leading-tight">{clip.title}</h2>
          <p className="text-haze">
            {clip.gamertag} on {(platformName as Record<string, string>)[clip.platform] ?? clip.platform}
            {clip.duration_seconds ? ` · ${clip.duration_seconds}s` : ""}
            {clip.for_contest === false ? " · not for the contest" : ""}
          </p>
          <p className="text-xs text-haze">In {waited < 1 ? "under an hour" : `${waited} hours`} · sent {new Date(clip.created_at).toLocaleString()}</p>
          <label className="grid gap-1 text-sm font-bold">Edited version link (Higgsfield or FFmpeg cut)<input name="edited" className="field font-normal" placeholder="https://" defaultValue={clip.edited_url ?? ""} /></label>
          <label className="grid gap-1 text-sm font-bold">Seconds into the compilation video<input name="ts" type="number" min={0} className="field font-normal" defaultValue={clip.youtube_timestamp ?? ""} /></label>
          <label className="grid gap-1 text-sm font-bold">Reason if rejecting<input name="reason" className="field font-normal" placeholder="Not GTA VI, too short, someone else's footage…" /></label>
          <div className="flex flex-wrap gap-2 mt-2">
            <button disabled={busy} className="btn btn-hot disabled:opacity-60">Approve</button>
            <button type="button" disabled={busy} onClick={(e) => decide("rejected", new FormData(e.currentTarget.form!))} className="btn btn-ghost disabled:opacity-60">Disapprove</button>
          </div>
          <div className="mod-row">
            <p className="mod-k">Also</p>
            {([["suspend", "Suspend"], ["remove_from_contest", "Out of the contest"],
               ["feature", "Feature it"], ["withdraw", "Withdraw"]] as const).map(([a, label]) => (
              <button key={a} type="button" disabled={busy} onClick={() => act(a)} className="mod-btn">{label}</button>
            ))}
          </div>
          <p className="text-xs text-haze">
            Nothing is erased. Suspended and withdrawn clips keep their file and their history —
            the terms say we keep a copy.
          </p>
          {note && <p role="status" className="text-sm font-semibold text-gulf">{note}</p>}
        </form>
      </div>
    </div>
  );
}

function Keys({ onKey }: { onKey: (k: string) => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName.match(/INPUT|TEXTAREA|SELECT/) || t.isContentEditable) return;
      // Space is the play/pause key here, so don't let it scroll the page too.
      if (e.key === " ") e.preventDefault();
      onKey(e.key.toLowerCase());
    };
    addEventListener("keydown", h); return () => removeEventListener("keydown", h);
  }, [onKey]);
  return null;
}

function ContestAdmin() {
  const [c, setC] = useState<Contest | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const s = sb(); if (!s) { setC(DEMO_CONTEST); return; }
    s.from("contests").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle().then(({ data }) => setC(data as Contest));
  }, []);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const row = { title: f.title, pool_cents: Math.round(Number(f.pool) * 100), youtube_url: f.youtube || null, status: f.status,
      submissions_close: new Date(f.subs).toISOString(), voting_opens: new Date(f.vopen).toISOString(), voting_closes: new Date(f.vclose).toISOString() };
    const s = sb();
    if (s) { const r = c?.id && f.mode === "update" ? await s.from("contests").update(row).eq("id", c.id).select().single() : await s.from("contests").insert(row).select().single();
      if (r.error) { setMsg(r.error.message); return; } setC(r.data as Contest); }
    setMsg("Saved.");
  }
  async function close() {
    const s = sb(); if (s && c) { const { error } = await s.rpc("close_contest", { p_contest: c.id }); if (error) { setMsg(error.message); return; } }
    setMsg("Round closed. Top three placed, winners emailed. Check them, then pay prizes into wallets.");
  }
  // datetime-local wants local wall time; slicing the UTC string shifted every save by the UTC offset.
  const d = (iso?: string) => {
    if (!iso) return "";
    const t = new Date(iso); return new Date(t.getTime() - t.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  };
  async function openVoting() {
    const s = sb(); if (!s || !c) return;
    const now = new Date().toISOString();
    const closes = new Date(Math.max(new Date(c.voting_closes).getTime(), Date.now() + 36e5)).toISOString();
    const r = await s.from("contests").update({ status: "voting", voting_opens: now, submissions_close: closes, voting_closes: closes,
      deadline_hours: Math.ceil((new Date(closes).getTime() - Date.now()) / 36e5) + 1 }).eq("id", c.id).select().single();
    if (r.error) { setMsg(r.error.message); return; }
    setC(r.data as Contest); setMsg("Voting is open now, until the close time. Clips can still come in.");
  }
  async function payWinners() {
    const s = sb(); if (!s || !c) return;
    const { data, error } = await s.rpc("pay_winnings_to_wallet", { p_contest: c.id });
    if (error) { setMsg(error.message); return; }
    setMsg(`${data ?? 0} prize${data === 1 ? "" : "s"} moved into winners' wallets. Each winner gets an email.`);
  }
  return (
    <form onSubmit={save} className="grid gap-4 max-w-2xl" key={c?.id}>
      <label className="grid gap-1 text-sm font-bold">Title<input name="title" defaultValue={c?.title} required className="field font-normal" /></label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="grid gap-1 text-sm font-bold">Prize pool (USD)<input name="pool" type="number" defaultValue={(c?.pool_cents ?? 10000) / 100} className="field font-normal" /></label>
        <label className="grid gap-1 text-sm font-bold">Status<select name="status" defaultValue={c?.status} className="field font-normal">{["submissions", "review", "voting", "closed", "paid"].map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-bold">Submissions close<input name="subs" type="datetime-local" defaultValue={d(c?.submissions_close)} required className="field font-normal" /></label>
        <label className="grid gap-1 text-sm font-bold">Voting opens<input name="vopen" type="datetime-local" defaultValue={d(c?.voting_opens)} required className="field font-normal" /></label>
        <label className="grid gap-1 text-sm font-bold">Voting closes<input name="vclose" type="datetime-local" defaultValue={d(c?.voting_closes)} required className="field font-normal" /></label>
        <label className="grid gap-1 text-sm font-bold">Compilation YouTube URL<input name="youtube" defaultValue={c?.youtube_url ?? ""} className="field font-normal" /></label>
      </div>
      <p className="text-sm text-haze">Prizes follow the bracket for paying members (Gold 60 / Silver 25 / Bronze 15 of the week pool; month ×4, year ×20). Voting runs in the last {(c as { deadline_hours?: number } | null)?.deadline_hours ?? 48} hours before the close.</p>
      <div className="flex flex-wrap gap-3">
        <button name="mode" value="update" className="btn btn-hot">Save this round</button>
        <button name="mode" value="new" className="btn btn-ghost">Save as a new round</button>
        <button type="button" onClick={openVoting} className="btn btn-ghost">Open voting now</button>
        <button type="button" onClick={close} className="btn btn-ghost">Close round and pick winners</button>
        <button type="button" onClick={payWinners} className="btn btn-ghost">Pay prizes into wallets</button>
      </div>
      {msg && <p role="status" className="font-semibold text-gulf">{msg}</p>}
    </form>
  );
}

function Table({ table, filter, cols, actions, refField }: { table: string; filter: [string, string[]]; cols: string[]; actions: [string, string][]; refField?: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    const s = sb(); if (!s) { setRows([]); return; }
    s.from(table).select("*").in(filter[0], filter[1]).then(({ data }) => setRows((data as Row[]) ?? []));
  }, [table, filter]);
  async function act(r: Row, status: string) {
    const s = sb(); const patch: Record<string, unknown> = { status };
    if (refField && status === "sent") { const ref = prompt("Payment reference (PayPal / Venmo transaction id)"); if (!ref) return; patch[refField] = ref; patch.sent_at = new Date().toISOString(); }
    if (s) await s.from(table).update(patch).eq("id", r.id);
    setRows((rs) => rs!.filter((x) => x.id !== r.id));
  }
  if (!rows) return <p className="text-haze">Loading…</p>;
  if (!rows.length) return <p className="text-haze">Nothing waiting here.</p>;
  return (
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead className="text-left text-haze"><tr>{cols.map((c) => <th key={c} className="py-2 pr-4 font-semibold">{c.replace(/_/g, " ")}</th>)}<th /></tr></thead>
      <tbody className="divide-y divide-line">{rows.map((r) => (
        <tr key={r.id}>{cols.map((c) => <td key={c} className="py-3 pr-4">{c === "amount_cents" ? money(Number(r[c])) : String(r[c] ?? "")}</td>)}
          <td className="py-3 flex gap-2 justify-end">{actions.map(([s, l]) => <button key={s} onClick={() => act(r, s)} className="btn btn-ghost !py-1.5 !px-3 text-xs">{l}</button>)}</td></tr>
      ))}</tbody></table></div>
  );
}

const ROLES = [["member", "Member"], ["reviewer", "Reviewer: clips and claims"], ["moderator", "Moderator: + payouts and drops"], ["owner", "Owner: everything, manages staff"]] as const;
type Person = { id: string; display_name: string; gamertag: string | null; role: string; tier: string };
/** Featured Clips is built but held off until its open rules are settled:
 *  Hustler's cadence, rotation, repeats, and plan changes. Owners flip it. */
function FeatureSwitch({ isOwner }: { isOwner: boolean }) {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => { const s = sb(); if (!s) { setOn(false); return; }
    s.from("site_settings").select("featured_enabled").maybeSingle().then(({ data }) => setOn(Boolean(data?.featured_enabled))); }, []);
  async function flip() {
    const s = sb(); if (!s || on === null) return;
    const { error } = await s.from("site_settings").update({ featured_enabled: !on }).eq("id", true);
    if (!error) setOn(!on);
  }
  return (
    <section>
      <h2 className="text-xl font-extrabold">Featured Clips</h2>
      <p className="text-sm text-haze mt-1 max-w-2xl">
        Hustler 1 a month, Kingpin 3 a month, 24 hours each, up to 6 live at once and the rest queued oldest first.
        Held off until these are confirmed: Hustler&apos;s cadence, how the carousel rotates, whether a clip can be
        featured twice, and what happens to placements on upgrade, downgrade or cancellation.
      </p>
      <button disabled={!isOwner || on === null} onClick={flip} className={`btn mt-3 !py-2 ${on ? "btn-hot" : "btn-ghost"} disabled:opacity-60`}>
        {on === null ? "…" : on ? "On — switch off" : "Off — switch on"}
      </button>
    </section>
  );
}

function Staff({ isOwner }: { isOwner: boolean }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [q, setQ] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    const s = sb();
    if (!s) { setPeople([
      { id: "demo", display_name: "ViceCityVandal", gamertag: "ViceCityVandal", role: "owner", tier: "kingpin" },
      { id: "a", display_name: "KeysKingpin", gamertag: "KeysKingpin", role: "reviewer", tier: "hustler" },
      { id: "b", display_name: "SwampSaint", gamertag: "SwampSaint", role: "member", tier: "street" },
      { id: "c", display_name: "NeonDrifter", gamertag: "NeonDrifter", role: "moderator", tier: "kingpin" },
    ]); return; }
    s.from("profiles").select("id,display_name,gamertag,role,tier").order("role").limit(200).then(({ data }) => setPeople((data as Person[]) ?? []));
  }, []);
  async function setRole(p: Person, role: string) {
    const s = sb(); if (s) { const { error } = await s.rpc("set_role", { p_user: p.id, p_role: role }); if (error) { setNote(error.message); return; } }
    setPeople((xs) => xs.map((x) => x.id === p.id ? { ...x, role } : x)); setNote(`${p.display_name} is now ${role}.`);
  }
  const shown = people.filter((p) => `${p.display_name} ${p.gamertag ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="grid gap-10">
    <FeatureSwitch isOwner={isOwner} />
    <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
      <section>
        <h2 className="text-xl font-extrabold">Staff</h2>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find someone by name or gamertag" className="field mt-3" />
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {shown.map((p) => (
            <li key={p.id} className="py-3 flex flex-wrap items-center gap-3">
              <span className="flex-1 min-w-0"><span className="font-bold">{p.display_name}</span>{p.tier !== "street" && <span className="ml-2 text-[10px] font-black uppercase tracking-wide text-white bg-gulf px-1.5 py-0.5 rounded">{p.tier}</span>}<span className="block text-sm text-haze truncate">{p.gamertag}</span></span>
              <select disabled={!isOwner} value={p.role} onChange={(e) => setRole(p, e.target.value)} className="field !w-auto">
                {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </li>
          ))}
        </ul>
        {!isOwner && <p className="mt-2 text-sm text-haze">Only owners can change roles.</p>}
      </section>
      <section>
        <PoolPanel />
        <OverlayPanel />
        {note && <p role="status" className="mt-4 font-semibold text-gulf">{note}</p>}
      </section>
    </div>
    </div>
  );
}

/** Live pool, driven by the paying-member count. Read-only: the ladder lives in the database. */
function PoolPanel() {
  const [pool, setPool] = useState<Pool | null>(null);
  useEffect(() => { poolNow().then(setPool); }, []);
  return (
    <>
      <h2 className="text-xl font-extrabold">Prize pool right now</h2>
      <div className="mt-3 rounded-lg border-2 border-gulf bg-ink p-5">
        <p className="display text-5xl">{pool ? money(pool.weekly_cents) : "—"}</p>
        <p className="font-semibold">this week</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-haze">Paying members</dt><dd className="display text-2xl">{pool?.paying_users ?? "—"}</dd></div>
          <div><dt className="text-haze">Clip of the Month</dt><dd className="display text-2xl">{pool ? money(pool.monthly_cents) : "—"}</dd></div>
        </dl>
        <p className="mt-4 text-sm text-haze">
          The pool is locked when you open a round, so it can&apos;t move once people have entered.
        </p>
      </div>
      <h3 className="text-sm font-extrabold mt-6">How it scales</h3>
      <ul className="mt-2 text-sm text-haze grid gap-1">
        {BRACKETS.map((b) => (
          <li key={b.label}>
            <b className="text-foam">{b.label} members</b> → ${b.pool.toLocaleString()} ·
            {" "}gold ${b.gold.toLocaleString()}, silver ${b.silver.toLocaleString()}, bronze ${b.bronze.toLocaleString()}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Close a month and cut one payout row per creator, then mark them paid as the money goes out. */
type PayoutRow = { id: string; creator_id: string; amount_cents: number; download_count: number;
  method: string | null; handle: string | null; status: string; period_start: string; period_end: string };

function CreatorPayouts() {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [owed, setOwed] = useState<{ creator_id: string; pending_cents: number; downloads: number }[]>([]);
  const [note, setNote] = useState("");
  const first = new Date(); first.setDate(1);
  const [from, setFrom] = useState(new Date(first.getFullYear(), first.getMonth() - 1, 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date(first.getFullYear(), first.getMonth(), 0).toISOString().slice(0, 10));

  const load = useCallback(async () => {
    const s = sb(); if (!s) {
      setOwed([{ creator_id: "KeysKingpin", pending_cents: 2310, downloads: 33 }]);
      setRows([{ id: "p1", creator_id: "SwampSaint", amount_cents: 1540, download_count: 22, method: "paypal",
        handle: "swamp@x.com", status: "pending", period_start: from, period_end: to }]);
      return;
    }
    const [{ data: b }, { data: p }] = await Promise.all([
      s.from("creator_balances").select("creator_id,pending_cents,downloads").order("pending_cents", { ascending: false }),
      s.from("payouts").select("*").order("period_end", { ascending: false }).limit(100),
    ]);
    setOwed(b ?? []); setRows((p as PayoutRow[]) ?? []);
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  async function runMonth() {
    const s = sb(); if (!s) { setNote("Demo mode: nothing was written."); return; }
    const { data, error } = await s.rpc("run_monthly_payouts", { p_start: from, p_end: to });
    if (error) { setNote(error.message); return; }
    setNote(`${data} payout${data === 1 ? "" : "s"} created for ${from} to ${to}.`);
    load();
  }
  async function mark(r: PayoutRow, status: string) {
    const s = sb();
    if (s) { const { error } = await s.from("payouts").update({ status, sent_at: status === "sent" ? new Date().toISOString() : null }).eq("id", r.id);
      if (error) { setNote(error.message); return; } }
    setRows((xs) => xs.map((x) => x.id === r.id ? { ...x, status } : x));
  }

  const totalOwed = owed.reduce((s, o) => s + o.pending_cents, 0);
  return (
    <div className="grid gap-8">
      <section className="rounded-lg border-2 border-line bg-ink p-5">
        <h2 className="text-xl font-extrabold">Run a month</h2>
        <p className="text-sm text-haze mt-1">
          Totals every unpaid download in the window and cuts one payout per creator over the minimum.
          Then pay each one by hand and mark it sent.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm font-bold">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field !w-auto font-normal" /></label>
          <label className="grid gap-1 text-sm font-bold">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field !w-auto font-normal" /></label>
          <button onClick={runMonth} className="btn btn-hot">Create payouts</button>
          <span className="text-sm text-haze">Unpaid across everyone: <b className="text-foam">{exactMoney(totalOwed)}</b></span>
        </div>
        {note && <p role="status" className="mt-3 font-semibold text-gulf">{note}</p>}
      </section>

      <section>
        <h2 className="text-xl font-extrabold">Payouts</h2>
        {rows.length === 0 ? <p className="text-haze mt-2">Nothing yet.</p> : (
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {rows.map((r) => (
              <li key={r.id} className="py-3 flex flex-wrap items-center gap-3">
                <span className="flex-1 min-w-0">
                  <span className="display text-2xl">{exactMoney(r.amount_cents)}</span>
                  <span className="block text-sm text-haze truncate">
                    {r.creator_id} · {r.download_count} downloads · {r.method ?? "no method set"} {r.handle ?? ""}
                  </span>
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${r.status === "sent" ? "bg-gulf text-white" : "bg-ink-2"}`}>{r.status}</span>
                {r.status !== "sent" && <button onClick={() => mark(r, "sent")} className="btn btn-ghost !py-1.5 !px-3 text-sm">Mark paid</button>}
                {r.status === "pending" && <button onClick={() => mark(r, "held")} className="btn btn-ghost !py-1.5 !px-3 text-sm">Hold</button>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Set today's theme and crown a winner. The winner gets a week in Trending. */
function Drops() {
  const [rows, setRows] = useState<{ id: string; day: string; theme: string; blurb: string | null; winner_clip_id: string | null }[]>([]);
  const [note, setNote] = useState("");
  const load = useCallback(async () => {
    const s = sb();
    if (!s) { setRows([{ id: "d1", day: new Date().toISOString().slice(0, 10), theme: "Five-star escapes", blurb: "Lose them in under a minute.", winner_clip_id: null }]); return; }
    const { data } = await s.from("daily_drops").select("*").order("day", { ascending: false }).limit(30);
    setRows(data ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget), s = sb();
    if (!s) { setNote("Demo mode: nothing was written."); return; }
    const { error } = await s.from("daily_drops").insert({
      day: f.get("day"), theme: f.get("theme"), blurb: f.get("blurb"),
      closes_at: `${f.get("day")}T23:59:00Z`,
    });
    setNote(error ? error.message : "Drop scheduled."); if (!error) load();
  }
  async function crown(id: string, clip: string) {
    const s = sb();
    if (!s) { setNote("Demo mode: nothing was written."); return; }
    const { error } = await s.rpc("pick_drop_winner", { p_drop: id, p_clip: clip });
    setNote(error ? error.message : "Winner set. They're in Trending for a week."); if (!error) load();
  }

  return (
    <div className="grid gap-8">
      <section className="rounded-lg border-2 border-line bg-ink p-5">
        <h2 className="text-xl font-extrabold">Schedule a drop</h2>
        <p className="text-sm text-haze mt-1">One a day. Open to everyone; the winner is featured in Trending for a full week.</p>
        <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-[10rem_1fr_1fr_auto] items-end">
          <label className="grid gap-1 text-sm font-bold">Day
            <input name="day" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="field font-normal" /></label>
          <label className="grid gap-1 text-sm font-bold">Theme
            <input name="theme" required placeholder="Five-star escapes" className="field font-normal" /></label>
          <label className="grid gap-1 text-sm font-bold">One line
            <input name="blurb" placeholder="Lose them in under a minute." className="field font-normal" /></label>
          <button className="btn btn-hot">Schedule</button>
        </form>
        {note && <p role="status" className="mt-3 font-semibold text-gulf">{note}</p>}
      </section>

      <section>
        <h2 className="text-xl font-extrabold">Scheduled</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {rows.map((r) => (
            <li key={r.id} className="py-3 flex flex-wrap items-center gap-3">
              <span className="flex-1 min-w-0">
                <span className="font-bold">{r.theme}</span>
                <span className="block text-sm text-haze truncate">{r.day}{r.blurb ? ` · ${r.blurb}` : ""}</span>
              </span>
              {r.winner_clip_id
                ? <span className="rounded-full bg-gulf px-3 py-1 text-xs font-black text-white">Winner picked</span>
                : <form onSubmit={(e) => { e.preventDefault(); crown(r.id, new FormData(e.currentTarget).get("clip") as string); }}
                    className="flex gap-2">
                    <input name="clip" required placeholder="Winning clip id" className="field !w-56 text-sm" />
                    <button className="btn btn-ghost !py-1.5 !px-3 text-sm">Crown</button>
                  </form>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}


/** Member money. Add it, take it off, see where it went. Every move writes a
 *  ledger row with your name on it — balances are the sum of that history, so
 *  they can't drift from it. */
type Member = { id: string; display_name: string; tier: string; balance_cents: number };
type Move = { id: number; player_id: string; amount_cents: number; kind: string; note: string | null; created_at: string };

function Wallets() {
  const [q, setQ] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [picked, setPicked] = useState<Member | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const search = useCallback(async () => {
    const s = sb(); if (!s) return;
    let sel = s.from("profiles").select("id,display_name,tier").order("created_at", { ascending: false }).limit(25);
    if (q.trim()) sel = s.from("profiles").select("id,display_name,tier").ilike("display_name", `%${q.trim()}%`).limit(25);
    const { data } = await sel;
    const ids = (data ?? []).map((m) => (m as { id: string }).id);
    const { data: bal } = await s.from("wallet_balances").select("player_id,balance_cents").in("player_id", ids);
    const by = new Map((bal ?? []).map((b) => [(b as { player_id: string }).player_id, (b as { balance_cents: number }).balance_cents]));
    setMembers((data ?? []).map((m) => ({ ...(m as Omit<Member, "balance_cents">), balance_cents: by.get((m as { id: string }).id) ?? 0 })));
  }, [q]);
  useEffect(() => { search(); }, [search]);

  const openMember = useCallback(async (m: Member) => {
    setPicked(m); setMsg(""); setErr("");
    const s = sb(); if (!s) return;
    const { data } = await s.from("wallet_entries").select("*").eq("player_id", m.id)
      .order("created_at", { ascending: false }).limit(40);
    setMoves((data ?? []) as Move[]);
  }, []);

  async function move(sign: 1 | -1) {
    if (!picked) return;
    const cents = Math.round(parseFloat(amount) * 100) * sign;
    if (!Number.isFinite(cents) || cents === 0) { setErr("Enter an amount."); return; }
    setBusy(true); setErr(""); setMsg("");
    const s = sb(); if (!s) { setBusy(false); return; }
    const { data, error } = await s.rpc("adjust_wallet", { p_user: picked.id, p_cents: cents, p_note: note || null });
    setBusy(false);
    if (error) {
      setErr(error.message.includes("INSUFFICIENT_FUNDS")
        ? "They don't have that much — you'd push the balance below zero."
        : error.message);
      return;
    }
    setMsg(`${sign > 0 ? "Added" : "Took off"} ${money(Math.abs(cents))}. New balance ${money(data as number)}.`);
    setAmount(""); setNote("");
    openMember({ ...picked, balance_cents: data as number });
    search();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[20rem_1fr] items-start [&>*]:min-w-0">
      <div>
        <h2 className="text-xl font-extrabold">Members</h2>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name"
          aria-label="Search members" className="field mt-3" />
        <ul className="mt-3 grid gap-px overflow-hidden rounded-lg border border-line bg-line max-h-[28rem] overflow-y-auto">
          {members.length === 0 && <li className="bg-ink px-4 py-3 text-haze text-sm">Nobody yet.</li>}
          {members.map((m) => (
            <li key={m.id}>
              <button onClick={() => openMember(m)} aria-current={picked?.id === m.id}
                className={`w-full text-left px-4 py-3 ${picked?.id === m.id ? "bg-ink-2" : "bg-ink"}`}>
                <span className="font-bold block truncate">{m.display_name}</span>
                <span className="text-xs text-haze">{m.tier} · {money(m.balance_cents)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {!picked ? (
        <p className="text-haze">Pick a member to see their money.</p>
      ) : (
        <div>
          <h2 className="text-xl font-extrabold">{picked.display_name}</h2>
          <p className="display text-6xl mt-1 sunset-text">{money(picked.balance_cents)}</p>

          <div className="mt-6 rounded-xl border-2 border-line bg-ink p-5 grid gap-3">
            <div className="flex flex-wrap gap-3 [&>*]:min-w-0">
              <label className="grid gap-1.5 flex-1 min-w-[8rem]">
                <span className="text-sm font-bold">Amount</span>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal"
                  placeholder="25.00" className="field" />
              </label>
              <label className="grid gap-1.5 flex-[2] min-w-[12rem]">
                <span className="text-sm font-bold">Why (shown to them)</span>
                <input value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Goodwill for the week 3 outage" className="field" />
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => move(1)} disabled={busy} className="btn btn-hot disabled:opacity-70">Add money</button>
              <button onClick={() => move(-1)} disabled={busy} className="btn btn-ghost disabled:opacity-70">Take money off</button>
            </div>
            {msg && <p role="status" className="font-semibold text-gulf">{msg}</p>}
            {err && <p role="alert" className="font-semibold text-flamingo">{err}</p>}
          </div>

          <h3 className="text-lg font-extrabold mt-8">History</h3>
          <ul className="mt-3 grid gap-px overflow-hidden rounded-lg border border-line bg-line">
            {moves.length === 0 && <li className="bg-ink px-4 py-3 text-haze text-sm">No movements.</li>}
            {moves.map((m) => (
              <li key={m.id} className="bg-ink px-4 py-3 flex items-baseline justify-between gap-4">
                <span className="min-w-0">
                  <span className="font-semibold block truncate">{m.kind.replace(/_/g, " ")}</span>
                  <span className="text-xs text-haze">{new Date(m.created_at).toLocaleString()}{m.note ? ` · ${m.note}` : ""}</span>
                </span>
                <span className={`font-black tabular-nums shrink-0 ${m.amount_cents > 0 ? "text-gulf" : "text-flamingo"}`}>
                  {m.amount_cents > 0 ? "+" : "−"}{money(Math.abs(m.amount_cents))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


/** The OBS browser sources, with their key already in the URL.
 *  The standings carry vote counts, which free accounts never see, so the
 *  overlays are gated on a token rather than left open. */
function OverlayPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const s = sb();
    if (!s) { setToken("demo-token-not-live"); return; }
    s.rpc("console_overlay_token").then(({ data }) => setToken((data as string) ?? null));
  }, []);

  async function rotate() {
    if (!confirm("Rotate the key? Every overlay already running goes blank until you paste the new URL into OBS.")) return;
    setBusy(true);
    const s = sb();
    if (s) { const { data } = await s.rpc("rotate_overlay_token"); if (data) setToken(data as string); }
    setBusy(false);
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const sources: [string, string, string][] = [
    ["Top 10 standings", `/overlay/top10?key=${token}`, "Ranked clips with live vote counts. &side=left, &count=5, &title=0"],
    ["Lower third", `/overlay/nameplate?key=${token}&place=1`, "Whose clip is on screen. Change place=1-10, or use &name=Tag&title=Caption"],
    ["Pool bug", `/overlay/pool?key=${token}`, "Prize pool, member count and time left. &side=right"],
  ];

  async function copy(url: string) {
    try { await navigator.clipboard.writeText(url); setCopied(url); setTimeout(() => setCopied(null), 2000); } catch {}
  }

  return (
    <div className="rounded-xl border-2 border-line bg-ink p-5">
      <h2 className="text-xl font-extrabold">Stream overlays</h2>
      <p className="text-sm text-haze mt-1">
        In OBS: Sources &rarr; <strong>Browser</strong>, 1920 &times; 1080, paste a URL. Leave the
        background transparent — the page already is.
      </p>

      <ul className="mt-4 grid gap-3">
        {sources.map(([label, path, hint]) => (
          <li key={label} className="rounded-lg border border-line p-3">
            <p className="font-bold">{label}</p>
            <p className="text-xs text-haze">{hint}</p>
            <div className="mt-2 flex items-center gap-2 [&>*]:min-w-0">
              <code className="flex-1 truncate rounded bg-ink-2 px-2 py-1.5 text-xs">{origin}{path}</code>
              <button onClick={() => copy(origin + path)} className="btn btn-ghost !py-1.5 !px-3 text-sm shrink-0">
                {copied === origin + path ? "Copied" : "Copy"}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-haze">
        The key is what lets an overlay read vote counts without signing in. Keep the URLs off stream.
      </p>
      <button onClick={rotate} disabled={busy} className="btn btn-ghost mt-3 disabled:opacity-70">
        {busy ? "Rotating…" : "Rotate key"}
      </button>
    </div>
  );
}
