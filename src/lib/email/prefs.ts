/** Email types a member can switch off. Anything not listed here (receipts,
 *  payouts, security, support, plan changes) always arrives. */
export const OPTIONAL = [
  { id: "rounds",    label: "Rounds",        note: "When a round opens and you have a clip you could enter, and when results are out for a round you were in.", kinds: ["round_open", "round_result"] },
  { id: "sales",     label: "Your clip sells",      note: "Each time someone downloads one of your clips.",                                  kinds: ["clip_sold"] },
  { id: "approvals", label: "Clip approved",        note: "When staff put one of your clips live.",                                          kinds: ["clip_approved"] },
  { id: "badges",    label: "Badges earned",        note: "When you unlock a badge.",                                                        kinds: ["badge_earned"] },
] as const;

export type PrefId = (typeof OPTIONAL)[number]["id"];

/** The preference that governs an email kind, or null if it can't be muted. */
export const prefFor = (kind: string): PrefId | null => OPTIONAL.find((o) => (o.kinds as readonly string[]).includes(kind))?.id ?? null;
