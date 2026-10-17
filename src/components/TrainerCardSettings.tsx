import { useState } from 'react';
import {
  CARD_FRAMES, CARD_PREFS_KEY, CARD_TITLES, loadCardPrefs, normalizeCardPrefs,
  type TrainerCardPrefs,
} from './ProfileCard';

/** Customise the trainer card: frame, title badge and Pokéball watermark. */
export function TrainerCardSettings({ onChange }: { onChange?: (prefs: TrainerCardPrefs) => void }) {
  const [prefs, setPrefs] = useState<TrainerCardPrefs>(() => loadCardPrefs());

  const update = (next: TrainerCardPrefs) => {
    const clean = normalizeCardPrefs(next);
    setPrefs(clean);
    try { localStorage.setItem(CARD_PREFS_KEY, JSON.stringify(clean)); } catch { /* ignore */ }
    onChange?.(clean);
  };

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="text-xs font-bold text-amber-300 mb-1.5">Card frame</legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CARD_FRAMES.map((frame) => {
            const active = frame.id === prefs.frame;
            return (
              <button
                key={frame.id}
                type="button"
                aria-pressed={active}
                onClick={() => update({ ...prefs, frame: frame.id })}
                className={`rounded-xl border p-2 cursor-pointer text-left ${active ? 'border-amber-400' : 'border-slate-700 hover:border-slate-500'}`}
              >
                <span
                  className="block h-8 rounded-lg border"
                  style={{ backgroundImage: `linear-gradient(135deg, ${frame.from}, ${frame.via}, ${frame.to})`, borderColor: frame.ring }}
                />
                <span className="block text-[11px] font-semibold text-slate-200 mt-1.5">{frame.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-bold text-amber-300 mb-1.5">Title badge</legend>
        <div className="flex flex-wrap gap-2">
          {CARD_TITLES.map((title) => (
            <button
              key={title}
              type="button"
              aria-pressed={prefs.title === title}
              onClick={() => update({ ...prefs, title })}
              className={`px-3 py-1.5 rounded-lg border-2 text-[11px] font-bold uppercase tracking-wide cursor-pointer ${
                prefs.title === title ? 'border-amber-400 bg-amber-400/15 text-amber-200' : 'border-slate-700 text-slate-300'
              }`}
            >
              {title}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900 p-3 cursor-pointer">
        <input
          type="checkbox"
          checked={prefs.showPokeball}
          onChange={(event) => update({ ...prefs, showPokeball: event.target.checked })}
          className="w-4 h-4 accent-amber-400"
        />
        <span className="text-xs font-semibold text-slate-200">Show Pokéball watermark</span>
      </label>
    </div>
  );
}
