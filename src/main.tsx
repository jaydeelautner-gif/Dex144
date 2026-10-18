import { loadTheme, loadCustomTheme, applyTheme } from './data/themes';
applyTheme(loadTheme(), loadCustomTheme());
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { markOfflineWorkerUpdate, setOfflineWorkerUpdater } from './utils/offlineUpdates';

// Manual registration (instead of the PWA plugin's registerSW) so we can pass
// updateViaCache: 'none' — without it iOS Safari can serve a stale service
// worker from its HTTP cache and the installed web app never sees updates.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then((registration) => {
    const checkForUpdate = () => { if (navigator.onLine) registration.update().catch(() => {}); };
    // Poll while online, and re-check whenever the tab regains focus or the
    // connection returns — this is what lets an installed iOS web app pick up
    // a new deployment without being deleted and re-added.
    const poll = setInterval(checkForUpdate, 5 * 60 * 1000);
    window.addEventListener('online', checkForUpdate);
    window.addEventListener('focus', checkForUpdate);
    window.addEventListener('pagehide', () => clearInterval(poll));

    // A waiting worker = an update downloaded but not yet applied.
    const notifyWaiting = () => { if (registration.waiting) markOfflineWorkerUpdate(); };
    notifyWaiting();
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      installing?.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) markOfflineWorkerUpdate();
        // First install: everything (shell, fonts, sprites) is now cached.
        if (installing.state === 'activated' && !navigator.serviceWorker.controller) {
          console.log('[HomeDex PWA] App shell, fonts and sprites cached. Download the offline data package in Settings for the remaining datasets.');
        }
      });
    });

    // Apply the update: activate the waiting worker, then reload once it controls.
    setOfflineWorkerUpdater(async () => {
      const waiting = registration.waiting;
      if (waiting) {
        const activated = new Promise<void>((resolve) => {
          const onControlling = () => { cleanup(); resolve(); };
          const cleanup = () => navigator.serviceWorker.removeEventListener('controllerchange', onControlling);
          navigator.serviceWorker.addEventListener('controllerchange', onControlling);
          setTimeout(() => { cleanup(); resolve(); }, 3000);
        });
        waiting.postMessage({ type: 'SKIP_WAITING' });
        await activated;
      }
      window.location.reload();
    });
  }).catch((err) => console.warn('[HomeDex PWA] Service worker registration failed:', err));
}

createRoot(document.getElementById('root')!).render(<App />);

