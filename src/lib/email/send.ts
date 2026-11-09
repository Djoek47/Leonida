import "server-only";
import type { Email } from "./templates";

const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? "Live From Leonida <noreply@livefromleonida.com>";
export const emailReady = Boolean(KEY);

/** One email through Resend. The idempotency key makes a retry of the same
 *  logical email a no-op on Resend's side, so a crash between "sent" and
 *  "marked sent" can never mail somebody twice. */
export async function sendEmail(to: string, e: Email, idempotencyKey: string, tag: string) {
  if (!KEY) return { ok: false as const, error: "RESEND_API_KEY is not set" };
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json", "idempotency-key": idempotencyKey.slice(0, 256) },
    body: JSON.stringify({ from: FROM, to: [to], subject: e.subject, html: e.html, text: e.text, tags: [{ name: "kind", value: tag.replace(/[^a-zA-Z0-9_-]/g, "_") }] }),
  });
  if (r.ok) return { ok: true as const, id: ((await r.json()) as { id?: string }).id };
  return { ok: false as const, error: `${r.status} ${await r.text()}`.slice(0, 500) };
}
