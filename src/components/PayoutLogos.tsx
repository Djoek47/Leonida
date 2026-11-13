"use client";
import { useState } from "react";

/** The four ways winners and creators get paid, one logo at a time. Logos are shown
 *  unaltered on a white tile, as their owners' guidelines ask. Static row for reduced motion. */
const LOGOS = [
  { name: "PayPal", src: "/media/payouts/paypal.png", w: 44, h: 53 },
  { name: "Venmo", src: "/media/payouts/venmo.png", w: 132, h: 25 },
  { name: "Interac", src: "/media/payouts/interac.svg", w: 52, h: 52 },
  { name: "Cash App", src: "https://static.afterpaycdn.com/en-US/integration/logo/lockup/cashapp-color-black-32.svg", w: 120, h: 32 },
];

export function PayoutLogos({ className = "" }: { className?: string }) {
  const [broken, setBroken] = useState<string | null>(null);
  return (
    <div className={`payout-logos ${className}`} role="img" aria-label="Paid out by PayPal, Venmo, Cash App and Interac">
      {LOGOS.map((l, i) => (
        <span key={l.name} className="payout-tile" style={{ ["--i" as string]: i }}>
          {broken === l.name
            ? <b className="text-[#1c1710]">{l.name}</b>
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={l.src} alt="" width={l.w} height={l.h} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(l.name)} />}
        </span>
      ))}
    </div>
  );
}
