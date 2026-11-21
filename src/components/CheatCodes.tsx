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

function Row({ c, ready }: { c: Cheat; ready: boolean }) {
  const late = !ready && c.unlock === "Finish the story";
  const [step, setStep] = useState(-1);
  useEffect(() => {
    if (step < 0) return;
    const t = setTimeout(() => setStep((s) => (s + 1 >= c.code.length ? -1 : s + 1)), 420);
    return () => clearTimeout(t);
  }, [step, c.code.length]);
  return (
    <li className={`ck-row c-${c.cat}${c.code ? "" : " is-soon"}${late ? " is-late" : ""}`}>
      <div className="ck-row-name"><b>{c.name}</b><small>{late ? "🔒 After the credits" : c.unlock}</small></div>
      {c.code ? (
        <div className="ck-code" aria-label={`Code: ${[...c.code].map((d) => WORD[d]).join(", ")}`}>
          {[...c.code].map((d, i) => <Key key={i} d={d} on={i === step} />)}
        </div>
      ) : <p className="ck-soon">Code not confirmed yet</p>}
      {c.code && !late ? <button className="ck-play" onClick={() => setStep(0)} disabled={step >= 0} aria-label={`Play the ${c.name} code`}>{step >= 0 ? `${step + 1}/${c.code.length}` : "▶"}</button> : <span />}
    </li>
  );
}

export function CheatCodes() {
  const [cat, setCat] = useState<CheatCat | "all">("all");
  const [ready, setReady] = useState(false);
  const [pf, setPf] = useState<"ps" | "xb">("ps");
  const L = pf === "ps" ? "L1" : "LB", R = pf === "ps" ? "R1" : "RB";
  const known = CHEATS.filter((c) => c.code).length;
  const list = CHEATS.filter((c) => cat === "all" || c.cat === cat).sort((a, b) => (b.code ? 1 : 0) - (a.code ? 1 : 0));
  return (
    <div className={`ck pf-${pf}`}>
      <div className="ck-pf" role="radiogroup" aria-label="Your console">
        <button role="radio" aria-checked={pf === "ps"} className={pf === "ps" ? "is-on" : ""} onClick={() => setPf("ps")}><span className="ck-pf-dot is-ps" />PlayStation 5</button>
        <button role="radio" aria-checked={pf === "xb"} className={pf === "xb" ? "is-on" : ""} onClick={() => setPf("xb")}><span className="ck-pf-dot is-xb" />Xbox Series X|S</button>
      </div>
      <ol className="ck-how" aria-label="How to enter a cheat">
        <li><span className="ck-n">1</span><b>Open the phone</b><small>Press up on the D-pad</small><Key d="U" /></li>
        <li><span className="ck-n">2</span><b>Open the cheat pad</b><small>Hold {L}, tap {R}</small><span className="ck-bump"><i>{L}</i>+<i>{R}</i></span></li>
        <li><span className="ck-n">3</span><b>Enter the code</b><small>Same codes on both consoles</small><span className="ck-mini"><Key d="L" /><Key d="U" /><Key d="R" /></span></li>
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
      <div className="ck-groups">
        {CHEAT_CATS.filter((k) => cat === "all" || k.id === cat).map((k) => {
          const rows = list.filter((c) => c.cat === k.id);
          return rows.length ? (
            <section key={k.id} className={`ck-group c-${k.id}`}>
              <p className="ck-group-h"><i aria-hidden>{k.icon}</i>{k.label}<span>{rows.filter((r) => r.code).length}/{rows.length} codes</span></p>
              <ul>{rows.map((c) => <Row key={c.name} c={c} ready={ready} />)}</ul>
            </section>
          ) : null;
        })}
      </div>
      <p className="ck-foot">{known} codes confirmed of the {CHEAT_TOTAL} cheats in the game. We add the rest as they&apos;re confirmed. Codes and unlock tasks from <a href="https://www.gtabase.com/gta-6/" target="_blank" rel="noopener noreferrer" className="underline">GTABase</a>.</p>
    </div>
  );
}
