"use client";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { tierById, TIERS } from "@/lib/tiers";
import { DemoNote } from "@/components/DemoNote";
import { TierMedal } from "@/components/TierMedal";

type Channel = { id: string; label: string; description: string | null; members_only: boolean; min_rank: number; position: number };
type Message = { id: number; channel_id: string; author_id: string; body: string; created_at: string;
  display_name: string; tier: string; stars: number; verified: boolean;
  top_badge: string | null; top_badge_label: string | null; badge_count: number; is_staff: boolean };

const FALLBACK: Channel[] = [
  { id: "lobby", label: "The Lobby", description: "Everyone. Say hello.", members_only: true, min_rank: 1, position: 1 },
  { id: "clips", label: "Clip talk", description: "This week's round, picks and arguments.", members_only: true, min_rank: 1, position: 2 },
  { id: "voting", label: "Voting", description: "Talk through this week's vote.", members_only: true, min_rank: 1, position: 3 },
  { id: "trending", label: "Trending", description: "Daily Drop winners and what's climbing.", members_only: true, min_rank: 1, position: 4 },
  { id: "members", label: "Members", description: "Street, Hustler and Kingpin.", members_only: true, min_rank: 1, position: 5 },
];

const DEMO: Message[] = [
  { id: 1, channel_id: "lobby", author_id: "a", body: "that bridge jump into the Keys is the clip of the year already", created_at: new Date(Date.now() - 42e5).toISOString(), display_name: "KeysKingpin", tier: "hustler", stars: 2, verified: true, top_badge: "week_gold", top_badge_label: "Clip of the Week", badge_count: 4, is_staff: false },
  { id: 2, channel_id: "lobby", author_id: "b", body: "nah the airboat one. he never touches the brake once", created_at: new Date(Date.now() - 39e5).toISOString(), display_name: "SwampSaint", tier: "free", stars: 0, verified: false, top_badge: "clipper_1", top_badge_label: "First Clip", badge_count: 1, is_staff: false },
  { id: 3, channel_id: "lobby", author_id: "b", body: "watch the third second, the whole thing lands on one wheel", created_at: new Date(Date.now() - 385e4).toISOString(), display_name: "SwampSaint", tier: "free", stars: 0, verified: false, top_badge: "clipper_1", top_badge_label: "First Clip", badge_count: 1, is_staff: false },
  { id: 4, channel_id: "lobby", author_id: "c", body: "welcome in. votes lock when the round opens, so pick early", created_at: new Date(Date.now() - 12e5).toISOString(), display_name: "Smugg", tier: "kingpin", stars: 3, verified: true, top_badge: "week_gold", top_badge_label: "Clip of the Week", badge_count: 6, is_staff: true },
];

const TONE: Record<string, string> = { lobby: "#00704a", clips: "#c7248a", trending: "#e8590c", members: "#2f6fe0", kingpins: "#b8860b" };
const tone = (id: string) => TONE[id] ?? "#00704a";

/** Rendered only after mount: the server has no idea what timezone the reader is in,
 *  and formatting it during SSR makes React throw a hydration mismatch. */
function Time({ iso, className = "cx-time" }: { iso: string; className?: string }) {
  const [text, setText] = useState("");
  useEffect(() => { setText(new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })); }, [iso]);
  return <time dateTime={iso} className={className} suppressHydrationWarning>{text}</time>;
}

const dayKey = (iso: string) => new Date(iso).toDateString();
function dayLabel(iso: string) {
  const d = new Date(iso), now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}
const GROUP_MS = 5 * 60 * 1000;   // same author within five minutes reads as one run

/** Starters for an empty room, so nobody stares at a blank box. */
const STARTERS: Record<string, string[]> = {
  lobby: ["Hey everyone", "What are you playing right now?", "First time here"],
  clips: ["Which clip are you backing this week?", "Best clip you've seen today?"],
  voting: ["Who's got my vote this week?", "That last clip deserves first place"],
  trending: ["What's climbing today?", "Daily Drop winner looks unbeatable"],
  members: ["Hello from the members' room"],
};

export default function Chat() {
  const { user, profile, paying, demo, loading } = useUser();
  const [preview, setPreview] = useState(false);   // dev only: ?preview shows the members' view without signing in
  useEffect(() => { if (process.env.NODE_ENV !== "production") setPreview(location.search.includes("preview")); }, []);
  const previewRef = useRef(false); previewRef.current = preview;
  const myRank = paying || preview ? Math.max(1, tierById(profile?.tier).rank) : 0;

  const [channels, setChannels] = useState<Channel[]>(FALLBACK);
  const [active, setActive] = useState("lobby");
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState("");
  const [here, setHere] = useState(0);
  const [away, setAway] = useState(false);          // scrolled up, with newer messages below
  const listRef = useRef<HTMLOListElement>(null);
  const stick = useRef(true);                       // follow the newest message while the reader is at the bottom
  const lastId = useRef<number | null>(null);

  const channel = channels.find((c) => c.id === active) ?? channels[0];
  const locked = channel.members_only && myRank < channel.min_rank;
  const needed = TIERS.find((t) => t.rank === channel.min_rank);

  useEffect(() => {
    const c = sb(); if (!c) return;
    c.from("chat_channels").select("*").eq("archived", false).order("position")
      .then(({ data }) => data?.length && setChannels(data as Channel[]));
  }, []);

  const load = useCallback(async () => {
    const c = sb();
    if (!c || preview) { setMsgs(DEMO.filter((m) => m.channel_id === active)); setErr(""); setLoaded(true); return; }
    // chat_feed carries each author's public face: plan, stars, best badge.
    const { data, error } = await c.rpc("chat_feed", { p_channel: active, p_limit: 80 });
    if (previewRef.current) return;   // dev preview switched on while this was in flight
    if (error) setErr("Couldn't load messages. Try again in a moment.");
    setMsgs((data ?? []) as Message[]);
    setLoaded(true);
  }, [active, preview]);

  useEffect(() => { setLoaded(false); stick.current = true; lastId.current = null; setAway(false); load(); }, [load]);

  // Live fan-out, so a message shows up without a refresh.
  useEffect(() => {
    const c = sb(); if (!c) return;
    const key = user?.id ?? `guest-${Math.random().toString(36).slice(2)}`;
    const sub = c.channel(`chat:${active}`, { config: { presence: { key } } })
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${active}` },
        () => load())
      .on("presence", { event: "sync" }, () => setHere(Object.keys(sub.presenceState()).length))
      .subscribe((status) => { if (status === "SUBSCRIBED") sub.track({ at: Date.now() }); });
    return () => { c.removeChannel(sub); };
  }, [active, load, user?.id]);

  // Stay at the bottom only if the reader is there; otherwise offer a way down.
  useEffect(() => {
    const el = listRef.current; if (!el) return;
    const newest = msgs[msgs.length - 1]?.id ?? null;
    const fresh = newest !== lastId.current;
    const mine = msgs[msgs.length - 1]?.author_id === user?.id;
    if (stick.current || (fresh && mine)) { el.scrollTop = el.scrollHeight; setAway(false); }
    else if (fresh && lastId.current !== null) setAway(true);
    lastId.current = newest;
  }, [msgs, user?.id]);

  function onScroll() {
    const el = listRef.current; if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stick.current = atBottom;
    if (atBottom) setAway(false);
  }
  const toBottom = () => { const el = listRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); };

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !user) return;
    setDraft(""); setErr(""); stick.current = true;
    const c = sb();
    if (!c) {
      setMsgs((m) => [...m, { id: Date.now(), channel_id: active, author_id: user.id, body, created_at: new Date().toISOString(),
        display_name: profile?.display_name ?? "You", tier: profile?.tier ?? "free", stars: 0, verified: false,
        top_badge: null, top_badge_label: null, badge_count: 0, is_staff: false }]);
      return;
    }
    const { error } = await c.from("chat_messages").insert({ channel_id: active, author_id: user.id, body });
    if (error) { setErr(locked ? "This room is for members." : "Your message didn't send. Try again."); setDraft(body); return; }
    load();
  }

  const starters = STARTERS[active] ?? STARTERS.lobby;
  const near = draft.length > 1800;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <DemoNote />
      <header className="cx-hero">
        <div>
          <h1 className="display text-6xl md:text-7xl">Chat</h1>
          <p className="cx-sub">{user && profile
            ? <>You&apos;re in as <strong>{profile.display_name}</strong>. Your plan and stars show next to your name.</>
            : "Read along signed out. Sign in to talk; your plan and stars show next to your name."}</p>
        </div>
        <span className="cx-pulse"><span className="rec" aria-hidden />{here > 0 ? `${here} here now` : "Live"}</span>
      </header>

      <div className="cx-shell">
        <nav aria-label="Channels" className="cx-rail">
          <p className="cx-rail-k">Rooms</p>
          <div className="cx-rooms">
            {channels.map((ch) => {
              const shut = ch.members_only && myRank < ch.min_rank;
              return (
                <button key={ch.id} onClick={() => setActive(ch.id)} aria-current={ch.id === active}
                  style={{ "--tone": tone(ch.id) } as React.CSSProperties}
                  className={`cx-room ${ch.id === active ? "is-on" : ""}`}>
                  <span className="cx-room-dot" aria-hidden>#</span>
                  <span className="cx-room-txt">
                    <b>{ch.label}</b>
                    {ch.description && <small>{ch.description}</small>}
                  </span>
                  {shut && <span className="cx-lock" title="Members only" aria-label="Members only">🔒</span>}
                </button>
              );
            })}
          </div>
        </nav>

        <section className="cx-panel" style={{ "--tone": tone(channel.id) } as React.CSSProperties}>
          <header className="cx-head">
            <span className="cx-head-dot" aria-hidden>#</span>
            <div className="min-w-0">
              <h2 className="display truncate">{channel.label}</h2>
              {channel.description && <p>{channel.description}</p>}
            </div>
          </header>

          {locked ? (
            <div className="cx-locked">
              <div>
                <p className="display text-4xl">{needed?.label} and up</p>
                <p className="text-haze mt-2 max-w-sm mx-auto">Chat is for Street, Hustler and Kingpin members.</p>
                <Link href="/pricing" className="btn btn-hot mt-5">See the plans</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="cx-stage">
                <ol ref={listRef} onScroll={onScroll} className="cx-list" role="log" aria-live="polite" aria-label={`${channel.label} messages`}>
                  {!loaded && !demo && <li className="cx-note">Loading…</li>}
                  {loaded && msgs.length === 0 && (
                    <li className="cx-empty">
                      <span className="cx-empty-mark" aria-hidden>#</span>
                      <p className="display text-3xl">Quiet in here</p>
                      <p className="text-haze">Be the first to say something in {channel.label}.</p>
                      {user && <div className="cx-starters">
                        {starters.map((t) => <button key={t} type="button" onClick={() => setDraft(t)}>{t}</button>)}
                      </div>}
                    </li>
                  )}
                  {msgs.map((m, i) => {
                    const prev = msgs[i - 1];
                    const newDay = !prev || dayKey(prev.created_at) !== dayKey(m.created_at);
                    const run = !!prev && !newDay && prev.author_id === m.author_id
                      && new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_MS;
                    const t = tierById(m.tier);
                    const me = user?.id === m.author_id;
                    return (
                      <Fragment key={m.id}>
                        {newDay && <li className="cx-day" aria-hidden><span>{dayLabel(m.created_at)}</span></li>}
                        <li className={`cx-msg ${me ? "is-me" : ""} ${run ? "is-run" : ""}`}>
                          {run
                            ? <Time iso={m.created_at} className="cx-time cx-time-side" />
                            : <TierMedal tier={t.id} className="cx-medal" />}
                          <div className="min-w-0">
                            {!run && (
                              <p className="cx-who">
                                <span className="cx-name">{m.display_name}</span>
                                {m.verified && <span className="chat-check" title="Gamertag verified" aria-label="Gamertag verified">✓</span>}
                                {m.is_staff && <span className="chat-chip chip-staff">Staff</span>}
                                {t.rank > 0 && <span className={`chat-chip chip-${t.id}`}>{t.label}</span>}
                                {m.stars > 0
                                  ? <span className="chat-chip chip-stars" title={`${m.stars} star${m.stars === 1 ? "" : "s"}`} aria-label={`${m.stars} star${m.stars === 1 ? "" : "s"}`}>
                                      <span aria-hidden>★</span> {m.stars}
                                    </span>
                                  : m.top_badge_label && <span className={`chat-chip chip-badge ${/_gold$/.test(m.top_badge ?? "") ? "is-gold" : ""}`}
                                      title={`${m.badge_count} badge${m.badge_count === 1 ? "" : "s"}`}>{m.top_badge_label}{m.badge_count > 1 && <span className="opacity-70"> +{m.badge_count - 1}</span>}</span>}
                                <Time iso={m.created_at} />
                              </p>
                            )}
                            <p className="cx-body">{m.body}</p>
                          </div>
                        </li>
                      </Fragment>
                    );
                  })}
                </ol>
                {away && <button type="button" className="cx-jump" onClick={toBottom}>New messages ↓</button>}
              </div>

              <form onSubmit={send} className="cx-composer">
                <div className="cx-box">
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={2000}
                    disabled={!user} aria-label={`Message #${channel.label}`} autoComplete="off"
                    placeholder={loading ? "Checking your account…" : user ? `Message #${channel.label}` : "Sign in to chat"} />
                  {near && <span className="cx-count" aria-live="polite">{2000 - draft.length}</span>}
                  <button disabled={!user || !draft.trim()} className="cx-send" aria-label="Send message">
                    <span>Send</span>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.3 10l12 2-12 2z" fill="currentColor" /></svg>
                  </button>
                </div>
                {!loading && !user && <p className="cx-fine"><Link href="/login?next=/chat" className="underline">Sign in</Link> to join in. It&apos;s free.</p>}
                {err && <p role="alert" className="cx-fine text-flamingo font-semibold">{err}</p>}
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
