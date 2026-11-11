"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { OPTIONAL, type PrefId } from "@/lib/email/prefs";

/** Settings → Notifications. One switch per optional email type; saves as you flip.
 *  Receipts, payouts, security and support are not listed because they always arrive. */
export function NotificationCenter({ userId }: { userId: string }) {
  const [muted, setMuted] = useState<PrefId[] | null>(null);
  const [saving, setSaving] = useState<PrefId | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const c = sb(); if (!c) { setMuted([]); return; }
    c.from("email_prefs").select("muted").eq("user_id", userId).maybeSingle()
      .then(({ data }) => setMuted(((data?.muted ?? []) as PrefId[])));
  }, [userId]);

  async function flip(id: PrefId) {
    const c = sb(); if (!c || muted === null) return;
    const next = muted.includes(id) ? muted.filter((x) => x !== id) : [...muted, id];
    setSaving(id); setErr(""); setMuted(next);
    const { error } = await c.from("email_prefs").upsert({ user_id: userId, muted: next, updated_at: new Date().toISOString() });
    if (error) { setErr("Couldn't save that. Try again."); setMuted(muted); }
    setSaving(null);
  }

  const on = (id: PrefId) => muted !== null && !muted.includes(id);
  const allOff = muted !== null && muted.length === OPTIONAL.length;

  return (
    <section className="set-card" id="notifications">
      <h2>Notifications</h2>
      <p className="text-haze text-sm -mt-1 mb-4">Pick which emails you get. Receipts, payouts, security and support always arrive.</p>
      <ul className="notif-list">
        {OPTIONAL.map((o) => (
          <li key={o.id}>
            <div className="min-w-0">
              <p className="font-extrabold">{o.label}</p>
              <p className="text-sm text-haze">{o.note}</p>
            </div>
            <button type="button" role="switch" aria-checked={on(o.id)} aria-label={o.label}
              disabled={muted === null || saving === o.id} onClick={() => flip(o.id)} className="notif-switch"><i /></button>
          </li>
        ))}
      </ul>
      {allOff && <p className="mt-3 text-sm text-haze">All optional emails are off. You won&apos;t hear when a round opens for your download-only clips.</p>}
      {err && <p role="alert" className="mt-3 text-sm font-semibold text-flamingo">{err}</p>}
    </section>
  );
}
