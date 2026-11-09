"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { TierMedal } from "@/components/TierMedal";
import { contestClips, currentContest, mmss, platformName, type Clip } from "@/lib/api";
import { TagPicker } from "@/components/TagPicker";
import { slugTag } from "@/lib/tags";
import { DemoNote } from "@/components/DemoNote";

type Tab = "send" | "claim";

export default function SubmitPage() {
  const { user, profile, account, paying, tier, loading } = useUser();
  const [tab, setTab] = useState<Tab>("send");
  if (loading) return <div className="mx-auto max-w-xl px-4 py-24 text-haze font-semibold" role="status">Loading your account…</div>;
  if (!user) return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <h1 className="display text-6xl">Sign in to send a clip</h1>
      <p className="text-haze mt-3">We need an account so we know who to pay. You don&apos;t need to link PlayStation or Xbox until you win.</p>
      <Link href="/login?next=/submit" className="btn btn-hot mt-6">Sign in</Link>
    </div>
  );
  return (
    <div className={`tint tint-${paying ? tier.id : "free"}`}>
    <div className="mx-auto max-w-3xl px-4 py-12">
      <DemoNote />
      <header className="send-hero">
        <TierMedal tier={paying ? tier.id : "free"} className="send-medal" />
        <div className="min-w-0">
          <p className="dash-kicker">{paying ? `${tier.label} submission` : "Free submission"}</p>
          <h1 className="display text-6xl md:text-8xl leading-[0.9]">Send it in</h1>
          {user && <p className="send-cap"><b>{Math.max(0, tier.dailySubmissions - (account?.submitted_today ?? 0))}</b> of {tier.dailySubmissions} left today{paying ? "" : <> · <a href="/pricing" className="underline">more with a plan</a></>}</p>}
        </div>
      </header>
      <div role="tablist" className="mt-8 inline-flex rounded border border-line p-1 bg-ink">
        {([["send", "Send my clip"], ["claim", "Claim a clip that's mine"]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded font-bold text-sm ${tab === k ? "bg-foam text-dusk" : "text-haze"}`}>{l}</button>
        ))}
      </div>
      {tab === "send" && (
        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border-2 border-line bg-ink px-4 py-3 text-sm font-semibold">
          <span>
            <span className="display text-2xl text-gulf">{Math.max(0, tier.dailySubmissions - (account?.submitted_today ?? 0))}</span>
            {" "}of {tier.dailySubmissions} clips left today
          </span>
          {!paying && <><span className="text-haze">·</span>
            <Link href="/pricing" className="text-gulf underline underline-offset-4">Members send up to 100 a day</Link></>}
        </p>
      )}
      {tab === "send"
        ? <SendForm gamertag={profile?.gamertag ?? null} platform={profile?.platform ?? null} userId={user.id} cap={tier.dailySubmissions} usedToday={account?.submitted_today ?? 0} />
        : <ClaimForm userId={user.id} />}
    </div>
    </div>
  );
}

/** Contest entries must come in under three minutes. */
const MAX_CONTEST_SECONDS = 180;

/** Read the duration out of the file in the browser, so we can refuse a long clip
 *  before uploading 400 MB of it. The database enforces the same rule. */
function durationOf(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    const done = (n: number | null) => { URL.revokeObjectURL(v.src); resolve(n); };
    v.onloadedmetadata = () => done(Number.isFinite(v.duration) ? v.duration : null);
    v.onerror = () => done(null);
    v.src = URL.createObjectURL(file);
  });
}

function SendForm({ userId, cap, usedToday, gamertag, platform }: { userId: string; cap: number; usedToday: number; gamertag: string | null; platform: string | null }) {
  const [mode, setMode] = useState<"file" | "link">("file");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");
  const [forContest, setForContest] = useState(true);
  const [len, setLen] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const atCap = usedToday >= cap;
  const tooLong = forContest && len != null && len >= MAX_CONTEST_SECONDS;

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

      // Ask before uploading. The database enforces the daily cap anyway, but
      // only once the row goes in — by which point up to 500 MB is already in
      // storage, and a refused row would leave it there forever.
      const { data: allowed } = await c.rpc("can_submit");
      if (allowed === false) throw new Error("DAILY_LIMIT");

      if (mode === "file" && file && file.size) {
        if (file.size > 500 * 1024 * 1024) throw new Error("That file is over 500 MB. Trim it or paste a link instead.");
        if (forContest && len != null && len >= MAX_CONTEST_SECONDS) {
          throw new Error(`Contest clips have to come in under 3 minutes. Yours is ${mmss(len)}.`);
        }
        storage_path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const up = await c.storage.from("clips").upload(storage_path, file);
        if (up.error) throw up.error;
      }
      const { data: clip, error } = await c.from("clips").insert({
        contest_id: contest.id === "none" ? null : contest.id, owner_id: userId, submitted_by: userId,
        title: f.get("title"), platform: f.get("platform"), gamertag: f.get("gamertag"),
        storage_path, source_url: mode === "link" ? f.get("url") : null,
        for_contest: forContest, duration_seconds: len == null ? null : Math.round(len),
      }).select("id").single();
      if (error) {
        // The row was refused, so nothing will ever point at the file. Take it back.
        if (storage_path) await c.storage.from("clips").remove([storage_path]);
        throw error;
      }
      // Tags are a nice-to-have: a failure here must not lose the clip itself.
      if (tags.length && clip?.id) {
        await c.from("clip_tags").insert(tags.map((t) => ({ clip_id: clip.id, tag: slugTag(t) })));
      }
      // Fill the profile in the first time only. Overwriting it on every
      // clip would re-tag the account — and a new gamertag drops verification.
      const { data: me } = await c.from("profiles").select("platform, gamertag").eq("id", userId).single();
      const fill: Record<string, FormDataEntryValue | null> = {};
      if (!me?.platform) fill.platform = f.get("platform");
      if (!me?.gamertag) fill.gamertag = f.get("gamertag");
      if (Object.keys(fill).length) await c.from("profiles").update(fill).eq("id", userId);
      setState("sent");
    } catch (x) {
      const m = (x as Error).message;
      setErr(m.includes("DAILY_LIMIT") ? `That's your ${cap} clips for today. The limit resets at midnight.`
           : m.includes("CLIP_TOO_LONG") ? "Contest clips have to come in under 3 minutes."
           : m);
      setState("error");
    }
  }

  if (state === "sent") return (
    <div className="mt-10 rounded-lg border border-gulf border-2 bg-ink p-6">
      <p className="display text-4xl">Clip received</p>
      <p className="mt-2 text-haze">Staff review every clip before it goes in the weekly video. You&apos;ll see its status and vote count on your dashboard.</p>
      <div className="mt-5 flex gap-3"><Link href="/dashboard" className="btn btn-hot">Open my dashboard</Link><button className="btn btn-ghost" onClick={() => setState("idle")}>Send another</button></div>
    </div>
  );

  return (
    <form onSubmit={submit} className="mt-8 grid gap-5 [&>*]:min-w-0">
      <label className="grid gap-1.5"><span className="font-bold">What happens in the clip?</span>
        <input name="title" required maxLength={90} className="field" placeholder="Airboat chase through Grassrivers at night" /></label>
      {gamertag ? (
        // Your tag and console come from your account; change them in settings.
        <div className="from-settings">
          <input type="hidden" name="gamertag" value={gamertag} />
          <input type="hidden" name="platform" value={platform ?? "ps5"} />
          <span className="text-xs font-black uppercase tracking-[0.18em] text-haze">Sending as</span>
          <span className="font-extrabold">{gamertag} <span className="text-haze font-semibold">on {platformName[(platform ?? "ps5") as keyof typeof platformName]}</span></span>
          <a href="/settings" className="text-sm font-bold text-gulf underline underline-offset-4">Change in settings</a>
        </div>
      ) : (
      <div className="grid sm:grid-cols-2 gap-5 [&>*]:min-w-0">
        <label className="grid gap-1.5"><span className="font-bold">Console</span>
          <select name="platform" className="field" defaultValue={platform ?? "ps5"}>
            {Object.entries(platformName).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></label>
        <label className="grid gap-1.5"><span className="font-bold">Your gamertag</span>
          <input name="gamertag" required className="field" placeholder="PSN ID or Xbox gamertag" />
          <span className="text-xs text-haze">Saved to your account, so you only type it once.</span></label>
      </div>
      )}
      <div>
        <div className="flex gap-4 text-sm font-bold mb-2">
          <button type="button" onClick={() => setMode("file")} className={mode === "file" ? "text-foam underline underline-offset-4" : "text-haze"}>Upload a file</button>
          <button type="button" onClick={() => setMode("link")} className={mode === "link" ? "text-foam underline underline-offset-4" : "text-haze"}>Paste a link</button>
        </div>
        {mode === "file"
          ? <input name="file" type="file" accept="video/mp4,video/quicktime,video/webm" required
              onChange={async (e) => { const f = e.target.files?.[0]; setLen(f ? await durationOf(f) : null); }}
              className="field file:mr-4 file:rounded file:border-0 file:bg-flamingo file:px-3 file:py-1.5 file:font-bold file:text-white" />
          : <input name="url" type="url" required className="field" placeholder="YouTube, TikTok, Twitch clip or PlayStation share link" />}
        <p className="text-xs text-haze mt-1.5">
          MP4, MOV or WebM up to 500 MB. Raw footage is fine, we edit.
          {forContest && " Contest clips must be under 3 minutes."}
        </p>
        {len != null && (
          <p className={`text-sm mt-1.5 font-semibold ${tooLong ? "text-flamingo" : "text-gulf"}`}>
            {tooLong
              ? `${mmss(len)} — too long for a contest clip. Trim it under 3:00, or untick the box below and send it as a regular upload.`
              : `${mmss(len)} — good for the contest.`}
          </p>
        )}
      </div>
      <TagPicker value={tags} onChange={setTags} />
      <label className="flex gap-3 items-start text-sm">
        <input type="checkbox" checked={forContest} onChange={(e) => setForContest(e.target.checked)} className="mt-1 accent-[var(--flamingo)]" />
        <span>Enter this in Clip of the Week and Clip of the Month.
          <span className="block text-haze">Untick to post it without entering — then it can run any length.</span></span>
      </label>
      <label className="flex gap-3 items-start text-sm text-haze">
        <input type="checkbox" required className="mt-1 accent-[var(--flamingo)]" />
        This is my own gameplay, and Live From Leonida can edit it and publish it in its videos. I&apos;ve read the <Link href="/rules" className="underline">contest rules</Link>.
      </label>
      {state === "error" && <p role="alert" className="text-flamingo font-semibold">{err}</p>}
      {atCap && (
        <p role="alert" className="rounded-lg border-2 border-mango bg-mango/20 px-4 py-3 font-semibold">
          That&apos;s your {cap} clips for today. The limit resets at midnight.{" "}
          <Link href="/pricing" className="underline">Members get more</Link>.
        </p>
      )}
      <button disabled={state === "sending" || atCap || tooLong} className="btn btn-hot w-fit disabled:opacity-60">
        {state === "sending" ? "Sending…" : "Send clip"}
      </button>
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
        <form onSubmit={claim} className="mt-6 grid gap-4 [&>*]:min-w-0">
          <label className="grid gap-1.5"><span className="font-bold">How can we tell it&apos;s yours?</span>
            <textarea name="evidence" required rows={3} className="field" placeholder="Link to the original capture, the date you recorded it, or anything only you would have." /></label>
          {err && <p role="alert" className="text-flamingo font-semibold">{err}</p>}
          <button className="btn btn-hot w-fit">Claim &ldquo;{pick.title}&rdquo;</button>
        </form>
      )}
    </div>
  );
}
