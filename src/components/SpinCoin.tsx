/* eslint-disable @next/next/no-img-element */
import { avatarUrl } from "@/components/CoinAvatar";

/** A two-sided 3D coin: the member's picture on one face, our medal on the other,
 *  with a real rim so the edge shows as it turns. No picture → their initials. */
export function SpinCoin({ medal, avatar, name = "", metal = "gold", className = "", state = "spin" }: {
  medal: string; avatar?: string | null; name?: string; metal?: "gold" | "silver" | "bronze" | "field"; className?: string;
  state?: "spin" | "sealed" | "open" | "still";
}) {
  const pic = avatarUrl(avatar);
  const initials = name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "LFL";
  return (
    <span className={`sc sc-${metal} sc-${state} ${className}`} aria-hidden>
      <span className="sc-3d">
        {Array.from({ length: 10 }, (_, i) => <i key={i} className="sc-rim" style={{ transform: `translateZ(${(i - 4.5) * 1.1}px)` }} />)}
        <span className="sc-face sc-me">{pic ? <img src={pic} alt="" /> : <span className="sc-init">{initials}</span>}<b className="sc-ring" /></span>
        <span className="sc-face sc-us"><img src={medal} alt="" /></span>
      </span>
    </span>
  );
}
