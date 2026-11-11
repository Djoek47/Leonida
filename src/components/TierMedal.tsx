import type { TierId } from "@/lib/tiers";

/** The plan coin: steel Free, bronze Street, silver Hustler, gold Kingpin.
 *  One piece of struck artwork per plan, cropped round with a transparent edge. */
export function TierMedal({ tier, className }: { tier: TierId; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/media/coins/${tier}.webp`} alt={`${tier.toUpperCase()} coin`} className={className}
      style={{ objectFit: "contain", aspectRatio: "1" }} loading="lazy" decoding="async" />
  );
}
