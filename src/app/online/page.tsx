"use client";
import { useState } from "react";
import Link from "@/components/A";
import { ONLINE_FACTS, ONLINE_INTEL, RP_FACTS, RP_INTEL, ONLINE_LAST_CHECKED, type Intel } from "@/lib/onlineIntel";

/** Online & RP: the road is closed. GTA VI shipped single-player; its online mode and any
 *  roleplay support are unannounced. Same night road and barricade as the pre-launch Edge,
 *  with a running intel board underneath. Content lives in src/lib/onlineIntel.ts. */

const STATUS: Record<Intel["status"], string> = { confirmed: "Confirmed", reported: "Reported", datamine: "Datamine" };
const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function Board({ facts }: { facts: { k: string; v: string; ok?: boolean }[] }) {
  return (
    <ul className="ol-board">
      {facts.map((f) => (
        <li key={f.k} className={f.ok ? "is-ok" : ""}>
          <span>{f.k}</span><b><i aria-hidden />{f.v}</b>
        </li>
      ))}
    </ul>
  );
}

function Feed({ items }: { items: Intel[] }) {
  return (
    <ol className="ol-feed">
      {items.map((it, i) => (
        <li key={it.title} style={{ "--i": i } as React.CSSProperties}>
          <div className="ol-when"><time dateTime={it.date}>{fmt(it.date)}</time><em className={`ol-tag is-${it.status}`}>{STATUS[it.status]}</em></div>
          <a className="edge-card ol-card" href={it.url} target="_blank" rel="noopener noreferrer">
            <b>{it.title}<i>↗</i></b>
            <span>{it.body}</span>
            <small>Source: {it.source}</small>
          </a>
        </li>
      ))}
    </ol>
  );
}

export default function Online() {
  const [lane, setLane] = useState<"online" | "rp">("online");
  return (
    <>
      <div className="edge-road ol-road">
        <div className="edge-horizon" aria-hidden />
        <div className="edge-lane" aria-hidden><i /><i /><i /><i /><i /><i /></div>
        <div className="edge-beam" aria-hidden />
        <div className="edge-motes" aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ "--m": i } as React.CSSProperties} />)}</div>
        <div className="edge-vig" aria-hidden />

        <section className="edge-scene">
          <p className="edge-k"><i className="edge-dot" aria-hidden />State route 6 · Leonida · Lanes closed ahead</p>
          <div className="edge-barrier">
            <div className="edge-sign">
              <span className="edge-stripe t" aria-hidden /><span className="edge-lamp a" aria-hidden /><span className="edge-lamp b" aria-hidden />
              <p>ROAD CLOSED · DETOUR AHEAD</p>
              <h1>ONLINE &amp; RP</h1>
              <span className="edge-stripe b" aria-hidden />
            </div>
            <span className="edge-leg l" aria-hidden /><span className="edge-leg r" aria-hidden />
          </div>

          <div className="edge-timer ol-status" role="img" aria-label="GTA VI Online: not announced. Roleplay: not announced.">
            <div className="edge-cell"><b>OFF</b><small>ONLINE</small></div>
            <div className="edge-cell"><b>TBA</b><small>DATE</small></div>
            <div className="edge-cell"><b>OFF</b><small>RP</small></div>
          </div>
          <p className="edge-when">Story mode is open · these lanes aren&apos;t yet</p>
          <p className="edge-open">GTA VI launched single-player on November 19, 2026. Its online mode and any roleplay support haven&apos;t been announced. Until they are, everything we can confirm, every credible report and every datamine lands here, with the source.</p>
        </section>
      </div>

      <main className="ol-main">
        <div className="ol-switch" role="tablist" aria-label="Pick a lane">
          <button role="tab" aria-selected={lane === "online"} className={lane === "online" ? "is-on" : ""} onClick={() => setLane("online")}>
            <span>Lane 1</span>GTA Online
          </button>
          <button role="tab" aria-selected={lane === "rp"} className={lane === "rp" ? "is-on" : ""} onClick={() => setLane("rp")}>
            <span>Lane 2</span>GTA RP
          </button>
        </div>

        {lane === "online" ? (
          <section className="ol-lane" aria-label="GTA Online">
            <h2 className="ol-h">Where GTA VI Online stands</h2>
            <Board facts={ONLINE_FACTS} />
            <h3 className="ol-h3">Intel, newest first</h3>
            <Feed items={ONLINE_INTEL} />
          </section>
        ) : (
          <section className="ol-lane" aria-label="GTA RP">
            <h2 className="ol-h">Where GTA VI roleplay stands</h2>
            <Board facts={RP_FACTS} />
            <h3 className="ol-h3">Intel, newest first</h3>
            <Feed items={RP_INTEL} />
          </section>
        )}

        <aside className="ol-meanwhile">
          <div>
            <p className="ol-k">While the road&apos;s closed</p>
            <p className="ol-mt">Story mode clips still count. Send yours to the weekly contest.</p>
          </div>
          <div className="ol-ctas">
            <Link href="/submit" className="btn btn-hot">Send a clip</Link>
            <Link href="/leonida" className="btn btn-ghost">Leonida guide</Link>
          </div>
        </aside>

        <p className="ol-foot">
          Last checked {fmt(ONLINE_LAST_CHECKED)}. &quot;Confirmed&quot; means Rockstar, Take-Two or Cfx.re said it on the record; &quot;reported&quot; means a credible outlet did; &quot;datamine&quot; means it was found in game files. Sites selling &quot;GTA 6 RP&quot; access or early servers aren&apos;t official.
          Live From Leonida is fan-run and not affiliated with Rockstar Games or Take-Two.
        </p>
      </main>
    </>
  );
}
