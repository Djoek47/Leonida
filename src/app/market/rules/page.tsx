import type { Metadata } from "next";
import Link from "@/components/A";

export const metadata: Metadata = {
  title: "Clip Market rules",
  description: "How buying and selling GTA VI clips works on the Live From Leonida Clip Market: prices, review, our commission, payouts, what buyers can do with a clip, and refunds.",
  alternates: { canonical: "/market/rules" },
};

const S: [string, string, string[]][] = [
  ["🛒", "How it works", [
    "Players sell their own GTA VI clips. Every clip is locked: you see the screenshots and the description, and the full video unlocks when you buy it.",
    "Prices run from $1 to $20, set by the seller. You pay once by card through Stripe and the file is yours to download.",
    "You can message the seller before you buy. Keep it on the site: deals made outside Live From Leonida aren't protected.",
  ]],
  ["🔎", "Every listing is reviewed", [
    "Our team watches each clip before it goes on sale and checks it matches its screenshots and description.",
    "Changing the video or the screenshots sends a listing back to review. Price, title and description changes don't.",
    "We can pause, reject or remove any listing that breaks these rules, and we may edit a title or description to fix a mistake.",
  ]],
  ["🎮", "What you can sell", [
    "Only gameplay you recorded yourself, from GTA VI.",
    "Screenshots and descriptions must show what's really in the clip.",
    "No one else's footage, no other creators' watermarks, no personal information (yours or anyone's), nothing illegal or hateful.",
    "One account per person. Fake listings or buying your own clips to look popular gets the account closed.",
  ]],
  ["💵", "Our commission and your payout", [
    "We keep 20% of each sale, with a 50¢ minimum. The seller gets the rest straight into their wallet: $4 on a $5 clip, 50¢ on a $1 clip, $16 on a $20 clip. The sell page shows your exact take before you list.",
    "Wallet money is cashed out the same way as every other earning on the site, from Wallet and billing.",
    "Card fees are covered by our commission. Sellers never pay to list.",
  ]],
  ["📄", "What a buyer can do with a clip", [
    "Use it in your own videos, streams and posts, edited or not, on any platform. Crediting the seller's gamertag is appreciated.",
    "Don't resell the file, give it away, or upload it as your own gameplay (including to our weekly contest or back onto the Clip Market).",
    "The seller keeps ownership and can keep selling the same clip to other people.",
  ]],
  ["↩", "Refunds", [
    "Clips are digital files, so sales are final once you've bought them, with these exceptions:",
    "The file won't play or is damaged. The clip clearly doesn't match its screenshots or description. It turns out not to be the seller's own gameplay. You were charged twice.",
    "Ask within 7 days of buying, through Support, topic “Clip Market”, with the clip's name. We reply within 2 days.",
    "If we approve it, your card gets the full price back through Stripe (usually 5 to 10 days) and the download is switched off. The seller's share comes back out of their wallet.",
    "Changing your mind, or buying by mistake when the preview showed the clip correctly, isn't covered.",
  ]],
  ["🗑", "When a listing comes down", [
    "Sellers can pause a listing (hidden, can relist any time) or remove it for good.",
    "Whether a seller removes it or we do, everyone who already bought it keeps their copy, and the seller keeps what they earned, unless the sale is refunded under the rules above.",
  ]],
  ["🛟", "Problems", [
    "Anything about the Clip Market, buying or selling, goes to Support with the topic “Clip Market”. Include the clip's name or link.",
    "Our team handles market issues in the console and can pause, remove or refund when something's wrong.",
  ]],
];

export default function MarketRules() {
  return (
    <div className="mk-page">
      <div className="mk-wrap py-12 max-w-3xl">
        <p className="mk-crumbs"><Link href="/market">Clip Market</Link> <span aria-hidden>›</span> <span>Rules</span></p>
        <h1 className="mk-title mt-2">Clip Market <span>rules</span></h1>
        <p className="mt-3 opacity-80">The short version: sell only your own GTA VI gameplay, show it honestly, and buyers can use what they buy in their own content. Refunds cover broken or misdescribed clips.</p>
        <div className="mkr-list mt-8">
          {S.map(([icon, h, ps]) => (
            <section key={h} className="mkr-sec">
              <h2><span aria-hidden>{icon}</span>{h}</h2>
              <ul>{ps.map((p) => <li key={p}>{p}</li>)}</ul>
            </section>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/support?topic=market" className="btn btn-hot">Report a Clip Market problem</Link>
          <Link href="/market" className="btn btn-ghost">Back to the market</Link>
        </div>
        <p className="mt-6 text-xs opacity-60">These rules sit alongside our <Link href="/terms" className="underline">Terms</Link>. If the two ever disagree on something about the Clip Market, these rules win.</p>
      </div>
    </div>
  );
}
