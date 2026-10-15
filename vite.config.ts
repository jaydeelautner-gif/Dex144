import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig } from 'vite';

// Stable content version: changes in code, every compiled dataset, public
// files (including encounters/artwork catalog/fonts), or build config invalidate
// the offline package. Never use timestamps: identical builds remain identical.
function offlineVersion() {
  const hash = createHash('sha256');
  function walk(dir: string) {
    for (const e of readdirSync(dir, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
      if(e.name.startsWith('.') || e.name === '__pycache__' || e.name.endsWith('.pyc')) continue;
      const file = path.join(dir,e.name);
      if (e.isDirectory()) walk(file);
      else { hash.update(file); hash.update(readFileSync(file)); }
    }
  }
  walk('src'); walk('public'); walk('scripts');
  for (const f of ['index.html','vite.config.ts','package.json','package-lock.json']) { hash.update(f); hash.update(readFileSync(f)); }
  return hash.digest('hex').slice(0,24);
}

export default defineConfig(() => {
  const version = offlineVersion();
  return {
    define: { __OFFLINE_BUILD_VERSION__: JSON.stringify(version) },
    plugins: [
      {
        name: 'offline-build-version',
        generateBundle() {
          this.emitFile({type:'asset',fileName:'offline-build.json',source:JSON.stringify({version})});
        },
      },
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt', // never reload while the user is registering/editing
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        manifest: { name:'HomeDex', short_name:'HomeDex', start_url:'/', scope:'/', display:'standalone', background_color:'#0B0F17', theme_color:'#0B0F17', icons:[{src:'/pwa-192x192.png',sizes:'192x192',type:'image/png'},{src:'/pwa-512x512.png',sizes:'512x512',type:'image/png'},{src:'/pwa-maskable-512x512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}] },
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,svg,ico,png,woff,woff2,ttf}'],
          globIgnores: ['offline-manifest.json','offline-media.json','data/**'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || process.cwd(), '.'),
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
