/** Emblems for the guide topics.
 *
 *  Each one is a stencil: single colour, heavy strokes, no detail that
 *  disappears at 40% opacity over a screenshot. They are drawn to sit as a
 *  watermark on a tile, which rules out thin lines and anything that depends
 *  on fill colour to read. Leonida's own shapes — a Keys palm, a wanted star,
 *  a duffel — rather than generic icons. */
export type EmblemId =
  | "guns" | "heat" | "cars" | "money" | "profile"
  | "custom" | "fencing" | "looks" | "leonida";

const P: Record<EmblemId, React.ReactNode> = {
  // Crosshair over a round
  guns: (
    <>
      <circle cx="50" cy="50" r="30" />
      <path d="M50 8v18M50 74v18M8 50h18M74 50h18" />
      <circle cx="50" cy="50" r="7" />
      <path d="M50 36v28" />
    </>
  ),
  // Wanted star, radiating
  heat: (
    <>
      <path d="M50 20l8.2 16.6 18.3 2.7-13.2 12.9 3.1 18.2L50 61.8 33.6 70.4l3.1-18.2-13.2-12.9 18.3-2.7z" />
      <path d="M50 6v8M86 24l-7 4M86 76l-7-4M50 94v-8M14 76l7-4M14 24l7 4" />
    </>
  ),
  // Steering wheel
  cars: (
    <>
      <circle cx="50" cy="50" r="32" />
      <circle cx="50" cy="50" r="11" />
      <path d="M50 18v21M22.3 66L40.5 55.5M77.7 66L59.5 55.5" />
    </>
  ),
  // Duffel of loot: a long soft bag with two grab handles, not a strongbox
  money: (
    <>
      {/* A tied swag bag. A rectangle with a handle just reads as a toolbox. */}
      <path d="M40 30h20l10 10H30z" />
      <path d="M36 40c-9 7-18 18-18 30a18 18 0 0 0 18 18h28a18 18 0 0 0 18-18c0-12-9-23-18-30z" />
      <path d="M50 52v26" />
      <path d="M57 58.5c0-3.3-3.1-5.5-7-5.5s-7 2.2-7 5.5 3.1 5 7 5.5 7 2.2 7 5.5-3.1 5.5-7 5.5-7-2.2-7-5.5" />
    </>
  ),
  // Fingerprint: closed loops, not open arcs — open arcs read as a signal icon
  profile: (
    <>
      {/* A whorl: closed nested loops that meet at the bottom, with the ridge
          ends showing. Arcs that stay open above a dot read as signal bars. */}
      <path d="M50 46c4.5 0 7 3.5 7 8s-2.5 9-7 9-7-4.5-7-9 2.5-8 7-8z" />
      <path d="M50 34c11 0 17 8 17 19 0 6-1 11-3 16l3 7" />
      <path d="M50 34c-11 0-17 8-17 19 0 6 1 11 3 16l-3 7" />
      <path d="M50 22c18 0 28 12 28 30 0 8-1.5 15-4 21l4 8" />
      <path d="M50 22c-18 0-28 12-28 30 0 8 1.5 15 4 21l-4 8" />
    </>
  ),
  // Rim and wrench
  custom: (
    <>
      {/* A spray gun: the customising shop, not another steering wheel. */}
      <rect x="26" y="34" width="34" height="30" rx="5" />
      <path d="M60 42h12l10-8v30l-10-8H60" />
      <path d="M34 64v10a8 8 0 0 0 8 8h4a8 8 0 0 0 8-8V64" />
      <path d="M36 34V24a6 6 0 0 1 6-6h8" />
      <path d="M14 40h8M14 50h8M14 60h8" />
    </>
  ),
  // A swing tag: what a fence puts on a thing before it moves on
  fencing: (
    <>
      <path d="M52 10h30a8 8 0 0 1 8 8v30a8 8 0 0 1-2.3 5.7L52 90.4a8 8 0 0 1-11.3 0L9.6 59.3a8 8 0 0 1 0-11.3L46.3 12.3A8 8 0 0 1 52 10z" />
      <circle cx="73" cy="27" r="7" />
      <path d="M30 52l14 14M42 40l14 14" />
    </>
  ),
  // Shades
  looks: (
    <>
      <path d="M12 40h76" />
      <path d="M14 42h30v12a11 11 0 0 1-11 11h-8a11 11 0 0 1-11-11z" />
      <path d="M56 42h30v12a11 11 0 0 1-11 11h-8a11 11 0 0 1-11-11z" />
      <path d="M44 48c2-2 10-2 12 0" />
    </>
  ),
  // A single clean palm against the sun, over water
  leonida: (
    <>
      {/* Sun, one tall palm, water. Long fronds arcing out and down from a
          single crown — short ones and it reads as a houseplant. */}
      <circle cx="76" cy="24" r="11" />
      <path d="M46 88c-2-24 0-40 3-50" />
      <path d="M49 38C39 26 22 24 12 32c11-1 22 3 31 11" />
      <path d="M49 38c-2-15 6-27 18-31-9 8-13 19-12 29" />
      <path d="M49 38c11-11 28-11 38-1-12-4-25-1-34 5" />
      <path d="M49 38c13 4 21 15 22 29-6-11-15-18-25-21" />
      <path d="M49 38c-13 5-21 16-22 29 6-11 14-18 24-21" />
      <circle cx="49" cy="38" r="3" />
      <path d="M6 82c8-6 15-6 22 0s15 6 22 0 15-6 22 0 15 6 22 0" />
    </>
  ),
};

export function TopicEmblem({ id, className }: { id: EmblemId; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden
         fill="none" stroke="currentColor" strokeWidth="4"
         strokeLinecap="round" strokeLinejoin="round">
      {P[id]}
    </svg>
  );
}
