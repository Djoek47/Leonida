"use client";
import { useEffect, useState } from "react";
import Link from "@/components/A";
import { PortraitClip } from "@/components/PortraitClip";
import { people } from "@/lib/content";
import { CAST, LEAD_ACTORS, type CastMember } from "@/lib/cast";

/** Everyone in the story, one board. The Prologue row holds Tomás and the eight faces Rockstar
 *  showed before launch; each chapter follows in story order. Chapters past Chapter 1 stay
 *  closed until you reach them in Mission Briefing (same chapter setting), or spoilers go on. */
const CH = ["Prologue", "Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4", "Chapter 5"];
const TONE = ["#8a8f98", "#00a86b", "#ff8a3d", "#ff3d8b", "#4bc9ff", "#c39bff"];
const initials = (n: string) => n.replace(/".*?"/g, "").split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("");

function CastCard({ c }: { c: CastMember }) {
  return (
    <article className="cast-card pb-card">
      <div className="relative aspect-square rounded-md overflow-hidden pb-photo" style={{ "--t": TONE[c.ch] } as React.CSSProperties}>
        {c.img
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={`/media/cast/${c.img}.webp`} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
          : <span className="pb-sil" aria-hidden><i>{initials(c.name)}</i></span>}
        <span className="pb-met">{c.met}</span>
      </div>
      <h3 className="name-tag display">{c.name}</h3>
      <p className="mt-3 text-haze text-[15px]">{c.role}</p>
      {c.actor && <p className="mt-1 text-xs font-bold text-haze">Voiced by {c.actor}</p>}
    </article>
  );
}

export function PeopleBoard() {
  const [reach, setReach] = useState(1);
  const [spoil, setSpoil] = useState(false);
  useEffect(() => { try { const v = Number(localStorage.getItem("lfl-chapter")); if (Number.isInteger(v) && v > 1) setReach(v); } catch {} }, []);
  const open = (ch: number) => spoil || ch <= reach;
  const chapters = [...new Set(CAST.filter((c) => c.ch > 0).map((c) => c.ch))].sort((a, b) => a - b);
  const hidden = CAST.filter((c) => !open(c.ch)).length;
  const tomas = CAST.filter((c) => c.ch === 0);

  return (
    <div className="pb">
      <div className="pb-bar">
        <p className="text-haze">Everyone you meet, in story order. {reach > 1 && !spoil ? `Open up to Chapter ${reach}, from your Mission Briefing progress.` : "Spoilers off shows the Prologue and Chapter 1."}</p>
        <button className={`cast-switch${spoil ? " is-on" : ""}`} onClick={() => setSpoil((v) => !v)} aria-pressed={spoil}>
          <span className="cast-switch-track"><i /></span>
          <span><b>Spoilers {spoil ? "on" : "off"}</b><small>{spoil ? "Everyone shown" : hidden ? `${hidden} people hidden` : "Nothing hidden"}</small></span>
        </button>
      </div>

      <section className="pb-ch">
        <p className="pb-k" style={{ "--t": TONE[0] } as React.CSSProperties}><span>Prologue</span>The faces you know</p>
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          {people.map((p) => (
            <article key={p.slug} className="cast-card">
              <div className="relative aspect-square rounded-md overflow-hidden bg-ink-2"><PortraitClip clip={p.video} name={p.name} /></div>
              <h3 className="name-tag display">{p.name}</h3>
              <p className="mt-3 text-haze text-[15px]">{p.line}</p>
              {p.slug in LEAD_ACTORS && <p className="mt-1 text-xs font-bold text-haze">Voiced by {LEAD_ACTORS[p.slug]}</p>}
            </article>
          ))}
          {tomas.map((c) => <CastCard key={c.name} c={c} />)}
        </div>
      </section>

      {chapters.map((ch) => {
        const list = CAST.filter((c) => c.ch === ch);
        return (
          <section key={ch} className="pb-ch">
            <p className="pb-k" style={{ "--t": TONE[ch] } as React.CSSProperties}><span>{CH[ch]}</span>{list.length} {list.length === 1 ? "person" : "people"}</p>
            {open(ch) ? (
              <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">{list.map((c) => <CastCard key={c.name} c={c} />)}</div>
            ) : (
              <div className="pb-locked" style={{ "--t": TONE[ch] } as React.CSSProperties}>
                <div className="pb-faces" aria-hidden>{list.slice(0, 5).map((c) => <i key={c.name} />)}</div>
                <div><b>🔒 {list.length} people you meet in {CH[ch]}</b><small>Reach {CH[ch]} in <Link href="/edge/briefing" className="underline">Mission Briefing</Link> or turn spoilers on.</small></div>
              </div>
            )}
          </section>
        );
      })}
      <p className="text-xs text-haze">From the in-game credits and story guides (OutputLag, GamesRadar). Niko Bellic and the GTA V crew aren&apos;t in the credits; Jimmy De Santa is credited with no confirmed role yet.</p>
    </div>
  );
}
