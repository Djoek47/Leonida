"use client";
import Link from "@/components/A";
import { quotaOf, resetLabel, useQuota } from "@/lib/quota";

/** "This week: 3 of 8 clips submitted - 5 remaining" for the contest week being entered, with when it ends. */
export function WeeklyQuota({ allowance, used, resetsAt, paying, contestId }: { allowance: number; used: number; resetsAt: string | null; paying: boolean; contestId?: string | null }) {
  const q = useQuota(quotaOf(allowance, used, resetsAt), contestId);
  const out = q.remaining === 0;
  return (
    <p className="send-cap" aria-live="polite">
      {out
        ? <><b>You have used all {q.allowance} submissions for {q.round_title ?? "this contest week"}.</b> Your next allowance starts when its entries close.</>
        : <>This week{q.round_title ? ` (${q.round_title})` : ""}: <b>{q.used} of {q.allowance}</b> clips submitted - <b>{q.remaining}</b> remaining.</>}
      <span className="block text-sm opacity-80">Round ends and your allowance resets: {resetLabel(q.resets_at)}{paying ? "" : <> · <Link href="/pricing" className="underline">more with a plan</Link></>}</span>
    </p>
  );
}
