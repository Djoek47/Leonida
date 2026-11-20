"use client";
import { useMemo, useState } from "react";
import { VEHICLES, VEHICLE_CLASSES } from "@/lib/vehicles";

/** Searchable list of every named vehicle so far, by class. Places in Leonida show as map
 *  pins; trailer and screenshot sightings show as a film tag. */
const PLACES = ["Vice City", "Port Gellhorn", "Ambrosia", "Grassrivers", "Leonida Keys", "Mount Kalaga", "Key Lento", "Watson Bay", "Ocean Beach", "Washington Beach"];
const ICON: Record<string, string> = { Super: "⚡", Sports: "🏁", "Sports Classics": "🕰", Muscle: "💪", Coupes: "🎩", Sedans: "🚘", SUVs: "🚙", "Off-road": "⛰", Pickups: "🛻", Vans: "🚐", Motorcycles: "🏍", Commercial: "🚚", Emergency: "🚨", Boats: "🚤", Helicopters: "🚁", Planes: "✈", Cycles: "🚲" };

export function VehicleCatalog() {
  const [q, setQ] = useState("");
  const [cls, setCls] = useState<string>("all");
  const [where, setWhere] = useState<string>("any");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return VEHICLES.filter(([c, m, n, s]) => (cls === "all" || c === cls) && (where === "any" || s.includes(where)) && (!t || `${m} ${n} ${c}`.toLowerCase().includes(t)));
  }, [q, cls, where]);
  const count = (c: string) => VEHICLES.filter((v) => v[0] === c).length;
  return (
    <div className="vc">
      <div className="vc-bar">
        <label className="vc-search"><span aria-hidden>🔎</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a car, a maker or a class" aria-label="Search vehicles" /></label>
        <select value={where} onChange={(e) => setWhere(e.target.value)} className="vc-where" aria-label="Seen in">
          <option value="any">Seen anywhere</option>
          {PLACES.map((p) => <option key={p} value={p}>Seen in {p}</option>)}
          <option value="Ultimate Edition">Ultimate Edition</option>
          <option value="Pre-order">Pre-order bonus</option>
        </select>
      </div>
      <div className="vc-classes" role="tablist">
        <button role="tab" aria-selected={cls === "all"} className={cls === "all" ? "is-on" : ""} onClick={() => setCls("all")}>All <b>{VEHICLES.length}</b></button>
        {VEHICLE_CLASSES.map((c) => <button key={c} role="tab" aria-selected={cls === c} className={cls === c ? "is-on" : ""} onClick={() => setCls(c)}>{ICON[c]} {c} <b>{count(c)}</b></button>)}
      </div>
      <p className="vc-n" role="status">{list.length} vehicle{list.length === 1 ? "" : "s"}</p>
      <ul className="vc-grid">
        {list.map(([c, m, n, s]) => {
          const tags = s.split(",").map((x) => x.trim()).filter(Boolean);
          return (
            <li key={`${c}-${m}-${n}`} className="vc-card">
              <span className="vc-ico" aria-hidden>{ICON[c]}</span>
              <div className="vc-main">
                <span className="vc-maker">{m || "Maker unknown"}</span>
                <b className="vc-model">{n}</b>
                <span className="vc-cls">{c}</span>
              </div>
              <div className="vc-tags">
                {tags.map((t) => {
                  const place = PLACES.some((p) => t.includes(p)), ed = /Edition|Pre-order|bonus/i.test(t);
                  return <span key={t} className={place ? "is-place" : ed ? "is-ed" : t === "Unknown" ? "is-unk" : ""}>{place ? "📍 " : ed ? "★ " : t === "Unknown" ? "" : "🎬 "}{t === "Unknown" ? "Not spotted yet" : t}</span>;
                })}
              </div>
            </li>
          );
        })}
        {!list.length && <li className="vc-empty">Nothing matches. Try another name or clear the filters.</li>}
      </ul>
      <p className="text-xs text-haze mt-3">Named vehicles only, compiled from the <a href="https://gta6cars.org/gta6" target="_blank" rel="noopener noreferrer" className="underline">gta6cars.org</a> database. Prices, top speeds and exact spawns get added as our crew logs them.</p>
    </div>
  );
}
