import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { HUE, WINGS, statusLine, tierOf, type Trophy } from "@/lib/trophies";

/* ─── Floor plan (world units ≈ metres) ───────────────────────────────────────────────
   Entrance at z≈0, a long hall running toward -z with four wings on each side, and the
   Podium rotunda at the far end. Left wings hold the even categories, right wings the odd. */
const W = 5, H = 6, L = 10, D = 3.5, Z0 = -6, RZ = -55, R = 9, EYE = 1.65;
const bayZ = (k: number) => Z0 - L * k - L / 2;
const sideOf = (ci: number) => (ci % 2 === 0 ? -1 : 1);

export type Palette = { wall: string; trim: string; floor: string; neonA: string; neonB: string; neonC: string; dark: boolean };
export type MuseumOpts = {
  palette: Palette; reduced: boolean; startRoom: number; look?: LookSettings;
  onRoom(i: number): void; onSelect(id: string | null): void; onHover(id: string | null): void;
  onPose(x: number, z: number, yaw: number): void; onReady(): void;
};
export type LookSettings = { invertX: boolean; invertY: boolean; sensitivity: number; speed: number; fov: number };
export const DEFAULT_LOOK: LookSettings = { invertX: false, invertY: false, sensitivity: 1, speed: 1, fov: 62 };
export type MuseumApi = {
  setLook(s: LookSettings): void;
  goRoom(i: number): void; focus(id: string): void; unfocus(): void; setMove(x: number, y: number): void;
  setPalette(p: Palette): void; dispose(): void;
};

type Pose = { p: THREE.Vector3; yaw: number; pitch: number };
type Item = { id: string; group: THREE.Group; world: THREE.Vector3; normal: THREE.Vector3; earned: boolean; fresh: boolean; spin: boolean; base: number };

const STATIONS: Pose[] = [
  { p: new THREE.Vector3(0, EYE, -0.8), yaw: 0, pitch: 0.16 },
  ...WINGS.map((_, ci) => { const s = sideOf(ci); return { p: new THREE.Vector3(s * 2.1, EYE, bayZ(ci >> 1)), yaw: -s * Math.PI / 2, pitch: 0.12 }; }),
  { p: new THREE.Vector3(0, EYE, -46.8), yaw: 0, pitch: 0.1 },
];

/* ─── Small texture helpers ─── */
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
function fitText(g: CanvasRenderingContext2D, text: string, max: number, size: number, weight = 900, family = "'Arial Black', Arial, sans-serif") {
  let s = size; do { g.font = `${weight} ${s}px ${family}`; s -= 2; } while (g.measureText(text).width > max && s > 10);
}
const glowTex = () => canvasTex(128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.45, "rgba(255,255,255,.35)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
});
function signTex(title: string, sub: string, color: string) {
  return canvasTex(1024, 256, (g) => {
    g.textAlign = "center"; g.textBaseline = "middle";
    fitText(g, title, 960, 118);
    g.shadowColor = color; g.shadowBlur = 34; g.fillStyle = color; g.fillText(title, 512, 102);
    g.shadowBlur = 12; g.fillStyle = "#fff"; g.fillText(title, 512, 102);
    if (sub) { g.shadowBlur = 16; g.shadowColor = color; fitText(g, sub, 900, 50, 800, "system-ui, sans-serif"); g.fillStyle = color; g.fillText(sub, 512, 205); }
  });
}
function plaqueTex(name: string, sub: string, accent: string, earned: boolean) {
  return canvasTex(512, 144, (g) => {
    g.fillStyle = "#140d03"; g.beginPath(); g.roundRect(4, 4, 504, 136, 18); g.fill();
    g.lineWidth = 5; g.strokeStyle = earned ? "#f0c24b" : "#5c4313"; g.stroke();
    g.textAlign = "center"; g.textBaseline = "middle";
    fitText(g, name, 470, 42, 900, "system-ui, sans-serif"); g.fillStyle = earned ? "#fff1e8" : "#bfaedc"; g.fillText(name, 256, 56);
    fitText(g, sub, 470, 28, 700, "system-ui, sans-serif"); g.fillStyle = earned ? accent : "#8f7fae"; g.fillText(sub, 256, 104);
  });
}
function terrazzo(p: Palette) {
  return canvasTex(512, 512, (g) => {
    g.fillStyle = p.floor; g.fillRect(0, 0, 512, 512);
    const flecks = [p.neonA, p.neonB, p.neonC, p.trim, p.dark ? "#ffffff" : "#140d03"];
    let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 900; i++) { g.globalAlpha = 0.25 + rnd() * 0.45; g.fillStyle = flecks[i % flecks.length]; g.beginPath(); g.ellipse(rnd() * 512, rnd() * 512, 1 + rnd() * 4, 1 + rnd() * 3, rnd() * 3, 0, 7); g.fill(); }
    g.globalAlpha = 0.5; g.strokeStyle = p.trim; g.lineWidth = 3; g.strokeRect(0, 0, 512, 512);
  }, [6, 22]);
}
function runnerTex(p: Palette) {
  return canvasTex(64, 256, (g) => {
    g.fillStyle = p.neonA; g.fillRect(0, 0, 64, 256);
    g.fillStyle = "rgba(0,0,0,.25)"; for (let y = 0; y < 256; y += 32) g.fillRect(14, y + 8, 36, 4);
    g.fillStyle = p.neonB; g.fillRect(0, 0, 6, 256); g.fillRect(58, 0, 6, 256);
  }, [1, 14]);
}
function inlayTex(p: Palette) {
  return canvasTex(1024, 1024, (g) => {
    g.fillStyle = p.floor; g.fillRect(0, 0, 1024, 1024);
    g.translate(512, 512);
    for (let i = 0; i < 3; i++) { g.strokeStyle = i === 1 ? p.neonA : p.trim; g.lineWidth = 10 - i * 2; g.beginPath(); g.arc(0, 0, 480 - i * 40, 0, 7); g.stroke(); }
    g.fillStyle = p.neonB; g.globalAlpha = 0.4; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, r = i % 2 ? 150 : 360; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.closePath(); g.fill(); g.globalAlpha = 1; g.strokeStyle = p.trim; g.lineWidth = 8; g.stroke();
  });
}

/* ─── Sky: a sunset gradient seen through the skylight and the rotunda dome ─── */
function skyMat(p: Palette, mode: 0 | 1) {
  const c = p.dark ? ["#140a26", "#8a2be2", "#ff3d8b"] : ["#ff9a3c", "#ffbe55", "#fff0c2"];
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: { top: { value: new THREE.Color(c[0]) }, mid: { value: new THREE.Color(c[1]) }, bot: { value: new THREE.Color(c[2]) }, t: { value: 0 }, mode: { value: mode }, stars: { value: p.dark ? 1 : 0 } },
    vertexShader: "varying vec3 vP; void main(){ vec4 w = modelMatrix*vec4(position,1.); vP = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }",
    fragmentShader: `varying vec3 vP; uniform vec3 top, mid, bot; uniform float t, mode, stars;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){
        float f = mode < .5 ? clamp((vP.y-${H.toFixed(1)})/${R.toFixed(1)}, 0., 1.) : clamp(-vP.z/48., 0., 1.);
        vec3 c = mix(bot, mid, smoothstep(0., .55, f)); c = mix(c, top, smoothstep(.45, 1., f));
        float band = .5+.5*sin(vP.x*1.7 + vP.z*.35 - t*.25); c += (mode < .5 ? 0. : .06*band);
        vec2 g = floor(vP.xz*6.); float s = step(.996, h(g)) * stars * (.6+.4*sin(t*2.+h(g)*30.));
        gl_FragColor = vec4((c + s) * (mode < .5 ? 1. : .72), 1.);
      }`,
  });
}

/* ─── Trophy models ───────────────────────────────────────────────────────────────────
   Tiers grow from medals (1–3) to cups (4–6), star trophies (7–9) and a crown (10).
   Parts are merged per material so each trophy costs only a few draw calls. */
type Slot = "metal" | "accent" | "trim" | "soft" | "gem";
type Part = [THREE.BufferGeometry, Slot];
const starShape = (o: number, i: number) => { const s = new THREE.Shape(); for (let k = 0; k < 10; k++) { const a = (k * Math.PI) / 5 + Math.PI / 2, r = k % 2 ? i : o; if (k) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); return s; };
const lathe = (pts: [number, number][]) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 40);
function partsFor(kind: "medal" | "cup" | "star" | "crown", tier: number): Part[] {
  const P: Part[] = [];
  if (kind === "medal") {
    P.push([new THREE.BoxGeometry(0.36, 0.06, 0.2).translate(0, 0.03, 0), "trim"]);
    P.push([new THREE.BoxGeometry(0.07, 0.28, 0.02).translate(0, 0.2, -0.04), "soft"]);
    P.push([new THREE.CylinderGeometry(0.17, 0.17, 0.04, 40).rotateX(Math.PI / 2).translate(0, 0.38, 0), "metal"]);
    P.push([new THREE.TorusGeometry(0.17, 0.016, 10, 48).translate(0, 0.38, 0), "accent"]);
    P.push([new THREE.CylinderGeometry(0.08, 0.08, 0.05, 32).rotateX(Math.PI / 2).translate(0, 0.38, 0.005), "accent"]);
    if (tier >= 2) P.push([new THREE.TorusGeometry(0.125, 0.007, 6, 40).translate(0, 0.38, 0.022), "accent"]);
    if (tier >= 3) P.push([new THREE.ExtrudeGeometry(starShape(0.05, 0.022), { depth: 0.012, bevelEnabled: false }).translate(0, 0.38, 0.03), "gem"]);
  } else if (kind === "cup") {
    P.push([new THREE.BoxGeometry(0.3, 0.07, 0.3).translate(0, 0.035, 0), "trim"]);
    P.push([new THREE.BoxGeometry(0.22, 0.05, 0.22).translate(0, 0.095, 0), "accent"]);
    P.push([lathe([[0.09, 0.12], [0.04, 0.15], [0.03, 0.26], [0.065, 0.3]]), "accent"]);
    P.push([lathe([[0.065, 0.3], [0.16, 0.36], [0.205, 0.48], [0.22, 0.6], [0.24, 0.625]]), "metal"]);
    P.push([new THREE.TorusGeometry(0.075, 0.015, 8, 24, Math.PI).rotateZ(-Math.PI / 2).translate(0.215, 0.47, 0), "accent"]);
    P.push([new THREE.TorusGeometry(0.075, 0.015, 8, 24, Math.PI).rotateZ(Math.PI / 2).translate(-0.215, 0.47, 0), "accent"]);
    if (tier >= 5) P.push([new THREE.TorusGeometry(0.235, 0.01, 8, 48).rotateX(Math.PI / 2).translate(0, 0.62, 0), "accent"]);
    if (tier >= 6) P.push([new THREE.ExtrudeGeometry(starShape(0.07, 0.03), { depth: 0.015, bevelEnabled: false }).translate(0, 0.47, 0.205), "gem"]);
  } else if (kind === "star") {
    P.push([new THREE.BoxGeometry(0.3, 0.08, 0.3).translate(0, 0.04, 0), "trim"]);
    P.push([new THREE.CylinderGeometry(0.03, 0.05, 0.34, 16).translate(0, 0.25, 0), "accent"]);
    P.push([new THREE.TorusGeometry(0.06, 0.012, 8, 24).rotateX(Math.PI / 2).translate(0, 0.42, 0), "accent"]);
    P.push([new THREE.ExtrudeGeometry(starShape(0.19, 0.08), { depth: 0.05, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 }).translate(0, 0.62, -0.025), "metal"]);
    if (tier >= 8) P.push([new THREE.TorusGeometry(0.24, 0.01, 8, 48).translate(0, 0.62, 0), "accent"]);
    if (tier >= 9) P.push([new THREE.SphereGeometry(0.035, 16, 10).translate(0, 0.62, 0.05), "gem"]);
  } else {
    P.push([new THREE.BoxGeometry(0.4, 0.06, 0.4).translate(0, 0.03, 0), "trim"]);
    P.push([new THREE.CylinderGeometry(0.22, 0.24, 0.12, 32).translate(0, 0.12, 0), "soft"]);
    P.push([new THREE.CylinderGeometry(0.16, 0.18, 0.17, 40, 1, true).translate(0, 0.265, 0), "accent"]);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, x = Math.cos(a) * 0.16, z = Math.sin(a) * 0.16;
      P.push([new THREE.ConeGeometry(0.035, 0.12, 10).translate(x, 0.41, z), "accent"]);
      P.push([new THREE.SphereGeometry(0.025, 10, 8).translate(x, 0.48, z), "gem"]);
    }
    P.push([new THREE.SphereGeometry(0.04, 16, 10).translate(0, 0.27, 0.18), "gem"]);
  }
  return P;
}
const kindOf = (t: Trophy): ["medal" | "cup" | "star" | "crown", number] => {
  if (t.id === "podium_weekly") return ["cup", 6];
  if (t.id === "podium_monthly") return ["star", 9];
  if (t.id === "podium_yearly") return ["crown", 10];
  const n = tierOf(t); return [n <= 3 ? "medal" : n <= 6 ? "cup" : n <= 9 ? "star" : "crown", n];
};
const TIER_METAL = (n: number) => (n <= 3 ? "#c98b52" : n <= 6 ? "#d9e0e8" : n <= 9 ? "#f5c542" : "#ffe27a");

export function createMuseum(host: HTMLElement, keyTarget: HTMLElement, rows: Trophy[], opts: MuseumOpts): MuseumApi {
  let pal = opts.palette;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none;outline:none";

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.fog = new THREE.Fog(pal.wall, 22, 62);
  scene.background = new THREE.Color(pal.wall);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 140);
  camera.rotation.order = "YXZ";

  const disposables: { dispose(): void }[] = [envTex, pmrem];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  /* Shared materials */
  const M = {
    wall: keep(new THREE.MeshStandardMaterial({ color: pal.wall, roughness: 0.85 })),
    trim: keep(new THREE.MeshStandardMaterial({ color: pal.trim, metalness: 0.6, roughness: 0.35 })),
    lacquer: keep(new THREE.MeshStandardMaterial({ color: "#140d03", metalness: 0.3, roughness: 0.35 })),
    floor: keep(new THREE.MeshStandardMaterial({ map: terrazzo(pal), roughness: 0.32, metalness: 0.05 })),
    runner: keep(new THREE.MeshStandardMaterial({ map: runnerTex(pal), roughness: 0.95 })),
    inlay: keep(new THREE.MeshStandardMaterial({ map: inlayTex(pal), roughness: 0.3 })),
    neonA: keep(new THREE.MeshBasicMaterial({ color: pal.neonA, toneMapped: false })),
    neonB: keep(new THREE.MeshBasicMaterial({ color: pal.neonB, toneMapped: false })),
    ghost: keep(new THREE.MeshStandardMaterial({ color: "#8c7fb0", emissive: "#2a2140", roughness: 0.35, metalness: 0.5, transparent: true, opacity: 0.42, depthWrite: false })),
    hit: keep(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })),
  };
  const glow = keep(glowTex());
  const skyDome = keep(skyMat(pal, 0)), skyBand = keep(skyMat(pal, 1));
  skyBand.side = THREE.DoubleSide;

  const catMats = new Map<string, Record<Slot, THREE.Material>>();
  const tierMats = new Map<string, THREE.MeshStandardMaterial>();
  const matsFor = (cat: string, tier: number) => {
    const key = `${cat}`;
    if (!catMats.has(key)) {
      const h = HUE[cat] ?? HUE.Uploads;
      catMats.set(key, {
        metal: keep(new THREE.MeshStandardMaterial({ color: h[1], metalness: 1, roughness: 0.22, side: THREE.DoubleSide, envMapIntensity: 1.4 })),
        accent: M.trim, trim: M.lacquer,
        soft: keep(new THREE.MeshStandardMaterial({ color: h[1], roughness: 0.9 })),
        gem: keep(new THREE.MeshStandardMaterial({ color: h[0], emissive: h[1], emissiveIntensity: 1.6, roughness: 0.1 })),
      });
    }
    const tk = TIER_METAL(tier);
    if (!tierMats.has(tk)) tierMats.set(tk, keep(new THREE.MeshStandardMaterial({ color: tk, metalness: 1, roughness: 0.2, side: THREE.DoubleSide, envMapIntensity: 1.5 })));
    return { ...catMats.get(key)!, accent: tierMats.get(tk)! };
  };
  const geoCache = new Map<string, Map<Slot, THREE.BufferGeometry> | THREE.BufferGeometry>();
  function trophyModel(t: Trophy, earned: boolean): THREE.Group {
    const [kind, tier] = kindOf(t);
    const g = new THREE.Group();
    const key = `${kind}${tier}`;
    if (earned) {
      const ck = `e:${key}`;
      if (!geoCache.has(ck)) {
        const by = new Map<Slot, THREE.BufferGeometry[]>();
        for (const [geo, slot] of partsFor(kind, tier)) { by.set(slot, [...(by.get(slot) ?? []), geo.toNonIndexed()]); geo.dispose(); }
        const merged = new Map<Slot, THREE.BufferGeometry>();
        by.forEach((list, slot) => { merged.set(slot, keep(mergeGeometries(list)!)); list.forEach((x) => x.dispose()); });
        geoCache.set(ck, merged);
      }
      const mats = matsFor(t.category, tier);
      (geoCache.get(ck) as Map<Slot, THREE.BufferGeometry>).forEach((geo, slot) => g.add(new THREE.Mesh(geo, mats[slot])));
    } else {
      const ck = `l:${key}`;
      if (!geoCache.has(ck)) {
        const list = partsFor(kind, tier).map(([geo]) => { const n = geo.toNonIndexed(); geo.dispose(); return n; });
        geoCache.set(ck, keep(mergeGeometries(list)!)); list.forEach((x) => x.dispose());
      }
      g.add(new THREE.Mesh(geoCache.get(ck) as THREE.BufferGeometry, M.ghost));
    }
    g.scale.setScalar(kind === "crown" ? 1.3 : 0.95 + tier * 0.012);
    return g;
  }

  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
    const g = keep(new THREE.BoxGeometry(w, h, d)); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); scene.add(o); return o;
  };
  const plane = (w: number, h: number, m: THREE.Material, parent: THREE.Object3D = scene) => {
    const o = new THREE.Mesh(keep(new THREE.PlaneGeometry(w, h)), m); parent.add(o); return o;
  };
  const basic = (map: THREE.Texture, extra: THREE.MeshBasicMaterialParameters = {}) =>
    keep(new THREE.MeshBasicMaterial({ map: keep(map), transparent: true, toneMapped: false, depthWrite: false, ...extra }));

  /* ─── Architecture ─── */
  const floor = plane(22, 72, M.floor); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -31);
  const runner = plane(2.6, 47, M.runner); runner.rotation.x = -Math.PI / 2; runner.position.set(0, 0.004, -23);
  const inlay = new THREE.Mesh(keep(new THREE.CircleGeometry(R - 0.05, 64)), M.inlay); inlay.rotation.x = -Math.PI / 2; inlay.position.set(0, 0.006, RZ); scene.add(inlay);

  for (const s of [-1, 1]) {
    box(0.3, H, 6, M.wall, s * (W + 0.15), H / 2, -2);
    for (let k = 0; k <= 4; k++) {
      const z = Z0 - L * k, len = k === 4 ? 2.8 : 2;
      box(0.6, H, len, M.trim, s * W, H / 2, k === 4 ? z - 0.4 : z);
      box(0.06, H - 0.6, 0.06, M.neonA, s * (W - 0.32), H / 2, k === 4 ? z - 0.4 : z);
    }
    for (let k = 0; k < 4; k++) {
      const c = bayZ(k);
      box(0.3, H, 8, M.wall, s * (W + D + 0.15), H / 2, c);
      box(D, H, 0.3, M.wall, s * (W + D / 2), H / 2, c - 4.1);
      box(D, H, 0.3, M.wall, s * (W + D / 2), H / 2, c + 4.1);
    }
    box(0.08, 0.08, 46, M.neonB, s * 3, H - 0.06, -23);
  }
  box(2 * W, H, 0.3, M.wall, 0, H / 2, 1.15);
  box(3.2, 4, 0.1, M.trim, 0, 2, 0.98); box(2.8, 3.7, 0.12, M.lacquer, 0, 1.85, 0.97);
  const ceil = box(2 * (W + D), 0.2, 48.6, M.wall, 0, H + 0.1, -23.3); ceil.material = M.wall;
  const band = plane(3, 46, skyBand); band.rotation.x = Math.PI / 2; band.position.set(0, H - 0.005, -23);

  for (let z = -1; z > -47; z -= 2.5) box(3.2, 0.14, 0.18, M.trim, 0, H - 0.08, z);
  box(0.16, 0.14, 46.5, M.trim, 1.55, H - 0.08, -23); box(0.16, 0.14, 46.5, M.trim, -1.55, H - 0.08, -23);

  /* Rotunda */
  const a = Math.asin(W / R);
  const rot = new THREE.Mesh(keep(new THREE.CylinderGeometry(R, R, H, 72, 1, true, a, Math.PI * 2 - 2 * a)), keep(new THREE.MeshStandardMaterial({ color: pal.wall, roughness: 0.8, side: THREE.DoubleSide })));
  rot.position.set(0, H / 2, RZ); scene.add(rot);
  const dome = new THREE.Mesh(keep(new THREE.SphereGeometry(R, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2)), skyDome); dome.position.set(0, H, RZ); scene.add(dome);
  const ringN = new THREE.Mesh(keep(new THREE.TorusGeometry(R - 0.08, 0.05, 8, 128)), M.neonA); ringN.rotation.x = Math.PI / 2; ringN.position.set(0, H - 0.25, RZ); scene.add(ringN);
  const ringM = new THREE.Mesh(keep(new THREE.TorusGeometry(R - 0.08, 0.035, 8, 128)), M.neonB); ringM.rotation.x = Math.PI / 2; ringM.position.set(0, 0.35, RZ); scene.add(ringM);

  /* Lights: environment reflections do most of the work; a headlamp adds glints, spots dress the podium. */
  scene.add(new THREE.HemisphereLight(pal.dark ? "#b9a3ff" : "#fff2d0", pal.dark ? "#1a0b2e" : "#8a5a00", pal.dark ? 0.7 : 0.9));
  const sun = new THREE.DirectionalLight(pal.dark ? "#ff9ad0" : "#ffd59a", 0.9); sun.position.set(3, 10, -10); scene.add(sun);
  const lamp = new THREE.PointLight("#ffffff", 14, 10, 2); scene.add(lamp);

  /* Benches in the middle of the hall */
  for (let k = 0; k < 4; k++) {
    const c = bayZ(k);
    box(0.6, 0.1, 2.4, M.lacquer, 0, 0.47, c); box(0.62, 0.04, 2.42, M.trim, 0, 0.53, c);
    box(0.5, 0.42, 0.12, M.trim, 0, 0.21, c - 0.95); box(0.5, 0.42, 0.12, M.trim, 0, 0.21, c + 0.95);
  }

  const total = rows.length, got = rows.filter((t) => t.earned_at).length;
  const entry = plane(5.4, 1.35, basic(signTex("HALL OF FAME", `${got} of ${total} trophies unlocked`, pal.neonA)));
  entry.position.set(0, 4.1, -5.6);
  const podSign = plane(7, 1.75, basic(signTex("THE PODIUM", "Weekly · Monthly · Yearly", pal.neonB)));
  podSign.position.set(0, 4.25, RZ - R + 0.35);

  /* ─── Exhibits ─── */
  const items: Item[] = [], hits: THREE.Mesh[] = [];
  const signs: THREE.MeshBasicMaterial[] = [];
  const addItem = (t: Trophy, parent: THREE.Object3D, x: number, y: number, z: number, scale = 1) => {
    const earned = !!t.earned_at;
    const g = trophyModel(t, earned); g.scale.multiplyScalar(scale); g.position.set(x, y, z); parent.add(g);
    const hit = new THREE.Mesh(keep(new THREE.BoxGeometry(0.62 * scale, 0.9 * scale, 0.5 * scale)), M.hit); hit.position.set(x, y + 0.42 * scale, z); hit.userData.id = t.id; parent.add(hit); hits.push(hit);
    const shadow = plane(0.7 * scale, 0.7 * scale, keep(new THREE.MeshBasicMaterial({ map: glow, color: "#000", transparent: true, opacity: 0.45, depthWrite: false })), parent);
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(x, y + 0.003, z);
    if (earned) {
      const halo = plane(0.9 * scale, 0.9 * scale, keep(new THREE.MeshBasicMaterial({ map: glow, color: (HUE[t.category] ?? HUE.Uploads)[0], transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending })), parent);
      halo.rotation.x = -Math.PI / 2; halo.position.set(x, y + 0.006, z); halo.userData.halo = true; g.userData.halo = halo;
    }
    parent.updateMatrixWorld(true);
    const world = new THREE.Vector3(x, y + 0.4 * scale, z).applyMatrix4(parent.matrixWorld);
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(parent.matrixWorld);
    items.push({ id: t.id, group: g, world, normal, earned, fresh: earned && !t.seen_at, spin: earned, base: g.rotation.y });
  };

  WINGS.forEach((cat, ci) => {
    const s = sideOf(ci), c = bayZ(ci >> 1), h = HUE[cat];
    const list = rows.filter((t) => t.category === cat);
    const n = list.filter((t) => t.earned_at).length;
    const grp = new THREE.Group(); grp.position.set(s * (W + D), 0, c); grp.rotation.y = -s * Math.PI / 2; scene.add(grp);
    const back = plane(8, H, keep(new THREE.MeshStandardMaterial({ color: new THREE.Color(h[2]).multiplyScalar(0.6), roughness: 0.75 })), grp); back.position.set(0, H / 2, 0.01);
    const cab = new THREE.Mesh(keep(new THREE.BoxGeometry(8.2, 3.4, 0.06)), M.lacquer); cab.position.set(0, 1.95, 0.03); grp.add(cab);
    const fr = new THREE.Mesh(keep(new THREE.BoxGeometry(8.4, 0.08, 0.7)), M.trim); fr.position.set(0, 3.62, 0.33); grp.add(fr);
    const fr2 = fr.clone(); fr2.position.y = 0.28; grp.add(fr2);
    const rug = plane(7.4, 2.4, keep(new THREE.MeshStandardMaterial({ color: h[2], roughness: 1 })), grp); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.005, 2.1);
    const rugEdge = plane(7.6, 2.6, M.trim, grp); rugEdge.rotation.x = -Math.PI / 2; rugEdge.position.set(0, 0.003, 2.1);
    const sm = basic(signTex(cat.toUpperCase(), `${n} of ${list.length} unlocked`, h[1]));
    signs[ci + 1] = sm;
    const sign = plane(6.6, 1.65, sm, grp); sign.position.set(0, 4.6, 0.08);
    const strip = plane(8, 0.06, keep(new THREE.MeshBasicMaterial({ color: h[1], toneMapped: false })), grp); strip.position.set(0, 3.7, 0.69);
    list.forEach((t, i) => {
      const row = i < 5 ? 0 : 1, col = i % 5, x = -3 + col * 1.5, sy = row ? 2.15 : 0.75;
      const nich = plane(1.32, 1.3, keep(new THREE.MeshBasicMaterial({ map: glow, color: h[1], transparent: true, opacity: t.earned_at ? 0.75 : 0.2, toneMapped: false, depthWrite: false })), grp);
      nich.position.set(x, sy + 0.65, 0.07);
      const shelf = new THREE.Mesh(keep(new THREE.BoxGeometry(1.36, 0.05, 0.58)), M.trim); shelf.position.set(x, sy, 0.31); grp.add(shelf);
      addItem(t, grp, x, sy + 0.025, 0.3);
      const pl = plane(0.98, 0.276, basic(plaqueTex(t.name, statusLine(t), h[0], !!t.earned_at), { transparent: false, depthWrite: true }), grp);
      pl.position.set(x, sy - 0.11, 0.611);
      if (col < 4) { const d = new THREE.Mesh(keep(new THREE.BoxGeometry(0.05, 1.32, 0.6)), M.trim); d.position.set(x + 0.75, sy + 0.66, 0.31); grp.add(d); }
    });
  });

  /* Podium hall: three plinths, the yearly trophy in the middle and highest. */
  const pod = rows.filter((t) => t.category === "Podium");
  const spots: [string, number, number][] = [["podium_monthly", -3.3, 1.0], ["podium_yearly", 0, 1.45], ["podium_weekly", 3.3, 0.8]];
  const PZ = RZ - 3;
  for (const [id, x, h] of spots) {
    const t = pod.find((p) => p.id === id); if (!t) continue;
    const pl = new THREE.Mesh(keep(new THREE.CylinderGeometry(1.0, 1.1, h, 48)), M.lacquer); pl.position.set(x, h / 2, PZ); scene.add(pl);
    const rim = new THREE.Mesh(keep(new THREE.TorusGeometry(1.0, 0.03, 8, 64)), t.earned_at ? M.neonB : M.trim); rim.rotation.x = Math.PI / 2; rim.position.set(x, h, PZ); scene.add(rim);
    const holder = new THREE.Group(); holder.position.set(x, h, PZ); scene.add(holder);
    addItem(t, holder, 0, 0, 0, 2.3);
    const plq = plane(1.4, 0.394, basic(plaqueTex(t.name, statusLine(t), "#f0c24b", !!t.earned_at), { transparent: false, depthWrite: true }));
    plq.position.set(x, h - 0.28, PZ + 1.03);
    const spot = new THREE.SpotLight(t.earned_at ? "#fff1c4" : "#9a8bc0", t.earned_at ? 60 : 18, 12, 0.32, 0.6, 1.6);
    spot.position.set(x, H + 1.5, PZ + 1.2); spot.target.position.set(x, h, PZ); scene.add(spot, spot.target);
    const cone = new THREE.Mesh(keep(new THREE.ConeGeometry(1.3, H, 32, 1, true)), keep(new THREE.MeshBasicMaterial({ color: t.earned_at ? "#ffe9a8" : "#8a7bb0", transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false })));
    cone.position.set(x, H / 2 + h / 2, PZ); scene.add(cone);
  }

  /* Dust motes drifting in the light */
  const NM = 600, mp = new Float32Array(NM * 3);
  for (let i = 0; i < NM; i++) { mp[i * 3] = (Math.random() - 0.5) * 16; mp[i * 3 + 1] = Math.random() * H; mp[i * 3 + 2] = 1 - Math.random() * 64; }
  const motesGeo = keep(new THREE.BufferGeometry()); motesGeo.setAttribute("position", new THREE.BufferAttribute(mp, 3));
  const motes = new THREE.Points(motesGeo, keep(new THREE.PointsMaterial({ color: pal.neonB, size: 0.035, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, map: glow })));
  scene.add(motes);

  /* ─── Movement, collisions, camera ─── */
  const benches = [0, 1, 2, 3].map(bayZ);
  const walkable = (x: number, z: number) => {
    let ok = (Math.abs(x) <= W - 0.6 && z <= 0.6 && z >= -48.5)
      || [0, 1, 2, 3].some((k) => Math.abs(z - bayZ(k)) <= 3.6 && Math.abs(x) <= W + D - 1.05)
      || (Math.hypot(x, z - RZ) <= R - 0.6 && z <= -46);
    if (ok && benches.some((c) => Math.abs(x) < 0.6 && Math.abs(z - c) < 1.5)) ok = false;
    if (ok && Math.abs(x) < 4.7 && z < PZ + 1.6 && z > PZ - 1.6) ok = false;
    return ok;
  };
    const pose: Pose = { p: new THREE.Vector3(0, 2.6, 0.4), yaw: 0, pitch: -0.05 };
  let tween: { from: Pose; to: Pose; t: number; dur: number } | null = null;
  let before: Pose | null = null; // where the camera was before focusing a trophy
  let focused: string | null = null;
  const clone = (p: Pose): Pose => ({ p: p.p.clone(), yaw: p.yaw, pitch: p.pitch });
  const flyTo = (to: Pose, dur = 1.3) => {
    if (opts.reduced) { pose.p.copy(to.p); pose.yaw = to.yaw; pose.pitch = to.pitch; tween = null; return; }
    let yaw = to.yaw; while (yaw - pose.yaw > Math.PI) yaw -= Math.PI * 2; while (yaw - pose.yaw < -Math.PI) yaw += Math.PI * 2;
    tween = { from: clone(pose), to: { p: to.p.clone(), yaw, pitch: to.pitch }, t: 0, dur };
  };
  function resizeNow() { const w = host.clientWidth, h = host.clientHeight; if (w && h) { camera.aspect = w / h; camera.updateProjectionMatrix(); } }
  /* On a narrow (portrait) screen, step back so a whole display fits in view. */
  const station = (i: number): Pose => {
    const st = clone(STATIONS[Math.max(0, Math.min(9, i))]);
    let k = Math.max(0, (1 - camera.aspect) * 5);
    const dx = Math.sin(st.yaw), dz = Math.cos(st.yaw);
    while (k > 0 && !walkable(st.p.x + dx * k, st.p.z + dz * k)) k -= 0.25;
    if (k > 0) { st.p.x += dx * k; st.p.z += dz * k; }
    return st;
  };
  resizeNow();
  flyTo(station(opts.startRoom), opts.startRoom ? 2.4 : 1.8);

  let look: LookSettings = { ...DEFAULT_LOOK, ...(opts.look ?? {}) };
  const keys = new Set<string>();
  let joy = { x: 0, y: 0 };
  const onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(k)) {
      if (e.type === "keydown") { keys.add(k); if (focused) api.unfocus(); tween = null; } else keys.delete(k);
      if (k.startsWith("arrow")) e.preventDefault();
    } else if (k === "escape" && e.type === "keydown" && focused) api.unfocus();
  };
  const clearKeys = () => keys.clear();
  keyTarget.addEventListener("keydown", onKey); keyTarget.addEventListener("keyup", onKey); keyTarget.addEventListener("blur", clearKeys, true);

  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  let drag: { x: number; y: number; moved: number; id: number } | null = null;
  let pointer: { x: number; y: number } | null = null, hovered: string | null = null;
  const pick = (cx: number, cy: number) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(hits, false)[0];
    return h && h.distance < 14 ? (h.object.userData.id as string) : null;
  };
  const el = renderer.domElement;
  const down = (e: PointerEvent) => { if (drag) return; drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId }; el.setPointerCapture(e.pointerId); keyTarget.focus({ preventScroll: true }); };
  const move = (e: PointerEvent) => {
    pointer = { x: e.clientX, y: e.clientY };
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
    if (drag.moved > 4) { tween = null; const k = (e.pointerType === "touch" ? 0.006 : 0.0042) * look.sensitivity; pose.yaw -= dx * k * (look.invertX ? -1 : 1); pose.pitch = Math.max(-0.7, Math.min(0.6, pose.pitch - dy * k * (look.invertY ? -1 : 1))); }
  };
  const up = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const click = drag.moved <= 6; drag = null;
    if (click) { const id = pick(e.clientX, e.clientY); if (id) api.focus(id); else if (focused) api.unfocus(); }
  };
  const leave = () => { pointer = null; };
  el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); el.addEventListener("pointerleave", leave);

  const resize = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.8 ? look.fov + 12 : look.fov; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  const roomAt = () => {
    const { x, z } = pose.p;
    if (z > Z0 + 0.5) return 0;
    if (z < -46.5) return 9;
    const k = Math.max(0, Math.min(3, Math.floor((Z0 - z) / L)));
    const side = Math.abs(x) > W - 0.5 ? Math.sign(x) : (-Math.sin(pose.yaw) >= 0 ? 1 : -1);
    return 1 + 2 * k + (side > 0 ? 1 : 0);
  };
  let room = -1, flicker = 0;

  const clock = new THREE.Clock(); let raf = 0, t = 0, readied = false;
  const fwd = new THREE.Vector3(), right = new THREE.Vector3();
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const raw = clock.getDelta(), dt = Math.min(0.05, raw); t += dt;

    if (tween) {
      tween.t = Math.min(1, tween.t + Math.min(0.25, raw) / tween.dur);
      const e = tween.t < 0.5 ? 4 * tween.t ** 3 : 1 - (-2 * tween.t + 2) ** 3 / 2;
      pose.p.lerpVectors(tween.from.p, tween.to.p, e);
      pose.yaw = tween.from.yaw + (tween.to.yaw - tween.from.yaw) * e;
      pose.pitch = tween.from.pitch + (tween.to.pitch - tween.from.pitch) * e;
      if (tween.t >= 1) tween = null;
    } else {
      const f = (keys.has("w") || keys.has("arrowup") ? 1 : 0) - (keys.has("s") || keys.has("arrowdown") ? 1 : 0) + joy.y;
      const sd = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0) + joy.x;
      pose.yaw += ((keys.has("arrowleft") ? 1 : 0) - (keys.has("arrowright") ? 1 : 0)) * dt * 1.8;
      if (f || sd) {
        const sp = (keys.has("shift") ? 6 : 3.2) * look.speed * dt;
        fwd.set(-Math.sin(pose.yaw), 0, -Math.cos(pose.yaw)); right.set(Math.cos(pose.yaw), 0, -Math.sin(pose.yaw));
        const nx = pose.p.x + (fwd.x * f + right.x * sd) * sp, nz = pose.p.z + (fwd.z * f + right.z * sd) * sp;
        if (walkable(nx, nz)) { pose.p.x = nx; pose.p.z = nz; }
        else if (walkable(nx, pose.p.z)) pose.p.x = nx;
        else if (walkable(pose.p.x, nz)) pose.p.z = nz;
      }
      const bob = f || sd ? (opts.reduced ? 0 : Math.sin(t * 9) * 0.025) : 0;
      if (!focused) pose.p.y += (EYE + bob - pose.p.y) * Math.min(1, dt * 5);
    }
    camera.position.copy(pose.p); camera.rotation.set(pose.pitch, pose.yaw, 0);
    lamp.position.copy(pose.p).add(new THREE.Vector3(0, 0.4, 0));

    const r = roomAt(); if (r !== room) { room = r; flicker = 0.9; opts.onRoom(r); }
    const sm = signs[room];
    if (flicker > 0) { flicker -= Math.min(0.25, raw); if (sm) sm.opacity = flicker > 0 ? (Math.random() > 0.35 ? 1 : 0.25) : 1; }

    if (!opts.reduced) {
      for (const it of items) {
        const target = it.id === hovered || it.id === focused ? 1.12 : 1;
        it.group.userData.s = (it.group.userData.s ?? 1) + (target - (it.group.userData.s ?? 1)) * Math.min(1, dt * 8);
        if (it.spin) it.group.rotation.y = it.base + t * 0.55 + it.world.x;
        const s0 = it.group.userData.s0 ?? (it.group.userData.s0 = it.group.scale.x);
        it.group.scale.setScalar(s0 * it.group.userData.s);
        const halo = it.group.userData.halo as THREE.Mesh | undefined;
        if (halo && it.fresh) { const k = 1 + 0.35 * Math.sin(t * 4); halo.scale.setScalar(k); (halo.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.3 * Math.sin(t * 4); }
      }
      const pos = motesGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < NM; i++) { let y = pos.getY(i) + dt * 0.08; if (y > H) y = 0; pos.setY(i, y); pos.setX(i, pos.getX(i) + Math.sin(t + i) * dt * 0.02); }
      pos.needsUpdate = true;
      skyDome.uniforms.t.value = t; skyBand.uniforms.t.value = t;
    }
    if (pointer && !drag) {
      const id = pick(pointer.x, pointer.y);
      if (id !== hovered) { hovered = id; el.style.cursor = id ? "pointer" : "grab"; opts.onHover(id); }
    }
    opts.onPose(pose.p.x, pose.p.z, pose.yaw);
    renderer.render(scene, camera);
    if (!readied) { readied = true; opts.onReady(); }
  };
  loop();

  const api: MuseumApi = {
    setLook(n) { look = { ...n }; resize(); },
    goRoom(i) { if (focused) { focused = null; before = null; opts.onSelect(null); } flyTo(station(i)); },
    focus(id) {
      const it = items.find((x) => x.id === id); if (!it) return;
      if (!focused) before = clone(pose);
      focused = id; opts.onSelect(id);
      const dist = it.id.startsWith("podium") ? 3.6 : 2.0;
      const p = it.world.clone().addScaledVector(it.normal, dist); p.y = it.world.y + (it.id.startsWith("podium") ? 0.4 : 0.05);
      flyTo({ p, yaw: Math.atan2(it.normal.x, it.normal.z), pitch: it.id.startsWith("podium") ? -0.05 : -0.04 }, 0.9);
    },
    unfocus() { if (!focused) return; focused = null; opts.onSelect(null); if (before) flyTo(before, 0.8); before = null; },
    setMove(x, y) { joy = { x, y }; if ((x || y) && focused) api.unfocus(); if (x || y) tween = null; },
    setPalette(p) {
      pal = p;
      M.wall.color.set(p.wall); M.trim.color.set(p.trim); (rot.material as THREE.MeshStandardMaterial).color.set(p.wall);
      M.neonA.color.set(p.neonA); M.neonB.color.set(p.neonB);
      for (const [m, f] of [[M.floor, terrazzo], [M.runner, runnerTex], [M.inlay, inlayTex]] as const) { m.map?.dispose(); m.map = f(p); m.needsUpdate = true; }
      (scene.fog as THREE.Fog).color.set(p.wall); (scene.background as THREE.Color).set(p.wall);
      const c = p.dark ? ["#140a26", "#8a2be2", "#ff3d8b"] : ["#ff9a3c", "#ffbe55", "#fff0c2"];
      for (const s of [skyDome, skyBand]) { s.uniforms.top.value.set(c[0]); s.uniforms.mid.value.set(c[1]); s.uniforms.bot.value.set(c[2]); s.uniforms.stars.value = p.dark ? 1 : 0; }
    },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect();
      keyTarget.removeEventListener("keydown", onKey); keyTarget.removeEventListener("keyup", onKey); keyTarget.removeEventListener("blur", clearKeys, true);
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); el.removeEventListener("pointerleave", leave);
      for (const m of [M.floor, M.runner, M.inlay]) m.map?.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose(); el.remove();
    },
  };
  return api;
}
