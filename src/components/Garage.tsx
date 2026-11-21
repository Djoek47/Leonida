"use client";
import { useMemo, useState } from "react";
import data from "@/lib/arsenal.json";
import { VEHICLES, VEHICLE_CLASSES } from "@/lib/vehicles";
import { WEAPONS, WEAPON_CLASSES } from "@/lib/weapons";

/** Cars and weapons in one place. Ten featured of each up top, then a compact browser for
 *  everything else (12 at a time). Pictures appear where we have an official image; the rest
 *  show a class tile until the crew's screenshots arrive. */
type Shot = { name: string; img: string | null; note: string; category: string };
const SHOTS = data as unknown as (Shot & { kind: string })[];
const RANK = ["Super", "Sports Classics", "Sports", "Muscle", "Coupes", "SUVs", "Sedans", "Off-road", "Motorcycles", "Boats", "Helicopters", "Planes", "Pickups", "Vans", "Commercial", "Emergency", "Cycles"];
const ICON: Record<string, string> = { Super: "⚡", Sports: "🏁", "Sports Classics": "🕰", Muscle: "💪", Coupes: "🎩", Sedans: "🚘", SUVs: "🚙", "Off-road": "⛰", Pickups: "🛻", Vans: "🚐", Motorcycles: "🏍", Commercial: "🚚", Emergency: "🚨", Boats: "🚤", Helicopters: "🚁", Planes: "✈", Cycles: "🚲",
  Handguns: "🔫", SMGs: "💥", Shotguns: "🎯", Rifles: "🪖", Marksman: "🔭", Snipers: "🎯", Heavy: "💣", Melee: "🔪", Throwables: "🧨" };
const PAGE = 12;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const imgFor = (maker: string, model: string) => SHOTS.find((s) => s.img && (norm(s.name).includes(norm(model)) || norm(s.name) === norm(`${maker}${model}`)))?.img ?? null;
const usd = (n: number) => (n ? `$${n.toLocaleString("en-US")}` : "—");

export function Garage() {
  const [kind, setKind] = useState<"vehicles" | "weapons">("vehicles");
  const [cls, setCls] = useState("all");
  const [q, setQ] = useState("");
  const [n, setN] = useState(PAGE);
  const [open, setOpen] = useState<string | null>(null);

  const featured = useMemo(() => kind === "vehicles"
    ? SHOTS.filter((s) => s.kind === "vehicle" && s.img).slice(0, 10)
    : (() => {
      const byPrice = [...WEAPONS].sort((a, b) => b[3] - a[3]);
      const top = WEAPON_CLASSES.map((c) => byPrice.find((w) => w[2] === c)).filter(Boolean) as typeof WEAPONS;
      return [...top, ...byPrice.filter((w) => !top.includes(w))].slice(0, 10);
    })(), [kind]);

  const vlist = useMemo(() => {
    const t = norm(q);
    return VEHICLES.filter(([c, m, md]) => (cls === "all" || c === cls) && (!t || norm(`${m}${md}${c}`).includes(t)))
      .sort((a, b) => RANK.indexOf(a[0]) - RANK.indexOf(b[0]) || a[2].localeCompare(b[2]));
  }, [cls, q]);
  const wlist = useMemo(() => {
    const t = norm(q);
    return WEAPONS.filter(([nm, ty, c]) => (cls === "all" || c === cls) && (!t || norm(`${nm}${ty}`).includes(t))).sort((a, b) => b[3] - a[3]);
  }, [cls, q]);
  const total = kind === "vehicles" ? vlist.length : wlist.length;
  const switchTo = (k: typeof kind) => { setKind(k); setCls("all"); setQ(""); setN(PAGE); setOpen(null); };

  return (
    <div className="gr">
      <div className="gr-switch" role="tablist">
        <button role="tab" aria-selected={kind === "vehicles"} className={kind === "vehicles" ? "is-on" : ""} onClick={() => switchTo("vehicles")}>🚗 Vehicles <b>{VEHICLES.length}</b></button>
        <button role="tab" aria-selected={kind === "weapons"} className={kind === "weapons" ? "is-on" : ""} onClick={() => switchTo("weapons")}>🔫 Weapons <b>{WEAPONS.length}</b></button>
      </div>

      <p className="gr-k">{kind === "vehicles" ? "Featured: the top of the range" : "Featured: the best of every class"}</p>
      <ul className="gr-feat">
        {kind === "vehicles"
          ? (featured as typeof SHOTS).map((s) => (
            <li key={s.name} className="gr-fcard">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.img!} alt={s.name} loading="lazy" />
              <span className="gr-fcls">{s.category}</span>
              <span className="gr-fname"><b>{s.name}</b><small>{s.note.split("·")[0]}</small></span>
            </li>
          ))
          : (featured as typeof WEAPONS).map((w) => (
            <li key={w[0]} className="gr-fcard is-w">
              <span className="gr-wico" aria-hidden>{ICON[w[2]]}</span>
              <span className="gr-fcls">{w[1]}</span>
              <span className="gr-fname"><b>{w[0]}</b><small>{usd(w[3])}</small></span>
            </li>
          ))}
      </ul>

      <div className="gr-browse">
        <div className="gr-bar">
          <label className="gr-search"><span aria-hidden>🔎</span><input value={q} onChange={(e) => { setQ(e.target.value); setN(PAGE); }} placeholder={kind === "vehicles" ? "Search a car, maker or class" : "Search a weapon or type"} aria-label="Search" /></label>
          {kind === "weapons" && <a href="#map" className="gr-maplink">📍 Find an Ammu-Nation on the map</a>}
        </div>
        <div className="gr-classes">
          <button className={cls === "all" ? "is-on" : ""} onClick={() => { setCls("all"); setN(PAGE); }}>All</button>
          {(kind === "vehicles" ? RANK.filter((c) => (VEHICLE_CLASSES as readonly string[]).includes(c)) : [...WEAPON_CLASSES]).map((c) => (
            <button key={c} className={cls === c ? "is-on" : ""} onClick={() => { setCls(c); setN(PAGE); }}>{ICON[c]} {c}</button>
          ))}
        </div>

        <ul className="gr-list">
          {kind === "vehicles" ? vlist.slice(0, n).map(([c, m, md, seen]) => {
            const img = imgFor(m, md), id = `${m}-${md}`;
            return (
              <li key={id} className={`gr-item${open === id ? " is-open" : ""}`}>
                <button onClick={() => setOpen(open === id ? null : id)}>
                  <span className="gr-thumb">{img
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={img} alt="" loading="lazy" /> : <i aria-hidden>{ICON[c]}</i>}</span>
                  <span className="gr-main"><small>{m || "Maker unknown"}</small><b>{md}</b><em>{c}</em></span>
                  <span className="gr-chev" aria-hidden>{open === id ? "−" : "+"}</span>
                </button>
                {open === id && (
                  <div className="gr-more">
                    <p><span>Seen</span>{seen === "Unknown" ? "Not spotted yet" : seen}</p>
                    <p><span>Steal it</span>Scan it with WAiNK first: security, tracker, the tool you need and its fence value.</p>
                    <p className="gr-soon">Stats, price and steal difficulty arrive with the crew&apos;s data.</p>
                  </div>
                )}
              </li>
            );
          }) : wlist.slice(0, n).map(([nm, ty, c, price, st, where]) => {
            const id = nm;
            return (
              <li key={id} className={`gr-item${open === id ? " is-open" : ""}`}>
                <button onClick={() => setOpen(open === id ? null : id)}>
                  <span className="gr-thumb is-w"><i aria-hidden>{ICON[c]}</i></span>
                  <span className="gr-main"><small>{ty}</small><b>{nm}</b><em>{usd(price)}</em></span>
                  <span className="gr-chev" aria-hidden>{open === id ? "−" : "+"}</span>
                </button>
                {open === id && (
                  <div className="gr-more">
                    {st && (
                      <div className="gr-stats">
                        {(["Damage", "Accuracy", "Range"] as const).map((k, i) => (
                          <div key={k}><span>{k}</span><i><b style={{ width: `${st[i] * 10}%` }} /></i><em>{st[i]}</em></div>
                        ))}
                        <div><span>Magazine</span><em className="is-mag">{st[3]} rounds</em></div>
                      </div>
                    )}
                    <p><span>Where</span>{where}</p>
                    <p><span>Keep it</span>Bought guns come back from any Ammu-Nation locker if you go down. Picked-up guns don&apos;t, unless they&apos;re in your own car&apos;s trunk.</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {n < total && <button className="gr-moreBtn" onClick={() => setN((x) => x + PAGE * 2)}>Show more ({total - n} left)</button>}
        <p className="gr-src">{kind === "vehicles" ? "Named vehicles from the gta6cars.org database." : "Prices and stats from the gta6wiki.eu table; some are disputed. Unique variants aren't listed."}</p>
      </div>
    </div>
  );
}
