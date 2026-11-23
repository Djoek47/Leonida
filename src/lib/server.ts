import "server-only";
import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Server-side env. Routes return a clear 503 when these are missing rather than crashing the build. */
export const env = {
  stripeKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Test mode: subscriptions and downloads are applied directly, with no card
   *  and no Stripe round trip, so the whole member experience can be exercised
   *  before the payment account is live. Refuses to run against live keys. */
  // With a Stripe key present, real (test-card) checkout always wins.
  mock: process.env.MOCK_PAYMENTS === "1" && !process.env.STRIPE_SECRET_KEY,
};

export const configured = Boolean(env.stripeKey && env.supabaseUrl && env.serviceKey);
/** Mock mode needs the database but not Stripe. */
export const mockReady = Boolean(env.mock && env.supabaseUrl && env.serviceKey);

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  if (!env.stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!_stripe) _stripe = new Stripe(env.stripeKey);
  return _stripe;
}

/** Service-role client. Bypasses RLS, so it is only ever used inside route handlers. */
let _admin: SupabaseClient | null = null;
export function admin(): SupabaseClient {
  if (!env.supabaseUrl || !env.serviceKey) throw new Error("Supabase service env is not set");
  if (!_admin) _admin = createClient(env.supabaseUrl, env.serviceKey, { auth: { persistSession: false } });
  return _admin;
}

/** Resolve the caller from the Authorization: Bearer <access token> header. */
export async function userFromRequest(req: Request): Promise<{ id: string; email?: string } | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !env.supabaseUrl || !env.serviceKey) return null;
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? undefined };
}

export const notConfigured = () =>
  Response.json({ error: "Payments are not switched on for this deployment yet." }, { status: 503 });

/** The member's Stripe customer id, if it still exists in this Stripe mode. Accounts created
 *  during testing can hold a test-mode id the live account has never seen ("No such customer"),
 *  which made checkout fail with a 500. A stale id is cleared so a fresh customer is used. */
export async function liveCustomer(userId: string, stored: string | null | undefined): Promise<string | undefined> {
  if (!stored) return undefined;
  try {
    const c = await stripe().customers.retrieve(stored);
    if (!("deleted" in c && c.deleted)) return stored;
  } catch (e) {
    if ((e as { code?: string }).code !== "resource_missing") throw e;
  }
  await admin().from("profiles").update({ stripe_customer_id: null }).eq("id", userId).eq("stripe_customer_id", stored);
  return undefined;
}
