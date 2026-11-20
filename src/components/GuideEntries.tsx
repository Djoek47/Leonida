"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { TopicPopup } from "@/components/TopicCards";
import { TopicEmblem, type EmblemId } from "@/components/TopicEmblem";

type Entry = { id: string; topic: string; title: string; body: string; sources: string[]; published_at: string | null };

/** Team-written guide entries (console Research tab), shown like How it plays: a tile per entry,
 *  one tip per slide when opened. Cheat entries are left out: they have their own section. */
const LOOKS: { test: RegExp; emblem: EmblemId; shots: string[] }[] = [
  { test: /police|heat|cops/i, emblem: "heat", shots: ["places/sheriff_chase", "places/police_supercar", "people/masked_duo_rifles", "places/vice_city_night"] },
  { test: /jason|lucia|relationship|close/i, emblem: "profile", shots: ["people/jason_lucia_balcony", "people/lucia_jason_home", "people/jason_lucia_sunset_1", "people/jason_lucia_hilltop"] },
  { test: /focus/i, emblem: "hud", shots: ["people/lucia_aim_closeup", "people/jason_sniper", "people/lucia_pistol_rain", "people/jason_gun_1"] },
  { test: /first|start|hours/i, emblem: "leonida", shots: ["places/leonida_keys_1", "people/jason_seaplane", "places/rusty_anchor_bar", "places/seaplane_sunset"] },
  { test: /car|vehicle|drive/i, emblem: "cars", shots: ["places/car_wash_cab", "places/orange_supercar", "places/car_lineup", "places/gold_donk"] },
  { test: /money|cash|fence/i, emblem: "money", shots: ["people/masked_duo_rifles", "places/vice_city_3", "places/palm_tower", "places/marina_skyline"] },
];
const FALL = { emblem: "leonida" as EmblemId, shots: ["places/vice_city_1", "places/vice_city_6", "places/beach_aerial", "places/vice_beach_day"] };
const lookFor = (e: Entry) => LOOKS.find((l) => l.test.test(`${e.topic} ${e.title}`)) ?? FALL;
const tips = (e: Entry) => e.body.split("\n").map((l) => l.trim().replace(/^[-•]\s*/, "")).filter((l) => l && !/^research notes/i.test(l));

export function GuideEntries() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [open, setOpen] = useState<Entry | null>(null);
  useEffect(() => {
    const c = sb(); if (!c) return;
    c.from("guide_entries").select("id, topic, title, body, sources, published_at").eq("published", true).order("published_at", { ascending: false }).limit(60)
      .then(({ data }) => setRows(((data ?? []) as Entry[]).filter((e) => !/cheat/i.test(`${e.topic} ${e.title}`))));
  }, []);
  if (!rows.length) return null;
  return (
    <section className="mt-14" aria-labelledby="guide-latest">
      <h3 id="guide-latest" className="display text-4xl md:text-5xl">From the team</h3>
      <p className="mt-1 text-haze">Checked and written up by us. Tap a card for one tip at a time.</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
        {rows.map((e) => {
          const look = lookFor(e);
          return (
            <li key={e.id}>
              <button onClick={() => setOpen(e)} className="tile group" aria-haspopup="dialog">
                <span className="tile-reel" aria-hidden>
                  {look.shots.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={`/media/${src}.webp`} alt="" loading="lazy" decoding="async" style={{ animationDelay: `${i * 1.4}s` }} />
                  ))}
                </span>
                <TopicEmblem id={look.emblem} className="tile-mark" />
                <span className="tile-plate">
                  <span className="tile-kick">{e.topic}</span>
                  <span className="tile-name display">{e.title}</span>
                  <span className="tile-more">{tips(e).length} things to know →</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {open && <TopicPopup topic={open.title} points={tips(open)} emblem={lookFor(open).emblem} shots={lookFor(open).shots} onClose={() => setOpen(null)} />}
    </section>
  );
}
