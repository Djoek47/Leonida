import Link from "@/components/A";
import { HeroReel } from "@/components/HeroReel";
import { regions } from "@/lib/content";
import { PlatformIcon } from "@/components/Icons";

const steps = [
  { t: "Send your clip", d: "Upload it with your gamertag." },
  { t: "We cut the video", d: "The best clips go in one compilation." },
  { t: "Leonida votes", d: "One vote per account." },
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
            <Link href="/submit" className="btn bg-mango text-[#15191c] hover:brightness-110">Send a clip</Link>
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

      {/* Versus teaser */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <Link href="/versus" className="group relative grid grid-cols-2 rounded-xl overflow-hidden aspect-[16/9] md:aspect-[16/6]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/people/jason_duval_3.webp" alt="Jason Duval" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/people/lucia_caminos_2.webp" alt="Lucia Caminos" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute left-3 top-3 lower-third text-xs"><span className="tag !bg-[#0070D1] gap-1.5"><PlatformIcon name="ps5" className="size-3.5" />PS5</span><span className="txt">Player one</span></span>
          <span className="absolute right-3 top-3 lower-third text-xs"><span className="tag !bg-[#107C10] gap-1.5"><PlatformIcon name="xbox" className="size-3.5" />Xbox</span><span className="txt">Player two</span></span>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center size-20 md:size-32 rotate-45 rounded-xl bg-mango shadow-[inset_0_0_0_4px_var(--mango),inset_0_0_0_8px_#15191c]"><span className="-rotate-45 display text-3xl md:text-6xl text-[#15191c]">VS</span></span>
          <span className="absolute inset-x-0 bottom-0 p-4 md:p-6 bg-gradient-to-t from-black/75 to-transparent text-white">
            <span className="block display text-3xl md:text-5xl">Versus</span>
            <span className="block text-white/85">Same task, two consoles, live on Twitch.</span>
          </span>
        </Link>
      </section>

      {/* Club teaser */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <Link href="/club" className="sign sign-yellow flex flex-col md:flex-row md:items-center justify-between gap-4 hover:brightness-105">
          <span><span className="block display text-3xl md:text-5xl">The Triple Comma Club ’’’</span><span className="block font-semibold">Made $1 billion in GTA Online? Prove it and join the VIP Discord.</span></span>
          <span className="btn bg-[#15191c] text-white shrink-0">See how to get in</span>
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
