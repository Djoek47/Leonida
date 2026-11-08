import Link from "@/components/A";
import { HOW_IT_PLAYS } from "@/lib/news";
import { shop } from "@/lib/content";

/** The places you change how a car, a gun or a character looks. Official Rockstar shots. */
const SHOPS = [
  { img: "rideout_customs_01", name: "Rideout Customs", what: "Donk and street builds — rims, paint, interiors, suspension" },
  { img: "one_eyed_willie_02", name: "One-Eyed Willie's", what: "Off-road builds and hand-painted one-off liveries" },
  { img: "wyman_car_collection_01", name: "Wyman's collection", what: "Find project cars in the world and restore them" },
  { img: "saras_salon_01", name: "Sara's Salon", what: "Hair, facial hair, makeup and nails" },
  { img: "weapon_variants_01", name: "Ammu-Nation", what: "Custom grips, engravings and scopes" },
  { img: "vice_city_style_01", name: "Vice City Style", what: "Outfits, accessories and capsule collections" },
];



/** Latest releases + how it plays. This is what the rest of the guide is built from. */
export function GuideNews() {
  return (
    <section id="how-it-plays-wrap" className="mx-auto max-w-7xl px-4 py-16">
      <h2 id="how-it-plays" className="display text-6xl md:text-7xl scroll-mt-40">How it plays</h2>
      <p className="mt-2 text-haze max-w-2xl">Guns, cops, cars, money — how Leonida actually works, from the people who&apos;ve played it. We correct anything that changes at launch.</p>
      <section className="mt-8">
        <h3 className="text-xl font-extrabold">Where you change things</h3>
        <p className="text-sm text-haze mt-1">
          Shown in Rockstar&apos;s own screenshots. The two car shops are Ultimate Edition at launch;
          Rockstar hasn&apos;t said yet what the standard game gets.
        </p>
        <ul className="mt-4 grid gap-4 grid-cols-2 lg:grid-cols-3">
          {SHOPS.map((x) => (
            <li key={x.img} className="rounded-lg overflow-hidden border border-line bg-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/ultimate/${x.img}.webp`} alt={x.name} loading="lazy"
                className="aspect-video w-full object-cover" />
              <div className="p-3">
                <p className="font-extrabold leading-tight">{x.name}</p>
                <p className="text-sm text-haze mt-0.5">{x.what}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {HOW_IT_PLAYS.map((g) => (
          <section key={g.topic} className="rounded-xl border border-line bg-ink p-5">
            <h3 className="text-xl font-extrabold">{g.topic}</h3>
            <ul className="mt-3 grid gap-2 text-[15px]">
              {g.points.map((p) => <li key={p} className="flex gap-2.5"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-flamingo" /><span>{p}</span></li>)}
            </ul>
          </section>
        ))}
      </div>
      <aside aria-label="Sponsored" className="mt-10 rounded-xl border-2 border-mango bg-ink p-5 flex flex-wrap items-center gap-4 justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-haze">Sponsored</p>
          <p className="display text-3xl mt-1">Get Grand Theft Auto VI</p>
          <p className="text-haze text-sm">Out November 19 on PS5 and Xbox Series X|S. Preload from November 12.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {shop.slice(0, 2).map((x) => <a key={x.title} href={x.href} target="_blank" rel="noreferrer sponsored" className="btn btn-hot !py-2.5">{x.title.replace("Grand Theft Auto VI — ", "")}</a>)}
        </div>
      </aside>
      <p className="mt-10 text-sm text-haze">Got a source we missed? Drop it in <Link href="/chat" className="underline">Chat</Link>.</p>
    </section>
  );
}
