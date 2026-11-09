"use client";
import { useEffect, useRef, useState } from "react";
import { HOW_IT_PLAYS } from "@/lib/news";
import { TopicEmblem, type EmblemId } from "@/components/TopicEmblem";

/** Which pictures sit behind each topic, and which mark it carries. Four each:
 *  enough for the tile to play like a short loop, few enough to preload. */
const LOOK: Record<string, { emblem: EmblemId; kicker: string; shots: string[] }> = {
  "Guns": { emblem: "guns", kicker: "Aim, recoil, Focus", shots: [
    "ultimate/hawk_and_little_morgan_revolvers_01", "ultimate/hawk_and_little_morgan_revolvers_02",
    "ultimate/weapon_variants_01", "vintage/weapon_pattern_01"] },
  "Police and Heat": { emblem: "heat", kicker: "What the cops know", shots: [
    "people/jason_and_lucia_3", "people/jason_and_lucia_8", "places/vice_city_4", "places/vice_city_9"] },
  "Cars": { emblem: "cars", kicker: "Fuel, locks, handling", shots: [
    "ultimate/grotti_cheetah_01", "ultimate/grotti_cheetah_03", "ultimate/stock_305_01", "ultimate/vapid_buggy_02"] },
  "Money and robberies": { emblem: "money", kicker: "Bank, cash, loot", shots: [
    "ultimate/ptt_store_01", "places/ambrosia_2", "people/real_dimez_1", "places/vice_city_6"] },
  "Criminal Profile": { emblem: "profile", kicker: "Professional to Psycho", shots: [
    "people/jason_duval_2", "people/lucia_caminos_3", "people/raul_bautista_1", "people/jason_and_lucia_11"] },
  "Customising cars": { emblem: "custom", kicker: "Rideout and One-Eyed Willie's", shots: [
    "ultimate/rideout_customs_01", "ultimate/rideout_customs_02", "ultimate/one_eyed_willie_01", "ultimate/one_eyed_willie_03"] },
  "Restoring and fencing": { emblem: "fencing", kicker: "Wyman's collection", shots: [
    "ultimate/wyman_car_collection_01", "ultimate/wyman_car_collection_03",
    "ultimate/wyman_car_collection_05", "ultimate/safehouse_vehicles_02"] },
  "Looking the part": { emblem: "looks", kicker: "Fits, ink, hair", shots: [
    "ultimate/saras_salon_01", "ultimate/vice_city_style_02", "vintage/pack_exclusive_looks_01",
    "vintage/pack_exclusive_looks_04"] },
  "Life in Leonida": { emblem: "leonida", kicker: "The state itself", shots: [
    "places/leonida_keys_2", "places/grassrivers_3", "places/mount_kalaga_national_park_4", "places/port_gellhorn_1"] },
};

const FALLBACK = { emblem: "leonida" as EmblemId, kicker: "", shots: ["places/vice_city_1"] };

export function TopicCards() {
  const [open, setOpen] = useState<string | null>(null);
  const topic = HOW_IT_PLAYS.find((t) => t.topic === open) ?? null;

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
        {HOW_IT_PLAYS.map((t) => {
          const look = LOOK[t.topic] ?? FALLBACK;
          return (
            <li key={t.topic}>
              <button onClick={() => setOpen(t.topic)} className="tile group" aria-haspopup="dialog">
                <span className="tile-reel" aria-hidden>
                  {look.shots.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={`/media/${src}.webp`} alt="" loading="lazy" decoding="async"
                      style={{ animationDelay: `${i * 1.4}s` }} />
                  ))}
                </span>
                <TopicEmblem id={look.emblem} className="tile-mark" />
                <span className="tile-plate">
                  <span className="tile-kick">{look.kicker}</span>
                  <span className="tile-name display">{t.topic}</span>
                  <span className="tile-more">{t.points.length} things to know →</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {topic && <TopicPopup topic={topic.topic} points={topic.points}
        emblem={(LOOK[topic.topic] ?? FALLBACK).emblem}
        shot={(LOOK[topic.topic] ?? FALLBACK).shots[0]}
        onClose={() => setOpen(null)} />}
    </>
  );
}

function TopicPopup({ topic, points, emblem, shot, onClose }: {
  topic: string; points: string[]; emblem: EmblemId; shot: string; onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";       // the page shouldn't scroll behind it
    box.current?.focus();
    return () => { removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="pop-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-label={topic} className="pop">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/media/${shot}.webp`} alt="" className="pop-shot" />
        <TopicEmblem id={emblem} className="pop-mark" />

        <button onClick={onClose} className="pop-x" aria-label="Close">✕</button>

        <div className="pop-body">
          <h3 className="display text-[clamp(1.8rem,5vw,2.6rem)] leading-none">{topic}</h3>
          <ul className="pop-list">
            {points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
