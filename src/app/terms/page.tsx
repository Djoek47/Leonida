import Link from "@/components/A";

export const metadata = { title: "Terms — Live From Leonida", description: "The terms for using Live From Leonida: clips, votes, memberships, prizes and payouts." };

const S = ({ h, children }: { h: string; children: React.ReactNode }) => (
  <section className="mt-10"><h2 className="text-2xl font-extrabold">{h}</h2><div className="mt-3 grid gap-3 text-haze leading-relaxed">{children}</div></section>
);

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="sign-sm inline-block !text-base">Terms</p>
      <h1 className="display mt-5 text-5xl md:text-6xl">The ground rules.</h1>
      <p className="mt-4 text-haze">Last updated November 9, 2026. Contest specifics are in the <Link href="/rules" className="text-gulf underline">contest rules</Link>.</p>
      <S h="Your clips">
        <p>Only send gameplay you captured yourself, or that you have the player&apos;s permission to send. You keep ownership. By sending a clip you let us show it on the site, in compilations and on our channels, and let members download it for their own videos.</p>
        <p>No leaked material, no cheats or mods that change the result, nothing illegal or hateful. Staff can reject or remove any clip.</p>
      </S>
      <S h="Votes and prizes">
        <p>One account per person. Votes can&apos;t be bought or traded, and you can&apos;t vote for your own clip. Paying for a membership never buys a win: free accounts are eligible for every prize.</p>
        <p>Prizes are paid after staff confirm the gamertag belongs to the winner. We can hold or cancel a prize when there is cheating, vote manipulation or a disputed clip.</p>
      </S>
      <S h="Memberships and payments">
        <p>Plans renew automatically until you cancel in settings. Cancelling keeps your perks until the end of the period you paid for. Download credits reset each cycle and don&apos;t carry over. Paid downloads are final once the file is delivered.</p>
      </S>
      <S h="Wallet and payouts">
        <p>Money you win or earn goes to your wallet. Withdrawals are sent by staff to the payout handle you set. You&apos;re responsible for any taxes on what you receive.</p>
      </S>
      <S h="The fine print">
        <p>Live From Leonida is a fan site. It is not affiliated with, endorsed or sponsored by Rockstar Games or Take-Two Interactive. Grand Theft Auto and GTA VI are their trademarks. The site is provided as is, and we may change these terms; we&apos;ll email you about anything that affects your money.</p>
      </S>
    </div>
  );
}
