"use client";
import Link from "@/components/A";
import { ENGINES, CHAPTER_ALERTS, KIND_LABEL, type Engine } from "@/lib/economy";
import { MONEY_ROUTE } from "@/lib/missionIntel";

/** The Economist, pocket-sized, beside Perfect Play. Only what serves the mission in front of
 *  you: this chapter's money goal, the three best earners open right now, the one warning that
 *  costs money if you miss it. Everything else stays on the full Economist page. */

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

function pick(ch: number): Engine[] {
  const open = ENGINES.filter((e) => e.kind !== "story" && (e.ch === ch || (e.ch < ch && e.repeat)));
  const score = (e: Engine) => (e.ch === ch ? 2 : 0) + (e.best ? 3 : 0) + (e.repeat ? 1 : 0) + Math.min(3, (e.top ?? 0) / 5000);
  return open.sort((a, b) => score(b) - score(a)).slice(0, 3);
}

export function EconPanel({ ch, missionName, missionCash, onClose }: { ch: number; missionName?: string; missionCash?: number; onClose: () => void }) {
  const route = MONEY_ROUTE[ch];
  const alert = CHAPTER_ALERTS.find((a) => a.ch === ch);
  const earners = pick(ch);
  const storyPay = ENGINES.filter((e) => e.ch === ch && e.kind === "story" && e.top).sort((a, b) => (b.top ?? 0) - (a.top ?? 0))[0];

  return (
    <aside className="pp-econ" aria-label="Economist">
      <header className="pp-econ-top">
        <p className="pp-econ-brand"><span aria-hidden>💰</span> Economist <small>{ch > 0 ? `Ch ${ch}` : "Prologue"}</small></p>
        <button className="pp-icon pp-econ-x" onClick={onClose} aria-label="Close the Economist">✕</button>
      </header>

      <div className="pp-econ-body">
        {route ? (
          <div className="pp-econ-goal">
            <b>{route.headline}</b>
            <p>{route.rule}</p>
          </div>
        ) : (
          <div className="pp-econ-goal"><b>No money to chase yet.</b><p>The Prologue is story only. Earning opens in Chapter 1.</p></div>
        )}

        {missionName && (missionCash || storyPay) ? (
          <p className="pp-econ-now">
            {missionCash ? <>This mission pays <b>{usd(missionCash)}</b>.</> : null}
            {storyPay && storyPay.name !== missionName ? <> Best story payout this chapter: <b>{storyPay.name}</b> ({storyPay.pay}).</> : null}
          </p>
        ) : null}

        {earners.length > 0 && (
          <>
            <p className="pp-k">Earn now</p>
            <ol className="pp-econ-list">
              {earners.map((e) => (
                <li key={e.id} className={e.best ? "is-best" : ""}>
                  <div className="pp-econ-row">
                    <b>{e.name}</b>
                    <span className="pp-econ-pay">{e.pay}{e.per ? <small> {e.per}</small> : null}</span>
                  </div>
                  <div className="pp-econ-meta">
                    <span>{KIND_LABEL[e.kind]}</span>
                    <span className="pp-heat" aria-label={`Heat ${e.heat} of 3`}>{[1, 2, 3].map((h) => <i key={h} className={h <= e.heat ? "on" : ""} />)}</span>
                    {e.repeat && <span>Repeatable</span>}
                  </div>
                  <p className="pp-econ-step">{e.steps[0]}</p>
                </li>
              ))}
            </ol>
          </>
        )}

        {alert && <p className="pp-econ-alert"><span aria-hidden>⚠</span> {alert.text}</p>}

        <Link href="/edge/economist" className="pp-econ-more">Full Economist →</Link>
      </div>
    </aside>
  );
}
