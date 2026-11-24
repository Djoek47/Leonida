"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "@/components/A";
import { FORKS, SAVE_PLAN, SAVE_RULES, SAVES_KEY, type SaveSlot } from "@/lib/choiceTree";

/** The save planner: where to spend GTA VI's 15 manual slots so every choice stays reachable.
 *  A slot map up top (what lives in each slot right now), then the saves for this chapter
 *  with what's at stake in each. Ticks live in this browser, shared with Perfect Play. */

const FORK = new Map(FORKS.map((f) => [f.id, f]));
type View = "chapter" | "keep" | "all";

function badge(s: SaveSlot) {
  if (s.kind === "clean") return { t: "Clean file", c: "is-clean" };
  if (s.kind === "rolling") return { t: "Rolling", c: "is-roll" };
  if (s.keep) return { t: s.key ? "Keep forever · big choice" : "Keep forever", c: "is-keep" };
  return { t: s.freeAfter ? `Reusable after ${s.freeAfter}` : "Reusable later", c: "is-reuse" };
}

export function SaveGuide({ ch }: { ch: number }) {
  const [view, setView] = useState<View>("chapter");
  const [got, setGot] = useState<string[]>([]);
  const [focus, setFocus] = useState<number | null>(null);
  useEffect(() => { try { setGot(JSON.parse(localStorage.getItem(SAVES_KEY) ?? "[]")); } catch {} }, []);
  const tick = (id: string) => { const g = got.includes(id) ? got.filter((x) => x !== id) : [...got, id]; setGot(g); try { localStorage.setItem(SAVES_KEY, JSON.stringify(g)); } catch {} };

  // What each of the 15 slots holds at this point in the story (later saves replace recycled ones).
  const occupant = useMemo(() => {
    const m = new Map<number, SaveSlot>();
    for (const s of SAVE_PLAN) if (s.ch <= Math.max(ch, 0) || s.kind !== "choice") { const cur = m.get(s.slot); if (!cur || s.ch >= cur.ch) m.set(s.slot, s); }
    return m;
  }, [ch]);

  const list = SAVE_PLAN.filter((s) =>
    focus != null ? s.slot === focus
      : view === "all" ? true
      : view === "keep" ? s.keep
      : s.ch === ch || s.kind !== "choice");
  const chapterSaves = SAVE_PLAN.filter((s) => s.kind === "choice" && s.ch === ch);
  const doneHere = chapterSaves.filter((s) => got.includes(s.id)).length;

  return (
    <section className="sv" aria-labelledby="sv-h">
      <div className="sv-head">
        <div>
          <p className="mx-panel-k">💾 Save planner</p>
          <h3 id="sv-h" className="sv-title">15 slots, every choice covered</h3>
          <p className="sv-sub">No mission replay and no saving mid-mission, so a save just before a choice is the only way back to it.
            {chapterSaves.length > 0 && <> This chapter: <b>{doneHere}/{chapterSaves.length}</b> saves made.</>}</p>
        </div>
        <div className="sv-btns" role="tablist">
          {([["chapter", "This chapter"], ["keep", "Keep forever"], ["all", "All saves"]] as [View, string][]).map(([v, l]) => (
            <button key={v} role="tab" aria-selected={view === v && focus == null} className={`sv-toggle${view === v && focus == null ? " is-on" : ""}`} onClick={() => { setView(v); setFocus(null); }}>{l}</button>
          ))}
        </div>
      </div>

      {/* The slot map: one disk per in-game slot, showing what lives there right now. */}
      <div className="sv-map" aria-label="Your 15 slots right now">
        {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => {
          const s = occupant.get(n);
          const b = s ? badge(s) : null;
          const saved = s ? got.includes(s.id) : false;
          return (
            <button key={n} className={`sv-slot ${b?.c ?? "is-free"}${saved ? " is-got" : ""}${focus === n ? " is-focus" : ""}`}
              onClick={() => setFocus(focus === n ? null : n)} title={s ? `Slot ${n}: ${s.tag}` : `Slot ${n}: free for now`}>
              <b>{saved ? "✓" : n}</b><small>{s ? s.tag.replace(/^Ch \d · /, "") : "Free"}</small>
            </button>
          );
        })}
      </div>
      <p className="sv-legend"><i className="is-clean" />Clean <i className="is-roll" />Rolling <i className="is-keep" />Keep forever <i className="is-reuse" />Reusable <i className="is-free" />Free for now</p>

      <ol className="sv-list">
        {list.map((s) => {
          const b = badge(s); const saved = got.includes(s.id);
          const stakes = s.forks.map((id) => FORK.get(id)).filter(Boolean);
          return (
            <li key={s.id} className={`${b.c}${saved ? " is-got" : ""}${s.key ? " is-key" : ""}`}>
              <button className="sv-disk" onClick={() => tick(s.id)} aria-pressed={saved} aria-label={`Mark "${s.tag}" as saved in slot ${s.slot}`}>{saved ? "✓" : s.slot}</button>
              <div>
                <p className="sv-k"><span className={`sv-badge ${b.c}`}>{b.t}</span>{s.ch > 0 && <span>Chapter {s.ch}</span>}</p>
                <b>{s.kind === "choice" ? `Before ${s.before}` : s.before}</b>
                <p>{s.why}</p>
                {s.reuses && <p className="sv-reuse">♻ Overwrites your {s.reuses} save. Only do it once you&apos;re happy with how that chapter went.</p>}
                {stakes.length > 0 && (
                  <p className="sv-stakes"><span>At stake:</span>{stakes.map((f) => <i key={f!.id} className={f!.big ? "is-big" : ""}>{f!.prompt.replace(/\.$/, "")}</i>)}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="sv-trap"><b>The autosave trap.</b> Loading an older save can replace your autosave. Before you go back to a choice, save where you are in a rolling slot so you can come back.</p>
      <ul className="sv-rules">{SAVE_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
      <Link href="/edge/briefing/choices" className="sv-road">See every save point on The Road →</Link>
    </section>
  );
}
