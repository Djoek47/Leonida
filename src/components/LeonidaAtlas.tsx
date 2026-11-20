"use client";
import { useState } from "react";

/** Leonida atlas: every county and named district of the in-game map, with the chapter where
 *  the story first takes you there. Region list from PowerPyx's full in-game map page. We link
 *  to the full map image and the community interactive map rather than copying them. */
const REGIONS = [
  { id: "mariana", name: "Mariana County", where: "The south: the Keys, swamps and Capri", ch: "Chapter 1", img: "places/leonida_keys_2",
    areas: ["Mile Zero Air Station", "Southwind", "Riquezas Keys", "Permit Keys", "Maroon Key", "Abismo Key", "Leonida Bay", "Key Lento", "Gambit Bay", "Shoeless Keys", "Corsair Key", "Peregrine Bay", "Leonida Straits", "Pelican Valley", "Cottonmouth Lake", "Wetman Bay", "Gullet Marsh", "Pelican River", "Watson Bay", "Bobcat Key", "Grassrivers", "Tola Bay", "Capri", "Tortoise Lake", "Capri Sound", "Belpoint", "Gulf of Leonida", "Nehrling River"] },
  { id: "vicedale", name: "Vice-Dale County", where: "Vice City, the beaches and the airport", ch: "Chapters 3–4", img: "places/vice_city_2",
    areas: ["Hamlet", "VCIA", "Southside", "Peacock Bay", "Tequesta", "Downtown", "Little Cuba", "Salton", "Rockridge", "Crosstown", "Bayside", "La Perle", "Balsero", "Stockyard", "Decor District", "Leaf Links", "Rialto Islands", "Starfish Island", "Waxman Island", "Port Vice City", "Catalan Bay", "Catalan Key", "Gloriana Key", "Dalton Island", "Ocean Beach", "Washington Beach"] },
  { id: "kelly", name: "Kelly County", where: "North-west: Port Gellhorn and the Gulf coast", ch: "Chapter 2", img: "places/port_gellhorn_2",
    areas: ["Buckskin Swamp", "Emerald River", "Emerland Springs", "Gellhorn", "Port Gellhorn", "Wild Hog Point", "Borrachero Sound", "Crude Islands", "Sandbars", "Draper Island", "Draper Bay", "Frogswater", "Manifest Canyon"] },
  { id: "leonard", name: "Leonard County", where: "North-east: Waning Sands and Lake Leonida", ch: "Chapter 3", img: "places/grassrivers_4",
    areas: ["Belville", "Waning Sands", "Leith River", "Lake Leonida", "Richard Barebone State Park", "Little Hardin Island"] },
  { id: "lummox", name: "Lummox County", where: "The north: Mount Kalaga and Ambrosia country", ch: "Free roam", img: "places/mount_kalaga_national_park_2",
    areas: ["Zephyr Islands", "Mount Kalaga National Park", "Grayson", "San Malo Bay", "Featherstone Islands", "Bonanza", "Okchioha Bay", "Moreau", "MacAlister Gold Mine", "Saint Attaway Islands", "Hyde Island", "Partridge Bay", "Frampton Islands", "Lake Tallaloko", "Kalaga Reservoir", "Dawson Dam", "Millport"] },
];

export function LeonidaAtlas() {
  const [open, setOpen] = useState("mariana");
  const r = REGIONS.find((x) => x.id === open) ?? REGIONS[0];
  return (
    <section className="mt-16" aria-labelledby="atlas">
      <h3 id="atlas" className="display text-4xl md:text-5xl">The map: Leonida atlas</h3>
      <p className="mt-1 text-haze max-w-2xl">Five counties, {REGIONS.reduce((n, x) => n + x.areas.length, 0)} named places. Pick a county to see every district and when the story first takes you there.</p>
      <div className="atlas mt-6">
        <div className="atlas-tabs" role="tablist">
          {REGIONS.map((x) => (
            <button key={x.id} role="tab" aria-selected={open === x.id} onClick={() => setOpen(x.id)} className={`atlas-tab${open === x.id ? " is-on" : ""}`}>
              <b>{x.name}</b><span>{x.ch}</span>
            </button>
          ))}
        </div>
        <div className="atlas-panel" role="tabpanel" style={{ backgroundImage: `url(/media/${r.img}.webp)` }}>
          <div className="atlas-in">
            <span className="atlas-k">{r.ch}</span>
            <p className="display atlas-t">{r.name}</p>
            <p className="atlas-w">{r.where}</p>
            <ul className="atlas-areas">{r.areas.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
        </div>
      </div>
      <div className="atlas-links">
        <a href="https://www.powerpyx.com/?p=370486" target="_blank" rel="noopener noreferrer" className="btn btn-hot">Full in-game map, high-res ↗</a>
        <a href="https://map.stateofleonida.net" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Community interactive map ↗</a>
      </div>
      <p className="mt-2 text-xs text-haze">Region and district names from PowerPyx&apos;s full world map page. The interactive map is a fan project by the State of Leonida mapping community.</p>
    </section>
  );
}
