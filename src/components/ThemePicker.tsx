import { THEMES } from '../data/themes';
import { useTheme } from '../hooks/useTheme';

/** Theme chooser for Settings → Appearance. Applied and saved on this device. */
export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  return (
    <section className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Appearance</h2>
        <p className="text-xs text-slate-400 mt-1">
          Pick a theme for the app. It recolors the Pokédex chassis, panels and backgrounds, and is
          saved on this device.
        </p>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-bold text-amber-300 mb-2">Theme</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {THEMES.map((option) => {
            const active = option.id === theme;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => setTheme(option.id)}
                className={`text-left rounded-xl border p-3 flex flex-col gap-2 cursor-pointer transition-colors ${
                  active
                    ? 'border-amber-400/70 bg-amber-400/10'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="flex gap-1">
                    {option.swatch.map((color) => (
                      <span
                        key={color}
                        className="w-5 h-5 rounded-full border border-black/40"
                        style={{ backgroundColor: color }}
                      />
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
  );
}
