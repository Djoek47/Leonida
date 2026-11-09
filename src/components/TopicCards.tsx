"use client";
import { useEffect, useRef, useState } from "react";
import { HOW_IT_PLAYS } from "@/lib/news";
import { TopicEmblem, type EmblemId } from "@/components/TopicEmblem";

/** Each topic's mark, and one picture per tip, in the same order as the
 *  tips in HOW_IT_PLAYS. The tile loops the first four. */
const LOOK: Record<string, { emblem: EmblemId; kicker: string; shots: string[] }> = {
  "Guns": { emblem: "guns", kicker: "Aim, recoil, Focus", shots: [
    "people/jason_duval_5", "people/jason_and_lucia_12", "vintage/weapon_pattern_01",
    "people/jason_and_lucia_4", "ultimate/hawk_and_little_morgan_revolvers_01"] },
  "Police and Heat": { emblem: "heat", kicker: "What the cops know", shots: [
    "places/vice_city_6", "people/jason_duval_7", "people/lucia_caminos_7",
    "people/jason_and_lucia_9", "people/jason_and_lucia_13"] },
  "Cars": { emblem: "cars", kicker: "Fuel, locks, handling", shots: [
    "art/jason_and_lucia_robbery_landscape", "ultimate/grotti_cheetah_04", "people/boobie_ike_2",
    "ultimate/safehouse_vehicles_01", "people/jason_and_lucia_11"] },
  "Money and robberies": { emblem: "money", kicker: "Bank, cash, loot", shots: [
    "people/jason_and_lucia_8", "people/jason_and_lucia_2", "people/jason_and_lucia_5"] },
  "Criminal Profile": { emblem: "profile", kicker: "Professional to Psycho", shots: [
    "people/jason_duval_10", "places/vice_city_12", "people/jason_and_lucia_7"] },
  "Customising cars": { emblem: "custom", kicker: "Rideout and One-Eyed Willie's", shots: [
    "ultimate/rideout_customs_01", "ultimate/rideout_customs_02", "ultimate/one_eyed_willie_01",
    "ultimate/one_eyed_willie_03", "ultimate/wyman_car_collection_04", "ultimate/rideout_customs_03",
    "ultimate/vapid_ganado_retro_build_01"] },
  "Restoring and fencing": { emblem: "fencing", kicker: "Wyman's collection", shots: [
    "ultimate/wyman_car_collection_01", "people/brian_heder_3", "people/cal_hampton_4", "ultimate/ptt_store_01"] },
  "Looking the part": { emblem: "looks", kicker: "Fits, ink, hair", shots: [
    "ultimate/electric_fang_04", "ultimate/saras_salon_03", "ultimate/weapon_variants_01", "ultimate/vice_city_style_01"] },
  "Life in Leonida": { emblem: "leonida", kicker: "The state itself", shots: [
    "places/leonida_keys_1", "people/raul_bautista_1", "people/lucia_caminos_9",
    "people/jason_duval_3", "people/real_dimez_4"] },
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
                  {look.shots.slice(0, 4).map((src, i) => (
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
        shots={(LOOK[topic.topic] ?? FALLBACK).shots}
        onClose={() => setOpen(null)} />}
    </>
  );
}

/** One tip at a time, on its own picture. Arrows, keys or a swipe move
 *  through them; the picture stays clear and the tip sits on a dark fade. */
function TopicPopup({ topic, points, emblem, shots, onClose }: {
  topic: string; points: string[]; emblem: EmblemId; shots: string[]; onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const n = points.length;
  const go = (d: number) => setAt((i) => (i + d + n) % n);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setAt((i) => (i + 1) % n);
      if (e.key === "ArrowLeft") setAt((i) => (i - 1 + n) % n);
    };
    addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    box.current?.focus();
    shots.forEach((s) => { const im = new Image(); im.src = `/media/${s}.webp`; });   // no blank flash between tips
    return () => { removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose, n, shots]);

  return (
    <div className="pop-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${topic}: tip ${at + 1} of ${n}`} className="slide"
        onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); touch.current = null; }}>
        {points.map((_, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={`/media/${shots[i % shots.length]}.webp`} alt="" className={`slide-shot ${i === at ? "is-on" : ""}`} />
        ))}
        <div className="slide-top">
          <TopicEmblem id={emblem} className="slide-mark" />
          <span className="slide-topic">{topic}</span>
          <span className="slide-count">{at + 1} / {n}</span>
          <button onClick={onClose} className="slide-x" aria-label="Close">✕</button>
        </div>

        <button className="slide-arrow is-left" onClick={() => go(-1)} aria-label="Previous tip">
          <svg viewBox="0 0 48 48" aria-hidden><circle cx="24" cy="24" r="21" /><path d="M28 14 18 24l10 10" /></svg>
        </button>
        <button className="slide-arrow is-right" onClick={() => go(1)} aria-label="Next tip">
          <svg viewBox="0 0 48 48" aria-hidden><circle cx="24" cy="24" r="21" /><path d="M20 14l10 10-10 10" /></svg>
        </button>

        <div className="slide-tip" aria-live="polite">
          <p key={at} className="slide-text">{points[at]}</p>
          <div className="slide-dots">
            {points.map((_, i) => <button key={i} onClick={() => setAt(i)} aria-label={`Tip ${i + 1}`} className={i === at ? "on" : ""} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
