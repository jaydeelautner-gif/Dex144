/**
 * Themes recolor the app's dark surfaces without touching layout. Every theme
 * exposes the same CSS variables that the base stylesheet consumes, so a single
 * data-theme attribute on <html> restyles the whole app.
 */
export const THEMES = [
  {
    id: 'homedex',
    label: 'HomeDex Red',
    description: 'The classic red Pokédex chassis.',
    swatch: ['#DC2626', '#B91C1C', '#0B0F17'],
  },
  {
    id: 'midnight',
    label: 'Midnight Blue',
    description: 'Cooler blues for late-night dexing.',
    swatch: ['#2563EB', '#1D4ED8', '#0A1020'],
  },
  {
    id: 'forest',
    label: 'Forest Green',
    description: 'Route 1 greens and woodland tones.',
    swatch: ['#16A34A', '#15803D', '#08140E'],
  },
  {
    id: 'lavender',
    label: 'Lavender Town',
    description: 'Purple hues from the haunted tower.',
    swatch: ['#7C3AED', '#6D28D9', '#0F0A1E'],
  },
  {
    id: 'amber',
    label: 'Amber League',
    description: 'Warm golds of a Champion hall.',
    swatch: ['#D97706', '#B45309', '#15100A'],
  },
  {
    id: 'cobalt',
    label: 'Cobalt Steel',
    description: 'Neutral slate with a steel-blue accent.',
    swatch: ['#0EA5E9', '#0284C7', '#0B1220'],
  },
  {
    id: 'crimson',
    label: 'Crimson Fangs',
    description: 'Deep wine tones with a hot accent.',
    swatch: ['#E11D48', '#BE123C', '#160A10'],
  },
  {
    id: 'grayscale',
    label: 'Game Boy',
    description: 'Monochrome green LCD, DMG style.',
    swatch: ['#9BBC0F', '#8BAC0F', '#0F1A0F'],
  },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export const DEFAULT_THEME: ThemeId = 'homedex';
export const THEME_STORAGE_KEY = 'homedex_theme_v1';
export const THEME_EVENT = 'homedex-theme-changed';

export function normalizeTheme(value: unknown): ThemeId {
  return THEMES.some((theme) => theme.id === value) ? (value as ThemeId) : DEFAULT_THEME;
}

export function loadTheme(): ThemeId {
  try {
    return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

/** Applies a theme to the document; safe to call before React mounts. */
export function applyTheme(theme: ThemeId): void {
  const id = normalizeTheme(theme);
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = id;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg-deep').trim() || '#0B0F17');
}

export function saveTheme(theme: ThemeId): void {
  const id = normalizeTheme(theme);
  try { localStorage.setItem(THEME_STORAGE_KEY, id); } catch { /* storage may be disabled */ }
  applyTheme(id);
  try { window.dispatchEvent(new Event(THEME_EVENT)); } catch { /* ignore */ }
}
