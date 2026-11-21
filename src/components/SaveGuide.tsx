"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { SAVE_PLAN, SAVE_RULES } from "@/lib/choiceTree";

/** Where to spend the 15 manual save slots, for the chapter on screen (or all of them).
 *  Ticks are kept in this browser so you can see which slots you've already used. */
const KEY = "lfl-saves";
export function SaveGuide({ ch }: { ch: number }) {
  const [all, setAll] = useState(false);
  const [got, setGot] = useState<number[]>([]);
  useEffect(() => { try { setGot(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch {} }, []);
  const tick = (n: number) => { const g = got.includes(n) ? got.filter((x) => x !== n) : [...got, n]; setGot(g); try { localStorage.setItem(KEY, JSON.stringify(g)); } catch {} };
  const list = SAVE_PLAN.filter((s) => all || s.ch === ch || s.ch === 0);
  return (
    <section className="sv" aria-labelledby="sv-h">
      <div className="sv-head">
        <div>
          <p className="mx-panel-k">💾 Saving guide</p>
          <h3 id="sv-h" className="sv-title">Your 15 save slots</h3>
          <p className="sv-sub">No mission replay and no saving mid-mission, so a save just before a choice is the only way back to it. {got.length}/15 used.</p>
        </div>
        <div className="sv-btns">
          <button className={`sv-toggle${all ? "" : " is-on"}`} onClick={() => setAll(false)}>This chapter</button>
          <button className={`sv-toggle${all ? " is-on" : ""}`} onClick={() => setAll(true)}>All 15</button>
        </div>
      </div>
      <ol className="sv-list">
        {list.map((s) => (
          <li key={s.slot} className={`${s.key ? "is-key" : ""}${got.includes(s.slot) ? " is-got" : ""}`}>
            <button className="sv-disk" onClick={() => tick(s.slot)} aria-pressed={got.includes(s.slot)} aria-label={`Mark slot ${s.slot} as saved`}>{got.includes(s.slot) ? "✓" : s.slot}</button>
            <div>
              <b>{s.ch ? `Ch. ${s.ch} · before ${s.before}` : s.before}</b>
              <p>{s.why}</p>
              {s.key && <span className="sv-key">Story-changing choice</span>}
            </div>
          </li>
        ))}
      </ol>
      <ul className="sv-rules">{SAVE_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
      <Link href="/edge/briefing/choices" className="sv-road">See every save point on The Road →</Link>
    </section>
  );
}
