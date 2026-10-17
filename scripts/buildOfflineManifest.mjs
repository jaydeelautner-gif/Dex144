// Regenerates dist/offline-manifest.json — the extra files the offline package
// must install on top of the service worker's automatic precache.
//
// The service worker precaches the app shell, fonts and every sprite (see the
// PWA globPatterns/globIgnores/maximumFileSizeToCacheInBytes in vite.config.ts).
// Re-downloading those into a second cache duplicated ~14 MB of storage and made
// the mobile download slow and flaky, so the offline package now lists only the
// files the precache cannot hold: `data/**` (too large / not precached) and a few
// non-precached types (.json, .webmanifest, .txt). Keep this rule in step with
// vite.config.ts.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const version = JSON.parse(readFileSync(join(root, 'offline-build.json'), 'utf8')).version;

// Must match vite.config.ts pwaPlugin() precache rules.
const PRECACHE_GLOB = /\.(js|css|html|svg|ico|png|woff|woff2|ttf)$/;
const PRECACHE_IGNORES = ['/offline-manifest.json', '/data/'];
const PRECACHE_MAX_BYTES = 5 * 1024 * 1024;
/** True when the service worker precache already installs this file. */
function precachedByServiceWorker(url, bytes) {
  if (PRECACHE_IGNORES.some((prefix) => url === prefix || url.startsWith(prefix))) return false;
  if (!PRECACHE_GLOB.test(url)) return false;
  return bytes <= PRECACHE_MAX_BYTES;
}

const files = [];
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, e.name);
    if (e.isDirectory()) { walk(path); continue; }
    if (e.name.endsWith('.map') || e.name === 'offline-manifest.json' || e.name.startsWith('.')) continue;
    const bytes = readFileSync(path);
    const url = '/' + relative(root, path).split('\\').join('/');
    if (precachedByServiceWorker(url, bytes.length)) continue;
    files.push({ url, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length });
  }
}
walk(root);
files.sort((a, b) => a.url.localeCompare(b.url));
if (!files.some((f) => f.url === '/data/encounters.json')) throw Error('Incomplete offline build output: encounters data missing.');
writeFileSync(join(root, 'offline-manifest.json'), JSON.stringify({ schema: 2, version, files }));
console.log(
  `Offline manifest ${version}: ${files.length} package files (${files.reduce((n, f) => n + f.bytes, 0)} bytes). ` +
    `The service worker precache covers the app shell, fonts and all sprites.`,
);
