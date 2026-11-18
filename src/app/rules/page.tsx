
const UPDATED = "November 17, 2026";

/** The short version people actually read. */
const PLAIN: [string, string][] = [
  ["Free to enter.", "Anyone can win."],
  ["18 and over", "Or the age of majority where you live."],
  ["Your own footage", "GTA VI gameplay you recorded yourself. Between 1-3 minutes (preferably) and under 600 MB. No mods, no cheats, no one else's clips."],
  ["One voting round per week", "Winners announced every Thursday at 1:00pm, in Eastern Time."],
  ["Votes decide it", "Every subscriber can vote. Every clip can be voted once."],
  ["Top three split the pool", "Gold 60%, Silver 25%, Bronze 15%."],
  ["Get paid", "PayPal, Venmo, Cash App or Interac. 60 days to claim."],
  ["You keep your clip", "Your clip could earn up to $0.99 per download."],
  ["Winners can't re-enter", "A clip that has won any prize (gold, silver or bronze) can't be submitted again."],
  ["Didn't win? Try again", "A clip that hasn't won can be resubmitted by choosing the next available week in the menu."],
];

/** The terms. The owner's numbering is kept on purpose: there is no 10. */
const TERMS: [number, string, string][] = [
  [1, "Who runs it", "Organized by Live From Leonida. Live From Leonida is a fan community, not affiliated with or endorsed by Rockstar Games or Take-Two Interactive."],
  [2, "Entering", "A free account, that's it."],
  [3, "What we won't take", "Other people's footage, mods, cheats, code glitches, anything breaking Rockstar's terms, hate, harassment, sexual content, personal information, or music laid over the top."],
  [4, "Review", "Every clip you send is a contest submission, and all clips are reviewed. Only clips approved by an administrator make the final contest cut and are uploaded on the website."],
  [5, "Voting", "Each video can be voted on once, even for users with multiple votes."],
  [6, "Winning", "Most votes wins. If there is a tie, the winner is the user with the most views on their videos."],
  [7, "Payment", "Give us a working payout account and you will receive your winnings after the announcement."],
  [8, "Resubmission", "Clips that have won any weekly or monthly prize, at gold, silver or bronze, become ineligible for resubmission. Clips that have not won can still be resubmitted by selecting the next available week in the menu. A resubmitted clip counts toward that week's submission allowance and is reviewed again."],
  [9, "Your rights", "You own your clip. Every clip download makes you $0.99. The user may edit and publish it, credited to your gamertag."],
  [11, "Privacy", "Account details run the contest, pay winners and keep voting honest. We don't sell your data."],
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
        {TERMS.map(([n, t, p]) => (
          <li key={t}>
            <h3 className="font-extrabold">{n}. {t}</h3>
            <p className="text-haze mt-1">{p}</p>
          </li>
        ))}
      </ol>

      <p className="mt-12 text-sm text-haze">
        Last updated {UPDATED}. Questions about a round or a payout: contact@livefromleonida.com.
      </p>
    </div>
  );
}
