"use client";
import { useEffect, useState } from "react";
import { CHEATS, CHEAT_CATS, CHEAT_RULES, CHEAT_TOTAL, type Cheat, type CheatCat } from "@/lib/cheats";

/** Cheat codes as cards. Codes are drawn with our own direction keys (not console glyphs),
 *  and Play runs through the sequence one press at a time. */
const ROT: Record<string, number> = { U: 0, R: 90, D: 180, L: 270 };
const WORD: Record<string, string> = { U: "Up", R: "Right", D: "Down", L: "Left" };

function Key({ d, on }: { d: string; on?: boolean }) {
  return (
    <span className={`ck-key${on ? " is-on" : ""}`} aria-label={WORD[d]}>
      <svg viewBox="0 0 24 24" style={{ transform: `rotate(${ROT[d]}deg)` }} aria-hidden><path d="M12 5 L19 14 H14.5 V19 H9.5 V14 H5 Z" /></svg>
    </span>
  );
}

function Card({ c, ready }: { c: Cheat; ready: boolean }) {
  const late = !ready && c.unlock === "Finish the story";
  const [step, setStep] = useState(-1);
  useEffect(() => {
    if (step < 0) return;
    const t = setTimeout(() => setStep((s) => (s + 1 >= c.code.length ? -1 : s + 1)), 420);
    return () => clearTimeout(t);
  }, [step, c.code.length]);
  const cat = CHEAT_CATS.find((k) => k.id === c.cat)!;
  return (
    <li className={`ck-card c-${c.cat}${c.code ? "" : " is-soon"}${late ? " is-late" : ""}`}>
      <div className="ck-top">
        <span className="ck-cat"><i aria-hidden>{cat.icon}</i>{cat.label}</span>
        {late ? <span className="ck-len">🔒 After the credits</span> : c.code && <span className="ck-len">{c.code.length} presses</span>}
      </div>
      <b className="ck-name">{c.name}</b>
      {c.code ? (
        <div className="ck-code" aria-label={`Code: ${[...c.code].map((d) => WORD[d]).join(", ")}`}>
          {[...c.code].map((d, i) => <Key key={i} d={d} on={i === step} />)}
        </div>
      ) : <p className="ck-soon">Code not confirmed yet</p>}
      <p className="ck-unlock"><span>Unlock</span>{c.unlock}</p>
      {c.code && !late && <button className="ck-play" onClick={() => setStep(0)} disabled={step >= 0}>{step >= 0 ? `Press ${step + 1} of ${c.code.length}` : "▶ Play the code"}</button>}
    </li>
  );
}

export function CheatCodes() {
  const [cat, setCat] = useState<CheatCat | "all">("all");
  const [ready, setReady] = useState(false);
  const known = CHEATS.filter((c) => c.code).length;
  const list = CHEATS.filter((c) => cat === "all" || c.cat === cat).sort((a, b) => (b.code ? 1 : 0) - (a.code ? 1 : 0));
  return (
    <div className="ck">
      <ol className="ck-how" aria-label="How to enter a cheat">
        <li><span className="ck-n">1</span><b>Open the phone</b><small>Press up on the D-pad</small><Key d="U" /></li>
        <li><span className="ck-n">2</span><b>Open the cheat pad</b><small>Hold the left bumper, tap the right bumper</small><span className="ck-bump"><i>L</i>+<i>R</i></span></li>
        <li><span className="ck-n">3</span><b>Enter the code</b><small>Same codes on PS5 and Xbox</small><span className="ck-mini"><Key d="L" /><Key d="U" /><Key d="R" /></span></li>
      </ol>
      <ul className="ck-rules">{CHEAT_RULES.map((r) => <li key={r.k}><b>{r.k}</b>{r.t}</li>)}</ul>
      <label className="ck-ready">
        <input type="checkbox" checked={ready} onChange={(e) => setReady(e.target.checked)} />
        <span>I&apos;ve finished the story <small>Cheats that need the credits show a lock until you tick this</small></span>
      </label>
      <div className="ck-filters" role="tablist">
        <button role="tab" aria-selected={cat === "all"} className={cat === "all" ? "is-on" : ""} onClick={() => setCat("all")}>All {CHEATS.length}</button>
        {CHEAT_CATS.map((k) => <button key={k.id} role="tab" aria-selected={cat === k.id} className={cat === k.id ? "is-on" : ""} onClick={() => setCat(k.id)}>{k.icon} {k.label}</button>)}
      </div>
      <ul className="ck-grid">{list.map((c) => <Card key={c.name} c={c} ready={ready} />)}</ul>
      <p className="ck-foot">{known} codes confirmed of the {CHEAT_TOTAL} cheats in the game. We add the rest as they&apos;re confirmed. Codes and unlock tasks from <a href="https://www.gtabase.com/gta-6/" target="_blank" rel="noopener noreferrer" className="underline">GTABase</a>.</p>
    </div>
  );
}
