import { NextRequest } from "next/server";
import { admin, env, userFromRequest } from "@/lib/server";
import { eventEmail } from "@/lib/email/templates";
import { emailReady, sendEmail } from "@/lib/email/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sends whatever is waiting in public.email_outbox.
 *
 *  The database writes a row for every event worth an email (a plan change, a
 *  badge, a win, a sale, a payout) and pings this route the moment the row is
 *  committed. Anything that fails stays queued and goes out on the next ping. */
export async function POST(req: NextRequest) {
  const secret = process.env.EMAIL_FLUSH_SECRET;
  const ok = (secret && req.headers.get("x-flush-secret") === secret) || (await isStaff(req));
  if (!ok) return new Response("forbidden", { status: 403 });
  if (!emailReady || !env.serviceKey) return Response.json({ sent: 0, reason: "email not configured" });
  return Response.json(await flush());
}

async function isStaff(req: NextRequest) {
  const me = await userFromRequest(req);
  if (!me) return false;
  const { data } = await admin().from("profiles").select("is_admin").eq("id", me.id).single();
  return Boolean(data?.is_admin);
}

async function flush() {
  const db = admin();
  // Claim a batch so two pings running at once never send the same row.
  const { data: batch, error } = await db.rpc("claim_email_batch", { p_limit: 25 });
  if (error) return { sent: 0, error: error.message };
  let sent = 0, failed = 0;
  for (const row of (batch ?? []) as Array<{ id: string; user_id: string; kind: string; data: Record<string, unknown> }>) {
    const [{ data: u }, { data: p }] = await Promise.all([
      db.auth.admin.getUserById(row.user_id),
      db.from("profiles").select("display_name").eq("id", row.user_id).maybeSingle(),
    ]);
    const to = u?.user?.email;
    const mail = eventEmail(row.kind, row.data ?? {}, p?.display_name ?? "there");
    if (!to || !mail) {
      await db.from("email_outbox").update({ status: "skipped", error: !to ? "no email address" : "unknown kind" }).eq("id", row.id);
      continue;
    }
    const r = await sendEmail(to, mail, `outbox-${row.id}`, row.kind);
    if (r.ok) { sent++; await db.from("email_outbox").update({ status: "sent", sent_at: new Date().toISOString(), resend_id: r.id ?? null, error: null }).eq("id", row.id); }
    else { failed++; await db.from("email_outbox").update({ status: "pending", error: r.error }).eq("id", row.id); }
  }
  return { sent, failed };
}
