import { useCallback, useEffect, useState } from 'react';
import {
  applyTheme, loadCustomTheme, loadTheme, normalizeCustomTheme, normalizeTheme, saveTheme,
  THEME_EVENT, type CustomTheme, type ThemeId,
} from '../data/themes';

/** Reads, applies and persists the theme (preset + custom colours/font). */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => loadTheme());
  const [custom, setCustomState] = useState<CustomTheme>(() => loadCustomTheme());

  useEffect(() => {
    applyTheme(theme, custom);
    const sync = () => { setThemeState(loadTheme()); setCustomState(loadCustomTheme()); };
    window.addEventListener(THEME_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(THEME_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [theme, custom]);

  const setTheme = useCallback((next: ThemeId) => {
    const id = normalizeTheme(next);
    setThemeState(id);
    saveTheme(id);
  }, []);

  /** Updates one custom colour; switches to the Custom preset automatically. */
  const setCustomColor = useCallback((key: string, value: string) => {
    setCustomState((prev) => {
      const next = normalizeCustomTheme({ ...prev, colors: { ...prev.colors, [key]: value } });
      setThemeState('custom');
      saveTheme('custom', next);
      return next;
    });
  }, []);

  const resetCustomColors = useCallback(() => {
    setCustomState((prev) => {
      const next = { ...prev, colors: {} };
      saveTheme('custom', next);
      return next;
    });
  }, []);

  const setFont = useCallback((font: CustomTheme['font']) => {
    setCustomState((prev) => {
      const next = { ...prev, font };
      saveTheme(loadTheme(), next);
      return next;
    });
  }, []);

  return { theme, custom, setTheme, setCustomColor, resetCustomColors, setFont };
}
