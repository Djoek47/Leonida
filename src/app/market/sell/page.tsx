"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "@/components/A";
import { sb } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { ClipEmblem } from "@/components/ClipEmblem";
import { MarketCard } from "@/components/market/MarketCard";
import { grabFrame, seek, uploadVideo } from "@/lib/marketUpload";
import { LISTING_COLS, MAX_BYTES, PRICE_MAX, PRICE_MIN, SHOTS, TAGS, THEMES, feeFor, mmss, quality, shotUrl, size, usd, type Listing, type MarketTag, type MarketTheme } from "@/lib/market";

/** Sell a clip: pick the video, grab five screenshots from it, build the card, set the price.
 *  The video uploads straight to private storage (resumable, up to 5 GB) and the listing goes
 *  to review. ?edit=<id> edits the card and price; ?resume=<id> finishes an interrupted upload. */
type Shot = { blob?: Blob; path?: string; url: string } | null;
const STEPS = ["Video", "Screenshots", "Card", "Price"];
const OK_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"];

export default function Sell() {
  const { user, profile, loading } = useUser();
  const [mode, setMode] = useState<"new" | "edit" | "resume">("new");
  const [editId, setEditId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ d: number; w: number; h: number } | null>(null);
  const [canPreview, setCanPreview] = useState(true);
  const [shots, setShots] = useState<Shot[]>(Array(SHOTS).fill(null));
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [beats, setBeats] = useState<string[]>(["", "", ""]);
  const [tags, setTags] = useState<MarketTag[]>([]);
  const [emblem, setEmblem] = useState<MarketTag>("action");
  const [emblemSet, setEmblemSet] = useState(false);
  const [theme, setTheme] = useState<MarketTheme>("vice_city");
  const [price, setPrice] = useState(500);
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState<{ sent: number; total: number; t0: number } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const vid = useRef<HTMLVideoElement>(null);

  // Edit or resume an existing listing.
  useEffect(() => {
    const p = new URLSearchParams(location.search), e = p.get("edit"), r = p.get("resume"), id = e || r;
    if (!id || !user) return;
    sb()?.from("market_listings").select(LISTING_COLS).eq("id", id).eq("seller_id", user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      const l = data as Listing;
      setEditId(l.id); setMode(e ? "edit" : "resume");
      setTitle(l.title); setDesc(l.description); setBeats([...l.highlights, "", "", ""].slice(0, Math.max(3, l.highlights.length)));
      setTags(l.tags); setEmblem(l.emblem); setEmblemSet(true); setTheme(l.theme); setPrice(l.price_cents);
      setShots(l.shots.map((path) => ({ path, url: shotUrl(path) })));
      if (l.duration_s) setMeta({ d: l.duration_s, w: l.width ?? 0, h: l.height ?? 0 });
      setStep(e ? 2 : 0);
    });
  }, [user]);
  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);
  useEffect(() => { if (!emblemSet && tags[0]) setEmblem(tags[0]); }, [tags, emblemSet]);

  const pick = (f: File | undefined) => {
    setErr("");
    if (!f) return;
    if (!OK_TYPES.includes(f.type) && !/\.(mp4|mov|webm|mkv)$/i.test(f.name)) { setErr("That isn't a video we can take. Use MP4, MOV, WebM or MKV."); return; }
    if (f.size > MAX_BYTES) { setErr(`That file is ${size(f.size)}. The limit is 5 GB.`); return; }
    if (src) URL.revokeObjectURL(src);
    setFile(f); setSrc(URL.createObjectURL(f)); setMeta(null); setCanPreview(true);
  };
  const onMeta = () => { const v = vid.current; if (v) setMeta({ d: v.duration, w: v.videoWidth, h: v.videoHeight }); };

  const setShot = (i: number, s: Shot) => setShots((xs) => { const n = [...xs]; if (n[i]?.blob && n[i]?.url) URL.revokeObjectURL(n[i]!.url); n[i] = s; return n; });
  const grab = async (slot?: number) => {
    const v = vid.current; if (!v) return;
    const b = await grabFrame(v); if (!b) return;
    const i = slot ?? shots.findIndex((s) => !s);
    setShot(i < 0 ? SHOTS - 1 : i, { blob: b, url: URL.createObjectURL(b) });
  };
  const autoPick = async () => {
    const v = vid.current; if (!v || !v.duration) return;
    setBusy(true);
    for (let i = 0; i < SHOTS; i++) { await seek(v, v.duration * (0.1 + i * 0.2)); const b = await grabFrame(v); if (b) setShot(i, { blob: b, url: URL.createObjectURL(b) }); }
    setBusy(false);
  };
  const fromImages = (fs: FileList | null) => {
    if (!fs) return;
    let i = 0;
    for (const f of Array.from(fs).slice(0, SHOTS)) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 5 * 1024 * 1024) continue;
      while (i < SHOTS && shots[i] && i < SHOTS) i++;
      setShot(Math.min(i, SHOTS - 1), { blob: f, url: URL.createObjectURL(f) }); i++;
    }
  };

  const fee = feeFor(price), shotCount = shots.filter(Boolean).length;
  const cleanBeats = beats.map((b) => b.trim()).filter(Boolean).slice(0, 5);
  const checks = useMemo(() => [
    mode !== "new" || Boolean(file) ? "" : "Choose the video.",
    mode === "resume" && !file ? "Choose the same video again to finish uploading." : "",
    shotCount === SHOTS ? "" : `Add ${SHOTS - shotCount} more screenshot${SHOTS - shotCount === 1 ? "" : "s"}.`,
    title.trim().length >= 3 ? "" : "Give it a title.",
    desc.trim().length >= 20 ? "" : "Write at least a couple of sentences describing the clip.",
    tags.length ? "" : "Pick at least one tag.",
  ].filter(Boolean), [mode, file, shotCount, title, desc, tags]);

  const publish = async () => {
    const c = sb(); if (!c || !user) return;
    if (checks.length) { setErr(checks[0]); return; }
    if (mode !== "edit" && !agree) { setErr("Tick the box to confirm the clip is yours to sell."); return; }
    setBusy(true); setErr("");
    try {
      const id = editId ?? crypto.randomUUID();
      const paths: string[] = [];
      for (let i = 0; i < SHOTS; i++) {
        const s = shots[i]!;
        if (s.path) { paths.push(s.path); continue; }
        const p = `${user.id}/${id}/${Date.now()}-${i}.jpg`;
        const { error } = await c.storage.from("market-shots").upload(p, s.blob!, { contentType: s.blob!.type || "image/jpeg", upsert: true });
        if (error) throw new Error("A screenshot didn't upload. Try again.");
        paths.push(p);
      }
      const fields = { title: title.trim(), description: desc.trim(), highlights: cleanBeats, tags, emblem, theme, price_cents: price, shots: paths };
      if (mode === "edit") {
        const { error } = await c.from("market_listings").update(fields).eq("id", id);
        if (error) throw new Error(error.message);
        setDone(id); return;
      }
      if (mode === "new") {
        const { error } = await c.from("market_listings").insert({ id, seller_id: user.id, ...fields, status: "uploading",
          duration_s: meta ? Math.max(1, Math.round(meta.d)) : null, size_bytes: file!.size, width: meta?.w || null, height: meta?.h || null });
        if (error) throw new Error(error.message);
      } else {
        await c.from("market_listings").update({ ...fields, size_bytes: file!.size }).eq("id", id);
      }
      const ext = (file!.name.split(".").pop() || "mp4").toLowerCase();
      setProg({ sent: 0, total: file!.size, t0: Date.now() });
      const stored = await uploadVideo(file!, `market/${user.id}/${id}.${ext}`, (sent, total) => setProg((p) => ({ sent, total, t0: p?.t0 ?? Date.now() }))).done;
      const { error } = await c.from("market_listings").update({ storage_path: stored, status: "pending" }).eq("id", id);
      if (error) throw new Error(error.message);
      setDone(id);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setErr(/413|too large|exceeded|maximumSize/i.test(m) ? "That file is over 5 GB. Trim it and try again." : /abort/i.test(m) ? "Upload stopped." : "The upload didn't finish. Check your connection and try again.");
    } finally { setBusy(false); }
  };

  if (loading) return <div className="mk-page"><p className="mk-wrap py-20 font-bold" role="status">Loading…</p></div>;
  if (!user) return (
    <div className="mk-page"><div className="mk-wrap py-20 text-center">
      <ClipEmblem id="money" className="mk-empty-ico mx-auto" />
      <p className="display text-4xl mt-2">Sign in to sell clips</p>
      <Link href="/login?next=/market/sell" className="btn btn-hot mt-5">Sign in</Link>
    </div></div>
  );
  if (!profile?.gamertag) return (
    <div className="mk-page"><div className="mk-wrap py-20 text-center">
      <p className="display text-4xl">Add your gamertag first</p>
      <p className="text-haze mt-2">Buyers see it on your listings, so they know whose clip they&apos;re buying.</p>
      <Link href="/settings" className="btn btn-hot mt-5">Open settings</Link>
    </div></div>
  );
  if (done) return (
    <div className="mk-page"><div className="mk-wrap py-16 mk-done">
      <span className="mk-done-ico" aria-hidden>✓</span>
      <p className="display text-5xl">{mode === "edit" ? "Listing updated" : "Sent for review"}</p>
      <p className="text-haze mt-2 max-w-lg mx-auto">{mode === "edit" ? "Changes to the card are live straight away. New screenshots go back through a quick review." : "Our team checks the video matches the card, usually within a day. You'll find it in My clips, and it goes live as soon as it's approved."}</p>
      <div className="flex flex-wrap gap-3 justify-center mt-6">
        <Link href={`/market/${done}`} className="btn btn-hot">See the listing</Link>
        <Link href="/market/mine" className="btn btn-ghost">My clips</Link>
      </div>
    </div></div>
  );

  const preview = { title, tags: tags.length ? tags : ["action" as MarketTag], emblem, theme, price_cents: price, duration_s: meta ? Math.round(meta.d) : null, width: meta?.w ?? null, height: meta?.h ?? null, shots: shots.map((s) => s?.url ?? ""), seller: profile.gamertag ?? undefined };
  const pct = prog ? Math.round((prog.sent / prog.total) * 100) : 0;
  const speed = prog && Date.now() > prog.t0 ? prog.sent / ((Date.now() - prog.t0) / 1000) : 0;

  return (
    <div className="mk-page">
      <div className="mk-wrap">
        <nav className="mk-crumbs"><Link href="/market">Clip Market</Link><span>›</span><span>{mode === "edit" ? "Edit listing" : "Sell a clip"}</span></nav>
        <h1 className="mk-title mk-title-sm">{mode === "edit" ? <>Edit your <span>listing</span></> : <>Sell a <span>clip</span></>}</h1>

        <ol className="mk-stepper">
          {STEPS.map((s, i) => (
            <li key={s}><button className={`${i === step ? "is-on" : ""}${i < step ? " is-done" : ""}`} onClick={() => setStep(i)} disabled={mode === "edit" && i < 1}>
              <span>{i < step ? "✓" : i + 1}</span>{s}
            </button></li>
          ))}
        </ol>

        <div className="mk-sell">
          <div className="mk-sell-main">
            {/* 1. Video */}
            {step === 0 && (
              <section className="mk-panel">
                <h2 className="mk-h2">Your video</h2>
                <p className="text-haze">Up to 5 GB, any length. MP4, MOV, WebM or MKV. Buyers never see it before they pay: only the screenshots and your description.</p>
                {mode === "resume" && <p className="mk-status mt-3">Your last upload didn&apos;t finish. Choose the same file and we&apos;ll upload it again.</p>}
                <label className={`mk-drop${file ? " has-file" : ""}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}>
                  <input type="file" accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mkv" onChange={(e) => pick(e.target.files?.[0])} />
                  {file ? (
                    <>
                      <span className="mk-drop-ico" aria-hidden>🎬</span>
                      <b>{file.name}</b>
                      <small>{size(file.size)}{meta ? ` · ${mmss(meta.d)} · ${quality(meta.w, meta.h)}` : ""} · tap to change</small>
                    </>
                  ) : (
                    <><span className="mk-drop-ico" aria-hidden>⬆</span><b>Drop your clip here</b><small>or tap to choose a file</small></>
                  )}
                </label>
                {src && (
                  <video ref={vid} src={src} className="mk-player" controls muted playsInline preload="metadata" onLoadedMetadata={onMeta} onError={() => setCanPreview(false)} />
                )}
                {src && !canPreview && <p className="mk-status mt-2">Your browser can&apos;t play this file, so we can&apos;t grab screenshots from it. You can still sell it: upload five screenshots as images in the next step.</p>}
                <div className="mk-nav"><span /><button className="btn btn-hot" disabled={!file && mode !== "edit"} onClick={() => setStep(1)}>Next: screenshots</button></div>
              </section>
            )}

            {/* 2. Screenshots */}
            {step === 1 && (
              <section className="mk-panel">
                <h2 className="mk-h2">Five screenshots</h2>
                <p className="text-haze">These are the shop window. Scrub to a moment and grab it, or let us pick five spread across the clip. Show the best bits without giving the whole thing away.</p>
                {src && canPreview ? (
                  <>
                    <video ref={vid} src={src} className="mk-player" controls muted playsInline preload="auto" onLoadedMetadata={onMeta} onError={() => setCanPreview(false)} />
                    <div className="mk-grab">
                      <button className="btn btn-hot" onClick={() => grab()} disabled={busy}>📸 Grab this frame</button>
                      <button className="btn btn-ghost" onClick={autoPick} disabled={busy}>{busy ? "Picking…" : "✨ Pick five for me"}</button>
                    </div>
                  </>
                ) : <p className="mk-status mt-3">{mode === "edit" ? "To change a screenshot, upload a new image below." : "Upload five screenshots as images."}</p>}
                <ul className="mk-slots">
                  {shots.map((s, i) => (
                    <li key={i} className={s ? "is-full" : ""}>
                      {s ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.url} alt={`Screenshot ${i + 1}`} />
                          <span className="mk-slot-n">{i === 0 ? "Cover" : i + 1}</span>
                          <span className="mk-slot-act">
                            {src && canPreview && <button onClick={() => grab(i)} title="Replace with the current frame">↻</button>}
                            <button onClick={() => setShot(i, null)} title="Remove">✕</button>
                          </span>
                        </>
                      ) : <span className="mk-slot-empty"><b>{i + 1}</b>{i === 0 ? "Cover" : "Empty"}</span>}
                    </li>
                  ))}
                </ul>
                <label className="mk-imgs">
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => fromImages(e.target.files)} />
                  Or upload images instead (JPG, PNG or WebP, 5 MB each)
                </label>
                <div className="mk-nav"><button className="btn btn-ghost" onClick={() => setStep(0)}>Back</button><button className="btn btn-hot" onClick={() => setStep(2)}>{shotCount === SHOTS ? "Next: the card" : `Next (${shotCount}/5)`}</button></div>
              </section>
            )}

            {/* 3. Card */}
            {step === 2 && (
              <section className="mk-panel">
                <h2 className="mk-h2">The card</h2>
                <label className="mk-field"><span>Title <small>{title.length}/80</small></span>
                  <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} placeholder="Airboat jump over the cop blockade" /></label>
                <label className="mk-field"><span>Describe the clip <small>{desc.length}/2000</small></span>
                  <textarea rows={5} value={desc} onChange={(e) => setDesc(e.target.value.slice(0, 2000))} placeholder="What happens, where it is, what makes it worth buying. Buyers can't watch it first, so be exact." /></label>
                <div className="mk-field"><span>What happens, in order <small>optional, up to 5</small></span>
                  {beats.map((b, i) => (
                    <div key={i} className="mk-beat-in"><b>{i + 1}</b><input value={b} maxLength={120} onChange={(e) => setBeats((x) => x.map((y, k) => (k === i ? e.target.value : y)))} placeholder={["Five-star chase starts on Ocean Drive", "Airboat off the pier at 0:42", "Lands on the police boat"][i] ?? "Next moment"} /></div>
                  ))}
                  {beats.length < 5 && <button className="mk-add" onClick={() => setBeats((x) => [...x, ""])}>+ Add a moment</button>}
                </div>
                <div className="mk-field"><span>Tags <small>{tags.length}/4</small></span>
                  <div className="mk-tagpick">
                    {TAGS.map((t) => {
                      const on = tags.includes(t.id);
                      return (
                        <button key={t.id} className={on ? "is-on" : ""} aria-pressed={on} onClick={() => setTags((x) => on ? x.filter((y) => y !== t.id) : x.length < 4 ? [...x, t.id] : x)}>
                          <ClipEmblem id={t.id} className="mk-tagpick-ico" /><b>{t.label}</b><small>{t.blurb}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mk-field"><span>Card emblem</span>
                  <div className="mk-emblems">
                    {(tags.length ? tags : TAGS.map((t) => t.id)).map((id) => (
                      <button key={id} className={emblem === id ? "is-on" : ""} onClick={() => { setEmblem(id); setEmblemSet(true); }} aria-label={id} aria-pressed={emblem === id}>
                        <ClipEmblem id={id} className="mk-emblem-ico" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mk-field"><span>Card colour</span>
                  <div className="mk-themes">
                    {THEMES.map((t) => (
                      <button key={t.id} className={theme === t.id ? "is-on" : ""} onClick={() => setTheme(t.id)} style={{ "--tone": t.tone, backgroundImage: `url(/media/${t.img}.webp)` } as React.CSSProperties} aria-pressed={theme === t.id}>
                        <span>{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mk-nav"><button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button><button className="btn btn-hot" onClick={() => setStep(3)}>Next: price</button></div>
              </section>
            )}

            {/* 4. Price + publish */}
            {step === 3 && (
              <section className="mk-panel">
                <h2 className="mk-h2">Price</h2>
                <div className="mk-pricer">
                  <b className="mk-pricer-v">{usd(price)}</b>
                  <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={50} value={price} onChange={(e) => setPrice(Number(e.target.value))} aria-label="Price" />
                  <div className="mk-pricer-marks"><span>$1</span><span>$5</span><span>$10</span><span>$15</span><span>$20</span></div>
                </div>
                <dl className="mk-payout">
                  <div><dt>Buyer pays</dt><dd>{usd(price)}</dd></div>
                  <div><dt>Live From Leonida fee <small>20%, 50¢ minimum</small></dt><dd>−{usd(fee)}</dd></div>
                  <div className="is-you"><dt>You get, per sale</dt><dd>{usd(price - fee)}</dd></div>
                </dl>
                <p className="text-sm text-haze">Your share goes into your wallet when the buyer&apos;s payment clears. Cash out from the wallet like any other earnings.</p>
                {mode !== "edit" && (
                  <label className="mk-agree"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                    <span>This is my own gameplay, it matches the screenshots and description, and buyers may use the file. <Link href="/terms" className="underline">Terms</Link></span></label>
                )}
                {checks.length > 0 && <ul className="mk-checks">{checks.map((c) => <li key={c}>{c}</li>)}</ul>}
                {prog && (
                  <div className="mk-prog" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="mk-prog-bar"><i style={{ width: `${pct}%` }} /></div>
                    <p><b>{pct}%</b> · {size(prog.sent)} of {size(prog.total)}{speed > 0 ? ` · ${size(speed)}/s` : ""} · keep this tab open</p>
                  </div>
                )}
                {err && <p className="mk-err" role="alert">{err}</p>}
                <div className="mk-nav">
                  <button className="btn btn-ghost" onClick={() => setStep(2)} disabled={busy}>Back</button>
                  <button className="btn btn-hot" onClick={publish} disabled={busy}>{busy ? (prog ? "Uploading…" : "Saving…") : mode === "edit" ? "Save changes" : mode === "resume" ? "Finish upload" : "Upload and send for review"}</button>
                </div>
              </section>
            )}
          </div>

          <aside className="mk-sell-side">
            <p className="mk-k">Live preview</p>
            <MarketCard c={preview} />
            <p className="text-xs text-haze mt-2">This is how buyers see it in the market. Hover to cycle the screenshots.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
