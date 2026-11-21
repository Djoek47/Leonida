"use client";
import Link from "@/components/A";
import { ClipEmblem } from "@/components/ClipEmblem";
import { mmss, quality, tagLabel, themeOf, usd, type MarketTag } from "@/lib/market";

export type CardData = {
  id?: string; title: string; tags: MarketTag[]; emblem: MarketTag; theme: string; price_cents: number;
  duration_s: number | null; width: number | null; height: number | null; shots: string[]; seller?: string; sales?: number; status?: string;
};

/** A listing as a shop card: screenshots cycle like the guide tiles, the tag emblem sits as a
 *  watermark, the theme colour runs along the plate, and the price hangs as a tag. */
export function MarketCard({ c, href, owned }: { c: CardData; href?: string; owned?: boolean }) {
  const t = themeOf(c.theme);
  const body = (
    <>
      <span className="mk-reel" aria-hidden>
        {c.shots.filter(Boolean).map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" loading="lazy" decoding="async" style={{ animationDelay: `${i * 1.6}s` }} />
        ))}
        {!c.shots.some(Boolean) && <span className="mk-reel-empty">Your screenshots show here</span>}
      </span>
      <ClipEmblem id={c.emblem} className="mk-mark" />
      <span className="mk-price"><b>{usd(c.price_cents)}</b></span>
      <span className="mk-lock">{owned ? "✓ Yours" : "🔒 Locked until bought"}</span>
      <span className="mk-plate">
        <span className="mk-chips">
          <span className="mk-chip is-len">▶ {mmss(c.duration_s)}</span>
          {quality(c.width, c.height) !== "—" && <span className="mk-chip">{quality(c.width, c.height)}</span>}
          {c.tags.slice(0, 2).map((x) => <span key={x} className="mk-chip">{tagLabel(x)}</span>)}
        </span>
        <span className="mk-name">{c.title || "Your clip title"}</span>
        <span className="mk-by">{c.seller ? <>by <b>{c.seller}</b></> : t.name}{c.sales ? ` · ${c.sales} sold` : ""}</span>
      </span>
    </>
  );
  const style = { "--tone": t.tone } as React.CSSProperties;
  return href
    ? <Link href={href} className="mk-card" style={style}>{body}</Link>
    : <div className="mk-card is-static" style={style}>{body}</div>;
}
