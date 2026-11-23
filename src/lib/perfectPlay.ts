"use client";
import { CHAPTERS, type Mission } from "@/lib/missions";
import { FORKS, SAVE_PLAN, type Fork, type Option } from "@/lib/choiceTree";

/** Perfect Play: the light, phone-first companion to Mission Briefing and The Road.
 *  It reads and writes the same device storage as both, so ticking a mission here shows up there. */
export const KEYS = { chapter: "lfl-chapter", prog: "lfl-mb-progress", road: "lfl-road", saves: "lfl-saves", at: "lfl-mb-at", perfect: "lfl-pp-perfect", tour: "lfl-pp-tour" };

export type Progress = { done: string[]; steps: Record<string, number[]> };
export type Picks = Record<string, number>;

const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v == null ? d : (JSON.parse(v) as T); } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch {} };

export function loadAll() {
  const p = read<Progress>(KEYS.prog, { done: [], steps: {} });
  const ch = Number(read<number | string>(KEYS.chapter, 0));
  return {
    prog: { done: Array.isArray(p.done) ? p.done : [], steps: p.steps ?? {} } as Progress,
    reach: Number.isInteger(ch) && ch >= 0 && ch < CHAPTERS.length ? ch : 0,
    picks: read<Picks>(KEYS.road, {}),
    perfect: read<boolean>(KEYS.perfect, false),
  };
}
export const saveProg = (p: Progress) => { write(KEYS.prog, p); write(KEYS.at, String(Date.now())); };
export const saveReach = (c: number) => write(KEYS.chapter, String(c));
export const savePicks = (p: Picks) => write(KEYS.road, p);
export const savePerfect = (on: boolean) => write(KEYS.perfect, on);
export const tourSeen = () => read<boolean>(KEYS.tour, false);
export const markTour = () => write(KEYS.tour, true);

/** Wipe the playthrough: missions, choices, save ticks, chapter. */
export function resetAll() {
  for (const k of [KEYS.prog, KEYS.road, KEYS.saves, KEYS.at]) { try { localStorage.removeItem(k); } catch {} }
  saveReach(0);
}

export const story = (ch: number) => CHAPTERS[ch].missions.filter((m) => !m.optional);
export const forksFor = (m: Mission) => FORKS.filter((f) => f.mission === m.name);
export const saveBefore = (m: Mission) => SAVE_PLAN.find((s) => s.before.startsWith(m.name));

/** The next story mission not done yet, within the chapters you've reached. */
export function nextUp(done: Set<string>, reach: number): { ch: number; m: Mission } | null {
  for (const c of CHAPTERS) {
    if (c.id > reach) break;
    const m = c.missions.find((x) => !x.optional && !done.has(x.name));
    if (m) return { ch: c.id, m };
  }
  return null;
}

/** "Perfect play" leans toward the good ending: guides say it weighs the relationship, a
 *  Professional (not Psycho) profile and Family Savings. So: hearts count double, clean play
 *  counts, violence counts against, money helps a little. It's our read, not a published rule. */
const score = (o: Option) => (o.fx.rel ?? 0) * 2 + (o.fx.pro ?? 0) * 1.5 - (o.fx.vio ?? 0) + (o.fx.cash ?? 0) / 5000;
export function perfectPick(f: Fork): number[] {
  if (f.multi) return f.options.map((o, i) => [score(o), i] as const).filter(([s]) => s > 0).map(([, i]) => i);
  const ranked = f.options.map((o, i) => [score(o), i] as const).sort((a, b) => b[0] - a[0]);
  // A tie at the top means the choice doesn't move the ending: no "perfect" pick to show.
  return ranked.length > 1 && ranked[0][0] === ranked[1][0] ? [] : [ranked[0][1]];
}
export const picked = (f: Fork, v: number | undefined) => (v === undefined ? [] : f.multi ? f.options.map((_, i) => i).filter((i) => v & (1 << i)) : [v]);
