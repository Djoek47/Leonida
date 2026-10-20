export const metadata = { title: "Contest rules — Leonida Live" };

const UPDATED = "October 20, 2026";

const sections: [string, string[]][] = [
  ["1. Who runs the contest", [
    "The Leonida Live weekly clip contest (the \"Contest\") is run by Mytikas 73 Inc. (\"Leonida Live\", \"we\"). Leonida Live is a fan community and is not affiliated with, sponsored or endorsed by Rockstar Games or Take-Two Interactive.",
  ]],
  ["2. Free to enter", [
    "No purchase, payment or subscription is needed to enter, to vote or to win. Buying anything on this site never changes your chances.",
  ]],
  ["3. Who can enter", [
    "You must be 18 or older, or the age of majority where you live, and have a Leonida Live account. Staff and their households can't win prizes.",
    "The Contest is void where prohibited. Residents of Quebec: any dispute about running this Contest can be submitted to the Régie des alcools, des courses et des jeux. Residents of Canada must answer a skill-testing question before receiving a prize.",
  ]],
  ["4. Rounds and dates", [
    "Each round runs one week. The round page shows the submission deadline, when voting opens and when it closes, in Eastern Time. If dates change, we post the change on the round page before it takes effect.",
  ]],
  ["5. What you can send", [
    "Gameplay from Grand Theft Auto VI that you recorded yourself, on PlayStation 5, Xbox Series X|S or PC once available. One clip per round per account. MP4, MOV or WebM up to 500 MB, or a public link. We recommend under 60 seconds.",
    "Not allowed: someone else's footage, clips made with mods, cheats, glitches that change the game's code, or anything that breaks Rockstar's terms; real-world hate, harassment, sexual content or personal information; copyrighted music added on top of the clip.",
  ]],
  ["6. Review and the weekly video", [
    "Staff review every clip. We choose which clips go in the weekly compilation on the Leonida Live YouTube channel, and we may trim, caption or edit them. Clips we don't select can't win that round.",
  ]],
  ["7. Voting", [
    "For Season 1, only verified members of the Triple Comma Club can vote. We'll announce on the site before voting opens to all account holders.",
    "One vote per eligible account per round. You can move your vote until voting closes. You can't vote for your own clip. Buying, trading or automating votes, or using multiple accounts, gets the votes removed and can disqualify the clip and ban the accounts.",
  ]],
  ["8. Winners and prizes", [
    "When voting closes, the three eligible clips with the most votes win. Ties go to the clip submitted first. Prizes are 50%, 30% and 20% of the pool shown on the round page, in US dollars.",
    "We contact winners through their dashboard and email. Results are final once staff confirm them.",
  ]],
  ["9. Getting paid", [
    "Before payment, winners must prove the gamertag in the clip is theirs (Xbox sign-in or a PSN profile code) and give a working payout account: PayPal, Venmo, Cash App, Interac e-Transfer or Wise. We may ask for ID and tax forms where the law requires it, for example a W-9 for US winners receiving $600 or more in a year.",
    "Unclaimed prizes expire 60 days after the round closes. Winners pay any taxes on their prizes. Payment fees are covered by Leonida Live.",
  ]],
  ["10. Clip claims", [
    "If your gameplay appears in a clip someone else sent or that we found, you can claim it. If the claim is approved, the clip, its votes and any prize move to your account. If two people claim the same clip, we decide from the evidence and our decision is final.",
  ]],
  ["11. Your rights and ours", [
    "You keep ownership of your clip. By sending it, you give Leonida Live a worldwide, royalty-free licence to host, edit and publish it in our videos, streams, social posts and ads, with credit to your gamertag. You can ask us to stop using a clip that didn't win; we'll remove it from future posts within 14 days.",
  ]],
  ["12. Disqualification and changes", [
    "We can disqualify entries or accounts that break these rules or try to cheat. If something outside our control affects a round (for example a platform outage or a game patch), we may extend, pause or cancel it and will explain why on the site.",
  ]],
  ["13. Privacy", [
    "We use your account details only to run the Contest, pay winners and keep voting fair. We don't sell your data.",
  ]],
  ["14. Contact", [
    "Questions about a round or a payout: contact@leonidalive.com.",
  ]],
];

export default function Rules() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="display text-6xl md:text-7xl">Contest rules</h1>
      <p className="mt-3 text-haze">Last updated {UPDATED}. Have a lawyer review before the first paid round.</p>
      <ol className="mt-10 grid gap-9">
        {sections.map(([t, ps]) => (
          <li key={t}>
            <h2 className="text-xl font-extrabold">{t}</h2>
            {ps.map((p) => <p key={p} className="text-haze mt-2">{p}</p>)}
          </li>
        ))}
      </ol>
    </div>
  );
}
