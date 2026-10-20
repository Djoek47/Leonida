"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { platformName } from "@/lib/api";
import Link from "@/components/A";

const formats = [
  { t: "Grand theft sprint", d: "Both players get the same target car. First to steal it and park it at the drop wins.", img: "ultimate/grotti_cheetah_01" },
  { t: "Heist race", d: "Same heist, same start. Fastest clean finish takes it; chat votes on style if it's close.", img: "people/jason_and_lucia_9" },
  { t: "Five-star escape", d: "Get to five stars, then lose them. Quickest escape wins.", img: "places/vice_city_6" },
  { t: "Leonida errand run", d: "A list of tasks across the map, revealed live by the host.", img: "places/leonida_keys_4" },
];
const flow = [
  ["Apply", "Pick a format and tell us your console and gamertag."],
  ["Get picked", "We match two players and send a time and a private stream link."],
  ["Stream your console", "PS5: Remote Play or Share Screen to our host. Xbox: the Xbox app or a capture card. A quick tech check runs 15 minutes before."],
  ["Play it live", "Our host runs both screens side by side on Twitch and calls the action."],
  ["Chat decides", "When it's close, Twitch chat votes. The winner gets the event prize."],
];

export default function Versus() {
  const { user } = useUser();
  const [sent, setSent] = useState(false);
  async function apply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const c = sb();
    if (c && user) await c.from("versus_applications").insert({ player_id: user.id, platform: f.get("platform"), gamertag: f.get("gamertag"), can_stream: f.get("stream") === "on", note: `${f.get("format")}: ${f.get("note")}` });
    setSent(true);
  }
  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <div className="grid grid-cols-2 h-[60vh] min-h-[420px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/art/jason_and_lucia_lock_and_load_portrait.webp" alt="" className="h-full w-full object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/art/jason_and_lucia_robbery_portrait.webp" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-10">
          <div className="sign max-w-3xl"><div className="lower-third text-sm mb-4"><span className="tag"><span className="rec" />Versus</span><span className="txt">Two consoles, one task, live on Twitch</span></div>
          <h1 className="display text-[clamp(2.8rem,7vw,6rem)]">Same job. Different couch. One winner.</h1></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {formats.map((f) => (
          <article key={f.t}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/media/${f.img}.webp`} alt="" className="aspect-[4/3] w-full object-cover rounded-md" />
            <h2 className="mt-3 text-xl font-extrabold">{f.t}</h2>
            <p className="text-haze text-[15px] mt-1">{f.d}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="display text-6xl">How a match runs</h2>
          <ol className="mt-6 grid gap-5">
            {flow.map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[3.5rem_1fr] gap-x-3 items-start"><span className="shield !min-w-10 !h-10 !text-lg">{i + 1}</span><div><p className="font-extrabold">{t}</p><p className="text-haze text-[15px]">{d}</p></div></li>
            ))}
          </ol>
        </div>
        <div className="rounded-lg bg-ink border border-line p-6 h-fit">
          <h2 className="display text-5xl">Apply to play</h2>
          {!user ? <p className="mt-4 text-haze"><Link href="/login?next=/versus" className="text-gulf underline">Sign in</Link> to apply.</p> : sent ? (
            <p className="mt-4 font-semibold text-gulf">You&apos;re on the list. We&apos;ll message you when you&apos;re matched.</p>
          ) : (
            <form onSubmit={apply} className="mt-5 grid gap-4">
              <select name="format" className="field">{formats.map((f) => <option key={f.t}>{f.t}</option>)}</select>
              <div className="grid sm:grid-cols-2 gap-4">
                <select name="platform" className="field">{Object.entries(platformName).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                <input name="gamertag" required placeholder="Gamertag" className="field" />
              </div>
              <textarea name="note" rows={2} className="field" placeholder="When are you usually free? Anything we should know?" />
              <label className="flex gap-3 text-sm text-haze"><input type="checkbox" name="stream" defaultChecked className="accent-[var(--flamingo)]" />I can stream my console (Remote Play, Xbox app or capture card)</label>
              <button className="btn btn-hot w-fit">Apply</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
