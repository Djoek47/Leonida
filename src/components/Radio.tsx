"use client";
import { useState } from "react";

// Official GTA VI music, from rockstargames.com/VI/music. We link to Rockstar's own
// station previews and the label's official streaming links; we never host the audio.
const MUSIC_PAGE = "https://www.rockstargames.com/VI/music";

const stations = [
  { name: "Flash FM", genre: "Pop", hosts: "Robyn and Alex" },
  { name: "Cocoteo", genre: "Modern Latin", hosts: "El Martillo and La Gata" },
  { name: "Dirty South Classics", genre: "Regional rap and hip-hop", hosts: "Trick and Trina" },
  { name: "Afro Bank FM", genre: "Amapiano and African classics", hosts: "Burna and Palmsy" },
  { name: "Back Country", genre: "Country", hosts: "MW and Delta Dawne" },
  { name: "The Chamber", genre: "Metal", hosts: "DJ Kerry and DJ Tom" },
];

const singles = [
  { title: "That's It", artist: "Yung Lean feat. Future & Metro Boomin", href: "https://gtavi-thealbum.lnk.to/thatsit" },
  { title: "RHYNO", artist: "Travis Scott", href: "https://gtavi-thealbum.lnk.to/rhyno" },
  { title: "Sexy Magic", artist: "CA7RIEL & Paco Amoroso, PinkPantheress, Fred again.. & Etienne de Crécy", href: "https://gtavi-thealbum.lnk.to/sexymagic" },
  { title: "Flower in a Hurricane", artist: "Justice feat. Tame Impala, SZA, King Gizzard & The Lizard Wizard", href: "https://gtavi-thealbum.lnk.to/FIAH" },
  { title: "Last Thing You Need", artist: "Morgan Wallen", href: "https://gtavi-thealbum.lnk.to/lastthingyouneed" },
  { title: "Suzuki", artist: "Fuerza Regida", href: "https://gtavi-thealbum.lnk.to/suzuki" },
  { title: "Macacoa 2000", artist: "Rauw Alejandro", href: "https://gtavi-thealbum.lnk.to/macacoa2000" },
  { title: "Don't Chart", artist: "Cardi B", href: "https://gtavi-thealbum.lnk.to/dontchart" },
  { title: "Bright Lights, Big City", artist: "Keith Richards", href: "https://gtavi-thealbum.lnk.to/brightlightsbigcity" },
];

export function Radio() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"stations" | "album">("stations");
  return (
    <div className="fixed z-50 right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] flex flex-col items-end gap-3">
      {open && (
        <div role="dialog" aria-label="Leonida radio" className="w-[min(24rem,calc(100vw-2rem))] max-h-[70vh] flex flex-col rounded-xl bg-ink border border-line shadow-2xl overflow-hidden">
          <div className="sign !rounded-none !shadow-none px-5 py-4 shrink-0">
            <p className="font-black text-xl leading-none">Leonida Radio</p>
            <p className="text-sm text-white/85 mt-1">Official GTA VI stations and The Album</p>
          </div>
          <div role="tablist" className="flex border-b border-line shrink-0">
            {(["stations", "album"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-sm font-bold border-b-2 -mb-px ${tab === t ? "border-flamingo" : "border-transparent text-haze"}`}>
                {t === "stations" ? "Stations" : "The Album"}
              </button>
            ))}
          </div>
          <ul className="divide-y divide-line overflow-y-auto">
            {tab === "stations" ? stations.map((s) => (
              <li key={s.name}>
                <a href={MUSIC_PAGE} target="_blank" rel="noreferrer" className="px-5 py-3 flex items-center gap-3 hover:bg-ink-2">
                  <span className="shield !min-w-10 !h-10 !text-xs shrink-0">FM</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{s.name}</span>
                    <span className="block text-sm text-haze truncate">{s.genre}, with {s.hosts}</span>
                  </span>
                  <span className="text-sm font-bold text-flamingo shrink-0">Preview</span>
                </a>
              </li>
            )) : singles.map((s) => (
              <li key={s.title}>
                <a href={s.href} target="_blank" rel="noreferrer" className="px-5 py-3 flex items-center gap-3 hover:bg-ink-2">
                  <svg viewBox="0 0 24 24" className="size-8 shrink-0 text-flamingo" fill="currentColor" aria-hidden><circle cx="12" cy="12" r="11" /><path d="M10 8l6 4-6 4z" fill="#fff" /></svg>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{s.title}</span>
                    <span className="block text-sm text-haze truncate">{s.artist}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="px-5 py-3 text-xs text-haze border-t border-line shrink-0">
            {tab === "stations" ? "Station previews play on Rockstar's music page." : "Opens the song on Spotify, Apple Music, YouTube and more."}
          </p>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="btn bg-mango text-[#15191c] shadow-lg !rounded-full !p-3 sm:!px-4">
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden><path d="M3 9h18v11H3zM7 9l9-5 .9 1.8L10.6 9zM8 14.5a2 2 0 1 0 0 .01zM14 12h4v1.5h-4zm0 3h4v1.5h-4z" /></svg>
        <span className={open ? "" : "sr-only sm:not-sr-only"}>{open ? "Close radio" : "Radio"}</span>
      </button>
    </div>
  );
}
