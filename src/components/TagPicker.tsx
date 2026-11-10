"use client";
import { useState } from "react";
import { TAG_GROUPS, MAX_TAGS_PER_CLIP, FLAGGED } from "@/lib/tags";

/** Up to three tags a clip. The database enforces the same cap. */
export function TagPicker({ value, onChange }: { value: string[]; onChange: (t: string[]) => void }) {
  const [open, setOpen] = useState(TAG_GROUPS[0].group);
  const full = value.length >= MAX_TAGS_PER_CLIP;

  const toggle = (tag: string) =>
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : full ? value : [...value, tag]);

  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-x-3 text-sm font-bold">
        Tags
        <span className="font-normal text-haze">
          {value.length} of {MAX_TAGS_PER_CLIP} picked — they decide who finds your clip
        </span>
      </p>

      {value.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {value.map((t) => (
            <li key={t}>
              <button type="button" onClick={() => toggle(t)}
                className={`tag-picked${FLAGGED.has(t) ? " warn" : ""}`}>
                {FLAGGED.has(t) && <span aria-hidden>⚠</span>}{t} <span aria-hidden>×</span>
                <span className="sr-only">Remove {t}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Wrapped, not scrolled: a sideways scroller hid half the groups and
          nothing told you they were there. */}
      <div className="tag-groups">
        {TAG_GROUPS.map((g) => {
          const warn = g.group === "Flagged";
          return (
            <button key={g.group} type="button" onClick={() => setOpen(g.group)} aria-pressed={open === g.group}
              aria-label={`Show ${g.group} tags`}
              className={`tag-group${open === g.group ? " on" : ""}${warn ? " warn" : ""}`}>
              {warn && <span aria-hidden>⚠</span>}{g.group}
            </button>
          );
        })}
      </div>

      {TAG_GROUPS.filter((g) => g.group === open).map((g) => (
        <div key={g.group} className="mt-3">
          <p className={`text-xs ${g.group === "Flagged" ? "tag-warn-note" : "text-haze"}`}>
            {g.group === "Flagged" && <span aria-hidden>⚠ </span>}{g.blurb}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {g.tags.map((t) => {
              const on = value.includes(t);
              return (
                <li key={t}>
                  <button type="button" onClick={() => toggle(t)} aria-pressed={on}
                    disabled={!on && full}
                    className={`tag-chip${on ? " on" : ""}${FLAGGED.has(t) ? " warn" : ""}`}>
                    {FLAGGED.has(t) && <span aria-hidden>⚠</span>}{t}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {full && <p className="mt-2 text-xs text-haze">Three is the limit. Remove one to swap it.</p>}
      <input type="hidden" name="tags" value={value.join(",")} />
    </div>
  );
}
