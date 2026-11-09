import { useId } from "react";
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
  rim: "plain" | "beaded" | "rope" | "reeded";
  scene: "mark" | "skyline" | "sunset" | "empire";
};

const SPEC: Record<TierId, Spec> = {
  free: {
    ring: ["#9aa0a6", "#5e636a", "#2e3237"], field: ["#4a4f55", "#23262a"],
    ink: "#cfd4da", banner: "#1d2024", bannerInk: "#d8dde3", stars: 0,
    rim: "plain", scene: "mark",
  },
  street: {
    ring: ["#ffffff", "#c6ced6", "#6e7881"], field: ["#4fc3e8", "#13506e"],
    ink: "#eaf7ff", banner: "#0e2d3f", bannerInk: "#eaf7ff", stars: 1,
    rim: "beaded", scene: "skyline",
  },
  hustler: {
    ring: ["#ffd9c0", "#d98b5f", "#7a3f22"], field: ["#f0579f", "#6d124a"],
    ink: "#ffe6f2", banner: "#450d2e", bannerInk: "#ffd9ea", stars: 2,
    rim: "rope", scene: "sunset",
  },
  kingpin: {
    ring: ["#fff3c4", "#e3b84e", "#8a6413"], field: ["#a970e0", "#39175e"],
    ink: "#fdeec4", banner: "#2a1140", bannerInk: "#ffe9a8", stars: 3, laurel: true, crown: true,
    rim: "reeded", scene: "empire",
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
  // Unique per instance. The same medal can be on screen three times — top
  // bar, open menu, pricing card — and SVG ids are document-global, so shared
  // ids resolve to whichever came first, including one in a closed menu,
  // where Chrome won't paint a gradient at all.
  const u = `m-${tier}-${useId().replace(/:/g, "")}`;
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
      <Rim kind={s.rim} tone={s.ring[0]} shade={s.ring[2]} />
      <circle cx="100" cy="98" r="78" fill={`url(#${u}-ring2)`} />
      <circle cx="100" cy="98" r="68" fill={s.ring[2]} opacity=".55" />

      {/* Glass field with the state engraved into it */}
      <circle cx="100" cy="98" r="62" fill={`url(#${u}-field)`} />
      <g clipPath={`url(#${u}-clip)`}><Scene kind={s.scene} ink={s.ink} /></g>
      <path d="M100 36a62 62 0 0 1 0 124A74 74 0 0 0 100 36z" transform="rotate(-150 100 98)"
            fill={`url(#${u}-glass)`} clipPath={`url(#${u}-clip)`} />
      <circle cx="100" cy="98" r="62" fill="none" stroke={s.ring[0]} strokeWidth="2.5" opacity=".65" />

      {/* Top legend */}
      {/* On the ring, between the glass and the rim: centred on the coin,
          radius between 62 and 78. */}
      <path id={`${u}-arc`} d="M30 98a70 70 0 0 1 140 0" fill="none" />
      {/* The crown sits where the legend would; on the top coin the crown
          is the legend. */}
      {!s.crown && (
        <text fontSize="11" fontWeight="900" letterSpacing="6" fill={s.banner} opacity=".75">
          <textPath href={`#${u}-arc`} startOffset="50%" textAnchor="middle">LEONIDA</textPath>
        </text>
      )}

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


/** The rim is where real medals tell you what they're worth before you read
 *  them: plain for the base issue, a beaded border, a twisted rope, and the
 *  fine reeding you only get on the heavy coin. */
function Rim({ kind, tone, shade }: { kind: Spec["rim"]; tone: string; shade: string }) {
  if (kind === "plain") return null;
  const R = 85;
  if (kind === "beaded") {
    return (
      <g fill={tone} opacity=".85">
        {Array.from({ length: 40 }, (_, i) => {
          const a = (i / 40) * Math.PI * 2;
          return <circle key={i} cx={100 + Math.cos(a) * R} cy={100 + Math.sin(a) * R} r="2.1" />;
        })}
      </g>
    );
  }
  if (kind === "rope") {
    return (
      <g stroke={tone} strokeWidth="2.6" strokeLinecap="round" opacity=".8">
        {Array.from({ length: 48 }, (_, i) => {
          const a = (i / 48) * Math.PI * 2, b = a + 0.09;
          return <line key={i}
            x1={100 + Math.cos(a) * (R - 3)} y1={100 + Math.sin(a) * (R - 3)}
            x2={100 + Math.cos(b) * (R + 3)} y2={100 + Math.sin(b) * (R + 3)} />;
        })}
      </g>
    );
  }
  return (
    <g stroke={shade} strokeWidth="1.3" opacity=".6">
      {Array.from({ length: 96 }, (_, i) => {
        const a = (i / 96) * Math.PI * 2;
        return <line key={i}
          x1={100 + Math.cos(a) * (R - 4)} y1={100 + Math.sin(a) * (R - 4)}
          x2={100 + Math.cos(a) * (R + 5)} y2={100 + Math.sin(a) * (R + 5)} />;
      })}
    </g>
  );
}

/** What's struck into the glass. It escalates: a single mark, then the
 *  skyline, then sunset over the water with a boat out, then the whole city
 *  under a sunburst. */
function Scene({ kind, ink }: { kind: Spec["scene"]; ink: string }) {
  const palm = (x: number, y: number, k = 1) => (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <path d="M-2 0c-1-16 1-26 4-34h4c-3 9-5 19-4 34z" />
      <path d="M2 -36c-8-8-20-9-27-3 9-1 18 2 25 7zM2 -36c-2-11 4-20 13-23-6 6-9 14-8 20zM2 -36c8-8 20-8 27-1-9-3-18-1-24 4z" />
    </g>
  );

  if (kind === "mark") {
    return (
      <g fill="none" stroke={ink} opacity=".45" strokeWidth="5" strokeLinecap="round">
        <path d="M86 68v42h26" />
        <circle cx="100" cy="98" r="40" strokeWidth="2" opacity=".5" />
      </g>
    );
  }

  if (kind === "skyline") {
    return (
      <g fill={ink} opacity=".5">
        <path d="M36 128h10V96h8v32h7V86h11v42h9V102h10v26h8V92h11v36h9v-24h9v24h12v18H36z" opacity=".55" />
        <path d="M30 146c10-6 20-6 30 0s20 6 30 0 20-6 30 0 20 6 30 0v22H30z" opacity=".35" />
        {palm(72, 142)}
      </g>
    );
  }

  if (kind === "sunset") {
    return (
      <g fill={ink}>
        <g opacity=".22" stroke={ink} strokeWidth="3">
          {Array.from({ length: 9 }, (_, i) => {
            const a = Math.PI + (i / 8) * Math.PI;
            return <line key={i} x1="100" y1="122" x2={100 + Math.cos(a) * 80} y2={122 + Math.sin(a) * 80} />;
          })}
        </g>
        <circle cx="100" cy="122" r="22" opacity=".55" />
        <path d="M30 124h140v44H30z" opacity=".35" />
        {/* a cigarette boat cutting across the bay */}
        <path d="M108 132h34l-6 6h-30zM118 132l6-6h8l3 6z" opacity=".75" />
        {palm(62, 146, 1.1)}
      </g>
    );
  }

  return (
    <g fill={ink}>
      <g opacity=".2" stroke={ink} strokeWidth="2.4">
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return <line key={i} x1="100" y1="96" x2={100 + Math.cos(a) * 70} y2={96 + Math.sin(a) * 70} />;
        })}
      </g>
      <path d="M40 132h8V100h7v32h6V78h10v54h7V92h9v40h6V70h12v62h7V96h8v36h7v-22h8v22h9v36H40z" opacity=".55" />
      <path d="M30 146c10-6 20-6 30 0s20 6 30 0 20-6 30 0 20 6 30 0v22H30z" opacity=".35" />
      {palm(56, 146)}
      {palm(146, 146, 0.85)}
    </g>
  );
}
