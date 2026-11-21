"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { sb } from "@/lib/supabase";

type Msg = { id: number; sender_id: string; body: string; created_at: string };

/** One buyer–seller conversation. Polls every few seconds while open. */
export function Thread({ threadId, me, otherName, role }: { threadId: string; me: string; otherName: string; role: "buyer" | "seller" }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    const c = sb(); if (!c) return;
    const { data } = await c.from("market_messages").select("id, sender_id, body, created_at").eq("thread_id", threadId).order("id").limit(300);
    if (data) setMsgs(data as Msg[]);
    await c.from("market_threads").update(role === "buyer" ? { buyer_seen_at: new Date().toISOString() } : { seller_seen_at: new Date().toISOString() }).eq("id", threadId);
  }, [threadId, role]);
  useEffect(() => { load(); const i = setInterval(load, 4000); return () => clearInterval(i); }, [load]);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [msgs.length]);
  const send = async () => {
    const b = text.trim(); if (!b) return;
    setErr("");
    const { error } = await sb()!.from("market_messages").insert({ thread_id: threadId, sender_id: me, body: b.slice(0, 1000) });
    if (error) { setErr("Couldn't send. Try again."); return; }
    setText(""); load();
  };
  return (
    <div className="mk-thread">
      <div className="mk-msgs" ref={box} aria-live="polite">
        {!msgs.length && <p className="mk-msgs-empty">{role === "buyer" ? `Ask ${otherName} anything before you buy: what happens, how long the best part is, the quality.` : "No messages yet."}</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`mk-msg${m.sender_id === me ? " is-me" : ""}`}>
            <p>{m.body}</p>
            <time>{new Date(m.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>
          </div>
        ))}
      </div>
      <form className="mk-send" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder={role === "buyer" ? `Message ${otherName}` : "Reply"} aria-label="Message" />
        <button className="btn btn-hot" disabled={!text.trim()}>Send</button>
      </form>
      {err && <p className="text-xs text-flamingo font-bold mt-1" role="alert">{err}</p>}
      <p className="mk-thread-note">Keep payment on Live From Leonida. Never pay a seller outside the site.</p>
    </div>
  );
}
