import Link from "@/components/A";

export const metadata = { title: "Privacy — Live From Leonida", description: "What Live From Leonida stores about you, why, and how to delete it." };

const S = ({ h, children }: { h: string; children: React.ReactNode }) => (
  <section className="mt-10"><h2 className="text-2xl font-extrabold">{h}</h2><div className="mt-3 grid gap-3 text-haze leading-relaxed">{children}</div></section>
);

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="sign-sm inline-block !text-base">Privacy</p>
      <h1 className="display mt-5 text-5xl md:text-6xl">What we keep, and why.</h1>
      <p className="mt-4 text-haze">Last updated November 9, 2026.</p>
      <S h="What we store">
        <p><strong className="text-foam">Account:</strong> your email, display name, platform and gamertag, and the payout handle you choose (PayPal, Venmo, Cash App, Interac or Wise).</p>
        <p><strong className="text-foam">Your clips:</strong> the videos you upload, their titles and tags, and the votes cast in each round.</p>
        <p><strong className="text-foam">Money:</strong> your plan, wallet entries, prizes, downloads and payouts. Card details never touch our servers: Stripe handles payments.</p>
      </S>
      <S h="Why">
        <p>To run the contest: count votes, pay winners, pay players when their clips are downloaded, and stop anyone gaming the result. We don&apos;t sell your data and we don&apos;t run third-party ad tracking.</p>
      </S>
      <S h="Who else sees it">
        <p>Supabase hosts the database and video storage. Stripe processes payments. Resend delivers our emails. Vercel serves the site. Each only gets what it needs for its job.</p>
        <p>Public: your display name, gamertag and approved clips. Private: everything else.</p>
      </S>
      <S h="Emails">
        <p>We email you about your account and your money: sign-in links, plan changes, badges, wins, sales and payouts. No marketing lists.</p>
      </S>
      <S h="Your control">
        <p>Change your details or delete your account any time in <Link href="/settings" className="text-gulf underline">settings</Link>. Deleting removes your account and profile; records of money already paid are kept as long as the law requires.</p>
      </S>
    </div>
  );
}
