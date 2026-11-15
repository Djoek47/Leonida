"use client";
import Link from "@/components/A";
import { quotaOf, resetLabel, useQuota } from "@/lib/quota";

/** "This week: 3 of 8 clips submitted - 5 remaining", with the next reset in Eastern Time. */
export function WeeklyQuota({ allowance, used, resetsAt, paying }: { allowance: number; used: number; resetsAt: string | null; paying: boolean }) {
  const q = useQuota(quotaOf(allowance, used, resetsAt));
  const out = q.remaining === 0;
  return (
    <p className="send-cap" aria-live="polite">
      {out
        ? <><b>You have used all {q.allowance} clips for this week.</b> Your allowance resets Thursday at 12:00 p.m. Eastern Time.</>
        : <>This week: <b>{q.used} of {q.allowance}</b> clips submitted - <b>{q.remaining}</b> remaining.</>}
      <span className="block text-sm opacity-80">Next reset: {resetLabel(q.resets_at)}{paying ? "" : <> · <Link href="/pricing" className="underline">more with a plan</Link></>}</span>
    </p>
  );
}
