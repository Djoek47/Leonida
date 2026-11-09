import { NextRequest } from "next/server";
import { admin, configured, stripe, userFromRequest } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The member's bills and receipts, straight from Stripe: plan invoices (with
 *  Stripe's hosted page and PDF) and one-off payments such as downloads. */
export async function POST(req: NextRequest) {
  if (!configured) return Response.json({ items: [] });
  const me = await userFromRequest(req);
  if (!me) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { data: p } = await admin().from("profiles").select("stripe_customer_id").eq("id", me.id).single();
  if (!p?.stripe_customer_id) return Response.json({ items: [] });

  const [inv, ch] = await Promise.all([
    stripe().invoices.list({ customer: p.stripe_customer_id, limit: 24 }),
    stripe().charges.list({ customer: p.stripe_customer_id, limit: 24 }),
  ]);
  const items = [
    ...inv.data.filter((i) => i.status !== "draft").map((i) => ({
      id: i.id, kind: "invoice" as const, at: i.created * 1000, cents: i.amount_paid || i.amount_due,
      what: i.lines.data[0]?.description ?? "Membership", status: i.status,
      number: i.number, view: i.hosted_invoice_url, pdf: i.invoice_pdf,
    })),
    ...ch.data.filter((c) => !(c as unknown as { invoice?: string | null }).invoice && c.paid).map((c) => ({
      id: c.id, kind: "payment" as const, at: c.created * 1000, cents: c.amount,
      what: c.description ?? (c.metadata?.kind === "download" ? "Clip download" : "Payment"),
      status: c.refunded ? "refunded" : "paid", number: c.receipt_number, view: c.receipt_url, pdf: null,
    })),
  ].sort((a, b) => b.at - a.at);
  return Response.json({ items });
}
