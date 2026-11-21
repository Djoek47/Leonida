import { guides, regions } from "@/lib/content";
import Link from "@/components/A";
import { PlaceReel } from "@/components/PlaceReel";
import { LeonidaMap } from "@/components/LeonidaMap";
import { LatestNews } from "@/components/LatestNews";
import { GuideNews } from "@/components/GuideNews";
import { EditionCarousel } from "@/components/EditionCarousel";
import { Gallery } from "@/components/Gallery";
import { GuideNav } from "@/components/GuideNav";
import { PeopleBoard } from "@/components/PeopleBoard";
import { Couple } from "@/components/Couple";
import { CheatCodes } from "@/components/CheatCodes";
import { Garage } from "@/components/Garage";

export const revalidate = 7200;

/** More official shots per place, on top of the numbered ones. */
const EXTRA: Record<string, string[]> = {
  vice_city: ["places/vice_city_night", "places/marina_skyline", "places/palm_tower", "places/club_jungle_1"],
  leonida_keys: ["places/rusty_anchor_bar", "places/seaplane_keys_bridge", "places/seaplane_sunset", "places/catamaran_aerial"],
  grassrivers: ["places/flamingo_wetlands", "places/sheriff_chase"],
  port_gellhorn: ["places/ricardo_tires_gas_night", "places/car_wash_cab"],
  ambrosia: ["places/ganado_coast", "places/offroad_muscle"],
  mount_kalaga_national_park: ["places/beach_aerial"],
};

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
          <p className="mt-2 text-xs text-haze"><Link href="/credits" className="underline">Map credits</Link></p>
        </div>
      </section>

      <GuideNews />

      <section id="places" className="py-6 scroll-mt-40">
        <div className="mx-auto max-w-7xl px-4"><h2 className="display text-6xl md:text-7xl">Places</h2></div>
        <div className="mt-8">
          {regions.map((r, i) => (
            <article id={r.slug} key={r.slug} className="place-band scroll-mt-40" style={{ "--tone": r.tone } as React.CSSProperties}>
              <div className={`mx-auto max-w-7xl px-4 py-12 grid gap-6 md:grid-cols-[1.6fr_1fr] items-center ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
                <PlaceReel slug={r.slug} name={r.name} shots={r.shots} extra={EXTRA[r.slug]} />
                <div>
                  <h3 className="place-sign display text-4xl md:text-5xl">{r.name}</h3>
                  <p className="mt-3 place-blurb">{r.blurb}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>


      <section id="people" className="bg-ink border-y border-line py-16 scroll-mt-40">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="display text-6xl md:text-7xl">People</h2>
          <div className="mt-8"><PeopleBoard /></div>
        </div>
      </section>

      <section id="couple" className="mx-auto max-w-7xl px-4 py-16 scroll-mt-40">
        <h2 className="display text-6xl md:text-7xl">Jason &amp; Lucia</h2>
        <p className="text-haze mt-3 max-w-2xl">The relationship isn&apos;t only the story. It&apos;s how you play.</p>
        <div className="mt-8"><Couple /></div>
      </section>

      <section id="garage" className="mx-auto max-w-7xl px-4 py-16 scroll-mt-40">
        <h2 className="display text-6xl md:text-7xl">Cars and weapons</h2>
        <p className="text-haze mt-3 max-w-2xl">Every vehicle and weapon so far. The best up top, the rest a tap away.</p>
        <div className="mt-8"><Garage /></div>

      </section>

      <section id="cheats" className="mx-auto max-w-7xl px-4 py-16 scroll-mt-40">
        <h2 className="display text-6xl md:text-7xl">Cheat codes</h2>
        <p className="text-haze mt-3 max-w-2xl">Every confirmed code, what unlocks it, and how to punch it in.</p>
        <div className="mt-8"><CheatCodes /></div>
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

      <LatestNews />

      <section id="editions" className="mx-auto max-w-7xl px-4 py-16 scroll-mt-40">
        <h2 className="display text-5xl md:text-6xl">Edition extras</h2>
        <p className="text-haze mt-2 mb-6 max-w-2xl">What the Ultimate Edition and the Vintage Vice City Pack add, from Rockstar&apos;s screenshots and press images. Swipe sideways.</p>
        <EditionCarousel />
      </section>
    </div>
  );
}
