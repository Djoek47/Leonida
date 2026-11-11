const SOURCE = "https://www.gamingbible.com/gta-6";

type Item = { title: string; href: string; date: string };

/** Shown only if GamingBible can't be reached, so the section is never empty. */
const FALLBACK: Item[] = [
  { title: "Rockstar explains how GTA 6 plays better on PS5 Pro in statement confirming 30fps", href: "/news/gta-6-30-fps-confirmed-411902-20261110", date: "20261110" },
  { title: "GTA 6 can be pre-loaded without pre-ordering, and here's how", href: "/news/gta-6-preloaded-without-preordering-304812-20261110", date: "20261110" },
  { title: "GTA 6: The Festival confirmed as Rockstar Games reveals real-life launch event", href: "/news/gta-6-the-festival-confirmed-rockstar-games-launch-event-532420-20261109", date: "20261109" },
  { title: "GTA 6's online mode looks set for 2027 as dataminers unearth early features", href: "/news/gta-6-online-mode-set-for-2027-893210-20261109", date: "20261109" },
  { title: "GTA 6 confirms regional unlock times as Xbox and PS5 users plan for early hands-on", href: "/news/gta-6-confirms-global-regional-unlock-xbox-ps5-743687-20261105", date: "20261105" },
];

const decode = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

/** Fetched on the server. Next re-fetches it at most once every 2 hours. */
async function load(): Promise<{ items: Item[]; live: boolean }> {
  try {
    const res = await fetch(SOURCE, {
      next: { revalidate: 7200 },
      headers: { "user-agent": "Mozilla/5.0 (compatible; LiveFromLeonida/1.0; +https://livefromleonida.com)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const html = await res.text();
    const seen = new Map<string, Item>();
    for (const m of html.matchAll(/<a\b[^>]*href="((?:https:\/\/www\.gamingbible\.com)?\/news\/[^"#?]*?-(\d{8}))"[^>]*>([\s\S]*?)<\/a>/g)) {
      const href = m[1].replace("https://www.gamingbible.com", "");
      const title = decode(m[3]);
      if (title.length < 20 || seen.has(href)) continue;
      seen.set(href, { title, href, date: m[2] });
    }
    const items = [...seen.values()].slice(0, 8);
    if (items.length < 3) throw new Error("no articles found");
    return { items, live: true };
  } catch {
    return { items: FALLBACK, live: false };
  }
}

const fmt = (d: string) => new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}T12:00:00Z`).toLocaleDateString("en-CA", { day: "numeric", month: "short", timeZone: "UTC" });

export async function LatestNews() {
  const { items, live } = await load();
  return (
    <section id="news" className="mx-auto max-w-7xl px-4 py-16 scroll-mt-40">
      <h2 className="display text-6xl md:text-7xl">Latest news</h2>
      <p className="text-haze mt-3 max-w-2xl">Fresh GTA 6 headlines from GamingBible, checked every 2 hours. Tap one to read it there.</p>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {items.map((n) => (
          <li key={n.href}>
            <a href={`https://www.gamingbible.com${n.href}`} target="_blank" rel="noreferrer noopener" className="py-4 grid gap-1 md:grid-cols-[6rem_1fr_auto] md:items-center md:gap-6 hover:text-gulf transition-colors">
              <span className="text-sm text-haze">{fmt(n.date)}</span>
              <span className="font-extrabold">{n.title}</span>
              <span className="text-sm font-bold text-gulf">Read →</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-haze">Headlines and links from <a href={SOURCE} target="_blank" rel="noreferrer noopener" className="underline">GamingBible</a>{live ? "" : " (showing the latest we saved; live feed is unreachable right now)"}.</p>
    </section>
  );
}
