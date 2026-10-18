import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig } from 'vite';

// Stable content version: changes in code, every compiled dataset, public
// files (including encounters/artwork catalog/fonts), or build config invalidate
// the offline package. Never use timestamps: identical builds remain identical.
// Falls back to a safe constant when files are unavailable (sandboxed builds).
function offlineVersion() {
  try {
    const hash = createHash('sha256');
    const walk = (dir: string) => {
      if (!existsSync(dir)) return;
      for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (e.name.startsWith('.') || e.name === '__pycache__' || e.name.endsWith('.pyc')) continue;
        const file = path.join(dir, e.name);
        if (e.isDirectory()) walk(file);
        else { hash.update(file); hash.update(readFileSync(file)); }
      }
    };
    walk('src'); walk('public'); walk('scripts');
    for (const f of ['index.html', 'vite.config.ts', 'package.json', 'package-lock.json']) {
      if (existsSync(f)) { hash.update(f); hash.update(readFileSync(f)); }
    }
    return hash.digest('hex').slice(0, 24);
  } catch {
    return 'development000000000000';
  }
}

// The custom service worker imports workbox-* packages. If a host installs
// production dependencies only, that build would fail, so fall back to the
// generated service worker instead of breaking startup.
function hasServiceWorkerDeps() {
  return ['workbox-core', 'workbox-precaching', 'workbox-routing', 'workbox-strategies', 'workbox-cacheable-response', 'workbox-expiration']
    .every((pkg) => existsSync(path.join('node_modules', pkg, 'package.json')));
}

function pwaPlugin(version: string) {
  const manifest: Partial<ManifestOptions> = {
    name: 'HomeDex',
    short_name: 'HomeDex',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0B0F17',
    theme_color: '#0B0F17',
    icons: [
      { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return VitePWA({
    registerType: 'prompt', // never reload while the user is registering/editing
    // The app registers the worker itself (src/main.tsx) so it can pass
    // updateViaCache: 'none' — required for iOS Safari to see updates.
    injectRegister: false,
    manifest,
    ...(hasServiceWorkerDeps()
      ? {
          strategies: 'injectManifest' as const,
          srcDir: 'src',
          filename: 'sw.ts',
          injectManifest: {
            globPatterns: ['**/*.{js,css,html,svg,ico,png,bin,woff,woff2,ttf}'],
            globIgnores: ['offline-manifest.json', 'data/**'],
            maximumFileSizeToCacheInBytes: 32 * 1024 * 1024,
          },
        }
      : {
          strategies: 'generateSW' as const,
          workbox: {
            globPatterns: ['**/*.{js,css,html,svg,ico,png,bin,woff,woff2,ttf}'],
            globIgnores: ['offline-manifest.json', 'data/**'],
            maximumFileSizeToCacheInBytes: 32 * 1024 * 1024,
            runtimeCaching: [
              {
                urlPattern: /\/data\/.+\.json$/,
                handler: 'CacheFirst' as const,
                options: {
                  cacheName: `dex-data-${version}`,
                  expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
                  cacheableResponse: { statuses: [200] },
                },
              },
            ],
          },
        }),
  });
}

export default defineConfig(() => {
  const version = offlineVersion();
  return {
    define: { __OFFLINE_BUILD_VERSION__: JSON.stringify(version) },
    plugins: [
      {
        name: 'offline-build-version',
        generateBundle() {
          this.emitFile({ type: 'asset', fileName: 'offline-build.json', source: JSON.stringify({ version }) });
        },
      },
      react(),
      tailwindcss(),
      pwaPlugin(version),
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
