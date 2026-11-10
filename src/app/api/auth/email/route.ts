import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { authEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Hook = {
  user: { id: string; email: string; new_email?: string; user_metadata?: { name?: string } };
  email_data: { token: string; token_hash: string; redirect_to: string; email_action_type: string; site_url: string; token_new: string; token_hash_new: string };
};

/** Supabase "Send Email" auth hook: every sign-up confirmation, sign-in link,
 *  password reset and email change goes through our own templates and Resend
 *  instead of Supabase's plain defaults. Signed with Standard Webhooks. */
export async function POST(req: NextRequest) {
  const body = await req.text();
  if (!verify(body, req.headers)) return fail(401, "bad signature");

  const { user, email_data: e } = JSON.parse(body) as Hook;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const name = user.user_metadata?.name || user.email.split("@")[0];
  // Links land on our own /auth/confirm page, which verifies the token_hash and
  // signs the member in on whatever device they open the email on.
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.livefromleonida.com").replace(/\/$/, "");
  const nextPath = (() => {
    try { const u = new URL(e.redirect_to || ""); return u.origin === new URL(site).origin ? u.pathname.replace(/^\/auth\/confirm$/, "") + u.search : ""; } catch { return ""; }
  })();
  const link = (hash: string, type: string) => {
    const nx = type === "recovery" ? "/login/reset" : (new URLSearchParams(nextPath.split("?")[1] || "").get("next") || (nextPath.split("?")[0] || "/dashboard"));
    return `${site}/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(nx)}`;
  };
  void base;

  const jobs: Array<{ to: string; kind: string; link?: string; token?: string }> = [];
  const t = e.email_action_type;
  if (t === "email_change") {
    // Field names are swapped upstream: token_hash_new belongs to the CURRENT address.
    if (e.token_hash_new && e.token_hash) {
      jobs.push({ to: user.email, kind: "email_change_current", link: link(e.token_hash_new, t), token: e.token });
      jobs.push({ to: user.new_email!, kind: "email_change_new", link: link(e.token_hash, t), token: e.token_new });
    } else {
      jobs.push({ to: user.new_email ?? user.email, kind: "email_change_new", link: link(e.token_hash, t), token: e.token_new || e.token });
    }
  } else {
    jobs.push({ to: user.email, kind: t === "email" ? "magiclink" : t, link: t === "reauthentication" ? undefined : link(e.token_hash, t), token: e.token });
  }

  for (const j of jobs) {
    const mail = authEmail(j.kind, { name, link: j.link, token: j.token, newEmail: user.new_email });
    if (!mail) return fail(400, `no template for ${j.kind}`);
    const r = await sendEmail(j.to, mail, `auth-${user.id}-${j.kind}-${e.token_hash || e.token}`, `auth_${j.kind}`);
    if (!r.ok) return fail(500, r.error);
  }
  return Response.json({});
}

function fail(code: number, message: string) {
  return Response.json({ error: { http_code: code, message } }, { status: code });
}

function verify(body: string, h: Headers): boolean {
  const raw = process.env.SEND_EMAIL_HOOK_SECRET;
  if (!raw) return false;
  const id = h.get("webhook-id"), ts = h.get("webhook-timestamp"), sig = h.get("webhook-signature");
  if (!id || !ts || !sig) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(raw.replace(/^v1,whsec_/, "").replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64");
  return sig.split(" ").some((p) => {
    const v = p.split(",")[1] ?? "";
    return v.length === expected.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(expected));
  });
}
