import { useCallback, useEffect, useState } from 'react';
import { applyTheme, loadTheme, normalizeTheme, saveTheme, THEME_EVENT, type ThemeId } from '../data/themes';

/** Reads, applies and persists the chosen theme (device-local). */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => loadTheme());

  // Apply on mount and whenever the stored value changes in another tab.
  useEffect(() => {
    applyTheme(theme);
    const sync = () => setThemeState(loadTheme());
    window.addEventListener(THEME_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(THEME_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [theme]);

  const setTheme = useCallback((next: ThemeId) => {
    const id = normalizeTheme(next);
    setThemeState(id);
    saveTheme(id);
  }, []);

  return { theme, setTheme };
}
