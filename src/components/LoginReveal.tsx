"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { TierId } from "@/lib/tiers";
import { CoinAvatar, avatarUrl } from "@/components/CoinAvatar";
import { TierMedal } from "@/components/TierMedal";

/** Plays once per browser session after sign-in: the plan coin spins in with a
 *  glint in its metal, then turns over to the member's own picture. */
export function LoginReveal({ userId, name, tier, path }: { userId: string; name: string; tier: TierId; path?: string | null }) {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<"coin" | "face">("coin");

  useEffect(() => {
    try {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const key = `lfl-reveal-${userId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch { return; }
    setShow(true);
    const t1 = setTimeout(() => setPhase("face"), 1500);
    const t2 = setTimeout(() => setShow(false), 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [userId]);

  if (!show || typeof document === "undefined") return null;
  const hasFace = Boolean(avatarUrl(path));
  return createPortal(
    <div className={`reveal coin-${tier}`} onClick={() => setShow(false)} role="status" aria-live="polite">
      <div className="reveal-coin">
        <div className={`reveal-flip ${phase === "face" && hasFace ? "is-face" : ""}`}>
          <div className="reveal-side reveal-front"><TierMedal tier={tier} className="reveal-img" /></div>
          <div className="reveal-side reveal-back"><CoinAvatar tier={tier} path={path} name={name} className="reveal-img" /></div>
        </div>
        <span className="reveal-light" aria-hidden />
      </div>
      <p className="reveal-name">Welcome back, <b>{name}</b></p>
    </div>,
    document.body,
  );
}
