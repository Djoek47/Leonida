"use client";
import { useState } from "react";
import { CAST } from "@/lib/cast";

/** The rest of the cast, by the chapter you meet them. Anyone from Chapter 3 on stays hidden
 *  until spoilers are switched on (people Rockstar showed in trailers are always visible). */
const CH = ["Prologue", "Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4", "Chapter 5"];
const OPEN_UP_TO = 2;
const initials = (n: string) => n.replace(/".*?"/g, "").split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("");

export function CastList() {
  const [spoil, setSpoil] = useState(false);
  const hidden = CAST.filter((c) => c.ch > OPEN_UP_TO && !c.promo).length;
  const chapters = [...new Set(CAST.map((c) => c.ch))].sort((a, b) => a - b);
  return (
    <div className="cast">
      <div className="cast-head">
        <div>
          <h3 className="display text-4xl md:text-5xl">Everyone else you&apos;ll meet</h3>
          <p className="text-haze mt-1">{CAST.length} more people from the story, by the chapter you first meet them.</p>
        </div>
        <button className={`cast-switch${spoil ? " is-on" : ""}`} onClick={() => setSpoil((v) => !v)} aria-pressed={spoil}>
          <span className="cast-switch-track"><i /></span>
          <span><b>Spoilers {spoil ? "on" : "off"}</b><small>{spoil ? "Everyone shown" : `${hidden} people from Chapter 3 on hidden`}</small></span>
        </button>
      </div>
      {chapters.map((ch) => {
        const all = CAST.filter((c) => c.ch === ch);
        const show = all.filter((c) => spoil || ch <= OPEN_UP_TO || c.promo);
        const veiled = all.length - show.length;
        return (
          <section key={ch} className="cast-ch">
            <p className="cast-ch-k"><span>{CH[ch]}</span>{all.length} {all.length === 1 ? "person" : "people"}</p>
            <ul className="cast-grid">
              {show.map((c) => (
                <li key={c.name} className={`cast-card t${ch}`}>
                  <span className="cast-av" aria-hidden>{initials(c.name)}</span>
                  <div>
                    <b>{c.name}</b>
                    <p>{c.role}</p>
                    <small>First met: <i>{c.met}</i>{c.actor ? <> · Voiced by {c.actor}</> : null}</small>
                  </div>
                </li>
              ))}
              {veiled > 0 && (
                <li className="cast-card is-veiled">
                  <span className="cast-av" aria-hidden>?</span>
                  <div><b>{veiled} {veiled === 1 ? "person" : "people"} hidden</b><p>Switch spoilers on to see who.</p></div>
                </li>
              )}
            </ul>
          </section>
        );
      })}
      <p className="text-xs text-haze mt-4">From the in-game credits and story guides (OutputLag, GamesRadar). Some credited names, like Jimmy De Santa, have no confirmed role yet, so they&apos;re not listed. Niko Bellic and the GTA V crew aren&apos;t in the credits.</p>
    </div>
  );
}
