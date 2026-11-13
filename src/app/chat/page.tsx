"use client";
import { useCallback, useEffect, useRef, useState } from "react";
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
];

/** Rendered only after mount: the server has no idea what timezone the reader is in,
 *  and formatting it during SSR makes React throw a hydration mismatch. */
const TONE: Record<string, string> = { lobby: "#00704a", clips: "#c7248a", trending: "#e8590c", members: "#2f6fe0", kingpins: "#b8860b" };
const tone = (id: string) => TONE[id] ?? "#00704a";

function Time({ iso }: { iso: string }) {
  const [text, setText] = useState("");
  useEffect(() => { setText(new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })); }, [iso]);
  return <span className="text-xs text-haze" suppressHydrationWarning>{text}</span>;
}

export default function Chat() {
  const { user, profile, paying, demo, loading } = useUser();
  const myRank = paying ? tierById(profile?.tier).rank : 0;

  const [channels, setChannels] = useState<Channel[]>(FALLBACK);
  const [active, setActive] = useState("lobby");
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState("");
  const [here, setHere] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

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
    if (!c) { setMsgs(DEMO.filter((m) => m.channel_id === active)); return; }
    // chat_feed carries each author's public face: plan, stars, best badge.
    const { data, error } = await c.rpc("chat_feed", { p_channel: active, p_limit: 80 });
    if (error) setErr("Couldn't load messages. Try again in a moment.");
    setMsgs((data ?? []) as Message[]);
    setLoaded(true);
  }, [active]);

  useEffect(() => { setLoaded(false); load(); }, [load]);

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

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !user) return;
    setDraft(""); setErr("");
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <DemoNote />
      <h1 className="display text-6xl md:text-7xl">Chat</h1>
      <p className="text-haze mt-2">{user && profile ? <>You&apos;re in as <strong className="text-foam">{profile.display_name}</strong>. Your plan and best badge show next to your name.</> : "Read along signed out. Sign in to talk; your plan and badges show next to your name."}</p>

      <div className="mt-8 grid gap-5 md:grid-cols-[15rem_1fr] items-start">
        <nav aria-label="Channels" className="grid gap-1.5 md:sticky md:top-24">
          {channels.map((ch) => {
            const shut = ch.members_only && myRank < ch.min_rank;
            return (
              <button key={ch.id} onClick={() => setActive(ch.id)} aria-current={ch.id === active}
                style={{ "--tone": tone(ch.id) } as React.CSSProperties}
                className={`chat-room ${ch.id === active ? "is-on" : ""}`}>
                <span className="flex items-center gap-2">
                  <span className="text-haze" aria-hidden>#</span>
                  <span className="flex-1 min-w-0 truncate">{ch.label}</span>
                  {shut && <span className="text-xs text-haze" title="Members only" aria-label="Members only">🔒</span>}
                </span>
                {ch.description && <span className="block text-xs font-normal text-haze mt-0.5 truncate">{ch.description}</span>}
              </button>
            );
          })}
        </nav>

        <section className="chat-panel flex flex-col min-h-[32rem]" style={{ "--tone": tone(channel.id) } as React.CSSProperties}>
          <header className="chat-head">
            <div className="min-w-0">
              <h2 className="display text-2xl md:text-3xl truncate"># {channel.label}</h2>
              {channel.description && <p className="text-sm opacity-85 truncate">{channel.description}</p>}
            </div>
            <span className="chat-live"><span className="rec" aria-hidden />{here > 0 ? `${here} here now` : "Live"}</span>
          </header>

          {locked ? (
            <div className="flex-1 grid place-items-center p-8 text-center">
              <div>
                <p className="display text-4xl">{needed?.label} and up</p>
                <p className="text-haze mt-2 max-w-sm">Chat is for Street, Hustler and Kingpin members.</p>
                <Link href="/pricing" className="btn btn-hot mt-5">See the plans</Link>
              </div>
            </div>
          ) : (
            <>
              <ol className="flex-1 overflow-y-auto max-h-[28rem] px-5 py-4 grid gap-3.5 content-start">
                {!loaded && !demo && <li className="text-haze">Loading…</li>}
                {loaded && msgs.length === 0 && <li className="text-haze">Nothing here yet. Say something.</li>}
                {msgs.map((m) => {
                  const t = tierById(m.tier);
                  const me = user?.id === m.author_id;
                  return (
                    <li key={m.id} className={`chat-msg ${me ? "is-me" : ""}`}>
                      <TierMedal tier={t.id} className="chat-medal" />
                      <div className="min-w-0">
                        <p className="text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-black">{m.display_name}</span>
                          {m.verified && <span className="chat-check" title="Gamertag verified" aria-label="Gamertag verified">✓</span>}
                          {m.is_staff && <span className="chat-chip chip-staff">Staff</span>}
                          {t.rank > 0 && <span className={`chat-chip chip-${t.id}`}>{t.label}{m.stars > 0 && <> {"★".repeat(m.stars)}</>}</span>}
                          {m.top_badge_label && <span className={`chat-chip chip-badge ${/_gold$/.test(m.top_badge ?? "") ? "is-gold" : ""}`}
                            title={`${m.badge_count} badge${m.badge_count === 1 ? "" : "s"}`}>{m.top_badge_label}{m.badge_count > 1 && <span className="opacity-70"> +{m.badge_count - 1}</span>}</span>}
                          <Time iso={m.created_at} />
                        </p>
                        <p className="break-words">{m.body}</p>
                      </div>
                    </li>
                  );
                })}
                <div ref={endRef} />
              </ol>

              <form onSubmit={send} className="border-t border-line p-3 flex gap-2">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={2000}
                  disabled={!user} className="field" aria-label={`Message #${channel.label}`}
                  placeholder={loading ? "Checking your account…" : user ? `Message #${channel.label} as ${profile?.display_name ?? "you"}` : "Sign in to chat"} />
                <button disabled={!user || !draft.trim()} className="btn btn-hot shrink-0 disabled:opacity-60">Send</button>
              </form>
              {!loading && !user && <p className="px-4 pb-3 text-sm text-haze"><Link href="/login?next=/chat" className="text-gulf underline">Sign in</Link> to join in. It&apos;s free.</p>}
              {err && <p role="alert" className="px-4 pb-3 text-sm text-flamingo font-semibold">{err}</p>}
              
            </>
          )}
        </section>
      </div>
    </div>
  );
}
