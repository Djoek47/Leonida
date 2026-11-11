import Link from "@/components/A";
import { HeroReel } from "@/components/HeroReel";
import { regions } from "@/lib/content";

const steps = [
  { t: "Send your clip", d: "Upload it with your gamertag." },
  { t: "We cut the video", d: "The best clips go in one compilation." },
  { t: "Leonida votes", d: "Members pick the week's best." },
  { t: "Top three get paid", d: "PayPal, Venmo and more." },
];

export default function Home() {
  return (
    <>
      {/* Hero: the trailer plays in full; the headline sign hangs just under it */}
      <HeroReel />
      <section className="mx-auto max-w-7xl px-4 -mt-10 md:-mt-14 relative z-10">
        <div className="sign sign-drop flex flex-col md:flex-row md:items-center gap-5 md:gap-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 text-sm font-bold">
              <span className="shield">VI</span>
              <span className="lower-third"><span className="tag"><span className="rec" />Live</span><span className="txt">Vice City, Leonida</span></span>
            </div>
            <h1 className="display mt-4 text-[clamp(2.1rem,4.2vw,3.8rem)]">Your best clip in Leonida pays <span className="sunset-text">$50</span> this week</h1>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link href="/submit" className="btn bg-mango text-[#1c1710] hover:brightness-110">Send a clip</Link>
            <Link href="/clips" className="btn btn-ghost">Watch and vote</Link>
          </div>
        </div>
      </section>

      {/* One strip: how it works + the split */}
      <section className="mx-auto max-w-7xl px-4 py-16 grid gap-10 lg:grid-cols-[1.4fr_1fr] items-center">
        <ol className="grid gap-6 sm:grid-cols-2">
          {steps.map((s, i) => (
            <li key={s.t} className="flex gap-4 items-start">
              <span className="shield shrink-0">{i + 1}</span>
              <div><p className="font-extrabold text-lg">{s.t}</p><p className="text-haze">{s.d}</p></div>
            </li>
          ))}
        </ol>
        <div className="flex items-end gap-3 h-56" aria-label="Prize split: first $50, second $30, third $20">
          {[["2nd", 30, "60%"], ["1st", 50, "100%"], ["3rd", 20, "42%"]].map(([p, v, h]) => (
            <div key={p as string} className="flex-1 flex flex-col justify-end h-full">
              <span className="display text-4xl md:text-5xl mb-2">${v}</span>
              <div className={`${p === "1st" ? "bg-gulf text-white" : "bg-ink-2"} rounded-t-lg p-3 font-bold`} style={{ height: h as string }}>{p}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How to earn */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <Link href="/earn" className="group relative block rounded-xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/art/official_cover_art_landscape.webp" alt="" className="h-full w-full object-cover aspect-[16/9] md:aspect-[16/6] transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 p-5 md:p-8 text-white">
            <span className="block display text-4xl md:text-6xl">Three ways to get paid</span>
            <span className="block mt-1 text-white/85 max-w-xl">
              Win the week. Earn on every download. Take the month or the year.
            </span>
            <span className="btn btn-hot mt-4">How to earn</span>
          </span>
        </Link>
      </section>

      {/* Guide: postcards only */}
      <section className="pb-8">
        <div className="mx-auto max-w-7xl px-4 flex items-end justify-between gap-6">
          <h2 className="display text-4xl md:text-5xl">Know Leonida</h2>
          <Link href="/leonida" className="font-bold text-gulf underline-offset-4 hover:underline">Open the guide</Link>
        </div>
        <div className="mt-6 flex gap-4 overflow-x-auto px-4 md:px-[max(1rem,calc((100vw-80rem)/2+1rem))] pb-4 snap-x">
          {regions.map((r) => (
            <Link key={r.slug} href={`/leonida#${r.slug}`} className="relative shrink-0 w-56 aspect-[3/4] rounded-lg overflow-hidden snap-start group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/art/${r.slug}_portrait.webp`} alt={`${r.name} postcard`} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
