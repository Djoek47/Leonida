"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

const TOPICS: [string, string, string][] = [
  ["account", "Account & sign-in", "Can't sign in, email change, gamertag proof"],
  ["payments", "Payments & payouts", "Plans, receipts, wallet, cash-outs, prizes"],
  ["clips", "My clips", "Upload, review status, takedown, downloads"],
  ["voting", "Voting & rounds", "Weekly rounds, vote balance, results"],
  ["bug", "Something's broken", "A page or button not doing what it should"],
  ["other", "Something else", ""],
];
// Answers people need most, shown before the form so many never have to send it.
const QUICK: Record<string, [string, string][]> = {
  payments: [["When do I get download money?", "Download earnings become available after the earning month ends, at midnight on the 1st (Toronto time)."], ["When is a weekly prize paid?", "Weekly prizes are processed after the winner is announced and valid payment details are provided."]],
  voting: [["When does a round open and close?", "Rounds open Thursday at noon. Entries close the next Wednesday at noon; voting ends just before Thursday noon."], ["Why can't I vote on a clip?", "Only approved clips in the open weekly round take votes, and one vote per clip, for good."]],
  clips: [["How long does review take?", "Usually within a day. You get an email either way."], ["Limits?", "Under 2 minutes and under 600 MB, up to 3 tags."]],
};
type Mine = { ref: string; subject: string; status: string; reply: string | null; created_at: string };

export default function Support() {
  const { user, profile } = useUser();
  const [topic, setTopic] = useState("account");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [err, setErr] = useState("");
  const [ref, setRef] = useState("");
  const [mine, setMine] = useState<Mine[]>([]);
  useEffect(() => { if (user?.email) setEmail(user.email); }, [user]);
  useEffect(() => {
    const c = sb(); if (!c || !user) return;
    c.from("support_tickets").select("ref,subject,status,reply,created_at").order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => setMine((data ?? []) as Mine[]));
  }, [user, state]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const c = sb(); if (!c) { setState("sent"); setRef("DEMO01"); return; }
    setState("busy"); setErr("");
    // Context staff would otherwise have to ask for. Nothing secret.
    const context = { page: document.referrer || null, ua: navigator.userAgent, tier: profile?.tier ?? null, gamertag: profile?.gamertag ?? null, at: new Date().toISOString() };
    const { data, error } = await c.rpc("submit_support", { p_email: email, p_topic: topic, p_subject: subject, p_message: message, p_context: context });
    if (error) {
      const m = error.message;
      setErr(m.includes("TOO_SHORT") ? "Add a little more detail so we can help." : m.includes("BAD_EMAIL") ? "That email doesn't look right." : m.includes("SLOW_DOWN") ? "You've sent a few already — we'll get to them. Try again in an hour." : "That didn't send. Try again.");
      setState("error"); return;
    }
    setRef(String(data)); setState("sent"); setSubject(""); setMessage("");
  }

  return (
    <div className="dash dash-free">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="dash-kicker">Help desk</p>
        <h1 className="display text-[clamp(2.4rem,8vw,4.6rem)] leading-none">Support</h1>
        <p className="mt-3 max-w-2xl text-haze">A real person on the team reads every request in our console and replies by email. Pick what it&apos;s about and we&apos;ll have the details we need.</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <form onSubmit={send} className="set-card p-6 grid gap-5">
            <fieldset className="grid gap-2 sm:grid-cols-2">
              <legend className="mb-2 font-bold">What&apos;s it about?</legend>
              {TOPICS.map(([k, label, sub]) => (
                <label key={k} className={`round-opt${topic === k ? " on" : ""}`}>
                  <input type="radio" name="topic" checked={topic === k} onChange={() => setTopic(k)} />
                  <span><b>{label}</b>{sub && <small>{sub}</small>}</span>
                </label>
              ))}
            </fieldset>
            {QUICK[topic] && (
              <details className="rounded-lg border-2 border-line p-4" open>
                <summary className="font-bold cursor-pointer">Quick answers</summary>
                <dl className="mt-3 grid gap-3 text-sm">{QUICK[topic].map(([q, a]) => <div key={q}><dt className="font-bold">{q}</dt><dd className="text-haze">{a}</dd></div>)}</dl>
              </details>
            )}
            <label className="grid gap-1.5"><span className="font-bold">Your email</span>
              <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
            <label className="grid gap-1.5"><span className="font-bold">Subject</span>
              <input className="field" required minLength={3} maxLength={140} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" /></label>
            <label className="grid gap-1.5"><span className="font-bold">What happened?</span>
              <textarea className="field min-h-[9rem]" required minLength={10} maxLength={4000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What you did, what you expected, what you saw instead." /></label>
            <button className="btn btn-hot justify-center" disabled={state === "busy"}>{state === "busy" ? "Sending…" : "Send to support"}</button>
            {state === "sent" && <p role="status" className="font-semibold text-gulf">Sent. Your ticket is <b>{ref}</b>{user ? " — we've emailed you a copy." : "."}</p>}
            {state === "error" && <p role="alert" className="font-semibold text-flamingo">{err}</p>}
          </form>

          <aside className="grid content-start gap-4">
            <div className="set-card p-5">
              <h2 className="font-black">Email</h2>
              <p className="mt-1 text-sm text-haze">Prefer email? Write to <a className="font-bold text-gulf underline" href="mailto:support@livefromleonida.com">support@livefromleonida.com</a>.</p>
            </div>
            {user && (
              <div className="set-card p-5">
                <h2 className="font-black">Your requests</h2>
                {mine.length === 0 ? <p className="mt-1 text-sm text-haze">None yet.</p> : (
                  <ul className="mt-2 grid gap-3">{mine.map((t) => (
                    <li key={t.ref} className="text-sm"><b>{t.subject}</b> <span className={`feat-chip ${t.status === "open" ? "scheduled" : "active"}`}>{t.status}</span>
                      <p className="text-haze text-xs">#{t.ref} · {new Date(t.created_at).toLocaleDateString()}</p>
                      {t.reply && <p className="mt-1 rounded bg-ink-2 p-2">{t.reply}</p>}</li>
                  ))}</ul>
                )}
              </div>
            )}
            <p className="text-sm text-haze">Rules and payouts are explained in the <Link className="underline" href="/rules">contest rules</Link>.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
