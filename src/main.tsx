import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Automatically register service worker for offline iPad / webapp availability
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[HomeDex PWA] New version available.');
    },
    onOfflineReady() {
      console.log('[HomeDex PWA] App cached and ready for offline use.');
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);

