import Link from "@/components/A";
import { HOW_IT_PLAYS } from "@/lib/news";
import { shop } from "@/lib/content";



/** Latest releases + how it plays. This is what the rest of the guide is built from. */
export function GuideNews() {
  return (
    <section id="how-it-plays-wrap" className="mx-auto max-w-7xl px-4 py-16">
      <h2 id="how-it-plays" className="display text-6xl md:text-7xl scroll-mt-40">How it plays</h2>
      <p className="mt-2 text-haze max-w-2xl">Guns, cops, cars, money — how Leonida actually works, from the people who&apos;ve played it. We correct anything that changes at launch.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
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
