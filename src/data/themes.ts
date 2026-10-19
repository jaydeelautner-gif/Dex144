/**
 * Themes recolor the app's dark surfaces without touching layout. Every theme
 * exposes the same CSS variables consumed by src/index.css, applied through a
 * `data-theme` attribute on <html>. Custom themes layer per-user colors and a
 * font family on top of the chosen preset.
 */

export interface ThemePreset {
  id: string;
  label: string;
  description: string;
  swatch: [string, string, string];
  vars: Record<string, string>;
}

/** Preset palettes. The first is the original HomeDex look (the default). */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'homedex',
    label: 'HomeDex Red',
    description: 'The classic red Pokédex chassis.',
    swatch: ['#DC2626', '#B91C1C', '#0B0F17'],
    vars: {
      '--chassis-1': '#dc2626', '--chassis-2': '#b91c1c', '--chassis-3': '#881337',
      '--chassis-border': '#7f1d1d', '--bg-deep': '#070a10', '--bg-app': '#0b0f17',
      '--panel': '#0f1522', '--panel-2': '#131c30', '--accent': '#f59e0b', '--accent-soft': '#fbbf24',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight Blue',
    description: 'Cooler blues for late-night dexing.',
    swatch: ['#2563EB', '#1D4ED8', '#0A1020'],
    vars: {
      '--chassis-1': '#2563eb', '--chassis-2': '#1d4ed8', '--chassis-3': '#172554',
      '--chassis-border': '#1e3a8a', '--bg-deep': '#05080f', '--bg-app': '#0a1020',
      '--panel': '#0e1526', '--panel-2': '#131c33', '--accent': '#60a5fa', '--accent-soft': '#93c5fd',
    },
  },
  {
    id: 'forest',
    label: 'Forest Green',
    description: 'Route 1 greens and woodland tones.',
    swatch: ['#16A34A', '#15803D', '#08140E'],
    vars: {
      '--chassis-1': '#16a34a', '--chassis-2': '#15803d', '--chassis-3': '#14532d',
      '--chassis-border': '#166534', '--bg-deep': '#050d09', '--bg-app': '#08140e',
      '--panel': '#0c1a13', '--panel-2': '#10241a', '--accent': '#86efac', '--accent-soft': '#bbf7d0',
    },
  },
  {
    id: 'lavender',
    label: 'Lavender Town',
    description: 'Purple hues from the haunted tower.',
    swatch: ['#7C3AED', '#6D28D9', '#0F0A1E'],
    vars: {
      '--chassis-1': '#7c3aed', '--chassis-2': '#6d28d9', '--chassis-3': '#4c1d95',
      '--chassis-border': '#5b21b6', '--bg-deep': '#07040f', '--bg-app': '#0f0a1e',
      '--panel': '#150f28', '--panel-2': '#1c1433', '--accent': '#c4b5fd', '--accent-soft': '#ddd6fe',
    },
  },
  {
    id: 'amber',
    label: 'Amber League',
    description: 'Warm golds of a Champion hall.',
    swatch: ['#D97706', '#B45309', '#15100A'],
    vars: {
      '--chassis-1': '#d97706', '--chassis-2': '#b45309', '--chassis-3': '#78350f',
      '--chassis-border': '#92400e', '--bg-deep': '#0b0803', '--bg-app': '#15100a',
      '--panel': '#1c1610', '--panel-2': '#241c13', '--accent': '#fcd34d', '--accent-soft': '#fde68a',
    },
  },
  {
    id: 'cobalt',
    label: 'Cobalt Steel',
    description: 'Neutral slate with a steel-blue accent.',
    swatch: ['#0EA5E9', '#0284C7', '#0B1220'],
    vars: {
      '--chassis-1': '#0ea5e9', '--chassis-2': '#0284c7', '--chassis-3': '#075985',
      '--chassis-border': '#0369a1', '--bg-deep': '#050b12', '--bg-app': '#0b1220',
      '--panel': '#101a2c', '--panel-2': '#16233a', '--accent': '#7dd3fc', '--accent-soft': '#bae6fd',
    },
  },
  {
    id: 'crimson',
    label: 'Crimson Fangs',
    description: 'Deep wine tones with a hot accent.',
    swatch: ['#E11D48', '#BE123C', '#160A10'],
    vars: {
      '--chassis-1': '#e11d48', '--chassis-2': '#be123c', '--chassis-3': '#881337',
      '--chassis-border': '#9f1239', '--bg-deep': '#0a0407', '--bg-app': '#160a10',
      '--panel': '#1d0f17', '--panel-2': '#26141d', '--accent': '#fda4af', '--accent-soft': '#fecdd3',
    },
  },
  {
    id: 'grayscale',
    label: 'Game Boy',
    description: 'Monochrome green LCD, DMG style.',
    swatch: ['#9BBC0F', '#8BAC0F', '#0F1A0F'],
    vars: {
      '--chassis-1': '#9bbc0f', '--chassis-2': '#8bac0f', '--chassis-3': '#306230',
      '--chassis-border': '#0f380f', '--bg-deep': '#08130a', '--bg-app': '#0f1a0f',
      '--panel': '#14240f', '--panel-2': '#1b2e14', '--accent': '#9bbc0f', '--accent-soft': '#cfe05a',
    },
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Your own colours, applied over the HomeDex base.',
    swatch: ['#DC2626', '#F59E0B', '#0B0F17'],
    vars: {},
  },
];

export type ThemeId = string;
export const DEFAULT_THEME: ThemeId = 'homedex';

/** Colors a user can override in the custom theme. */
export const CUSTOM_COLOR_FIELDS = [
  { key: '--chassis-1', label: 'Chassis', hint: 'Main device body' },
  { key: '--chassis-2', label: 'Chassis shade', hint: 'Darker device areas' },
  { key: '--chassis-border', label: 'Chassis edge', hint: 'Hardware borders' },
  { key: '--bg-app', label: 'Background', hint: 'Page background' },
  { key: '--bg-deep', label: 'Deep background', hint: 'Behind the panels' },
  { key: '--panel', label: 'Panels', hint: 'Cards and sections' },
  { key: '--panel-2', label: 'Panel highlight', hint: 'Elevated surfaces' },
  { key: '--accent', label: 'Accent', hint: 'Buttons and highlights' },
  { key: '--accent-soft', label: 'Accent (light)', hint: 'Secondary accents' },
] as const;

/** Font families bundled with the app (see public/fonts/site-fonts.css). */
export const FONT_OPTIONS = [
  { id: 'pkmn', label: 'PKMN Classic (RBY/GSC)', stack: "'PKMN RBYGSC', 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" },
  { id: 'default', label: 'HomeDex Default', stack: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" },
  { id: 'bricolage', label: 'Bricolage Grotesque', stack: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif" },
  { id: 'jakarta', label: 'Plus Jakarta Sans', stack: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" },
  { id: 'mono', label: 'JetBrains Mono', stack: "'JetBrains Mono', ui-monospace, monospace" },
] as const;
export type FontId = (typeof FONT_OPTIONS)[number]['id'];
export const DEFAULT_FONT: FontId = 'pkmn';

export interface CustomTheme {
  colors: Record<string, string>;
  font: FontId;
}

export const THEME_STORAGE_KEY = 'homedex_theme_v1';
export const CUSTOM_THEME_STORAGE_KEY = 'homedex_theme_custom_v1';
export const THEME_EVENT = 'homedex-theme-changed';

const HEX = /^#[0-9a-fA-F]{6}$/;

export function normalizeTheme(value: unknown): ThemeId {
  return THEME_PRESETS.some((preset) => preset.id === value) ? (value as ThemeId) : DEFAULT_THEME;
}

export function normalizeCustomTheme(raw: unknown): CustomTheme {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Partial<CustomTheme>;
  const colors: Record<string, string> = {};
  const allowed = new Set(CUSTOM_COLOR_FIELDS.map((field) => field.key as string));
  for (const [key, value] of Object.entries(data.colors ?? {})) {
    if (allowed.has(key) && typeof value === 'string' && HEX.test(value)) colors[key] = value.toLowerCase();
  }
  const font = FONT_OPTIONS.some((option) => option.id === data.font) ? (data.font as FontId) : DEFAULT_FONT;
  return { colors, font };
}

export function loadTheme(): ThemeId {
  try { return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY)); } catch { return DEFAULT_THEME; }
}

export function loadCustomTheme(): CustomTheme {
  try { return normalizeCustomTheme(JSON.parse(localStorage.getItem(CUSTOM_THEME_STORAGE_KEY) ?? 'null')); }
  catch { return { colors: {}, font: DEFAULT_FONT }; }
}

/**
 * Applies the preset plus any custom overrides. The chosen preset supplies its
 * palette; custom colours then layer on top as inline properties for EVERY
 * preset — so panel/background/accent overrides work on Game Boy, Midnight or
 * any other theme, not just "Custom". Unset colours keep the preset value.
 */
export function applyTheme(theme: ThemeId, custom: CustomTheme = loadCustomTheme()): void {
  if (typeof document === 'undefined') return;
  const id = normalizeTheme(theme);
  const root = document.documentElement;
  root.dataset.theme = id;
  for (const field of CUSTOM_COLOR_FIELDS) root.style.removeProperty(field.key);
  if (id === 'custom') {
    const preset = THEME_PRESETS[0].vars;
    for (const [key, value] of Object.entries(preset)) root.style.setProperty(key, value);
  }
  for (const [key, value] of Object.entries(custom.colors)) root.style.setProperty(key, value);
  const font = FONT_OPTIONS.find((option) => option.id === custom.font) ?? FONT_OPTIONS[0];
  root.style.setProperty('--app-font', font.stack);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const bg = getComputedStyle(root).getPropertyValue('--bg-app').trim() || '#0B0F17';
    meta.setAttribute('content', bg);
  }
}

export function saveTheme(theme: ThemeId, custom?: CustomTheme): void {
  const id = normalizeTheme(theme);
  const nextCustom = custom ?? loadCustomTheme();
  try { localStorage.setItem(THEME_STORAGE_KEY, id); } catch { /* storage may be disabled */ }
  try { localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(normalizeCustomTheme(nextCustom))); } catch { /* ignore */ }
  applyTheme(id, nextCustom);
  try { window.dispatchEvent(new Event(THEME_EVENT)); } catch { /* ignore */ }
}
