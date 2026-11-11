import { eventEmail } from "@/lib/email/templates";
export const dynamic = "force-dynamic";
// Dev-only preview of rendered emails: /api/mock/emails?kind=clip_approved&tier=hustler
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response("not found", { status: 404 });
  const u = new URL(req.url);
  const d = { tier: u.searchParams.get("tier") ?? "free", title: "Airboat chase through Grassrivers", gamertag: "SwampSaint", platform: "ps5", duration: 48, waiting: 3, round: "Week of Nov 19",
    place: 1, amount: 6000, period: "week", contest: "Week of Nov 19", topic: "payments", email: "member@example.com", subject: "Payout question", message: "When does my prize arrive?", ref: "7F3A2C", reply: "It was sent this morning. It shows in your wallet history.", from: "street", to: "hustler" };
  const m = eventEmail(u.searchParams.get("kind") ?? "clip_approved", d, "Jay");
  return new Response(m?.html ?? "unknown", { headers: { "content-type": "text/html" } });
}
