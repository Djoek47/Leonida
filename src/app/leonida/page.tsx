import { guides, people, regions } from "@/lib/content";
import { PortraitClip } from "@/components/PortraitClip";
import Link from "@/components/A";
import { PlaceReel } from "@/components/PlaceReel";
import { LeonidaMap } from "@/components/LeonidaMap";
import { GuideNews } from "@/components/GuideNews";
import { EditionCarousel } from "@/components/EditionCarousel";
import { Arsenal } from "@/components/Arsenal";
import { Gallery } from "@/components/Gallery";
import { GuideNav } from "@/components/GuideNav";

export const metadata = { title: "Leonida guide — Live From Leonida" };

export default function Guide() {
  return (
    <div>
      <section className="relative isolate overflow-hidden h-[60vh] min-h-[420px] flex items-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/art/jason_and_lucia_beach_landscape.webp" alt="Jason and Lucia on a Leonida beach" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="mx-auto w-full max-w-7xl px-4 pb-10">
          <div className="sign max-w-2xl"><h1 className="display text-[clamp(2.8rem,7vw,6rem)]">The Leonida guide</h1>
          <p className="max-w-xl text-white/90 mt-3">Built from every new release — trailers, Rockstar drops and hands-on previews — and updated as they land.</p></div>
        </div>
      </section>

      <GuideNav />

      <section className="mx-auto max-w-7xl px-4 pt-14 pb-4">
        <div id="map" className="scroll-mt-40">
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

      <section id="places" className="py-6 scroll-mt-40">
        <div className="mx-auto max-w-7xl px-4"><h2 className="display text-6xl md:text-7xl">Places</h2></div>
        <div className="mt-8">
          {regions.map((r, i) => (
            <article id={r.slug} key={r.slug} className="place-band scroll-mt-40" style={{ "--tone": r.tone } as React.CSSProperties}>
              <div className={`mx-auto max-w-7xl px-4 py-12 grid gap-6 md:grid-cols-[1.6fr_1fr] items-center ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
                <PlaceReel slug={r.slug} name={r.name} shots={r.shots} />
                <div>
                  <h3 className="place-sign display text-4xl md:text-5xl">{r.name}</h3>
                  <p className="mt-3 place-blurb">{r.blurb}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <GuideNews />

      <section id="people" className="bg-ink border-y border-line py-16 scroll-mt-40">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="display text-6xl md:text-7xl">People</h2>
          <div className="mt-10 grid gap-6 grid-cols-2 lg:grid-cols-4">
            {people.map((p) => (
              <article key={p.slug}>
                <div className="relative aspect-square rounded-md overflow-hidden bg-ink-2">
                  <PortraitClip clip={p.video} name={p.name} />
                </div>
                <h3 className="mt-3 text-xl font-extrabold">{p.name}</h3>
                <p className="text-haze text-[15px]">{p.line}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="garage" className="mx-auto max-w-7xl px-4 py-16 scroll-mt-40">
        <h2 className="display text-6xl md:text-7xl">Cars and weapons</h2>
        <p className="text-haze mt-3 max-w-2xl">Everything seen so far. Tap one for the details. Stats and where to find them get added after launch.</p>
        <div className="mt-8"><Arsenal /></div>

        <h3 className="display text-4xl mt-16">Edition extras</h3>
        <p className="text-haze mt-2 mb-6 max-w-2xl">What the Ultimate Edition and the Vintage Vice City Pack add at launch, from Rockstar&apos;s own screenshots. Swipe sideways. Rockstar hasn&apos;t said yet what the standard game gets.</p>
        <EditionCarousel />
      </section>

      <section id="screenshots" className="mx-auto max-w-7xl px-4 py-16 scroll-mt-40">
        <h2 className="display text-6xl md:text-7xl">Screenshots</h2>
        <p className="text-haze mt-3 max-w-2xl">Every official image Rockstar has released, in one place — characters, places, both edition packs and the artwork.</p>
        <div className="mt-8"><Gallery /></div>
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
