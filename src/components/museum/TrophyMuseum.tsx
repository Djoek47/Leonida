"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "@/components/A";
import { Medal, Ring, TrophyList } from "@/components/TrophyCase";
import { ACTION, HUE, ROOMS, WINGS, fmt, pct, roomOf, statusLine, type Trophy } from "@/lib/trophies";
import type { MuseumApi, Palette } from "./engine";

const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function readPalette(): Palette {
  const dark = getComputedStyle(document.documentElement).colorScheme.includes("dark") || css("--dusk").toLowerCase() === "#140a26";
  return { wall: (dark ? css("--ink") : css("--ink-2")) || "#21103d", trim: css("--line") || "#44296f", floor: (dark ? css("--ink-2") : css("--dusk")) || "#2e1854", neonA: css("--flamingo") || "#ff3d8b", neonB: css("--mango") || "#ffc23d", neonC: css("--gulf") || "#8a2be2", dark };
}
const webgl = () => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } };

/* Minimap: the hall seen from above, entrance on the left. Map u = -z, v = x. */
const bayZ = (k: number) => -11 - 10 * k;
function MiniMap({ rows, room, onGo, dot }: { rows: Trophy[]; room: number; onGo(i: number): void; dot: React.RefObject<SVGGElement | null> }) {
  return (
    <svg className="mz-map" viewBox="-1.5 -9.5 66 19" role="group" aria-label="Museum map">
      <rect x="-1" y="-5" width="48.5" height="10" rx=".6" className="mz-map-hall" onClick={() => onGo(0)} />
      <circle cx="55" cy="0" r="9" className={`mz-map-hall${room === 9 ? " is-here" : ""}`} onClick={() => onGo(9)} />
      {WINGS.map((cat, ci) => {
        const s = ci % 2 === 0 ? -1 : 1, c = bayZ(ci >> 1), list = rows.filter((t) => t.category === cat);
        const g = list.length ? list.filter((t) => t.earned_at).length / list.length : 0;
        return (
          <g key={cat} onClick={() => onGo(ci + 1)} className={`mz-map-bay${room === ci + 1 ? " is-here" : ""}`}>
            <title>{cat}</title>
            <rect x={-c - 4} y={s < 0 ? -8.5 : 5} width="8" height="3.5" rx=".5" style={{ fill: HUE[cat][1], fillOpacity: 0.25 + g * 0.75 }} />
          </g>
        );
      })}
      <g ref={dot}><path d="M2 0 L-1.4 1.4 L-.6 0 L-1.4 -1.4 Z" className="mz-map-me" /></g>
    </svg>
  );
}

function Joystick({ onMove }: { onMove(x: number, y: number): void }) {
  const [k, setK] = useState({ x: 0, y: 0 });
  const base = useRef<HTMLDivElement>(null), id = useRef<number | null>(null);
  const set = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect(), R = r.width / 2;
    let x = (e.clientX - r.left - R) / R, y = (e.clientY - r.top - R) / R; const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    setK({ x, y }); onMove(Math.abs(x) < 0.15 ? 0 : x, Math.abs(y) < 0.15 ? 0 : -y);
  };
  const end = () => { id.current = null; setK({ x: 0, y: 0 }); onMove(0, 0); };
  return (
    <div ref={base} className="mz-joy" aria-hidden
      onPointerDown={(e) => { id.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); set(e); }}
      onPointerMove={(e) => id.current === e.pointerId && set(e)} onPointerUp={end} onPointerCancel={end}>
      <span style={{ transform: `translate(${k.x * 34}px, ${k.y * 34}px)` }} />
    </div>
  );
}

/** A walk-through 3D trophy museum. Falls back to the plain list if WebGL isn't available. */
export function TrophyMuseum({ rows }: { rows: Trophy[] }) {
  const wrap = useRef<HTMLDivElement>(null), host = useRef<HTMLDivElement>(null), dot = useRef<SVGGElement>(null);
  const api = useRef<MuseumApi | null>(null);
  const [mode, setMode] = useState<"3d" | "list">("3d");
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  const [room, setRoom] = useState(0), [sel, setSel] = useState<string | null>(null), [hover, setHover] = useState<string | null>(null);
  const [panel, setPanel] = useState(false), [hint, setHint] = useState(true), [full, setFull] = useState(false);

  useEffect(() => {
    if (mode !== "3d") return;
    if (!webgl()) { setFailed(true); setMode("list"); return; }
    let live = true, m: MuseumApi | null = null;
    const q = new URLSearchParams(location.search).get("room");
    const startRoom = q ? Math.max(0, Math.min(9, Number(q) || 0)) : 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("./engine").then(({ createMuseum }) => {
      if (!live || !host.current || !wrap.current) return;
      try {
        m = createMuseum(host.current, wrap.current, rows, {
          palette: readPalette(), reduced, startRoom,
          onRoom: setRoom, onSelect: setSel, onHover: setHover, onReady: () => setReady(true),
          onPose: (x, z, yaw) => dot.current?.setAttribute("transform", `translate(${-z} ${x}) rotate(${(-yaw * 180) / Math.PI})`),
        });
        api.current = m;
      } catch { setFailed(true); setMode("list"); }
    });
    const mo = new MutationObserver(() => api.current?.setPalette(readPalette()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
    const mq = matchMedia("(prefers-color-scheme: dark)"); const onMq = () => api.current?.setPalette(readPalette()); mq.addEventListener("change", onMq);
    const tm = setTimeout(() => setHint(false), 9000);
    return () => { live = false; m?.dispose(); api.current = null; mo.disconnect(); mq.removeEventListener("change", onMq); clearTimeout(tm); setReady(false); };
  }, [rows, mode]);

  useEffect(() => { const f = () => setFull(document.fullscreenElement === wrap.current); document.addEventListener("fullscreenchange", f); return () => document.removeEventListener("fullscreenchange", f); }, []);

  const go = useCallback((i: number) => { api.current?.goRoom((i + 10) % 10); setHint(false); }, []);
  const pick = useCallback((id: string) => { const r = roomOf(rows.find((t) => t.id === id)?.category ?? ""); if (r !== room) api.current?.goRoom(r); setTimeout(() => api.current?.focus(id), r !== room ? 1400 : 0); setPanel(false); }, [rows, room]);

  const here = useMemo(() => (room === 0 ? [] : rows.filter((t) => roomOf(t.category) === room)), [rows, room]);
  const got = rows.filter((t) => t.earned_at).length;
  const s = sel ? rows.find((t) => t.id === sel) : null;
  const hv = !s && hover ? rows.find((t) => t.id === hover) : null;
  const roomName = ROOMS[room] === "Entrance" ? "Entrance" : ROOMS[room] === "Podium" ? "Podium hall" : ROOMS[room];
  const roomGot = here.filter((t) => t.earned_at).length;

  if (mode === "list") {
    return (
      <div>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <p className="text-haze text-sm">{failed ? "Your browser can't show the 3D museum, so here's every trophy as a list." : "Every trophy as a list."}</p>
          {!failed && <button className="btn btn-hot !py-1.5" onClick={() => setMode("3d")}>Back to the museum</button>}
        </div>
        <TrophyList rows={rows} />
      </div>
    );
  }

  return (
    <div ref={wrap} className={`mz${full ? " is-full" : ""}`} tabIndex={0} aria-label="3D trophy museum. Drag to look around, use W A S D or the arrow keys to walk, and choose trophies from the room list.">
      <div ref={host} className="mz-canvas" />
      {!ready && <div className="mz-loading"><span className="mz-spin" />Opening the museum…</div>}

      <div className="mz-top">
        <div className="mz-title">
          <p className="mz-kicker">Live From Leonida · Trophy museum</p>
          <p className="mz-room">{roomName}{room > 0 && <span> {roomGot} / {here.length}</span>}</p>
        </div>
        <div className="mz-tools">
          <span className="mz-total"><b>{got}</b> / {rows.length}</span>
          <button onClick={() => setMode("list")} title="Show as a list">List</button>
          <button className="mz-fs" onClick={() => (full ? document.exitFullscreen() : wrap.current?.requestFullscreen?.())} title={full ? "Exit full screen" : "Full screen"}>{full ? "Exit" : "Full screen"}</button>
        </div>
      </div>

      {hint && ready && <p className="mz-hint">Drag to look around · <b>WASD</b> or the stick to walk · click a trophy to inspect it</p>}

      <aside className={`mz-side${panel ? " is-open" : ""}`} aria-label={room === 0 ? "Wings" : `Trophies in ${roomName}`}>
        <button className="mz-side-toggle" onClick={() => setPanel((v) => !v)} aria-expanded={panel}>{room === 0 ? "Wings" : "In this room"}</button>
        <div className="mz-side-body">
          {room === 0 ? (
            <ul className="mz-list">
              {[...WINGS, "Podium"].map((cat) => {
                const l = rows.filter((t) => t.category === cat), g = l.filter((t) => t.earned_at).length;
                return <li key={cat}><button onClick={() => { go(roomOf(cat)); setPanel(false); }}><Ring cat={cat} value={l.length ? g / l.length : 0} size={30}>{g}</Ring><span>{cat === "Podium" ? "Podium hall" : cat}</span><em>{g}/{l.length}</em></button></li>;
              })}
            </ul>
          ) : (
            <ul className="mz-list">
              {here.map((t) => (
                <li key={t.id}>
                  <button onClick={() => pick(t.id)} aria-pressed={sel === t.id} className={t.earned_at ? "is-earned" : "is-locked"}>
                    <Medal t={t} earned={!!t.earned_at} size="1.7rem" />
                    <span>{t.name}{t.earned_at && !t.seen_at && <i className="mz-new">New</i>}</span>
                    <em>{t.earned_at ? "✓" : `${Math.round(pct(t) * 100)}%`}</em>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {(s || hv) && (() => {
        const t = (s ?? hv)!; const h = HUE[t.category] ?? HUE.Uploads; const p = pct(t);
        return (
          <div className={`mz-card${s ? " is-open" : ""}`} role={s ? "dialog" : undefined} aria-label={t.name} style={{ "--c": h[1] } as React.CSSProperties}>
            <div className="flex items-center gap-3">
              <Medal t={t} earned={!!t.earned_at} size="2.6rem" />
              <div className="min-w-0">
                <p className="mz-card-cat">{t.category === "Podium" ? "Podium" : `${t.category} · tier ${Number(t.id.slice(1))}`}</p>
                <p className="mz-card-name">{t.name}</p>
              </div>
              {s && <button className="mz-x" onClick={() => api.current?.unfocus()} aria-label="Close">×</button>}
            </div>
            {s && (
              <>
                <p className="mt-2 text-sm">{t.description}</p>
                {t.category !== "Podium" && (
                  <div className="mz-bar" aria-label={`${Math.round(p * 100)} percent`}><span style={{ width: `${p * 100}%` }} /></div>
                )}
                <p className="mt-1 text-xs mz-dim">{statusLine(t)}{!t.earned_at && t.category !== "Podium" ? ` · ${fmt(t, Math.max(0, t.threshold - t.progress))} to go` : ""}{t.privacy === "private" ? " · Only you can see this" : ""}</p>
                {!t.earned_at && <Link href={ACTION[t.category]?.[1] ?? "/clips"} className="mz-cta">{ACTION[t.category]?.[0] ?? "Browse clips"} →</Link>}
              </>
            )}
          </div>
        );
      })()}

      <div className="mz-bottom">
        <nav className="mz-nav" aria-label="Rooms">
          <button onClick={() => go(room - 1)} aria-label="Previous room">‹</button>
          <span>{roomName}</span>
          <button onClick={() => go(room + 1)} aria-label="Next room">›</button>
        </nav>
        <MiniMap rows={rows} room={room} onGo={go} dot={dot} />
      </div>
      <Joystick onMove={(x, y) => api.current?.setMove(x, y)} />
    </div>
  );
}
