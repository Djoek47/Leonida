export const metadata = { title: "Contest rules — Live From Leonida" };

const UPDATED = "November 9, 2026";

/** The short version people actually read. */
const PLAIN: [string, string][] = [
  ["Free to enter, free to win", "No payment, ever, to enter or to collect. Paying changes nothing about your odds."],
  ["18 and over", "Or the age of majority where you live. Staff and their households can't win."],
  ["Your own footage", "GTA VI gameplay you recorded yourself. Under 3 minutes. No mods, no cheats, no one else's clips."],
  ["One round a week", "The round page shows the deadlines, in Eastern Time."],
  ["Votes decide it", "Everyone gets at least one. Members get more. You can't vote for your own clip."],
  ["Top three split the pool", "Gold 60%, Silver 25%, Bronze 15%. The pool is locked when the round opens, so it can't shrink under you."],
  ["Prove the gamertag, then get paid", "PayPal, Venmo, Cash App, Interac or Wise. 60 days to claim."],
  ["You keep your clip", "We get a licence to show it with your name on it. Ask and we'll stop using a clip that didn't win."],
];

/** The terms. Kept to what actually has to be said. */
const TERMS: [string, string][] = [
  ["Who runs it", "Mytikas 73 Inc. Live From Leonida is a fan community, not affiliated with or endorsed by Rockstar Games or Take-Two Interactive."],
  ["Entering", "A free account, that's it. Void where prohibited. Canadian winners answer a skill-testing question; Quebec residents may take disputes to the Régie des alcools, des courses et des jeux."],
  ["What we won't take", "Other people's footage, mods, cheats, code glitches, anything breaking Rockstar's terms, hate, harassment, sexual content, personal information, or music laid over the top."],
  ["Review", "Staff review every clip and pick what goes in the weekly compilation, trimming or captioning as needed. A clip we don't select can't win that round."],
  ["Voting", "Your tier sets how many votes you hold — see the pricing page. Buying, trading or automating votes, or running several accounts, voids them and can ban you."],
  ["Winning", "Most votes wins; a tie goes to whoever submitted first. Winners are told in their dashboard and by email. Final once staff confirm."],
  ["Payment", "Verify the gamertag in the clip (Xbox sign-in or a PSN profile code), give a working payout account. Where the law requires it we ask for ID or tax forms — a W-9 for US winners at $600+ a year. You pay your taxes, we pay the transfer fees."],
  ["Claiming a clip", "If your gameplay turns up in a clip you didn't send, claim it. Approved, the clip, its votes and any prize move to you. Competing claims are settled on the evidence."],
  ["Your rights", "You own your clip. We get a worldwide, royalty-free licence to host, edit and publish it, credited to your gamertag. Ask us to drop a non-winning clip and it's out of future posts within 14 days."],
  ["Changes", "We disqualify cheats. If something outside our control hits a round — an outage, a game patch — we may extend, pause or cancel it, and we'll say why here."],
  ["Privacy", "Account details run the contest, pay winners and keep voting honest. We don't sell your data."],
];

export default function Rules() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 [&>*]:min-w-0">
      <h1 className="display text-6xl md:text-7xl">Contest rules</h1>
      <p className="mt-3 text-haze">The short version first. The terms are underneath.</p>

      <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border-2 border-line bg-line">
        {PLAIN.map(([t, p]) => (
          <li key={t} className="bg-ink px-5 py-4">
            <p className="font-extrabold">{t}</p>
            <p className="text-haze mt-0.5">{p}</p>
          </li>
        ))}
      </ul>

      <h2 className="display text-4xl mt-14">The terms</h2>
      <ol className="mt-6 grid gap-6">
        {TERMS.map(([t, p], i) => (
          <li key={t}>
            <h3 className="font-extrabold">{i + 1}. {t}</h3>
            <p className="text-haze mt-1">{p}</p>
          </li>
        ))}
      </ol>

      <p className="mt-12 text-sm text-haze">
        Last updated {UPDATED}. Questions about a round or a payout: contact@livefromleonida.com.
        Have a lawyer review before the first paid round.
      </p>
    </div>
  );
}
