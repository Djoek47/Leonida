"use client";
import { useEffect, useRef, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { TierMedal } from "@/components/TierMedal";
import { contestClips, currentContest, openContests, mmss, platformName, type Clip, type Contest } from "@/lib/api";
import { TagPicker } from "@/components/TagPicker";
import { slugTag } from "@/lib/tags";
import { DemoNote } from "@/components/DemoNote";
import { WeeklyQuota } from "@/components/WeeklyQuota";
import { quotaOf, refreshQuota, resetLabel, useQuota } from "@/lib/quota";

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
    <div className={`dash dash-${paying ? tier.id : "free"}`}>
    <div className="mx-auto max-w-3xl px-4 py-12">
      <DemoNote />
      <header className="send-hero">
        <TierMedal tier={paying ? tier.id : "free"} className="send-medal" />
        <div className="min-w-0">
          <p className="dash-kicker">{paying ? `${tier.label} submission` : "Free submission"}</p>
          <h1 className="display text-6xl md:text-8xl leading-[0.9]">Send it in</h1>
          {user && <WeeklyQuota allowance={tier.weeklySubmissions} used={account?.submitted_week ?? 0} resetsAt={account?.week_resets_at ?? null} paying={paying} />}
        </div>
      </header>
      <RoundWindow />

      <div role="tablist" className="mt-8 inline-flex rounded border border-line p-1 bg-ink">
        {([["send", "Send my clip"], ["claim", "Claim a clip that's mine"]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded font-bold text-sm ${tab === k ? "bg-foam text-dusk" : "text-haze"}`}>{l}</button>
        ))}
      </div>
      {tab === "send"
        ? <SendForm gamertag={profile?.gamertag ?? null} platform={profile?.platform ?? null} userId={user.id} cap={tier.weeklySubmissions} usedWeek={account?.submitted_week ?? 0} resetsAt={account?.week_resets_at ?? null} />
        : <ClaimForm userId={user.id} />}
    </div>
    </div>
  );
}

/** Every clip: under two minutes and under 600 MB. Both are hard limits,
 *  checked here and again on the server. */
const MAX_BYTES = 600 * 1024 * 1024;

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

/** Which competition this clip is going into, and when its doors shut.
 *  Announced up front, so nobody films for a round that has already closed. */
function RoundWindow() {
  const [c, setC] = useState<Contest | null>(null);
  useEffect(() => { currentContest().then(setC).catch(() => {}); }, []);
  if (!c) return null;
  const opens = new Date(c.voting_opens).getTime();
  const closes = new Date(c.voting_closes).getTime();
  const now = Date.now();
  const live = now >= opens && now < closes && !["closed", "paid"].includes(c.status);
  const when = (t: number) => new Date(t).toLocaleString(undefined,
    { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return (
    <section className={`round-window${live ? "" : " shut"}`}>
      <p className="rw-k">{live ? "● Round open" : "Next round"}</p>
      <p className="rw-t">{c.title}</p>
      <p className="rw-one">{live ? <>Send clips and vote until <b>{when(closes)}</b></> : <>Opens <b>{when(opens)}</b></>}</p>
      <p className="rw-note">{live ? "Our team checks every clip before it goes up for votes." : "Anything you send now goes into this round when it opens."}</p>
    </section>
  );
}

function SendForm({ userId, cap, usedWeek, resetsAt, gamertag, platform }: { userId: string; cap: number; usedWeek: number; resetsAt: string | null; gamertag: string | null; platform: string | null }) {
    // One key per send attempt: a retry of the same request can never take a second slot.
  const idemKey = useRef(crypto.randomUUID());
  const [mode, setMode] = useState<"file" | "link">("file");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");
  // Which contest week this clip is submitted to. Every upload is a contest submission.
  const [rounds, setRounds] = useState<Contest[] | null>(null);
  const [roundId, setRoundId] = useState<string>("");
  const quota = useQuota(quotaOf(cap, usedWeek, resetsAt), roundId || null);
  useEffect(() => {
    openContests().then((rs) => { setRounds(rs); setRoundId(rs[0]?.id ?? ""); }).catch(() => setRounds([]));
  }, []);
  const [entered, setEntered] = useState<{ title: string; starts_at: string; timezone: string; state: string } | null>(null);
  const [len, setLen] = useState<number | null>(null);
  // The cover: a moment the creator scrubs to. It's what voters see first.
  const [preview, setPreview] = useState<string | null>(null);
  const [coverAt, setCoverAt] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const atCap = quota.remaining === 0;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending");
    const c = sb();
    if (!c) { setTimeout(() => setState("sent"), 600); return; }
    try {
      let storage_path: string | null = null;
      const file = f.get("file") as File | null;

      // Ask before uploading. The database enforces the weekly cap anyway, but
      // only once the row goes in — by which point up to 600 MB is already in
      // storage, and a refused row would leave it there forever.
      if (!roundId) throw new Error("NO_OPEN_ROUND");
      const { data: q } = await c.rpc("my_submission_quota", { p_contest: roundId });
      if (q && (q as { remaining: number }).remaining <= 0) throw new Error("WEEKLY_LIMIT");

      if (mode === "file" && file && file.size) {
        if (file.size >= MAX_BYTES) throw new Error("That file is 600 MB or over. Clips have to come in under 600 MB — trim it or paste a link instead.");
        storage_path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const up = await c.storage.from("clips").upload(storage_path, file);
        if (up.error) throw up.error;
      }
      const { data: clip, error } = await c.from("clips").insert({
        contest_id: roundId, owner_id: userId, submitted_by: userId,
        title: f.get("title"), platform: f.get("platform"), gamertag: f.get("gamertag"),
        storage_path, source_url: mode === "link" ? f.get("url") : null,
        for_contest: true, duration_seconds: len == null ? null : Math.round(len), idem_key: idemKey.current,
      }).select("id, contest_id").single();
      if (error) {
        // The row was refused, so nothing will ever point at the file. Take it back.
        if (storage_path) await c.storage.from("clips").remove([storage_path]);
        throw error;
      }
      // A poster frame for the grids. Best effort: a clip with no thumbnail still plays.
      if (mode === "file" && file && file.size && clip?.id) {
        const jpg = await grabFrame(file, coverAt).catch(() => null);
        if (jpg) await c.storage.from("thumbs").upload(`${userId}/${clip.id}.jpg`, jpg, { contentType: "image/jpeg", upsert: true });
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
      if (clip?.contest_id) {
        const { data: rs } = await c.rpc("round_status");
        const r = ((rs ?? []) as { id: string; title: string; starts_at: string; timezone: string; state: string }[]).find((x) => x.id === clip.contest_id);
        if (r) setEntered(r);
      }
      idemKey.current = crypto.randomUUID();
      refreshQuota();
      setState("sent");
    } catch (x) {
      const m = (x as Error).message;
      refreshQuota();
      if (m.includes("DUPLICATE_SUBMISSION")) { idemKey.current = crypto.randomUUID(); setState("sent"); return; }
      setErr(m.includes("WEEKLY_LIMIT") ? `You have used all ${quota.allowance} submissions for this contest week. Your next allowance starts ${resetLabel(quota.resets_at)}.`
           : m.includes("ROUND_CLOSED") ? "Entries for that contest week have just closed. Pick the next one and send it again."
           : m.includes("NO_OPEN_ROUND") ? "No contest week is taking entries right now. Try again soon."
           : m.includes("CLIP_TOO_LONG") ? "That clip is too long."
           : m);
      setState("error");
    }
  }

  if (state === "sent") return (
    <div className="mt-10 rounded-lg border border-gulf border-2 bg-ink p-6">
      <p className="display text-4xl">Clip received</p>
      {entered && (
        <p className="mt-2 font-bold">
          {entered.state === "scheduled"
            ? <>Submitted for the next weekly round. Status: Pending review. Voting opens {new Date(entered.starts_at).toLocaleString(undefined, { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: entered.timezone })} ({entered.timezone.replace("_", " ")} time).</>
            : <>Submitted for {entered.title}. Status: Pending review.</>}
        </p>
      )}
      <p className="mt-2 text-haze">It&apos;s in the review queue now. Staff review every submission, and only approved clips make the final contest cut. You&apos;ll get an email either way, usually within a day. Until then it shows as <b className="text-foam">Pending review</b> on your dashboard.</p>
      <div className="mt-5 flex gap-3"><Link href="/dashboard" className="btn btn-hot">Open my dashboard</Link><button className="btn btn-ghost" onClick={() => setState("idle")}>Send another</button></div>
    </div>
  );

  return (
    <form onSubmit={submit} className="send-form mt-8 grid gap-5 [&>*]:min-w-0">
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
              onChange={async (e) => { const f = e.target.files?.[0]; setLen(f ? await durationOf(f) : null);
                if (preview) URL.revokeObjectURL(preview); setPreview(f ? URL.createObjectURL(f) : null); setCoverAt(1); }}
              className="field file:mr-4 file:rounded file:border-0 file:bg-flamingo file:px-3 file:py-1.5 file:font-bold file:text-white" />
          : <input name="url" type="url" required className="field" placeholder="YouTube, TikTok, Twitch clip or PlayStation share link" />}
        {mode === "file" && preview && len != null && (
          <div className="cover-pick mt-3">
            <span className="text-sm font-bold">Pick the cover moment</span>
            <video src={preview} muted playsInline preload="auto" className="mt-2 w-full max-w-md rounded-lg border-2 border-line bg-black aspect-video"
              ref={(v) => { if (v && Math.abs(v.currentTime - coverAt) > 0.2) v.currentTime = coverAt; }} />
            <input type="range" min={0} max={Math.max(0, Math.floor(len * 10) / 10 - 0.1)} step={0.1} value={coverAt}
              onChange={(e) => setCoverAt(Number(e.target.value))} className="mt-2 w-full max-w-md" aria-label="Cover moment" />
            <p className="text-xs text-haze">At {mmss(coverAt)} — this frame is the thumbnail people see before they press play.</p>
          </div>
        )}
        {len != null && (
          <p className="text-sm mt-1.5 font-semibold text-gulf">{mmss(len)}{len < 60 || len > 180 ? " · 1 to 3 minutes works best" : ""}</p>
        )}
      </div>
      <TagPicker value={tags} onChange={setTags} />
      <fieldset className="round-pick">
        <legend>Which contest week?</legend>
        {rounds === null ? <p className="text-sm text-haze">Looking up the rounds…</p> : (
          <div className="grid gap-2">
            {rounds.map((r) => (
              <label key={r.id} className={`round-opt${roundId === r.id ? " on" : ""}`}>
                <input type="radio" name="round" value={r.id} checked={roundId === r.id}
                  onChange={() => setRoundId(r.id)} />
                <span>
                  <b>{r.title}</b>
                  <small>
                    Open until {new Date(r.voting_closes).toLocaleString(undefined,
                      { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Toronto", timeZoneName: "short" })}
                  </small>
                </span>
              </label>
            ))}
          </div>
        )}
        {rounds !== null && rounds.length === 0 && (
          <p className="text-sm text-haze mt-1">
            No contest week is taking entries right now. Check back soon: a new week opens every Thursday.
          </p>
        )}
      </fieldset>
      {/* Same two-line shape as the entry tick above it, so the pair line up. */}
      <label className="flex gap-3 items-start text-sm">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 accent-[var(--flamingo)]" />
        <span>I confirm this is my own gameplay.
          <span className="block text-haze">
            I&apos;ve read the <Link href="/rules" className="rules-link">contest rules</Link>.
          </span></span>
      </label>
      {state === "error" && <p role="alert" className="text-flamingo font-semibold">{err}</p>}
      {atCap && (
        <p role="alert" className="rounded-lg border-2 border-mango bg-mango/20 px-4 py-3 font-semibold">
          You have used all {quota.allowance} submissions for this contest week. Your next allowance starts {resetLabel(quota.resets_at)}.{" "}
          <Link href="/pricing" className="underline">Members get more</Link>.
        </p>
      )}
      {!agreed && (
        <p className="send-gate">
          <span aria-hidden>☐</span>
          Tick the box above to send your clip — we can&apos;t publish it without your say-so.
        </p>
      )}
      <button disabled={state === "sending" || atCap || !agreed || !roundId}
        className="btn btn-hot w-fit disabled:opacity-60">
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

/** One frame, a second in (or a third of the way for very short clips), as a 640px JPEG. */
function grabFrame(file: File, at?: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    const u = URL.createObjectURL(file);
    const done = (b: Blob | null) => { URL.revokeObjectURL(u); resolve(b); };
    v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = u;
    v.onloadedmetadata = () => { v.currentTime = at != null ? Math.min(at, Math.max(0, (v.duration || 1) - 0.1)) : Math.min(1, (v.duration || 3) / 3); };
    v.onseeked = () => {
      const w = 640, h = Math.round((v.videoHeight / v.videoWidth) * w) || 360;
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      cv.getContext("2d")?.drawImage(v, 0, 0, w, h);
      cv.toBlob((b) => done(b), "image/jpeg", 0.8);
    };
    v.onerror = () => done(null);
    setTimeout(() => done(null), 8000);
  });
}
