"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { DEMO_CLIPS, money, platformName, type Clip, type Winning } from "@/lib/api";
import { DemoNote } from "@/components/DemoNote";

const statusText: Record<string, string> = {
  pending: "Waiting for review", approved: "In this week's vote", featured: "Featured", rejected: "Not selected",
  unclaimed: "Ready to redeem", requested: "Payout requested", verifying: "Checking your gamertag", sent: "Paid", held: "On hold, check your email",
};
const methods = [["paypal", "PayPal"], ["venmo", "Venmo"], ["cashapp", "Cash App"], ["interac", "Interac e-Transfer"], ["wise", "Wise"]] as const;

export default function Dashboard() {
  const { user, profile, setProfile, loading } = useUser();
  const [clips, setClips] = useState<Clip[]>([]);
  const [wins, setWins] = useState<Winning[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!user) return;
    const c = sb();
    if (!c) {
      setClips([DEMO_CLIPS[3], { ...DEMO_CLIPS[6], id: "p", status: "pending", votes: 0, owner_id: "demo" }]);
      setWins([{ id: "w", contest_id: "w0", clip_id: "x", place: 2, amount_cents: 3000, status: "unclaimed" }]);
      return;
    }
    c.from("clip_scores").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setClips((data as Clip[]) ?? []));
    c.from("winnings").select("*").eq("owner_id", user.id).then(({ data }) => setWins((data as Winning[]) ?? []));
  }, [user]);

  if (loading) return null;
  if (!user || !profile) return <div className="mx-auto max-w-xl px-4 py-24"><h1 className="display text-6xl">Sign in to see your clips</h1><Link href="/login" className="btn btn-hot mt-6">Sign in</Link></div>;

  const totalVotes = clips.reduce((s, c) => s + c.votes, 0);
  const owed = wins.filter((w) => w.status !== "sent").reduce((s, w) => s + w.amount_cents, 0);

  async function savePayout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const patch = { payout_method: String(f.get("method")), payout_handle: String(f.get("handle")) };
    const c = sb(); if (c) await c.from("profiles").update(patch).eq("id", profile!.id);
    setProfile({ ...profile!, ...patch }); setNote("Payout details saved.");
  }
  async function redeem(w: Winning) {
    if (!profile!.payout_handle) { setNote("Add where to send your money first."); return; }
    const c = sb(); if (c) { const { error } = await c.from("winnings").update({ status: "requested", requested_at: new Date().toISOString() }).eq("id", w.id); if (error) { setNote(error.message); return; } }
    setWins((ws) => ws.map((x) => x.id === w.id ? { ...x, status: "requested" } : x));
    setNote(profile!.gamertag_verified ? "Payout requested. Most go out within 3 business days." : "Payout requested. Verify your gamertag below so we can send it.");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <DemoNote />
      <h1 className="display text-[clamp(2.2rem,10vw,6rem)] break-words">{profile.display_name}</h1>
      <dl className="mt-8 grid grid-cols-3 border-y border-line divide-x divide-line">
        {[["Clips sent", clips.length], ["Votes received", totalVotes.toLocaleString()], ["To redeem", money(owed)]].map(([k, v]) => (
          <div key={k as string} className="py-5 px-4"><dt className="text-sm text-haze">{k}</dt><dd className="display text-[clamp(1.8rem,8vw,3rem)] mt-1">{v}</dd></div>
        ))}
      </dl>
      {note && <p role="status" className="mt-6 inline-block bg-ink-2 px-4 py-2 rounded font-semibold">{note}</p>}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="text-2xl font-extrabold">Winnings</h2>
          {wins.length === 0 ? <p className="text-haze mt-3">Nothing yet. Top three each week get paid.</p> : (
            <ul className="mt-4 grid gap-3">{wins.map((w) => (
              <li key={w.id} className="flex items-center justify-between rounded-lg bg-ink border border-gulf border-2 p-4">
                <div><p className="display text-4xl sunset-text">{money(w.amount_cents)}</p><p className="text-sm text-haze">{["1st", "2nd", "3rd"][w.place - 1]} place. {statusText[w.status]}</p></div>
                {w.status === "unclaimed" && <button onClick={() => redeem(w)} className="btn btn-hot">Redeem</button>}
              </li>))}</ul>
          )}

          <h2 className="text-2xl font-extrabold mt-12">My clips</h2>
          {clips.length === 0 ? <p className="text-haze mt-3">No clips yet. <Link href="/submit" className="text-gulf underline">Send your first one</Link>.</p> : (
            <ul className="mt-4 divide-y divide-line border-y border-line">{clips.map((c) => (
              <li key={c.id} className="py-4 flex items-center justify-between gap-4">
                <div><p className="font-bold">{c.title}</p><p className="text-sm text-haze">{statusText[c.status]}</p></div>
                <p className="shrink-0"><span className="display text-3xl">{c.votes}</span> <span className="text-sm text-haze">votes</span></p>
              </li>))}</ul>
          )}
        </section>

        <aside className="grid gap-8 content-start">
          <section className="rounded-lg bg-ink border border-line p-5">
            <h2 className="text-xl font-extrabold">Prove your gamertag</h2>
            <p className="text-sm text-haze mt-1">Only needed to get paid. {profile.gamertag ? <>Gamertag on file: <b className="text-foam">{profile.gamertag}</b> ({platformName[(profile.platform ?? "ps5") as "ps5"]}).</> : null}</p>
            {profile.gamertag_verified ? <p className="mt-4 font-bold text-gulf">Verified</p> : (
              <ol className="mt-4 grid gap-3 text-sm list-decimal pl-5">
                <li><b>Xbox:</b> sign in with your Microsoft account and we read your gamertag automatically. <span className="text-haze">(Coming with Xbox app approval.)</span></li>
                <li><b>PlayStation:</b> put this code in your PSN &ldquo;About me&rdquo;, then press the button. Staff check it and you can remove it after.
                  <span className="mt-2 block display text-4xl tracking-wider text-gulf">{profile.verify_code}</span></li>
              </ol>
            )}
            {!profile.gamertag_verified && <button onClick={() => setNote("Thanks. Staff will check your profile, usually within a day.")} className="btn btn-ghost mt-4 !py-2 text-sm">I&apos;ve added the code</button>}
          </section>

          <form onSubmit={savePayout} className="rounded-lg bg-ink border border-line p-5 grid gap-3">
            <h2 className="text-xl font-extrabold">Where to send your money</h2>
            <select name="method" defaultValue={profile.payout_method ?? "paypal"} className="field">{methods.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input name="handle" defaultValue={profile.payout_handle ?? ""} required className="field" placeholder="Email, @username or $cashtag" />
            <button className="btn btn-hot w-fit !py-2">Save payout details</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
