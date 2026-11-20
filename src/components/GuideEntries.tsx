"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";

type Entry = { id: string; topic: string; title: string; body: string; sources: string[]; published_at: string | null };
const host = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];

/** Guide entries written by the team in the console (Research tab). Free to read.
 *  Lines that start with "-" or "•" become bullet points; anything else is a paragraph. */
export function GuideEntries() {
  const [rows, setRows] = useState<Entry[]>([]);
  useEffect(() => {
    const c = sb(); if (!c) return;
    c.from("guide_entries").select("id, topic, title, body, sources, published_at").eq("published", true).order("published_at", { ascending: false }).limit(60)
      .then(({ data }) => setRows((data ?? []) as Entry[]));
  }, []);
  if (!rows.length) return null;
  return (
    <section className="mt-14" aria-labelledby="guide-latest">
      <h3 id="guide-latest" className="display text-4xl md:text-5xl">From the team</h3>
      <p className="mt-1 text-haze">Cheats, map finds and how-tos, checked and written up by us.</p>
      <ul className="guide-entries mt-6">
        {rows.map((e) => {
          const lines = e.body.split("\n").map((l) => l.trim()).filter(Boolean);
          const bullets = lines.filter((l) => /^[-•]/.test(l)).map((l) => l.replace(/^[-•]\s*/, ""));
          const paras = lines.filter((l) => !/^[-•]/.test(l));
          return (
            <li key={e.id} className="guide-entry">
              <span className="brief-mission">{e.topic}</span>
              <b className="text-lg leading-tight">{e.title}</b>
              {paras.map((p, i) => <p key={i} className="text-sm leading-relaxed">{p}</p>)}
              {bullets.length > 0 && <ul>{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
              {e.sources.length > 0 && <p className="text-xs text-haze">Sources: {e.sources.map((u) => <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="underline mr-2">{host(u)}</a>)}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
