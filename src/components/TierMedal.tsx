import type { TierId } from "@/lib/tiers";

/** Tier medallions.
 *
 *  Struck rather than drawn: a metal ring with a conic sheen, a glass field
 *  with a real highlight arc, a Leonida skyline engraved behind a palm, and a
 *  banner. Free is unplated steel, Street is silver over ice, Hustler is rose
 *  gold over magenta, Kingpin is gold with laurel and a crown.
 *
 *  No faces and no borrowed wordmarks — the state's own name and its own
 *  skyline, so the thing belongs to this site and nobody else's. */

type Spec = {
  ring: [string, string, string];   // metal: highlight, body, shadow
  field: [string, string];          // glass: top, bottom
  ink: string; banner: string; bannerInk: string;
  stars: number; laurel?: boolean; crown?: boolean;
};

const SPEC: Record<TierId, Spec> = {
  free: {
    ring: ["#9aa0a6", "#5e636a", "#2e3237"], field: ["#4a4f55", "#23262a"],
    ink: "#cfd4da", banner: "#1d2024", bannerInk: "#d8dde3", stars: 0,
  },
  street: {
    ring: ["#ffffff", "#c6ced6", "#6e7881"], field: ["#4fc3e8", "#13506e"],
    ink: "#eaf7ff", banner: "#0e2d3f", bannerInk: "#eaf7ff", stars: 1,
  },
  hustler: {
    ring: ["#ffd9c0", "#d98b5f", "#7a3f22"], field: ["#f0579f", "#6d124a"],
    ink: "#ffe6f2", banner: "#450d2e", bannerInk: "#ffd9ea", stars: 2,
  },
  kingpin: {
    ring: ["#fff3c4", "#e3b84e", "#8a6413"], field: ["#a970e0", "#39175e"],
    ink: "#fdeec4", banner: "#2a1140", bannerInk: "#ffe9a8", stars: 3, laurel: true, crown: true,
  },
};

function Star({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const rad = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${(x + Math.cos(a) * rad).toFixed(2)},${(y + Math.sin(a) * rad).toFixed(2)}`;
  }).join(" ");
  return <polygon points={pts} fill={fill} />;
}

export function TierMedal({ tier, className }: { tier: TierId; className?: string }) {
  const s = SPEC[tier];
  const u = `m-${tier}`;
  const label = tier === "free" ? "FREE" : tier.toUpperCase();

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={`${label} tier medal`}>
      <defs>
        {/* Metal: a conic sweep is what makes a ring look turned rather than painted. */}
        <linearGradient id={`${u}-ring`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={s.ring[0]} />
          <stop offset="28%" stopColor={s.ring[1]} />
          <stop offset="52%" stopColor={s.ring[2]} />
          <stop offset="74%" stopColor={s.ring[1]} />
          <stop offset="100%" stopColor={s.ring[0]} />
        </linearGradient>
        <linearGradient id={`${u}-ring2`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={s.ring[2]} />
          <stop offset="45%" stopColor={s.ring[0]} stopOpacity="0.9" />
          <stop offset="100%" stopColor={s.ring[2]} />
        </linearGradient>
        <radialGradient id={`${u}-field`} cx="38%" cy="26%" r="92%">
          <stop offset="0%" stopColor={s.field[0]} />
          <stop offset="100%" stopColor={s.field[1]} />
        </radialGradient>
        <linearGradient id={`${u}-glass`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${u}-clip`}><circle cx="100" cy="98" r="62" /></clipPath>
      </defs>

      {/* Body and rim */}
      <circle cx="100" cy="100" r="92" fill={`url(#${u}-ring)`} />
      <circle cx="100" cy="100" r="92" fill="none" stroke={s.ring[2]} strokeWidth="2" opacity=".7" />
      <circle cx="100" cy="98" r="78" fill={`url(#${u}-ring2)`} />
      <circle cx="100" cy="98" r="68" fill={s.ring[2]} opacity=".55" />

      {/* Glass field with the state engraved into it */}
      <circle cx="100" cy="98" r="62" fill={`url(#${u}-field)`} />
      <g clipPath={`url(#${u}-clip)`} opacity=".5" fill={s.ink}>
        {/* skyline */}
        <path d="M36 128h10V96h8v32h7V86h11v42h9V102h10v26h8V92h11v36h9v-24h9v24h12v18H36z" opacity=".55" />
        {/* water */}
        <path d="M30 146c10-6 20-6 30 0s20 6 30 0 20-6 30 0 20 6 30 0v22H30z" opacity=".35" />
        {/* palm */}
        <path d="M70 142c-1-16 1-26 4-34h4c-3 9-5 19-4 34z" />
        <path d="M74 106c-8-8-20-9-27-3 9-1 18 2 25 7zM74 106c-2-11 4-20 13-23-6 6-9 14-8 20zM74 106c8-8 20-8 27-1-9-3-18-1-24 4z" />
      </g>
      <path d="M100 36a62 62 0 0 1 0 124A74 74 0 0 0 100 36z" transform="rotate(-150 100 98)"
            fill={`url(#${u}-glass)`} clipPath={`url(#${u}-clip)`} />
      <circle cx="100" cy="98" r="62" fill="none" stroke={s.ring[0]} strokeWidth="2.5" opacity=".65" />

      {/* Top legend */}
      <path id={`${u}-arc`} d="M100 28m-60 0a60 60 0 0 1 120 0" fill="none" />
      <text fontSize="13" fontWeight="800" letterSpacing="5" fill={s.ink} opacity=".9">
        <textPath href={`#${u}-arc`} startOffset="50%" textAnchor="middle">LEONIDA</textPath>
      </text>

      {s.laurel && (
        <g stroke={s.ring[0]} strokeWidth="3" fill="none" opacity=".85" strokeLinecap="round">
          <path d="M30 118c-6-18-3-38 8-50M170 118c6-18 3-38-8-50" />
          <path d="M33 104c-6-2-10-7-11-13M37 88c-6-2-10-7-11-13M44 73c-6-2-9-7-10-13M167 104c6-2 10-7 11-13M163 88c6-2 10-7 11-13M156 73c6-2 9-7 10-13" />
        </g>
      )}
      {s.crown && (
        <g fill={s.ring[0]} stroke={s.ring[2]} strokeWidth="1.5">
          <path d="M80 26l7 10 13-14 13 14 7-10 3 18H77z" />
          <rect x="76" y="45" width="48" height="6" rx="2" />
        </g>
      )}

      {/* Banner */}
      <path d="M38 150h124l-10 13H48z" fill={s.banner} stroke={s.ring[1]} strokeWidth="2" />
      <text x="100" y="160" textAnchor="middle" fontSize={label.length > 7 ? 15 : 18}
            fontWeight="900" letterSpacing="2" fill={s.bannerInk}>{label}</text>

      {s.stars > 0 && (
        <g>
          {Array.from({ length: s.stars }, (_, i) =>
            <Star key={i} x={100 + (i - (s.stars - 1) / 2) * 16} y={176} r={6} fill={s.ring[0]} />)}
        </g>
      )}
    </svg>
  );
}
