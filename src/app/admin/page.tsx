"use client";
import { useCallback, useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { DEMO_CLIPS, DEMO_CONTEST, money, platformName, type Clip, type Contest } from "@/lib/api";
import { DemoNote } from "@/components/DemoNote";

type Tab = "review" | "contest" | "payouts" | "claims" | "versus" | "club" | "staff";
type Row = Record<string, unknown> & { id: string };

export default function Admin() {
  const { profile, loading } = useUser();
  const [tab, setTab] = useState<Tab>("review");
  if (loading) return null;
  if (!profile?.is_admin) return <div className="mx-auto max-w-xl px-4 py-24"><h1 className="display text-6xl">Staff only</h1><p className="text-haze mt-3">Ask an admin to set <code>is_admin</code> on your profile.</p></div>;
  const tabs: [Tab, string][] = [["review", "Review queue"], ["contest", "Weekly round"], ["payouts", "Payouts"], ["claims", "Claims"], ["versus", "Versus"], ["club", "’’’ Club"], ["staff", "Staff and settings"]];
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
        {tab === "club" && <Table table="club_applications" filter={["status", ["applied"]]} cols={["social_club", "platform", "discord", "proof_url", "profile_url"]} actions={[["approved", "Approve"], ["declined", "Decline"]]} />}
        {tab === "versus" && <Table table="versus_applications" filter={["status", ["applied"]]} cols={["gamertag", "platform", "can_stream", "note"]} actions={[["selected", "Select"], ["declined", "Decline"]]} />}
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
    const { data } = await c.from("clips").select("*").eq("status", "pending").order("spotlighted_by", { ascending: true, nullsFirst: false }).order("created_at"); // club spotlights first
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

const ROLES = [["member", "Member"], ["reviewer", "Reviewer: clips and claims"], ["moderator", "Moderator: + payouts, club, Versus"], ["owner", "Owner: everything, manages staff"]] as const;
type Person = { id: string; display_name: string; gamertag: string | null; role: string; is_club: boolean };
function Staff({ isOwner }: { isOwner: boolean }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("club");
  const [note, setNote] = useState("");
  useEffect(() => {
    const s = sb();
    if (!s) { setPeople([
      { id: "demo", display_name: "ViceCityVandal", gamertag: "ViceCityVandal", role: "owner", is_club: true },
      { id: "a", display_name: "KeysKingpin", gamertag: "KeysKingpin", role: "reviewer", is_club: true },
      { id: "b", display_name: "SwampSaint", gamertag: "SwampSaint", role: "member", is_club: false },
      { id: "c", display_name: "NeonDrifter", gamertag: "NeonDrifter", role: "moderator", is_club: false },
    ]); return; }
    s.from("profiles").select("id,display_name,gamertag,role,is_club").order("role").limit(200).then(({ data }) => setPeople((data as Person[]) ?? []));
    s.from("site_settings").select("voting_mode").maybeSingle().then(({ data }) => data && setMode(data.voting_mode));
  }, []);
  async function setRole(p: Person, role: string) {
    const s = sb(); if (s) { const { error } = await s.rpc("set_role", { p_user: p.id, p_role: role }); if (error) { setNote(error.message); return; } }
    setPeople((xs) => xs.map((x) => x.id === p.id ? { ...x, role } : x)); setNote(`${p.display_name} is now ${role}.`);
  }
  async function saveMode(m: string) {
    const s = sb(); if (s) { const { error } = await s.from("site_settings").update({ voting_mode: m }).eq("id", true); if (error) { setNote(error.message); return; } }
    setMode(m); setNote(m === "club" ? "Only club members can vote now." : "Everyone can vote now.");
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
              <span className="flex-1 min-w-0"><span className="font-bold">{p.display_name}</span>{p.is_club && <span className="ml-2 text-xs font-black text-[#1c1710] bg-mango px-1.5 rounded">’’’</span>}<span className="block text-sm text-haze truncate">{p.gamertag}</span></span>
              <select disabled={!isOwner} value={p.role} onChange={(e) => setRole(p, e.target.value)} className="field !w-auto">
                {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </li>
          ))}
        </ul>
        {!isOwner && <p className="mt-2 text-sm text-haze">Only owners can change roles.</p>}
      </section>
      <section>
        <h2 className="text-xl font-extrabold">Who can vote</h2>
        <div className="mt-3 grid gap-2">
          {[["club", "Triple Comma Club only", "Season 1 launch setting"], ["everyone", "Everyone with an account", "Open it up later"]].map(([v, l, d]) => (
            <button key={v} onClick={() => saveMode(v)} aria-pressed={mode === v} className={`text-left rounded-lg border-2 px-4 py-3 ${mode === v ? "border-gulf bg-ink" : "border-line"}`}>
              <span className="block font-bold">{l}</span><span className="block text-sm text-haze">{d}</span>
            </button>
          ))}
        </div>
        {note && <p role="status" className="mt-4 font-semibold text-gulf">{note}</p>}
      </section>
    </div>
  );
}
