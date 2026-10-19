import { CUSTOM_COLOR_FIELDS, FONT_OPTIONS, THEME_PRESETS } from '../data/themes';
import { useTheme } from '../hooks/useTheme';

/** Theme chooser: preset palettes, custom colours and a font family. */
export function ThemePicker() {
  const { theme, custom, setTheme, setCustomColor, resetCustomColors, setFont } = useTheme();
  const effective = (key: string) => custom.colors[key] ?? '';

  return (
    <div className="flex flex-col gap-5">
      <section className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Appearance</h2>
          <p className="text-xs text-slate-400 mt-1">
            Pick a theme, or build your own. Saved on this device.
          </p>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-bold text-amber-300 mb-2">Theme</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {THEME_PRESETS.map((option) => {
              const active = option.id === theme;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTheme(option.id)}
                  className={`text-left rounded-xl border p-3 flex flex-col gap-2 cursor-pointer transition-colors ${
                    active ? 'border-amber-400/70 bg-amber-400/10' : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="flex gap-1">
                      {option.swatch.map((color) => (
                        <span key={color} className="w-5 h-5 rounded-full border border-black/40" style={{ backgroundColor: color }} />
                      ))}
                    </span>
                    <span className="text-sm font-semibold text-slate-100">{option.label}</span>
                    {active && <span className="ml-auto text-[10px] font-bold text-amber-300 uppercase">Active</span>}
                  </span>
                  <span className="text-xs text-slate-400">{option.description}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </section>

      <section className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-100">Custom colours</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Panels, background, chassis and accents — these layer over whichever theme you picked above. Unset colours keep the preset's value.
            </p>
          </div>
          <button
            type="button"
            onClick={resetCustomColors}
            disabled={Object.keys(custom.colors).length === 0}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold cursor-pointer disabled:opacity-40"
          >
            Reset colours
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CUSTOM_COLOR_FIELDS.map((field) => (
            <label key={field.key} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
              <input
                type="color"
                aria-label={field.label}
                value={effective(field.key) || '#0b0f17'}
                onChange={(event) => setCustomColor(field.key, event.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
              />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-slate-100">{field.label}</span>
                <span className="block text-[10px] text-slate-400">{field.hint}</span>
                <span className="block text-[10px] font-mono text-slate-500">
                  {effective(field.key) || 'default'}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">Font</h3>
          <p className="text-xs text-slate-400 mt-0.5">Bundled fonts, available offline. PKMN Classic uses the RBY/GSC handheld typeface.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FONT_OPTIONS.map((option) => {
            const active = custom.font === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFont(option.id)}
                style={{ fontFamily: option.stack }}
                className={`text-left rounded-xl border p-3 cursor-pointer transition-colors ${
                  active ? 'border-amber-400/70 bg-amber-400/10' : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-100">{option.label}</span>
                  {active && <span className="text-[10px] font-bold text-amber-300 uppercase">Active</span>}
                </span>
                <span className="block text-xs text-slate-400 mt-1">Aa Bb Cc — 1234</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
