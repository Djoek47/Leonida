"use client";
import { useCallback, useEffect, useState } from "react";
import { sb } from "@/lib/supabase";

/** One weekly allowance per account. The week runs Thursday 12:00 p.m. Eastern to the next Thursday
 *  12:00 p.m., start inclusive, end exclusive. The database decides the numbers; this only shows them. */
export type Quota = { allowance: number; used: number; remaining: number; resets_at: string | null };

export const quotaOf = (allowance: number, used: number, resets_at: string | null = null): Quota =>
  ({ allowance, used, remaining: Math.max(0, allowance - used), resets_at });

/** "Thu, Nov 19, 12:00 p.m. Eastern Time", from the real reset moment. */
export function resetLabel(iso: string | null): string {
  if (!iso) return "Thursday at 12:00 p.m. Eastern Time";
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric" }).format(d);
  const t = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" }).format(d)
    .replace(" AM", " a.m.").replace(" PM", " p.m.");
  return `${day}, ${t} Eastern Time`;
}

export const QUOTA_EVENT = "lfl:quota";
export const refreshQuota = () => { try { window.dispatchEvent(new Event(QUOTA_EVENT)); } catch { /* server render */ } };

/** Live numbers from the database, shared by every component that shows them. */
export function useQuota(fallback: Quota): Quota {
  const [q, setQ] = useState<Quota>(fallback);
  const load = useCallback(async () => {
    const c = sb(); if (!c) return;
    const { data } = await c.rpc("my_submission_quota");
    if (data) setQ(data as Quota);
  }, []);
  useEffect(() => { setQ(fallback); }, [fallback.allowance, fallback.used, fallback.resets_at]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
    window.addEventListener(QUOTA_EVENT, load);
    return () => window.removeEventListener(QUOTA_EVENT, load);
  }, [load]);
  return q;
}
