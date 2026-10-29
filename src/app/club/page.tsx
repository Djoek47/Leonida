"use client";
import { useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { PlatformIcon } from "@/components/Icons";
import { DemoNote } from "@/components/DemoNote";

const perks = [
  ["You pick the winners", "For Season 1, only club members can vote on the weekly clips. Everyone else watches."],
  ["Spotlight a clip", "Once a round, push any clip to the front of the review queue so staff look at it first."],
  ["Choose the theme", "Members vote on next week's contest theme: getaways, stunts, heists or fails."],
  ["Private Discord", "A members-only server with its own channels, voice rooms and a verified role."],
  ["First seat in Versus", "Members get first call when we pick players for live Versus matches."],
  ["Club badge", "A gold ’’’ badge next to your gamertag on every clip and leaderboard."],
];
const themes = ["Getaways", "Stunts", "Heists", "Funniest fail"];

const proof = [
  ["Sign in with Discord", "Your membership is attached to your Discord account, so that's where the role goes."],
  ["Show the money", "Record a short clip in GTA Online: open the pause menu, then Stats, then Career, so the total cash earned shows $1’000’000’000 or more. Then open your Maze Bank balance on the in-game phone."],
  ["Prove it's your account", "Put your club code in your Rockstar Social Club \"About me\" and include a screenshot of that profile page."],
  ["We check and let you in", "Staff review every application by hand. Approved members get the Discord invite and the role."],
];

export default function Club() {
  const { user, profile } = useUser();
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const code = `LL-${(profile?.verify_code ?? "K7Q2ZP")}`;

  async function apply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget), c = sb();
    if (c && user) {
      const { error } = await c.from("club_applications").insert({
        player_id: user.id, platform: f.get("platform"), social_club: f.get("sc"),
        proof_url: f.get("proof"), profile_url: f.get("profile"), discord: f.get("discord"),
      });
      if (error) { setErr(error.message); return; }
    }
    setSent(true);
  }

  return (
    <div>
      <section className="bg-asphalt text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24 grid gap-10 md:grid-cols-[1.3fr_1fr] items-center [&>*]:min-w-0">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-mango text-[#1c1710] px-3 py-1 text-sm font-black">Members only</p>
            <h1 className="display mt-5 text-[clamp(2.4rem,9vw,7rem)] break-words">The Triple Comma Club <span className="text-mango" aria-hidden>’’’</span></h1>
            <p className="mt-4 max-w-xl text-lg text-white/85">For players who made $1’000’000’000 in GTA Online. Prove it once and you&apos;re in the Live From Leonida VIP Discord for GTA VI.</p>
          </div>
          <div className="sign sign-yellow text-center py-10">
            <p className="display text-[clamp(1.6rem,7.5vw,4.5rem)] leading-none whitespace-nowrap">$1’000’000’000</p>
            <p className="mt-3 font-bold">Minimum to enter</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
        {perks.map(([t, d]) => (
          <div key={t}><h2 className="text-xl font-extrabold">{t}</h2><p className="text-haze mt-1">{d}</p></div>
        ))}
      </section>

      {profile?.is_club && user && <MembersRoom userId={user.id} />}

      <section className="mx-auto max-w-7xl px-4 grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="display text-5xl md:text-6xl">How to get in</h2>
          <ol className="mt-6 grid gap-5">
            {proof.map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[3.5rem_1fr] gap-x-3 items-start">
                <span className="shield !min-w-10 !h-10 !text-lg">{i + 1}</span>
                <div><p className="font-extrabold">{t}</p><p className="text-haze text-[15px]">{d}</p></div>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-haze">Modded or glitched money doesn&apos;t count. If Rockstar has banned the account, we can&apos;t accept it.</p>
        </div>

        <div className="rounded-xl bg-ink border border-line p-6 h-fit">
          <DemoNote />
          <h2 className="display text-4xl">Apply</h2>
          {!user ? (
            <p className="mt-4 text-haze"><Link href="/login?next=/club" className="text-gulf underline">Sign in with Discord</Link> to apply.</p>
          ) : sent ? (
            <p className="mt-4 font-semibold text-gulf">Application received. Staff will review your proof, usually within two days, and message you on Discord.</p>
          ) : (
            <form onSubmit={apply} className="mt-5 grid gap-4">
              <div className="rounded-lg border-2 border-dashed border-gulf p-4">
                <p className="text-sm font-bold">Your club code</p>
                <p className="display text-4xl tracking-wider text-gulf mt-1">{code}</p>
                <p className="text-xs text-haze mt-1">Add it to your Social Club &ldquo;About me&rdquo;. You can remove it after you&apos;re approved.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="grid gap-1.5 text-sm font-bold">Platform you played on
                  <select name="platform" id="club-platform" className="field font-normal">
                    <option value="ps5">PlayStation</option><option value="xbox">Xbox</option><option value="pc">PC</option>
                  </select></label>
                <label className="grid gap-1.5 text-sm font-bold">Social Club name
                  <input name="sc" id="club-sc" required className="field font-normal" placeholder="Your Rockstar ID" /></label>
              </div>
              <label className="grid gap-1.5 text-sm font-bold">Link to your proof clip
                <input name="proof" id="club-proof" type="url" required className="field font-normal" placeholder="YouTube (unlisted is fine), Streamable, Medal…" /></label>
              <label className="grid gap-1.5 text-sm font-bold">Link to your Social Club profile screenshot
                <input name="profile" id="club-profile" type="url" required className="field font-normal" placeholder="Imgur, Discord attachment link…" /></label>
              <label className="grid gap-1.5 text-sm font-bold">Discord username
                <input name="discord" id="club-discord" required className="field font-normal" placeholder="name" /></label>
              {err && <p role="alert" className="text-flamingo font-semibold">{err}</p>}
              <button className="btn btn-hot w-fit">Send application</button>
              <p className="flex items-center gap-3 text-haze text-xs"><PlatformIcon name="ps5" /><PlatformIcon name="xbox" /><PlatformIcon name="pc" />GTA Online on any platform counts.</p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function MembersRoom({ userId }: { userId: string }) {
  const [theme, setTheme] = useState<string | null>(null);
  const [tally, setTally] = useState<Record<string, number>>({ Getaways: 12, Stunts: 19, Heists: 8, "Funniest fail": 5 });
  function pick(t: string) {
    setTally((x) => ({ ...x, [t]: x[t] + 1, ...(theme ? { [theme]: x[theme] - 1 } : {}) }));
    setTheme(t);
    const c = sb(); if (c) c.from("theme_votes").upsert({ week: new Date().toISOString().slice(0, 10), voter_id: userId, theme: t });
  }
  const total = Object.values(tally).reduce((a, b) => a + b, 0);
  return (
    <section className="mx-auto max-w-7xl px-4 pb-14">
      <div className="sign sign-yellow grid gap-6 md:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="display text-4xl">Members&apos; room</p>
          <p className="mt-2 font-semibold">You&apos;re in. Your powers this round:</p>
          <ul className="mt-3 grid gap-1 font-semibold">
            <li>Vote on this week&apos;s clips: <Link href="/clips" className="underline">go vote</Link></li>
            <li>Spotlight: 1 left this round, use it from any clip</li>
            <li>Discord: <a href="https://discord.gg/livefromleonida" target="_blank" rel="noreferrer" className="underline">open the club server</a></li>
          </ul>
        </div>
        <div>
          <p className="font-black text-xl">Pick next week&apos;s theme</p>
          <ul className="mt-3 grid gap-2">
            {themes.map((t) => (
              <li key={t}>
                <button onClick={() => pick(t)} aria-pressed={theme === t} className={`relative w-full overflow-hidden rounded-lg border-2 border-[#1c1710] px-4 py-2.5 text-left font-bold ${theme === t ? "bg-[#1c1710] text-[#ffc12b]" : "bg-white/60 text-[#1c1710]"}`}>
                  <span className="absolute inset-y-0 left-0 bg-[#1c1710]/10" style={{ width: `${(tally[t] / total) * 100}%` }} aria-hidden />
                  <span className="relative flex justify-between"><span>{t}</span><span>{Math.round((tally[t] / total) * 100)}%</span></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
