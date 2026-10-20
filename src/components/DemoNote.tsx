"use client";
import { isLive } from "@/lib/supabase";

export function DemoNote() {
  if (isLive) return null;
  return (
    <p className="mb-8 rounded border border-mango bg-mango/25 px-4 py-2 text-sm font-semibold text-foam">
      Preview mode: showing sample data. Connect Supabase (see README) to go live.
    </p>
  );
}
