"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { contestClips, currentContest, platformName, type Clip } from "@/lib/api";
import { DemoNote } from "@/components/DemoNote";

type Tab = "send" | "claim";

export default function SubmitPage() {
  const { user, loading } = useUser();
  const [tab, setTab] = useState<Tab>("send");
  if (loading) return null;
  if (!user) return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <h1 className="display text-6xl">Sign in to send a clip</h1>
      <p className="text-haze mt-3">We need an account so we know who to pay. You don&apos;t need to link PlayStation or Xbox until you win.</p>
      <Link href="/login?next=/submit" className="btn btn-hot mt-6">Sign in</Link>
    </div>
  );
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <DemoNote />
      <h1 className="display text-6xl md:text-8xl">Send it in</h1>
      <div role="tablist" className="mt-8 inline-flex rounded border border-line p-1 bg-ink">
        {([["send", "Send my clip"], ["claim", "Claim a clip that's mine"]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded font-bold text-sm ${tab === k ? "bg-foam text-dusk" : "text-haze"}`}>{l}</button>
        ))}
      </div>
      {tab === "send" ? <SendForm userId={user.id} /> : <ClaimForm userId={user.id} />}
    </div>
  );
}

function SendForm({ userId }: { userId: string }) {
  const [mode, setMode] = useState<"file" | "link">("file");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending");
    const c = sb();
    if (!c) { setTimeout(() => setState("sent"), 600); return; }
    try {
      const contest = await currentContest();
      let storage_path: string | null = null;
      const file = f.get("file") as File | null;
      if (mode === "file" && file && file.size) {
        if (file.size > 500 * 1024 * 1024) throw new Error("That file is over 500 MB. Trim it or paste a link instead.");
        storage_path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const up = await c.storage.from("clips").upload(storage_path, file);
        if (up.error) throw up.error;
      }
      const { error } = await c.from("clips").insert({
        contest_id: contest.id === "none" ? null : contest.id, owner_id: userId, submitted_by: userId,
        title: f.get("title"), platform: f.get("platform"), gamertag: f.get("gamertag"),
        storage_path, source_url: mode === "link" ? f.get("url") : null,
      });
      if (error) throw error;
      await c.from("profiles").update({ platform: f.get("platform"), gamertag: f.get("gamertag") }).eq("id", userId);
      setState("sent");
    } catch (x) { setErr((x as Error).message); setState("error"); }
  }

  if (state === "sent") return (
    <div className="mt-10 rounded-lg border border-gulf border-2 bg-ink p-6">
      <p className="display text-4xl">Clip received</p>
      <p className="mt-2 text-haze">Staff review every clip before it goes in the weekly video. You&apos;ll see its status and vote count on your dashboard.</p>
      <div className="mt-5 flex gap-3"><Link href="/dashboard" className="btn btn-hot">Open my dashboard</Link><button className="btn btn-ghost" onClick={() => setState("idle")}>Send another</button></div>
    </div>
  );

  return (
    <form onSubmit={submit} className="mt-8 grid gap-5">
      <label className="grid gap-1.5"><span className="font-bold">What happens in the clip?</span>
        <input name="title" required maxLength={90} className="field" placeholder="Airboat chase through Grassrivers at night" /></label>
      <div className="grid sm:grid-cols-2 gap-5">
        <label className="grid gap-1.5"><span className="font-bold">Console</span>
          <select name="platform" className="field" defaultValue="ps5">
            {Object.entries(platformName).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></label>
        <label className="grid gap-1.5"><span className="font-bold">Your gamertag</span>
          <input name="gamertag" required className="field" placeholder="PSN ID or Xbox gamertag" />
          <span className="text-xs text-haze">If you win, you&apos;ll prove this account is yours before we pay.</span></label>
      </div>
      <div>
        <div className="flex gap-4 text-sm font-bold mb-2">
          <button type="button" onClick={() => setMode("file")} className={mode === "file" ? "text-foam underline underline-offset-4" : "text-haze"}>Upload a file</button>
          <button type="button" onClick={() => setMode("link")} className={mode === "link" ? "text-foam underline underline-offset-4" : "text-haze"}>Paste a link</button>
        </div>
        {mode === "file"
          ? <input name="file" type="file" accept="video/mp4,video/quicktime,video/webm" required className="field file:mr-4 file:rounded file:border-0 file:bg-flamingo file:px-3 file:py-1.5 file:font-bold file:text-white" />
          : <input name="url" type="url" required className="field" placeholder="YouTube, TikTok, Twitch clip or PlayStation share link" />}
        <p className="text-xs text-haze mt-1.5">MP4, MOV or WebM up to 500 MB. Keep it under 60 seconds; raw footage is fine, we edit.</p>
      </div>
      <label className="flex gap-3 items-start text-sm text-haze">
        <input type="checkbox" required className="mt-1 accent-[var(--flamingo)]" />
        This is my own gameplay, and Live From Leonida can edit it and publish it in its videos. I&apos;ve read the <Link href="/rules" className="underline">contest rules</Link>.
      </label>
      {state === "error" && <p role="alert" className="text-flamingo font-semibold">{err}</p>}
      <button disabled={state === "sending"} className="btn btn-hot w-fit">{state === "sending" ? "Sending…" : "Send clip"}</button>
    </form>
  );
}

function ClaimForm({ userId }: { userId: string }) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<Clip | null>(null);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { currentContest().then((c) => contestClips(c.id)).then((cs) => setClips(cs.filter((x) => x.owner_id !== userId))); }, [userId]);
  const shown = clips.filter((c) => (c.title + c.gamertag).toLowerCase().includes(q.toLowerCase()));

  async function claim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const c = sb();
    if (c && pick) {
      const { error } = await c.from("claims").insert({ clip_id: pick.id, claimant_id: userId, evidence: new FormData(e.currentTarget).get("evidence") });
      if (error) { setErr(error.message); return; }
    }
    setDone(true);
  }

  if (done) return <div className="mt-10 rounded-lg border border-gulf border-2 bg-ink p-6"><p className="display text-4xl">Claim sent</p><p className="text-haze mt-2">Staff will check it against the gamertag in the clip. If it&apos;s yours, the clip and any winnings move to your account.</p></div>;

  return (
    <div className="mt-8">
      <p className="text-haze">Saw your gameplay in one of our videos, uploaded by us or by someone else? Find it and claim it.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} className="field mt-4" placeholder="Search by title or gamertag" />
      <ul className="mt-4 max-h-72 overflow-auto divide-y divide-line border border-line rounded">
        {shown.map((c) => (
          <li key={c.id}><button onClick={() => setPick(c)} className={`w-full text-left px-4 py-3 ${pick?.id === c.id ? "bg-ink-2" : "hover:bg-ink"}`}>
            <span className="font-bold">{c.title}</span><span className="block text-sm text-haze">{c.gamertag} on {platformName[c.platform]}</span></button></li>
        ))}
        {shown.length === 0 && <li className="px-4 py-6 text-haze">No clips match. Try the gamertag shown in the video.</li>}
      </ul>
      {pick && (
        <form onSubmit={claim} className="mt-6 grid gap-4">
          <label className="grid gap-1.5"><span className="font-bold">How can we tell it&apos;s yours?</span>
            <textarea name="evidence" required rows={3} className="field" placeholder="Link to the original capture, the date you recorded it, or anything only you would have." /></label>
          {err && <p role="alert" className="text-flamingo font-semibold">{err}</p>}
          <button className="btn btn-hot w-fit">Claim &ldquo;{pick.title}&rdquo;</button>
        </form>
      )}
    </div>
  );
}
