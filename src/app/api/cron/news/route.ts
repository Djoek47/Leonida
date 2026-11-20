import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { admin, env } from "@/lib/server";
import { sendEmail } from "@/lib/email/send";
import { newsDigestEmail } from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function same(a: string, b: string) { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }

/** Daily news run (Vercel cron, 6:00 Toronto).
 *  1. Pulls the last day of GTA VI news from Google News through Serper into news_inbox (deduped by link).
 *  2. Replaces yesterday's automatic ticker lines with today's freshest headlines ("via Source").
 *     Lines an admin wrote by hand are never touched; any auto line can be hidden in the console.
 *  3. Emails every admin a digest that links to the console's News tab. */
const QUERIES = ["GTA 6", "GTA VI Rockstar", "GTA 6 update patch", "GTA 6 sales"];
const ABOUT = /\b(gta\s?(6|vi)|grand theft auto (6|vi)|rockstar|leonida|vice city)\b/i;
type Hit = { title: string; link: string; snippet: string; source: string; date: string | null };

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !same(req.headers.get("authorization") ?? "", `Bearer ${secret}`)) return new Response("forbidden", { status: 403 });
  const key = process.env.SERPER_API_KEY;
  if (!key || !env.serviceKey) return Response.json({ ok: false, reason: "SERPER_API_KEY or service key missing" });

  const hits: Hit[] = [];
  for (const q of QUERIES) {
    try {
      const r = await fetch("https://google.serper.dev/news", {
        method: "POST", headers: { "X-API-KEY": key, "Content-Type": "application/json" },
        body: JSON.stringify({ q, num: 10, gl: "us", hl: "en", tbs: "qdr:d" }), signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) continue;
      const j = (await r.json()) as { news?: Record<string, string>[] };
      for (const x of j.news ?? []) {
        const h = { title: String(x.title ?? "").trim(), link: String(x.link ?? ""), snippet: String(x.snippet ?? "").slice(0, 400), source: String(x.source ?? ""), date: x.date ? String(x.date) : null };
        if (h.title && h.link.startsWith("http") && ABOUT.test(h.title + " " + h.snippet) && !hits.some((y) => y.link === h.link || y.title === h.title)) hits.push(h);
      }
    } catch { /* one failed query shouldn't stop the run */ }
  }

  const db = admin();
  const { data: added, error } = await db.from("news_inbox")
    .upsert(hits.map((h) => ({ link: h.link, title: h.title.slice(0, 300), source: h.source, snippet: h.snippet, published: h.date })), { onConflict: "link", ignoreDuplicates: true })
    .select("title, source, link");
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  const fresh = added ?? [];

  // Ticker: today's top headlines replace yesterday's automatic lines. Keep the old ones if nothing new came in.
  const lines = (fresh.length ? fresh : []).slice(0, 4).map((h) => {
    const via = h.source ? ` (via ${h.source})` : "";
    const room = 140 - via.length;
    const t = h.title.length > room ? h.title.slice(0, room - 1).replace(/\s+\S*$/, "") + "…" : h.title;
    return { text: t + via, kind: "auto", source: h.source, link: h.link };
  });
  if (lines.length) {
    await db.from("ticker_items").delete().eq("kind", "auto");
    await db.from("ticker_items").insert(lines);
  }

  // Notify every admin.
  let mailed = 0;
  if (fresh.length) {
    const { data: staff } = await db.from("profiles").select("id").eq("is_admin", true);
    const day = new Date().toISOString().slice(0, 10);
    for (const s of staff ?? []) {
      const { data: u } = await db.auth.admin.getUserById(s.id);
      if (!u?.user?.email) continue;
      const r = await sendEmail(u.user.email, newsDigestEmail(fresh, lines.length), `news-${day}-${s.id}`, "news_digest");
      if (r.ok) mailed++;
    }
  }
  return Response.json({ ok: true, found: hits.length, new: fresh.length, ticker: lines.length, mailed });
}
