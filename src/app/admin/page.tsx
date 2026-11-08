"use client";
import { useCallback, useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { DEMO_CLIPS, DEMO_CONTEST, exactMoney, money, platformName, poolNow, type Clip, type Contest, type Pool } from "@/lib/api";
import { BRACKETS } from "@/lib/tiers";
import { DemoNote } from "@/components/DemoNote";

type Tab = "review" | "contest" | "payouts" | "creators" | "claims" | "drops" | "staff";
type Row = Record<string, unknown> & { id: string };

export default function Admin() {
  const { profile, loading } = useUser();
  const [tab, setTab] = useState<Tab>("review");
  if (loading) return null;
  if (!profile?.is_admin) return <div className="mx-auto max-w-xl px-4 py-24"><h1 className="display text-6xl">Staff only</h1><p className="text-haze mt-3">Ask an admin to set <code>is_admin</code> on your profile.</p></div>;
  const tabs: [Tab, string][] = [["review", "Review queue"], ["contest", "Weekly round"], ["payouts", "Prize payouts"], ["creators", "Creator payouts"], ["claims", "Claims"], ["drops", "Daily Drops"], ["staff", "Staff and settings"]];
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <DemoNote />
      <h1 className="display text-6xl">Control room</h1>
      <div role="tablist" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-4 py-2.5 font-bold text-sm border-b-2 -mb-px ${tab === k ? "border-flamingo text-foam" : "border-transparent text-haze"}`}>{l}</button>)}
      </div>
      <div className="mt-8">
        {tab === "review" && <Review />}
        {tab === "contest" && <ContestAdmin />}
        {tab === "payouts" && <Table table="winnings" filter={["status", ["requested", "verifying", "held"]]} cols={["place", "amount_cents", "status", "owner_id"]}
          actions={[["verifying", "Checking gamertag"], ["sent", "Mark paid"], ["held", "Hold"]]} refField="payout_ref" />}
        {tab === "claims" && <Table table="claims" filter={["status", ["open"]]} cols={["clip_id", "claimant_id", "evidence"]} actions={[["approved", "Approve"], ["rejected", "Reject"]]} />}
        {tab === "staff" && <Staff isOwner={profile.role === "owner"} />}
        {tab === "creators" && <CreatorPayouts />}
        {tab === "drops" && <Drops />}
      </div>
    </div>
  );
}

function Review() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [i, setI] = useState(0);
  const [src, setSrc] = useState<string | null>(null);
  const load = useCallback(async () => {
    const c = sb();
    if (!c) { setClips(DEMO_CLIPS.map((x) => ({ ...x, status: "pending" }))); return; }
    const { data } = await c.from("clips").select("*").eq("status", "pending").order("created_at");
    setClips((data as Clip[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const clip = clips[i];
  useEffect(() => {
    setSrc(null);
    const c = sb();
    if (c && clip?.storage_path) c.storage.from("clips").createSignedUrl(clip.storage_path, 3600).then(({ data }) => setSrc(data?.signedUrl ?? null));
  }, [clip]);

  async function decide(status: "approved" | "rejected", f?: FormData) {
    const c = sb();
    const patch: Record<string, unknown> = { status };
    if (f) { patch.edited_url = f.get("edited") || null; patch.youtube_timestamp = f.get("ts") ? Number(f.get("ts")) : null; patch.reject_reason = f.get("reason") || null; }
    if (c) await c.from("clips").update(patch).eq("id", clip.id);
    setClips((cs) => cs.filter((x) => x.id !== clip.id));
    setI((n) => Math.min(n, clips.length - 2));
  }

  if (!clip) return <p className="text-haze">Queue is empty. Nice work.</p>;
  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <div className="aspect-video bg-ink-2 rounded-lg overflow-hidden grid place-items-center">
          {src ? <video src={src} controls autoPlay className="h-full w-full" /> :
            clip.source_url ? <a href={clip.source_url} target="_blank" rel="noreferrer" className="btn btn-ghost">Open the linked clip</a> :
            // eslint-disable-next-line @next/next/no-img-element
            clip.thumb ? <img src={clip.thumb} alt="" className="h-full w-full object-cover" /> : <span className="text-haze">No preview</span>}
        </div>
        <p className="mt-3 text-sm text-haze">{i + 1} of {clips.length} waiting. Keys: A approve, R reject, J/K next/previous.</p>
        <Keys onKey={(k) => { if (k === "j") setI((n) => Math.min(n + 1, clips.length - 1)); if (k === "k") setI((n) => Math.max(n - 1, 0)); if (k === "a") decide("approved"); if (k === "r") decide("rejected"); }} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); decide("approved", new FormData(e.currentTarget)); }} className="grid gap-3 content-start" key={clip.id}>
        <h2 className="text-2xl font-extrabold">{clip.title}</h2>
        <p className="text-haze">{clip.gamertag} on {platformName[clip.platform]}</p>
        <label className="grid gap-1 text-sm font-bold">Edited version link (Higgsfield or FFmpeg cut)<input name="edited" className="field font-normal" placeholder="https://" /></label>
        <label className="grid gap-1 text-sm font-bold">Seconds into the compilation video<input name="ts" type="number" min={0} className="field font-normal" defaultValue={clip.youtube_timestamp ?? ""} /></label>
        <label className="grid gap-1 text-sm font-bold">Reason if rejecting<input name="reason" className="field font-normal" placeholder="Not GTA VI, too short, someone else's footage…" /></label>
        <div className="flex gap-3 mt-2">
          <button className="btn btn-hot">Approve</button>
          <button type="button" onClick={(e) => decide("rejected", new FormData(e.currentTarget.form!))} className="btn btn-ghost">Reject</button>
        </div>
      </form>
    </div>
  );
}

function Keys({ onKey }: { onKey: (k: string) => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA|SELECT/)) return; onKey(e.key.toLowerCase()); };
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
    setMsg("Round closed. Top three winnings created; they appear on winners' dashboards.");
  }
  const d = (iso?: string) => iso ? iso.slice(0, 16) : "";
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
      <p className="text-sm text-haze">Split: 50% / 30% / 20% of {money(c?.pool_cents ?? 10000)}.</p>
      <div className="flex flex-wrap gap-3">
        <button name="mode" value="update" className="btn btn-hot">Save this round</button>
        <button name="mode" value="new" className="btn btn-ghost">Save as a new round</button>
        <button type="button" onClick={close} className="btn btn-ghost">Close round and pick winners</button>
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
        {note && <p role="status" className="mt-4 font-semibold text-gulf">{note}</p>}
      </section>
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
