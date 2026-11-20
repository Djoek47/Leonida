"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { sb } from "@/lib/supabase";
import { CHAPTERS } from "@/lib/missions";
import { HOW_IT_PLAYS } from "@/lib/news";

/** Research desk. Two tools on one search engine (Serper, through /api/admin/research):
 *   1. Guide research: find GTA VI news, cheats, map and system info, turn picked results into a
 *      guide entry (shown in "How it plays" on the guide page once published).
 *   2. Mission research: research one mission, or a whole chapter in one go, into draft briefings
 *      attached to each mission's card on Mission Briefing.
 *  Everything lands as a DRAFT with the source links. Rewrite it in our own words, then publish. */

type Hit = { title: string; link: string; snippet: string; source: string; date: string | null };
type GuideRow = { id: string; topic: string; title: string; body: string; sources: string[]; published: boolean; updated_at: string };

const GUIDE_PRESETS = [
  "GTA 6 cheat codes PS5", "GTA 6 cheat codes Xbox", "GTA 6 phone cheats", "GTA 6 map collectibles locations",
  "GTA 6 side activities list", "GTA 6 best way to make money", "GTA 6 hidden easter eggs", "GTA 6 tips and tricks",
];
const TOPICS = Array.from(new Set(["Cheat codes", "Map and collectibles", "Side activities", "Easter eggs", "News", ...HOW_IT_PLAYS.map((t) => t.topic)]));
const NOTE = "Research notes. Rewrite in our own words before publishing, then delete this line.";

async function search(q: string, kind: "search" | "news", num = 10): Promise<Hit[]> {
  const t = (await sb()?.auth.getSession())?.data.session?.access_token;
  const r = await fetch("/api/admin/research", {
    method: "POST",
    headers: { "content-type": "application/json", ...(t ? { authorization: `Bearer ${t}` } : {}) },
    body: JSON.stringify({ q, kind, num }),
  });
  const j = (await r.json().catch(() => ({}))) as { hits?: Hit[]; error?: string };
  if (!r.ok) throw new Error(j.error ?? "Search failed.");
  return j.hits ?? [];
}
const notes = (hits: Hit[]) => [NOTE, "", ...hits.map((h) => `- ${h.snippet} (${h.source})`)].join("\n");

export function Research() {
  const [mode, setMode] = useState<"guide" | "mission">("guide");
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        {([["guide", "Guide research"], ["mission", "Mission research"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)} className={`mb-chip${mode === k ? " is-on" : ""}`}>{l}</button>
        ))}
      </div>
      <p className="text-sm text-haze max-w-3xl">Searches the web and Google News. Pick the useful results and they become a draft with the sources attached. Drafts are never public until you rewrite them and press Publish. Write it in our words; never paste another site&apos;s text.</p>
      {mode === "guide" ? <GuideResearch /> : <MissionResearch />}
    </div>
  );
}

function Results({ hits, picked, setPicked }: { hits: Hit[]; picked: Set<string>; setPicked: (s: Set<string>) => void }) {
  if (!hits.length) return null;
  return (
    <ul className="grid gap-2">
      {hits.map((h) => {
        const on = picked.has(h.link);
        return (
          <li key={h.link} className={`rounded-lg border-2 p-3 ${on ? "border-flamingo bg-ink" : "border-line bg-ink"}`}>
            <label className="flex gap-3 cursor-pointer">
              <input type="checkbox" checked={on} onChange={() => { const n = new Set(picked); if (on) n.delete(h.link); else n.add(h.link); setPicked(n); }} className="mt-1" />
              <span className="min-w-0">
                <span className="block font-extrabold">{h.title}</span>
                <span className="block text-sm text-haze">{h.snippet}</span>
                <a href={h.link} target="_blank" rel="noopener noreferrer" className="text-xs underline">{h.source}{h.date ? ` · ${h.date}` : ""}</a>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function GuideResearch() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"search" | "news">("search");
  const [hits, setHits] = useState<Hit[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [draft, setDraft] = useState<{ id?: string; topic: string; title: string; body: string; sources: string[] } | null>(null);
  const [rows, setRows] = useState<GuideRow[]>([]);

  const load = useCallback(async () => {
    const s = sb(); if (!s) return;
    const { data } = await s.from("guide_entries").select("*").order("updated_at", { ascending: false });
    setRows((data ?? []) as GuideRow[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function run(query = q) {
    if (!query.trim()) return;
    setQ(query); setBusy(true); setMsg(""); setPicked(new Set());
    try { setHits(await search(query, kind)); } catch (e) { setMsg((e as Error).message); setHits([]); }
    setBusy(false);
  }
  function makeDraft() {
    const use = hits.filter((h) => picked.has(h.link));
    if (!use.length) { setMsg("Tick at least one result first."); return; }
    const topic = /cheat/i.test(q) ? "Cheat codes" : /map|collect/i.test(q) ? "Map and collectibles" : kind === "news" ? "News" : TOPICS[0];
    setDraft({ topic, title: q.replace(/^gta ?(6|vi)\s*/i, "").replace(/^./, (c) => c.toUpperCase()), body: notes(use), sources: use.map((h) => h.link) });
  }
  async function save(publish: boolean) {
    if (!draft) return;
    const s = sb(); if (!s) { setMsg("Demo mode: nothing was written."); return; }
    if (publish && draft.body.includes(NOTE)) { setMsg("Rewrite the notes in our words first (and remove the research line), then publish."); return; }
    const row = { topic: draft.topic.trim(), title: draft.title.trim(), body: draft.body.trim(), sources: draft.sources, published: publish };
    const { error } = draft.id ? await s.from("guide_entries").update(row).eq("id", draft.id) : await s.from("guide_entries").insert(row);
    setMsg(error ? error.message : publish ? "Published to the guide." : "Saved as a draft.");
    if (!error) { setDraft(null); setPicked(new Set()); load(); }
  }
  async function toggle(r: GuideRow) {
    const s = sb(); if (!s) return;
    if (!r.published && r.body.includes(NOTE)) { setMsg("That one still has raw research notes. Edit and rewrite it first."); return; }
    const { error } = await s.from("guide_entries").update({ published: !r.published }).eq("id", r.id);
    setMsg(error ? error.message : r.published ? "Unpublished." : "Published."); load();
  }
  async function remove(r: GuideRow) {
    if (!confirm(`Delete "${r.title}"?`)) return;
    const s = sb(); if (!s) return;
    await s.from("guide_entries").delete().eq("id", r.id); load();
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border-2 border-line bg-ink p-5 grid gap-3">
        <h2 className="text-xl font-extrabold">Find guide material</h2>
        <form onSubmit={(e) => { e.preventDefault(); run(); }} className="flex flex-wrap gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} className="field flex-1 min-w-[240px]" placeholder="GTA 6 cheat codes PS5" />
          <select value={kind} onChange={(e) => setKind(e.target.value as "search" | "news")} className="field w-auto"><option value="search">Web</option><option value="news">News</option></select>
          <button className="btn btn-hot" disabled={busy}>{busy ? "Searching…" : "Search"}</button>
        </form>
        <div className="flex flex-wrap gap-2">{GUIDE_PRESETS.map((p) => <button key={p} type="button" className="mb-chip !text-xs" onClick={() => run(p)}>{p.replace(/^GTA 6 /, "")}</button>)}</div>
        {msg && <p role="status" className="text-sm font-semibold">{msg}</p>}
        <Results hits={hits} picked={picked} setPicked={setPicked} />
        {hits.length > 0 && <button className="btn btn-hot justify-self-start" onClick={makeDraft}>Draft a guide entry from {picked.size || "picked"} result{picked.size === 1 ? "" : "s"}</button>}
      </section>

      {draft && (
        <section className="rounded-lg border-2 border-flamingo bg-ink p-5 grid gap-3">
          <h2 className="text-xl font-extrabold">{draft.id ? "Edit guide entry" : "New guide entry"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-bold">Topic
              <input list="guide-topics" value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} className="field font-normal" />
              <datalist id="guide-topics">{TOPICS.map((t) => <option key={t} value={t} />)}</datalist>
            </label>
            <label className="grid gap-1 text-sm font-bold">Title<input value={draft.title} maxLength={140} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="field font-normal" /></label>
          </div>
          <label className="grid gap-1 text-sm font-bold">Entry (one tip per line works best)<textarea rows={10} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className="field font-normal" /></label>
          <p className="text-xs text-haze">Sources ({draft.sources.length}): {draft.sources.map((s) => <a key={s} href={s} target="_blank" rel="noopener noreferrer" className="underline mr-2">{new URL(s).hostname.replace(/^www\./, "")}</a>)}</p>
          <div className="flex gap-3">
            <button className="btn btn-ghost" onClick={() => save(false)}>Save draft</button>
            <button className="btn btn-hot" onClick={() => save(true)}>Publish to guide</button>
            <button className="btn btn-ghost" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-extrabold">Guide entries</h2>
        {rows.length === 0 ? <p className="text-haze mt-2">None yet.</p> : (
          <ul className="mt-3 grid gap-2">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border-2 border-line bg-ink p-3">
                <div className="min-w-0 flex-1"><p className="font-extrabold truncate">{r.title}</p><p className="text-xs text-haze">{r.topic} · {r.published ? "Published" : "Draft"} · {r.sources.length} sources</p></div>
                <button className="text-sm font-bold underline" onClick={() => { setDraft({ id: r.id, topic: r.topic, title: r.title, body: r.body, sources: r.sources }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
                <button className="text-sm font-bold underline" onClick={() => toggle(r)}>{r.published ? "Unpublish" : "Publish"}</button>
                <button className="text-sm font-bold underline text-flamingo" onClick={() => remove(r)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MissionResearch() {
  const [ch, setCh] = useState(1);
  const [name, setName] = useState(CHAPTERS[1].missions[0].name);
  const [hits, setHits] = useState<Hit[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [have, setHave] = useState<Set<string>>(new Set());
  const [batch, setBatch] = useState<{ done: number; total: number } | null>(null);
  const chapter = CHAPTERS[ch];
  const mission = useMemo(() => chapter.missions.find((m) => m.name === name) ?? chapter.missions[0], [chapter, name]);

  const loadHave = useCallback(async () => {
    const s = sb(); if (!s) return;
    const { data } = await s.from("mission_briefings").select("mission");
    setHave(new Set((data ?? []).map((r: { mission: string | null }) => (r.mission ?? "").toLowerCase()).filter(Boolean)));
  }, []);
  useEffect(() => { loadHave(); }, [loadHave]);

  const query = (m: string) => `GTA 6 "${m}" mission walkthrough`;
  async function run() {
    setBusy(true); setMsg(""); setPicked(new Set());
    try { const h = await search(query(mission.name), "search", 8); setHits(h); setPicked(new Set(h.slice(0, 4).map((x) => x.link))); } catch (e) { setMsg((e as Error).message); setHits([]); }
    setBusy(false);
  }
  async function saveDraft(mName: string, goal: string, use: Hit[]) {
    const s = sb(); if (!s) throw new Error("Demo mode: nothing was written.");
    const { error } = await s.from("mission_briefings").insert({
      title: `${mName}: briefing`, mission: mName, summary: goal, body: notes(use), sources: use.map((h) => h.link), published: false,
    });
    if (error) throw new Error(error.message);
  }
  async function draftOne() {
    const use = hits.filter((h) => picked.has(h.link));
    if (!use.length) { setMsg("Tick at least one result first."); return; }
    try { await saveDraft(mission.name, mission.goal, use); setMsg(`Draft saved for ${mission.name}. Edit and publish it in the Mission Briefing tab.`); loadHave(); }
    catch (e) { setMsg((e as Error).message); }
  }
  async function draftChapter() {
    const todo = chapter.missions.filter((m) => !m.optional && !have.has(m.name.toLowerCase()));
    if (!todo.length) { setMsg("Every story mission in this chapter already has a briefing."); return; }
    if (!confirm(`Research ${todo.length} missions in ${chapter.label} and save each as a draft? This uses ${todo.length} searches.`)) return;
    setBatch({ done: 0, total: todo.length }); setMsg("");
    let ok = 0, fail = 0;
    for (const [i, m] of todo.entries()) {
      try { const h = await search(query(m.name), "search", 6); if (h.length) { await saveDraft(m.name, m.goal, h.slice(0, 4)); ok++; } else fail++; }
      catch { fail++; }
      setBatch({ done: i + 1, total: todo.length });
    }
    setBatch(null); loadHave();
    setMsg(`${ok} drafts saved${fail ? `, ${fail} with nothing found` : ""}. Rewrite and publish them in the Mission Briefing tab.`);
  }

  return (
    <section className="rounded-lg border-2 border-line bg-ink p-5 grid gap-3">
      <h2 className="text-xl font-extrabold">Research a mission</h2>
      <div className="flex flex-wrap gap-2">
        <select value={ch} onChange={(e) => { const c = Number(e.target.value); setCh(c); setName(CHAPTERS[c].missions[0].name); setHits([]); }} className="field w-auto">
          {CHAPTERS.map((c) => <option key={c.id} value={c.id}>{c.label}: {c.title}</option>)}
        </select>
        <select value={mission.name} onChange={(e) => { setName(e.target.value); setHits([]); }} className="field flex-1 min-w-[220px]">
          {chapter.missions.map((m) => <option key={m.name} value={m.name}>{m.n ? `${m.n}. ` : "+ "}{m.name}{have.has(m.name.toLowerCase()) ? "  ✓ has briefing" : ""}</option>)}
        </select>
        <button className="btn btn-hot" onClick={run} disabled={busy || !!batch}>{busy ? "Searching…" : "Research"}</button>
      </div>
      <p className="text-sm text-haze">{mission.goal}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-ghost" onClick={draftChapter} disabled={!!batch}>Research the whole {chapter.label} into drafts</button>
        {batch && <span className="text-sm font-bold" role="status">Working… {batch.done}/{batch.total}</span>}
      </div>
      {msg && <p role="status" className="text-sm font-semibold">{msg}</p>}
      <Results hits={hits} picked={picked} setPicked={setPicked} />
      {hits.length > 0 && <button className="btn btn-hot justify-self-start" onClick={draftOne}>Save draft briefing for {mission.name}</button>}
    </section>
  );
}
