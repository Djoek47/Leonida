"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { platformName, type Clip } from "@/lib/api";

/** The public Featured Clips row. Each placement runs 24 hours from the
 *  moment it went live, tracked on the server; when it ends the clip simply
 *  drops out of this row and stays everywhere else. Nothing here when the
 *  feature is switched off or nobody is featured. */
export function FeaturedRow() {
  const [clips, setClips] = useState<Clip[]>([]);
  useEffect(() => {
    const c = sb(); if (!c) return;
    const load = () => c.rpc("featured_now").then(({ data }) => setClips((data ?? []) as Clip[]));
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);
  if (!clips.length) return null;
  return (
    <section className="featured-row" aria-label="Featured Clips">
      <h2 className="money-h !mt-8">Featured Clips</h2>
      <ul className="featured-scroll">
        {clips.map((c) => (
          <li key={c.id}>
            <a href={`#clip-${c.id}`} className="featured-card">
              <span className="featured-tag">Featured</span>
              <b>{c.title}</b>
              <small>{c.gamertag} on {(platformName as Record<string, string>)[c.platform] ?? c.platform}</small>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
