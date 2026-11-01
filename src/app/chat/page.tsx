"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { tierById, TIERS } from "@/lib/tiers";
import { DemoNote } from "@/components/DemoNote";

type Channel = { id: string; label: string; description: string | null; members_only: boolean; min_rank: number; position: number };
type Message = { id: number; channel_id: string; author_id: string; body: string; created_at: string;
  author?: { display_name: string; tier: string } | null };

const FALLBACK: Channel[] = [
  { id: "lobby", label: "The Lobby", description: "Everyone. Say hello.", members_only: false, min_rank: 0, position: 1 },
  { id: "clips", label: "Clip talk", description: "This week's round, picks and arguments.", members_only: false, min_rank: 0, position: 2 },
  { id: "versus", label: "Versus", description: "Match calls and trash talk.", members_only: false, min_rank: 0, position: 3 },
  { id: "members", label: "Members", description: "Hustler and up.", members_only: true, min_rank: 1, position: 4 },
  { id: "kingpins", label: "Back room", description: "Kingpin and Cartel.", members_only: true, min_rank: 2, position: 5 },
];

const DEMO: Message[] = [
  { id: 1, channel_id: "lobby", author_id: "a", body: "that bridge jump into the Keys is the clip of the year already", created_at: new Date(Date.now() - 42e5).toISOString(), author: { display_name: "KeysKingpin", tier: "hustler" } },
  { id: 2, channel_id: "lobby", author_id: "b", body: "nah the airboat one. he never touches the brake once", created_at: new Date(Date.now() - 39e5).toISOString(), author: { display_name: "SwampSaint", tier: "street" } },
  { id: 3, channel_id: "lobby", author_id: "c", body: "both of you are wrong and I have 8 points to prove it", created_at: new Date(Date.now() - 20e5).toISOString(), author: { display_name: "NeonDrifter", tier: "cartel" } },
];

/** Rendered only after mount: the server has no idea what timezone the reader is in,
 *  and formatting it during SSR makes React throw a hydration mismatch. */
function Time({ iso }: { iso: string }) {
  const [text, setText] = useState("");
  useEffect(() => { setText(new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })); }, [iso]);
  return <span className="text-xs text-haze" suppressHydrationWarning>{text}</span>;
}

export default function Chat() {
  const { user, profile, paying, demo } = useUser();
  const myRank = paying ? tierById(profile?.tier).rank : 0;

  const [channels, setChannels] = useState<Channel[]>(FALLBACK);
  const [active, setActive] = useState("lobby");
  const [msgs, setMsgs] = useState<Message[]>(DEMO);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState("");
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
    const { data } = await c.from("chat_messages")
      .select("id,channel_id,author_id,body,created_at,author:profiles(display_name,tier)")
      .eq("channel_id", active).eq("deleted", false)
      .order("created_at", { ascending: false }).limit(80);
    setMsgs(((data ?? []) as unknown as Message[]).reverse());
  }, [active]);

  useEffect(() => { load(); }, [load]);

  // Live fan-out, so a message shows up without a refresh.
  useEffect(() => {
    const c = sb(); if (!c) return;
    const sub = c.channel(`chat:${active}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${active}` },
        () => load())
      .subscribe();
    return () => { c.removeChannel(sub); };
  }, [active, load]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !user) return;
    setDraft(""); setErr("");
    const c = sb();
    if (!c) {
      setMsgs((m) => [...m, { id: Date.now(), channel_id: active, author_id: "demo", body,
        created_at: new Date().toISOString(), author: { display_name: profile?.display_name ?? "You", tier: profile?.tier ?? "street" } }]);
      return;
    }
    const { error } = await c.from("chat_messages").insert({ channel_id: active, author_id: user.id, body });
    if (error) { setErr(error.message); setDraft(body); }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <DemoNote />
      <h1 className="display text-6xl md:text-7xl">Chat</h1>
      <p className="text-haze mt-2">Everything happens here on the site now. No separate server to join.</p>

      <div className="mt-8 grid gap-5 md:grid-cols-[15rem_1fr] items-start">
        <nav aria-label="Channels" className="grid gap-1.5 md:sticky md:top-24">
          {channels.map((ch) => {
            const shut = ch.members_only && myRank < ch.min_rank;
            return (
              <button key={ch.id} onClick={() => setActive(ch.id)} aria-current={ch.id === active}
                className={`rounded-lg px-3.5 py-2.5 text-left font-bold border-2 ${ch.id === active ? "border-gulf bg-ink" : "border-transparent hover:bg-ink"}`}>
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

        <section className="rounded-xl border-2 border-line bg-ink flex flex-col min-h-[32rem]">
          <header className="border-b border-line px-5 py-3">
            <h2 className="font-extrabold"># {channel.label}</h2>
            {channel.description && <p className="text-sm text-haze">{channel.description}</p>}
          </header>

          {locked ? (
            <div className="flex-1 grid place-items-center p-8 text-center">
              <div>
                <p className="display text-4xl">{needed?.label} and up</p>
                <p className="text-haze mt-2 max-w-sm">This room is for paying members. The Lobby, Clip talk and Versus are open to everyone.</p>
                <Link href="/pricing" className="btn btn-hot mt-5">See the plans</Link>
              </div>
            </div>
          ) : (
            <>
              <ol className="flex-1 overflow-y-auto max-h-[28rem] px-5 py-4 grid gap-3.5 content-start">
                {msgs.length === 0 && <li className="text-haze">Nothing here yet. Say something.</li>}
                {msgs.map((m) => {
                  const t = tierById(m.author?.tier);
                  return (
                    <li key={m.id} className="grid gap-0.5">
                      <p className="text-sm flex flex-wrap items-baseline gap-x-2">
                        <span className="font-black">{m.author?.display_name ?? "Player"}</span>
                        {t.rank > 0 && <span className="rounded-full bg-gulf text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">{t.label}</span>}
                        <Time iso={m.created_at} />
                      </p>
                      <p className="break-words">{m.body}</p>
                    </li>
                  );
                })}
                <div ref={endRef} />
              </ol>

              <form onSubmit={send} className="border-t border-line p-3 flex gap-2">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={2000}
                  disabled={!user} className="field" aria-label={`Message #${channel.label}`}
                  placeholder={user ? `Message #${channel.label}` : "Sign in to chat"} />
                <button disabled={!user || !draft.trim()} className="btn btn-hot shrink-0 disabled:opacity-60">Send</button>
              </form>
              {!user && <p className="px-4 pb-3 text-sm text-haze"><Link href="/login?next=/chat" className="text-gulf underline">Sign in</Link> to join in. It&apos;s free.</p>}
              {err && <p role="alert" className="px-4 pb-3 text-sm text-flamingo font-semibold">{err}</p>}
              {demo && <p className="px-4 pb-3 text-xs text-haze">Demo mode: messages stay in this browser tab.</p>}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
