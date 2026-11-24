import { NextRequest, after } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { admin, userFromRequest } from "@/lib/server";
import { watermarkBacklog, watermarkClip } from "@/lib/watermarkJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Up to 800 s on Pro; Hobby caps every function at 300 s. Encoding settings are sized for 300.
export const maxDuration = 800;

function same(a: string, b: string) { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }

async function allowed(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && same(req.headers.get("authorization") ?? "", `Bearer ${secret}`)) return true;
  const me = await userFromRequest(req);
  if (!me) return false;
  const { data } = await admin().from("profiles").select("is_admin").eq("id", me.id).maybeSingle();
  return Boolean(data?.is_admin);
}

/** Burn the watermark into clips.
 *  { clip: "<id>" }  → that clip (the console calls this right after approving)
 *  { backlog: true } → every live clip still streaming its clean original, as many as fit
 *  The work runs after the response, so the console never waits on ffmpeg. */
export async function POST(req: NextRequest) {
  if (!(await allowed(req))) return Response.json({ error: "Staff only." }, { status: 403 });
  const body = await req.json().catch(() => ({})) as { clip?: string; backlog?: boolean };
  const budget = (maxDuration - 30) * 1000;
  if (body.clip) {
    if (!/^[0-9a-f-]{36}$/i.test(body.clip)) return Response.json({ error: "Bad clip id." }, { status: 400 });
    const id = body.clip;
    after(async () => { const r = await watermarkClip(id); console.log("[watermark]", id, JSON.stringify(r)); });
    return Response.json({ queued: [id] }, { status: 202 });
  }
  if (body.backlog) {
    after(async () => { const r = await watermarkBacklog(budget); console.log("[watermark backlog]", JSON.stringify(r)); });
    return Response.json({ queued: "backlog" }, { status: 202 });
  }
  return Response.json({ error: "Nothing to do." }, { status: 400 });
}
