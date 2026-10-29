import { garage, guides, people, regions } from "@/lib/content";
import Link from "@/components/A";
import { LeonidaMap } from "@/components/LeonidaMap";

export const metadata = { title: "Leonida guide — Live From Leonida" };

export default function Guide() {
  return (
    <div>
      <section className="relative isolate overflow-hidden h-[60vh] min-h-[420px] flex items-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/art/jason_and_lucia_beach_landscape.webp" alt="Jason and Lucia on a Leonida beach" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="mx-auto w-full max-w-7xl px-4 pb-10">
          <div className="sign max-w-2xl"><h1 className="display text-[clamp(2.8rem,7vw,6rem)]">The Leonida guide</h1>
          <p className="max-w-xl text-white/90 mt-3">Everything Rockstar has shown so far, in one place. Gameplay guides arrive at launch, tested by our crew, never copied from rumours.</p></div>
        </div>
      </section>

      <nav className="sticky top-[5.75rem] z-30 bg-ink border-b border-line">
        <div className="mx-auto max-w-7xl px-4 flex gap-6 overflow-x-auto py-3 text-sm font-bold text-haze">
          {[["#map", "Map"], ["#places", "Places"], ["#people", "People"], ["#garage", "Cars, weapons and extras"], ["#guides", "Guides"]].map(([h, l]) => <a key={h} href={h} className="shrink-0 hover:text-foam">{l}</a>)}
        </div>
      </nav>

      <section id="places" className="mx-auto max-w-7xl px-4 py-16 scroll-mt-40">
        <h2 className="display text-6xl md:text-7xl">Places</h2>
        <div className="mt-10 grid gap-16">
          {regions.map((r, i) => (
            <article id={r.slug} key={r.slug} className={`grid gap-6 md:grid-cols-[1.6fr_1fr] items-center scroll-mt-40 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
              <div className="grid grid-cols-3 gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/places/${r.slug}_1.webp`} alt={`${r.name}, official screenshot`} className="col-span-3 aspect-[16/8] w-full object-cover rounded-md" loading="lazy" />
                {[2, 3, 4].map((n) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={n} src={`/media/places/${r.slug}_${n}.webp`} alt="" className="aspect-video w-full object-cover rounded" loading="lazy" />
                ))}
              </div>
              <div>
                <h3 className="sign inline-block !py-3 !px-5 display text-4xl md:text-5xl">{r.name}</h3>
                <p className="mt-3 text-haze">{r.blurb}</p>
              </div>
            </article>
          ))}
        </div>
        <div id="map" className="mt-16 scroll-mt-40">
          <h2 className="display text-5xl md:text-6xl mb-6">Map of Leonida</h2>
          <LeonidaMap />
          <p className="mt-3 text-xs text-haze">Base map adapted from the GTADB community map. <Link href="/credits" className="underline">Credits</Link></p>
        </div>
        <div className="mt-8 rounded-lg border border-line bg-ink p-6 md:p-8 grid gap-6 md:grid-cols-[1fr_1.4fr] items-center">
          <div>
            <p className="display text-4xl">More maps</p>
            <p className="text-haze mt-2">Rockstar hasn&apos;t released an official map yet. These community projects go deeper.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {[["State of Leonida map", "Mapping Community", "https://map.stateofleonida.net/"], ["GTA VI landmarks map", "GTADB", "https://map.gtadb.org/"], ["GTA Wiki", "Weird Gloop", "https://gta.wiki/"]].map(([t, by, href]) => (
              <li key={href}><a href={href} target="_blank" rel="noreferrer" className="block h-full rounded-lg border-2 border-gulf p-4 hover:bg-gulf hover:text-white transition-colors">
                <span className="block font-extrabold">{t}</span><span className="block text-sm opacity-80">by {by}</span></a></li>
            ))}
          </ul>
        </div>
      </section>

      <section id="people" className="bg-ink border-y border-line py-16 scroll-mt-40">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="display text-6xl md:text-7xl">People</h2>
          <div className="mt-10 grid gap-6 grid-cols-2 lg:grid-cols-4">
            {people.map((p) => (
              <article key={p.slug}>
                <div className="relative aspect-square rounded-md overflow-hidden bg-ink-2">
                  <video src={`/media/video/${p.video}.mp4`} poster={`/media/video/${p.video}.jpg`} autoPlay muted loop playsInline aria-hidden className="h-full w-full object-cover" />
                </div>
                <h3 className="mt-3 text-xl font-extrabold">{p.name}</h3>
                <p className="text-haze text-[15px]">{p.line}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="garage" className="mx-auto max-w-7xl px-4 py-16 scroll-mt-40">
        <h2 className="display text-6xl md:text-7xl">Cars, weapons and extras</h2>
        <p className="text-haze mt-3 max-w-2xl">From the Ultimate Edition and the Vintage Vice City Pack. Prices, stats and spawn spots get added after launch.</p>
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {garage.map((g) => (
            <article key={g.img}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/${g.img}.webp`} alt={g.name} loading="lazy" className="aspect-video w-full object-cover rounded-md" />
              <div className="mt-3 flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-extrabold">{g.name}</h3>
                <span className="text-sm text-haze shrink-0">{g.kind}</span>
              </div>
              <p className="text-sm text-gulf font-semibold">{g.from}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="guides" className="mx-auto max-w-7xl px-4 py-8 scroll-mt-40">
        <h2 className="display text-6xl md:text-7xl">Guides</h2>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {guides.map((g) => (
            <li key={g.title} className="py-5 grid gap-1 md:grid-cols-[1fr_2fr_auto] md:items-center md:gap-6">
              <p className="text-xl font-extrabold">{g.title}</p>
              <p className="text-haze">{g.note}</p>
              <span className={`text-sm font-bold ${g.status === "Live" ? "text-gulf" : "text-flamingo"}`}>{g.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
