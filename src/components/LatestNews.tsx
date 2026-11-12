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

const UA = { "user-agent": "Mozilla/5.0 (compatible; LiveFromLeonida/1.0; +https://livefromleonida.com)" };
const RELEVANT = /gta|grand theft auto|rockstar|leonida|vice city|jason|lucia/i;
const EVERY = 7200; // Next refreshes this at most once every 2 hours

type Row = Item & { source: string; url: string; at: number };

async function gamingBible(): Promise<Row[]> {
  const res = await fetch(SOURCE, { next: { revalidate: EVERY }, headers: UA, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(String(res.status));
  const html = await res.text();
  const out = new Map<string, Row>();
  for (const m of html.matchAll(/<a\b[^>]*href="((?:https:\/\/www\.gamingbible\.com)?\/news\/[^"#?]*?-(\d{8}))"[^>]*>([\s\S]*?)<\/a>/g)) {
    const href = m[1].replace("https://www.gamingbible.com", "");
    const title = decode(m[3]);
    if (title.length < 20 || out.has(href)) continue;
    out.set(href, { title, href, date: m[2], source: "GamingBible", url: `https://www.gamingbible.com${href}`, at: Date.parse(`${m[2].slice(0, 4)}-${m[2].slice(4, 6)}-${m[2].slice(6)}T12:00:00Z`) });
  }
  return [...out.values()];
}

/** Google News RSS: one headline per story, with the outlet's name and a link out. */
export function parseRss(xml: string): Row[] {
  const rows: Row[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const tag = (n: string) => decode((m[1].match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`)) ?? [])[1]?.replace(/<!\[CDATA\[|\]\]>/g, "") ?? "");
    const raw = tag("title"), url = tag("link"), at = Date.parse(tag("pubDate"));
    const cut = raw.lastIndexOf(" - ");
    const title = cut > 0 ? raw.slice(0, cut) : raw, source = cut > 0 ? raw.slice(cut + 3) : "News";
    if (!title || !url.startsWith("http") || Number.isNaN(at)) continue;
    const d = new Date(at).toISOString().slice(0, 10).replace(/-/g, "");
    rows.push({ title, href: url, date: d, source, url, at });
  }
  return rows;
}

async function googleNews(): Promise<Row[]> {
  const q = encodeURIComponent('("GTA 6" OR "GTA VI" OR "Grand Theft Auto VI") when:3d');
  const res = await fetch(`https://news.google.com/rss/search?q=${q}&hl=en-CA&gl=CA&ceid=CA:en`, { next: { revalidate: EVERY }, headers: UA, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(String(res.status));
  return parseRss(await res.text());
}

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").slice(0, 60);

/** Fetched on the server from both sources, merged, de-duplicated and filtered to GTA 6. */
async function load(): Promise<{ items: Row[]; live: boolean }> {
  const got = await Promise.allSettled([gamingBible(), googleNews()]);
  const rows = got.flatMap((g) => (g.status === "fulfilled" ? g.value : [])).filter((r) => RELEVANT.test(r.title));
  const seen = new Set<string>();
  const items = rows.sort((a, b) => b.at - a.at).filter((r) => { const k = norm(r.title); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 12);
  if (items.length >= 3) return { items, live: true };
  return { items: FALLBACK.map((f) => ({ ...f, source: "GamingBible", url: `https://www.gamingbible.com${f.href}`, at: Date.parse(`${f.date.slice(0, 4)}-${f.date.slice(4, 6)}-${f.date.slice(6)}T12:00:00Z`) })), live: false };
}

const fmt = (d: string) => new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}T12:00:00Z`).toLocaleDateString("en-CA", { day: "numeric", month: "short", timeZone: "UTC" });

/** The news strip is only for the run-up. It switches itself off at launch. */
const LAUNCH_END = Date.parse("2026-11-19T00:00:00-05:00");

export async function LatestNews() {
  if (Date.now() >= LAUNCH_END) return null;
  const { items, live } = await load();
  return (
    <section id="news" className="mx-auto max-w-7xl px-4 py-16 scroll-mt-40">
      <h2 className="display text-6xl md:text-7xl">Latest news</h2>
      <p className="text-haze mt-3 max-w-2xl">Fresh GTA 6 headlines from across the web, checked every 2 hours. Tap one to read it at the source.</p>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {items.map((n) => (
          <li key={n.href}>
            <a href={n.url} target="_blank" rel="noreferrer noopener" className="py-4 grid gap-1 md:grid-cols-[6rem_1fr_auto] md:items-center md:gap-6 hover:text-gulf transition-colors">
              <span className="text-sm text-haze">{fmt(n.date)}</span>
              <span><span className="font-extrabold">{n.title}</span> <span className="text-xs text-haze">{n.source}</span></span>
              <span className="text-sm font-bold text-gulf">Read →</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-haze">Headlines and links from <a href={SOURCE} target="_blank" rel="noreferrer noopener" className="underline">GamingBible</a> and Google News{live ? "" : " (showing the latest we saved; live feed is unreachable right now)"}.</p>
    </section>
  );
}
