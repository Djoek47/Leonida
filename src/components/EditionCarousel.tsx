"use client";
import { useRef, useState } from "react";

type Card = { img: string; name: string; tag: string; pack: string; text: string; points: string[] };

/** One card per Ultimate Edition / Vintage pack extra: one picture, the facts beside it. */
const CARDS: Card[] = [
  { img: "places/gold_donk", name: "Rideout Customs", tag: "Shop", pack: "Ultimate Edition",
    text: "The street-build shop. Take a stock car and turn it into a donk.",
    points: ["Oversized rims and fresh paint", "Detailed interior work", "Suspension tuning"] },
  { img: "places/offroad_muscle", name: "One-Eyed Willie's", tag: "Shop", pack: "Ultimate Edition",
    text: "A mod shop at Lake Leonida for people who leave the road.",
    points: ["Off-road builds", "Hand-painted one-off liveries"] },
  { img: "ultimate/wyman_car_collection_01", name: "Wyman's collection", tag: "Cars", pack: "Ultimate Edition",
    text: "Project cars waiting in the world. Find them, then bring them back.",
    points: ["Hunt down the cars", "Restore each one"] },
  { img: "ultimate/saras_salon_01", name: "Sara's Salon", tag: "Look", pack: "Ultimate Edition",
    text: "A unisex salon with signature styles for both leads.",
    points: ["Hairstyles for Jason and Lucia", "Facial hair for Jason", "Makeup and nails for Lucia"] },
  { img: "ultimate/weapon_variants_01", name: "Ammu-Nation", tag: "Guns", pack: "Ultimate Edition",
    text: "Make a weapon yours before you ever fire it.",
    points: ["Custom grips", "Engravings", "Scopes"] },
  { img: "ultimate/vice_city_style_01", name: "Vice City Style", tag: "Clothes", pack: "Ultimate Edition",
    text: "Outfits and accessories built around Vice City.",
    points: ["Outfits and accessories", "Capsule collections"] },
  { img: "vintage/pack_exclusive_looks_01", name: "Vintage looks", tag: "Outfits", pack: "Vintage Vice City Pack",
    text: "Period outfits that come with the Vintage Vice City Pack.", points: ["Pack exclusive"] },
  { img: "vintage/weapon_pattern_01", name: "Vintage weapon pattern", tag: "Guns", pack: "Vintage Vice City Pack",
    text: "A retro finish for your weapons.", points: ["Pack exclusive"] },
];

export function EditionCarousel() {
  const ref = useRef<HTMLUListElement>(null);
  const [i, setI] = useState(0);
  const go = (d: number) => {
    const el = ref.current; if (!el) return;
    el.scrollBy({ left: d * (el.clientWidth * 0.8), behavior: "smooth" });
  };
  const onScroll = () => {
    const el = ref.current; if (!el) return;
    const w = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 1;
    setI(Math.min(CARDS.length - 1, Math.round(el.scrollLeft / (w + 16))));
  };
  return (
    <div className="ec">
      <div className="ec-bar">
        <p className="ec-count" aria-live="polite">{String(i + 1).padStart(2, "0")} <span>/ {String(CARDS.length).padStart(2, "0")}</span></p>
        <div className="flex gap-2">
          <button type="button" onClick={() => go(-1)} aria-label="Previous" className="ec-btn">←</button>
          <button type="button" onClick={() => go(1)} aria-label="Next" className="ec-btn">→</button>
        </div>
      </div>
      <ul ref={ref} onScroll={onScroll} className="ec-track" tabIndex={0} aria-label="Edition extras, swipe sideways">
        {CARDS.map((c) => (
          <li key={c.img} className="ec-card">
            <div className="ec-pic">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/${c.img}.webp`} alt={c.name} loading="lazy" />
              <span className="ec-tag">{c.tag}</span>
            </div>
            <div className="ec-body">
              <p className="ec-pack">{c.pack}</p>
              <h4 className="display text-3xl leading-none">{c.name}</h4>
              <p className="mt-2 text-haze text-[15px]">{c.text}</p>
              <ul className="ec-pts">{c.points.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
