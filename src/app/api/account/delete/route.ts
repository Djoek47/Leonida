import { NextRequest } from "next/server";
import { admin, env, userFromRequest } from "@/lib/server";
import { eventEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Deletes the caller's account.
 *
 *  Refuses while there's money or a live plan attached, because deleting
 *  either would lose it: a balance they haven't cashed out, a subscription
 *  that would keep billing, a prize still being paid. The page asks them to
 *  deal with those first.
 *
 *  What goes: the login, the profile, their wallet history, votes, chat,
 *  badges, downloads they made. What stays, ownerless: clips they sent and
 *  any placings, because those are the contest's history and other people's
 *  votes are attached to them. */
export async function POST(req: NextRequest) {
  if (!env.supabaseUrl || !env.serviceKey) {
    return Response.json({ error: "Account deletion isn't switched on for this deployment." }, { status: 503 });
  }
  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in first." }, { status: 401 });

  const { confirm } = (await req.json().catch(() => ({}))) as { confirm?: string };
  if (confirm !== "DELETE") {
    return Response.json({ error: "Type DELETE to confirm." }, { status: 400 });
  }

  const db = admin();
  const { data: blockers } = await db.rpc("deletion_blockers", { p_user: me.id });
  const list = (blockers as string[] | null) ?? [];
  if (list.length) return Response.json({ blocked: list }, { status: 409 });

  await db.from("money_events").insert({ kind: "account_deleted", player_id: null, amount_cents: 0, note: me.id });

  const { data: p } = await db.from("profiles").select("display_name").eq("id", me.id).maybeSingle();
  const { error } = await db.auth.admin.deleteUser(me.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // A last word, sent after the account is really gone. Best effort.
  const mail = eventEmail("account_deleted", {}, p?.display_name ?? "there");
  if (me.email && mail) await sendEmail(me.email, mail, `deleted-${me.id}`, "account_deleted").catch(() => null);

  return Response.json({ ok: true });
}
