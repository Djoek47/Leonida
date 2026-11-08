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
                className={`rounded-full px-3 py-1 text-sm font-bold ${FLAGGED.has(t) ? "bg-flamingo text-white" : "bg-gulf text-white"}`}>
                {t} <span aria-hidden>×</span><span className="sr-only">Remove {t}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 max-w-full">
        {TAG_GROUPS.map((g) => (
          <button key={g.group} type="button" onClick={() => setOpen(g.group)} aria-pressed={open === g.group}
            aria-label={`Show ${g.group} tags`}
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${open === g.group ? "bg-foam text-dusk" : "bg-ink-2 text-haze"}`}>
            {g.group}
          </button>
        ))}
      </div>

      {TAG_GROUPS.filter((g) => g.group === open).map((g) => (
        <div key={g.group} className="mt-3">
          <p className="text-xs text-haze">{g.blurb}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {g.tags.map((t) => {
              const on = value.includes(t);
              return (
                <li key={t}>
                  <button type="button" onClick={() => toggle(t)} aria-pressed={on}
                    disabled={!on && full}
                    className={`rounded-full border-2 px-3 py-1 text-sm font-semibold disabled:opacity-40
                      ${on ? "border-gulf bg-gulf text-white" : "border-line hover:border-gulf"}`}>
                    {t}
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
