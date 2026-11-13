import type { Metadata } from "next";
import Link from "@/components/A";

const SITE = "https://www.livefromleonida.com";

export const metadata: Metadata = {
  title: "GTA 6 clips: find, buy and sell GTA VI clips",
  description:
    "Find GTA 6 clips from real players, download them for your own videos, or sell yours and earn on every download. Weekly GTA VI clip contest with cash prizes. Live From Leonida.",
  keywords: [
    "GTA 6 clips", "GTA VI clips", "buy GTA 6 clips", "find GTA 6 clips", "sell GTA 6 clips", "GTA 6 clips for sale",
    "GTA 6 gameplay clips download", "GTA 6 clips for TikTok", "GTA 6 clips for YouTube", "GTA 6 clip marketplace",
    "GTA 6 clipping service", "Leonida clips", "LV Leonida", "Live From Leonida",
  ],
  alternates: { canonical: "/gta-6-clips" },
  openGraph: {
    type: "website", url: `${SITE}/gta-6-clips`, siteName: "Live From Leonida",
    title: "GTA 6 clips: find, buy and sell GTA VI clips",
    description: "Real GTA VI clips from real players. Download them for your videos, or sell yours and earn on every download.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Live From Leonida: GTA 6 clips" }],
  },
};

const FAQ: [string, string][] = [
  ["Where can I find GTA 6 clips?", "Live From Leonida has a library of GTA VI clips sent in by players. Browse this week's clips, every clip, or the featured ones, and filter by tag or by views."],
  ["Can I buy GTA 6 clips for my own videos?", "Yes. Members download clips with the monthly download credits that come with their plan. Creators agree to let members download their clips for their own videos when they send them in."],
  ["How do I sell my GTA 6 clips?", "Send your clip to the weekly round. Once staff approve it, it goes live in the library. Every time a member downloads it, you earn a share of that download."],
  ["Is there a GTA 6 clip contest?", "Yes. A new round opens every week. Everyone can vote, the top three clips split the weekly prize pool, and free accounts can win too."],
  ["Which clips are performing best?", "Kingpin members get Clip analytics: a ranking of clips by views, downloads and how often a view turns into a download, so they can pick clips that perform."],
  ["Is Live From Leonida affiliated with Rockstar Games?", "No. Live From Leonida is a fan-run community. It is not affiliated with, endorsed or sponsored by Rockstar Games or Take-Two Interactive."],
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FAQPage", "@id": `${SITE}/gta-6-clips#faq`,
      mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
    {
      "@type": "Service", "@id": `${SITE}/gta-6-clips#service`, name: "GTA 6 clip library and clipping service",
      serviceType: "Video clip marketplace", provider: { "@id": `${SITE}/#org` }, areaServed: "Worldwide",
      description: "Find GTA VI clips from real players, download them for your own videos, or sell yours and earn on every download.",
      url: `${SITE}/gta-6-clips`,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "GTA 6 clips", item: `${SITE}/gta-6-clips` },
      ],
    },
  ],
};

export default function Gta6Clips() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="display text-[clamp(2.2rem,7vw,3.6rem)] leading-[0.95]">GTA 6 clips from real players</h1>
      <p className="mt-4 text-lg text-haze">
        Live From Leonida is where GTA VI players send their best clips, the community votes on them every week, and creators get paid when their clips are downloaded.
        Looking for GTA 6 clips to use in your videos? Want to sell yours? Both start here.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/clips/all" className="btn btn-hot">Browse GTA 6 clips</Link>
        <Link href="/submit" className="btn btn-ghost">Send your clip</Link>
        <Link href="/pricing" className="btn btn-ghost">See memberships</Link>
      </div>

      <section className="mt-12">
        <h2 className="display text-3xl">Find GTA 6 clips</h2>
        <p className="mt-3 text-haze">
          Every clip in the library is real gameplay recorded by a player and checked by staff before it goes live. Browse this week&apos;s contest clips, the full library or the featured ones,
          filter by tag such as chase, stunt, funny, drift or scenic, and sort by views to see what other people are watching.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="display text-3xl">Buy and download GTA 6 clips</h2>
        <p className="mt-3 text-haze">
          Making a TikTok, a YouTube video, a montage or a stream highlight? Members download clips with the monthly download credits that come with their plan,
          and creators agree to let members download their clips for their own videos. Higher plans include more downloads a month.
          Kingpin members also get Clip analytics, a live ranking of the clips performing best, so you can pick clips people actually watch.
        </p>
        <p className="mt-3"><Link href="/pricing" className="font-black underline">Compare memberships</Link></p>
      </section>

      <section className="mt-10">
        <h2 className="display text-3xl">Sell your GTA 6 clips</h2>
        <p className="mt-3 text-haze">
          Send your clip into the weekly round. Once staff approve it, it goes live in the library and into the contest.
          Every time a member downloads it you earn a share of that download. You can earn up to 99¢ per download.
          Free accounts can enter, vote and win prizes too.
        </p>
        <p className="mt-3"><Link href="/earn" className="font-black underline">How earning works</Link></p>
      </section>

      <section className="mt-10">
        <h2 className="display text-3xl">The weekly GTA 6 clip contest</h2>
        <p className="mt-3 text-haze">
          A new round opens every week. Everyone can vote, the top three clips split the weekly prize pool, and the pool grows as more members join.
          Read the <Link href="/rules" className="font-black underline">contest rules</Link> or see <Link href="/clips" className="font-black underline">this week&apos;s clips</Link>.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="display text-3xl">Questions</h2>
        <dl className="mt-4 grid gap-5">
          {FAQ.map(([q, a]) => (
            <div key={q}><dt className="font-black">{q}</dt><dd className="mt-1 text-haze">{a}</dd></div>
          ))}
        </dl>
      </section>

      <p className="mt-12 text-xs text-haze">
        Live From Leonida is a fan-run community and is not affiliated with, endorsed or sponsored by Rockstar Games or Take-Two Interactive.
        Grand Theft Auto and GTA are trademarks of their respective owners. Also known as LV Leonida, Leonida Live and LFL.
      </p>
    </div>
  );
}
