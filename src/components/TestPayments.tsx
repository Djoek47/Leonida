"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase";

export const MOCK_ON = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === "1";

/** Says plainly that money isn't real here, and gives back the one control a
 *  test subscription otherwise has no way to reach: cancelling. */
export function TestPaymentsNote({ paying }: { paying: boolean }) {
  const [busy, setBusy] = useState(false);
  if (!MOCK_ON) return null;

  async function cancel() {
    setBusy(true);
    const token = (await sb()?.auth.getSession())?.data.session?.access_token;
    await fetch("/api/mock/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ cancel: true }),
    });
    location.reload();
  }

  return (
    <p className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border-2 border-mango bg-mango/15 px-4 py-2.5 text-sm font-semibold">
      <span className="rounded-full bg-mango px-2 py-0.5 text-[11px] font-black text-[#1c1710]">TEST MODE</span>
      Plans activate straight away and no card is charged.
      {paying && (
        <button onClick={cancel} disabled={busy}
          className="font-bold text-gulf underline underline-offset-4 disabled:opacity-60">
          {busy ? "Cancelling…" : "Cancel my plan"}
        </button>
      )}
    </p>
  );
}
