/* eslint-disable @next/next/no-img-element */
import { avatarUrl } from "@/components/CoinAvatar";

/** A two-sided 3D coin: the member's picture on one face, our medal on the other,
 *  with a real rim so the edge shows as it turns. */
export function SpinCoin({ medal, avatar, metal = "gold", className = "", state = "spin" }: {
  medal: string; avatar?: string | null; name?: string; metal?: "gold" | "silver" | "bronze" | "field"; className?: string;
  state?: "spin" | "sealed" | "open" | "still";
}) {
  const pic = avatarUrl(avatar);
  // No picture: both faces are ours. On a podium that means no spin, just a sway; on the reveal the
  // sealed side is the neutral Live From Leonida coin, it flips once to the medal and then holds.
  const back = pic ?? (state === "sealed" || state === "open" ? "/media/coins/free.webp" : medal);
  const st = !pic && state === "spin" ? "sway" : state;
  return (
    <span className={`sc sc-${metal} sc-${st}${pic ? "" : " sc-nopic"} ${className}`} aria-hidden>
      <span className="sc-3d">
        {Array.from({ length: 10 }, (_, i) => <i key={i} className="sc-rim" style={{ transform: `translateZ(${(i - 4.5) * 1.1}px)` }} />)}
        <span className="sc-face sc-me"><img src={back} alt="" className={pic ? "" : "sc-contain"} />{pic && <b className="sc-ring" />}</span>
        <span className="sc-face sc-us"><img src={medal} alt="" /></span>
      </span>
    </span>
  );
}
