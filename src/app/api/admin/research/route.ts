import { NextRequest } from "next/server";
import { admin, env, userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Console research: searches the web or Google News through Serper, for admins only.
 *  Body: { q: string, kind?: "search" | "news", num?: number }
 *  Returns short results (title, link, snippet, source, date). Nothing is stored here; the
 *  console turns picked results into drafts that a person rewrites before publishing. */
type Hit = { title: string; link: string; snippet: string; source: string; date: string | null };

export async function POST(req: NextRequest) {
  const key = process.env.SERPER_API_KEY;
  if (!key) return Response.json({ error: "Research isn't switched on: SERPER_API_KEY is missing." }, { status: 503 });
  if (!env.supabaseUrl || !env.serviceKey) return Response.json({ error: "Not configured." }, { status: 503 });
  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { data: p } = await admin().from("profiles").select("is_admin").eq("id", me.id).single();
  if (!p?.is_admin) return Response.json({ error: "Admins only." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { q?: string; kind?: string; num?: number };
  const q = String(body.q ?? "").trim().slice(0, 200);
  if (q.length < 2) return Response.json({ error: "Type something to search for." }, { status: 400 });
  const kind = body.kind === "news" ? "news" : "search";
  const num = Math.min(20, Math.max(3, Number(body.num) || 10));

  try {
    const r = await fetch(`https://google.serper.dev/${kind}`, {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q, num, gl: "us", hl: "en" }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return Response.json({ error: `Search failed (${r.status}).` }, { status: 502 });
    const j = (await r.json()) as { organic?: Record<string, string>[]; news?: Record<string, string>[] };
    const raw = (kind === "news" ? j.news : j.organic) ?? [];
    const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
    const hits: Hit[] = raw.slice(0, num).map((x) => ({
      title: String(x.title ?? ""), link: String(x.link ?? ""), snippet: String(x.snippet ?? ""),
      source: String(x.source ?? host(String(x.link ?? ""))), date: x.date ? String(x.date) : null,
    })).filter((h) => h.link.startsWith("http"));
    return Response.json({ hits });
  } catch (e) {
    console.error("[admin/research]", (e as Error).message);
    return Response.json({ error: "Search timed out. Try again." }, { status: 504 });
  }
}
