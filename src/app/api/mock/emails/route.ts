import { authEmail, eventEmail } from "@/lib/email/templates";
export const dynamic = "force-dynamic";
// Dev-only preview of rendered emails: /api/mock/emails?kind=clip_approved&tier=hustler
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response("not found", { status: 404 });
  const u = new URL(req.url);
  const d0 = { place: 1 };
  const d = { ...d0, tier: u.searchParams.get("tier") ?? "free", ...(u.searchParams.get("place") ? { place: Number(u.searchParams.get("place")) } : {}), title: "Airboat chase through Grassrivers", gamertag: "SwampSaint", platform: "ps5", duration: 48, waiting: 3, round: "Week of Nov 19",
    amount: 6000, period: "week", contest: "Week of Nov 19", topic: "payments", email: "member@example.com", subject: "Payout question", message: "When does my prize arrive?", ref: "7F3A2C", reply: "It was sent this morning. It shows in your wallet history.", entries: 42, views: 1318, contest_id: "demo",
    podium: [{ place: 1, title: "Airboat through the billboard", creator: "SwampSaint" }, { place: 2, title: "Keys bridge jump", creator: "KeysKingpin" }, { place: 3, title: "Squalo stunt off the marina", creator: "MarinaMenace" }], from: "street", to: "hustler" };
  const kind = u.searchParams.get("kind") ?? "clip_approved";
  const m = authEmail(kind, { name: "Jay", link: "https://www.livefromleonida.com/auth/confirm", token: "482913", newEmail: "jay@example.com", tier: d.tier })
    ?? eventEmail(kind, { ...d, balance: 1840, credits: 8, period_end: "2026-12-11", badge: "Regular", label: "Regular", blurb: "Ten clips sent.", reason: "Card declined", method: "paypal", handle: "jay@example.com", note: "Bonus", total: 2000, plan: "hustler", tier_name: "hustler" }, "Jay");
  return new Response(m?.html ?? "unknown", { headers: { "content-type": "text/html" } });
}
