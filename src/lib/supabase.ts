"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when Supabase env vars are set. Without them the site runs on demo data. */
export const isLive = Boolean(url && key);

let client: SupabaseClient | null = null;
export function sb(): SupabaseClient | null {
  if (!isLive) return null;
  if (!client) client = createBrowserClient(url!, key!);
  return client;
}
