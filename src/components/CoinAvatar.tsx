import type { TierId } from "@/lib/tiers";
import { TierMedal } from "@/components/TierMedal";

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const avatarUrl = (path?: string | null) => (path && SUPA ? `${SUPA}/storage/v1/object/public/avatars/${path}` : null);

/** A member's picture set in their plan's metal: gold Kingpin, silver Hustler,
 *  bronze Street, steel Free. A slow glint travels round the rim. With no
 *  picture it falls back to the plan coin, so the slot is never empty. */
export function CoinAvatar({ tier, path, name = "", className = "", glint = true }: {
  tier: TierId; path?: string | null; name?: string; className?: string; glint?: boolean;
}) {
  const src = avatarUrl(path);
  if (!src) return <TierMedal tier={tier} className={className} />;
  return (
    <span className={`coin-av coin-${tier} ${glint ? "has-glint" : ""} ${className}`} role="img" aria-label={name ? `${name}, ${tier} member` : `${tier} member`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" decoding="async" />
    </span>
  );
}
