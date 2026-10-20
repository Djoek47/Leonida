"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/*
  Leonida Live map: our own styling, place curation and layers, adapted from GTADB community data
  (CC BY 4.0, https://map.gtadb.org). Attribution lives on /credits and under the map; keep it.
  Tiles: 256px, z0-5, centred on world (0,0); at z0 the 32,768 m world is 1,024 px; files "z,y,x.jpg".
  Place: [id, name, area, x, y, realLife, layer]
*/
type Place = [string, string, string, number, number, string, string];

const WORLD = 32768, HALF = 16384, MAXZ = 5;
const STATIC = process.env.NEXT_PUBLIC_STATIC === "1";
const TILEZ = STATIC ? 2 : MAXZ;
const ISLAND = { x0: -8600, x1: 3300, y0: -8300, y1: 10300 }; // world bounds of Leonida

type Layer = { id: string; label: string; glyph: string; color: string; soon?: boolean };
const LAYERS: Layer[] = [
  { id: "sights", label: "Sights", glyph: "★", color: "#00704a" },
  { id: "nightlife", label: "Hotels and food", glyph: "H", color: "#ae3ec9" },
  { id: "shops", label: "Shops", glyph: "$", color: "#e67700" },
  { id: "gas", label: "Gas stations", glyph: "G", color: "#c92a2a" },
  { id: "transport", label: "Transport", glyph: "T", color: "#1c7ed6" },
  { id: "city", label: "City and industry", glyph: "C", color: "#495057" },
  { id: "cars", label: "Cars", glyph: "", color: "#000", soon: true },
  { id: "weapons", label: "Weapons", glyph: "", color: "#000", soon: true },
  { id: "money", label: "Fast money", glyph: "", color: "#000", soon: true },
  { id: "extras", label: "Extras", glyph: "", color: "#000", soon: true },
];

/* Theme recolouring: tiles are drawn through a per-theme pixel pass, cached per tile. */
function isNight() { const t = document.documentElement.dataset.theme; return t === "night" || (!t && matchMedia("(prefers-color-scheme: dark)").matches); }
function recolor(img: HTMLImageElement, night: boolean) {
  const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext("2d")!; g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], gg = p[i + 1], b = p[i + 2];
    const water = b > r + 35 && b > gg + 5;
    if (night) {
      if (water) { const k = b / 255; p[i] = 70 * k + 20; p[i + 1] = 26 * k + 8; p[i + 2] = 150 * k + 40; } // violet sea
      else { const l = (r + gg + b) / 3; p[i] = l * 0.42 + 18; p[i + 1] = l * 0.36 + 10; p[i + 2] = l * 0.55 + 30; } // dusk land
    } else if (water) { p[i] = r * 0.55 + 20; p[i + 1] = gg * 0.75 + 40; p[i + 2] = b * 0.85 + 30; } // gulf teal
    else { const l = (r + gg + b) / 3; p[i] = r * 0.8 + l * 0.2; p[i + 1] = gg * 0.8 + l * 0.2; p[i + 2] = b * 0.8 + l * 0.2; } // softened land
  }
  g.putImageData(d, 0, 0);
  return c;
}

export function LeonidaMap() {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const raw = useRef(new Map<string, HTMLImageElement | null>());
  const painted = useRef(new Map<string, HTMLCanvasElement>());
  const view = useRef({ x: (ISLAND.x0 + ISLAND.x1) / 2, y: (ISLAND.y0 + ISLAND.y1) / 2, z: 0.5 });
  const minZ = useRef(0.3);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const pointers = useRef(new Map<number, [number, number]>());
  const pinch = useRef<number | null>(null);
  const raf = useRef(0);
  const [night, setNight] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [on, setOn] = useState<Set<string>>(new Set(LAYERS.filter((l) => !l.soon).map((l) => l.id)));
  const [sel, setSel] = useState<Place | null>(null);
  const [, force] = useState(0);
  const base = () => (document.querySelector("base") ? "" : "/");

  useEffect(() => { fetch(`${base()}gtadb/places.json`).then((r) => r.json()).then(setPlaces).catch(() => setPlaces([])); }, []);
  useEffect(() => {
    const check = () => { const n = isNight(); setNight((o) => { if (o !== n) painted.current.clear(); return n; }); };
    check();
    const mo = new MutationObserver(check); mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  const shown = useMemo(() => places.filter((p) => on.has(p[6])), [places, on]);
  const layerOf = (id: string) => LAYERS.find((l) => l.id === id)!;
  const scale = () => (1024 * 2 ** view.current.z) / WORLD;
  const toScreen = (wx: number, wy: number, w: number, h: number) => { const s = scale(), v = view.current; return [w / 2 + (wx - v.x) * s, h / 2 - (wy - v.y) * s]; };

  const draw = useCallback(() => {
    const c = cv.current; if (!c) return;
    const dpr = devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext("2d")!; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // fit the whole island, never zoom out past it, keep the island in view
    const fitS = Math.min(w / (ISLAND.x1 - ISLAND.x0), h / (ISLAND.y1 - ISLAND.y0)) * 0.95;
    const fitZ = Math.log2((fitS * WORLD) / 1024);
    if (minZ.current !== fitZ) { const first = minZ.current === 0.3; minZ.current = fitZ; if (first || view.current.z < fitZ) view.current.z = fitZ; }
    { const v0 = view.current, s0 = scale(), hw = w / 2 / s0, hh = h / 2 / s0;
      const cx = (ISLAND.x0 + ISLAND.x1) / 2, cy = (ISLAND.y0 + ISLAND.y1) / 2;
      v0.x = hw * 2 >= ISLAND.x1 - ISLAND.x0 ? cx : Math.min(ISLAND.x1 - hw, Math.max(ISLAND.x0 + hw, v0.x));
      v0.y = hh * 2 >= ISLAND.y1 - ISLAND.y0 ? cy : Math.min(ISLAND.y1 - hh, Math.max(ISLAND.y0 + hh, v0.y)); }
    g.fillStyle = night ? "#411988" : "#2c75a9"; g.fillRect(0, 0, w, h);
    const v = view.current, zi = Math.min(TILEZ, Math.max(0, Math.ceil(v.z))), s = scale();
    const tw = (WORLD / (4 * 2 ** zi)) * s, n = 4 * 2 ** zi;
    const ox = w / 2 - (v.x + HALF) * s, oy = h / 2 - (HALF - v.y) * s;
    const x0 = Math.max(0, Math.floor(-ox / tw)), x1 = Math.min(n - 1, Math.floor((w - ox) / tw));
    const y0 = Math.max(0, Math.floor(-oy / tw)), y1 = Math.min(n - 1, Math.floor((h - oy) / tw));
    g.imageSmoothingQuality = "high";
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const key = `${zi}/${zi},${ty},${tx}`;
      let img = raw.current.get(key);
      if (img === undefined) {
        img = new Image(); raw.current.set(key, img);
        img.onload = () => schedule(); img.onerror = () => raw.current.set(key, null);
        img.src = `${base()}gtadb/tiles/${key}.jpg`;
      }
      if (!img || !img.complete || !img.naturalWidth) continue;
      let pc = painted.current.get(key);
      if (!pc) { pc = recolor(img, night); painted.current.set(key, pc); }
      g.drawImage(pc, ox + tx * tw, oy + ty * tw, tw + 0.5, tw + 0.5);
    }
    // markers: small road-sign plates; labels appear once zoomed in
    const big = v.z >= 2.6, sz = big ? 22 : 16;
    const glyphFont = `800 ${big ? 12 : 10}px system-ui, sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    for (const p of shown) {
      const [sx, sy] = toScreen(p[3], p[4], w, h);
      if (sx < -40 || sy < -40 || sx > w + 40 || sy > h + 40) continue;
      const L = layerOf(p[6]), active = sel?.[0] === p[0], k = active ? sz + 8 : sz;
      g.fillStyle = "#fff"; g.beginPath(); g.roundRect(sx - k / 2 - 2, sy - k / 2 - 2, k + 4, k + 4, 6); g.fill();
      g.fillStyle = active ? "#ffc72c" : L.color; g.beginPath(); g.roundRect(sx - k / 2, sy - k / 2, k, k, 5); g.fill();
      g.font = glyphFont; g.fillStyle = active ? "#15191c" : "#fff"; g.fillText(L.glyph, sx, sy + 1);
      if (big || active) {
        g.font = "700 12px system-ui, sans-serif";
        const tw2 = g.measureText(p[1]).width + 10;
        g.fillStyle = night ? "rgba(20,10,38,.85)" : "rgba(255,255,255,.92)"; g.beginPath(); g.roundRect(sx - tw2 / 2, sy + k / 2 + 4, tw2, 18, 4); g.fill();
        g.fillStyle = night ? "#fff1e8" : "#15191c"; g.fillText(p[1], sx, sy + k / 2 + 13.5);
      }
    }
  }, [shown, sel, night]); // eslint-disable-line react-hooks/exhaustive-deps
  const drawRef = useRef(draw); drawRef.current = draw;
  // always draws with the latest state, even when called from an old tile onload
  const schedule = useCallback(() => { cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(() => drawRef.current()); }, []);
  useEffect(() => { schedule(); }, [draw, schedule]);
  useEffect(() => { const o = new ResizeObserver(() => schedule()); if (wrap.current) o.observe(wrap.current); return () => o.disconnect(); }, [schedule]);

  function zoomAt(dz: number, px?: number, py?: number) {
    const c = cv.current!, v = view.current, w = c.clientWidth, h = c.clientHeight;
    const nz = Math.min(MAXZ + 0.8, Math.max(minZ.current, v.z + dz));
    px ??= w / 2; py ??= h / 2;
    const s0 = scale(), wx = v.x + (px - w / 2) / s0, wy = v.y - (py - h / 2) / s0;
    v.z = nz; const s1 = scale(); v.x = wx - (px - w / 2) / s1; v.y = wy + (py - h / 2) / s1;
    schedule(); force((n) => n + 1);
  }
  useEffect(() => {
    const c = cv.current!;
    const wheel = (e: WheelEvent) => { e.preventDefault(); const b = c.getBoundingClientRect(); zoomAt(-e.deltaY * 0.0025, e.clientX - b.left, e.clientY - b.top); };
    c.addEventListener("wheel", wheel, { passive: false });
    return () => c.removeEventListener("wheel", wheel);
  });
  function down(e: React.PointerEvent) { cv.current!.setPointerCapture(e.pointerId); pointers.current.set(e.pointerId, [e.clientX, e.clientY]); drag.current = { x: e.clientX, y: e.clientY, moved: false }; }
  function move(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinch.current) { const r = cv.current!.getBoundingClientRect(); zoomAt(Math.log2(d / pinch.current), (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top); }
      pinch.current = d; if (drag.current) drag.current.moved = true; return;
    }
    const dr = drag.current; if (!dr) return;
    const dx = e.clientX - dr.x, dy = e.clientY - dr.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) dr.moved = true;
    const s = scale(); view.current.x -= dx / s; view.current.y += dy / s; dr.x = e.clientX; dr.y = e.clientY; schedule();
  }
  function up(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId); if (pointers.current.size < 2) pinch.current = null;
    const dr = drag.current; drag.current = null;
    if (!dr || dr.moved) return;
    const r = cv.current!.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    let best: Place | null = null, bd = 20 ** 2;
    for (const p of shown) { const [sx, sy] = toScreen(p[3], p[4], r.width, r.height); const d = (sx - px) ** 2 + (sy - py) ** 2; if (d < bd) { bd = d; best = p; } }
    setSel(best);
  }
  function focus(p: Place) { view.current = { x: p[3], y: p[4], z: Math.max(view.current.z, 3.2) }; setSel(p); schedule(); force((n) => n + 1); }
  function onKey(e: React.KeyboardEvent) {
    const s = 80 / scale(), v = view.current;
    const k: Record<string, () => void> = { ArrowLeft: () => (v.x -= s), ArrowRight: () => (v.x += s), ArrowUp: () => (v.y += s), ArrowDown: () => (v.y -= s), "+": () => zoomAt(0.5), "=": () => zoomAt(0.5), "-": () => zoomAt(-0.5) };
    if (k[e.key]) { e.preventDefault(); k[e.key](); schedule(); }
  }
  const toggle = (id: string) => setOn((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const count = (id: string) => places.filter((p) => p[6] === id).length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div ref={wrap} className="relative rounded-xl overflow-hidden border border-line h-[min(78vh,700px)] min-h-[440px]">
        <canvas ref={cv} tabIndex={0} onKeyDown={onKey} aria-label="Map of Leonida. Drag to move, scroll or pinch to zoom, arrow keys to pan."
          className="absolute inset-0 h-full w-full touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
        <div className="absolute right-3 top-3 grid gap-1">
          <button onClick={() => zoomAt(0.6)} className="btn bg-ink text-foam !p-0 size-10 !rounded-md shadow text-xl" aria-label="Zoom in">+</button>
          <button onClick={() => zoomAt(-0.6)} className="btn bg-ink text-foam !p-0 size-10 !rounded-md shadow text-xl" aria-label="Zoom out">−</button>
        </div>
        {sel && (
          <article className="absolute left-3 top-3 w-[min(19rem,calc(100%-5rem))] rounded-xl bg-ink border border-line shadow-2xl overflow-hidden">
            <button onClick={() => setSel(null)} className="absolute right-2 top-2 size-8 rounded-full bg-ink-2 text-foam" aria-label="Close">×</button>
            <div className="p-4">
              <p className="text-xs font-bold text-haze">{layerOf(sel[6]).label}</p>
              <h3 className="font-extrabold text-lg leading-tight">{sel[1]}</h3>
              <p className="text-sm text-haze">{sel[2]}</p>
              {sel[5] && <p className="mt-2 text-sm"><span className="font-bold">Real-life spot:</span> {sel[5]}</p>}
            </div>
          </article>
        )}
      </div>

      <aside className="grid gap-3 content-start">
        <p className="font-extrabold">Show on the map</p>
        <ul className="grid gap-2">
          {LAYERS.map((l) => (
            <li key={l.id}>
              <button disabled={l.soon} onClick={() => toggle(l.id)} aria-pressed={on.has(l.id)}
                className={`w-full flex items-center gap-3 rounded-lg border-2 px-3 py-2 text-left ${l.soon ? "border-dashed border-line opacity-60" : on.has(l.id) ? "border-gulf bg-ink" : "border-line"}`}>
                <span className="grid place-items-center size-7 rounded-md text-white font-black text-sm shrink-0" style={{ background: l.soon ? "var(--line)" : l.color, opacity: on.has(l.id) || l.soon ? 1 : 0.35 }}>{l.glyph}</span>
                <span className="flex-1 font-bold text-sm">{l.label}</span>
                <span className="text-xs text-haze">{l.soon ? "At launch" : count(l.id)}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="text-sm text-haze">Cars, weapons and money spots go on the map after launch, logged by our crew.</p>
        <p className="font-extrabold mt-2">Jump to</p>
        <div className="flex flex-wrap gap-2">
          {places.filter((p) => p[6] === "sights").slice(0, 8).map((p) => (
            <button key={p[0]} onClick={() => focus(p)} className="px-3 py-1.5 rounded-full text-sm font-bold border-2 border-line hover:border-gulf">{p[1]}</button>
          ))}
        </div>
      </aside>
    </div>
  );
}
