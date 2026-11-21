import type { MarketTag } from "@/lib/market";

/** Emblems for Clip Market tags, drawn the same way as the guide's topic emblems:
 *  one colour, heavy strokes, readable as a watermark over a screenshot. */
const P: Record<MarketTag, React.ReactNode> = {
  // Steering wheel
  driving: (<><circle cx="50" cy="50" r="34" /><circle cx="50" cy="50" r="9" /><path d="M16 46h25M59 46h25M50 59v25" /></>),
  // Laughing mask
  funny: (<><path d="M18 26h64v20c0 22-14 38-32 38S18 68 18 46z" /><path d="M30 42c4-6 10-6 14 0M56 42c4-6 10-6 14 0" /><path d="M32 58c8 12 28 12 36 0z" /></>),
  // A local, with a speech bubble
  npc: (<><circle cx="38" cy="34" r="12" /><path d="M14 86c0-18 11-30 24-30s24 12 24 30" /><path d="M60 14h28v20H72l-8 8v-8h-4z" /></>),
  // Hazard sign
  dangerous: (<><path d="M50 10 90 82H10z" /><path d="M50 36v22" /><circle cx="50" cy="70" r="3.5" /></>),
  // Skull
  scary: (<><path d="M22 46c0-18 12-32 28-32s28 14 28 32c0 10-5 16-10 19v13H32V65c-5-3-10-9-10-19z" /><circle cx="38" cy="46" r="7" /><circle cx="62" cy="46" r="7" /><path d="M44 78v-8M50 78v-8M56 78v-8" /></>),
  // Banded stack of bills
  money: (<><path d="M12 34h76v38H12z" /><circle cx="50" cy="53" r="10" /><path d="M42 34v38M58 34v38" /><path d="M18 26h64M24 18h52" /></>),
  // Burst
  action: (<><path d="M50 8l9 22 22-10-10 22 22 8-22 9 10 22-22-10-9 22-9-22-22 10 10-22-22-9 22-8-10-22 22 10z" /><circle cx="50" cy="50" r="10" /></>),
  // Two crossed pistols
  shootout: (<><path d="M14 30h34v12H30l-6 22H14l4-22h-4zM48 34h6" /><path d="M86 52H52v12h18l6 22h10l-4-22h4zM52 56h-6" /></>),
  // Light bar
  chase: (<><path d="M16 56h68v14H16z" /><path d="M28 56V44h20v12M52 56V44h20v12" /><path d="M38 34l-4-10M62 34l4-10M50 30V18" /><circle cx="28" cy="80" r="5" /><circle cx="72" cy="80" r="5" /></>),
  // Duffel bag
  heist: (<><path d="M14 42h72l-4 40H18z" /><path d="M34 42c0-14 6-20 16-20s16 6 16 20" /><path d="M14 58h72" /><path d="M44 66h12" /></>),
  // Car arcing off a ramp
  stunt: (<><path d="M8 86h40l30-30" /><path d="M54 38l18-8 10 4v8l-26 10-6-4z" /><path d="M20 66c10-26 26-38 44-40" strokeDasharray="4 6" /></>),
  // Sunset over water
  scenic: (<><path d="M24 58a26 26 0 0 1 52 0" /><path d="M50 18v8M22 30l6 6M78 30l-6 6M12 58h8M80 58h8" /><path d="M8 70c8-5 16-5 24 0s16 5 24 0 16-5 24 0 12 4 12 4M16 82c8-4 14-4 22 0s14 4 22 0 14-4 22 0" /></>),
};

export function ClipEmblem({ id, className }: { id: MarketTag; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      {P[id] ?? P.action}
    </svg>
  );
}
