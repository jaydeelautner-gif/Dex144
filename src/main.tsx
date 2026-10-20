import { loadTheme, loadCustomTheme, applyTheme } from './data/themes';
applyTheme(loadTheme(), loadCustomTheme());
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

import { markOfflineWorkerUpdate, setOfflineWorkerUpdater } from './utils/offlineUpdates';

// Detect updates without reloading an unsaved registration/edit form.
if ('serviceWorker' in navigator) {
  const updateWorker = registerSW({
    immediate: true,
    onNeedRefresh: markOfflineWorkerUpdate,
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => { if(navigator.onLine) registration.update().catch(() => {}); }, 5 * 60 * 1000);
    },
    onOfflineReady() { console.log('[HomeDex PWA] App shell, fonts and sprites cached. Download the offline data package in Settings for the remaining datasets.'); },
  });
  setOfflineWorkerUpdater(() => updateWorker(true));
}

createRoot(document.getElementById('root')!).render(<App />);

