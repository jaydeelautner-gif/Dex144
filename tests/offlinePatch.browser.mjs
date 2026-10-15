// Verifies the "patch only what is out of sync" rule using the real service
// worker + CacheStorage: install release A, deploy release B that changes ONE
// file, then re-download and assert only that file hits the network.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.js':'application/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf','.woff2':'font/woff2','.webmanifest':'application/manifest+json' };
const original = JSON.parse(readFileSync(join(root,'offline-manifest.json'),'utf8'));
const CATALOG = readFileSync(join(root,'offline-media.json'));
const CHANGED = '/data/encounters.json';

const sha = (b) => createHash('sha256').update(b).digest('hex');
/** Deploy release A, then B differing only in CHANGED (and the version marker). */
function deploy(version, patch = null) {
  // Every served file also needs an accurate manifest entry (build info embeds
  // the version, so it changes on every release).
  const overrides = new Map([
    ['/offline-build.json', Buffer.from(JSON.stringify({ version }))],
    ['/offline-media.json', CATALOG],
  ]);
  if (patch) overrides.set(patch.url, patch.bytes);
  const files = original.files.map((f) => {
    const bytes = overrides.get(f.url);
    return bytes ? { ...f, bytes: bytes.length, sha256: sha(bytes) } : f;
  });
  const manifest = { ...original, version, files };
  const assets = new Map([
    ['/offline-manifest.json', Buffer.from(JSON.stringify(manifest))],
    ...overrides,
  ]);
  return { manifest, assets };
}
let release = deploy('a'.repeat(24));
let siteFetches = 0;
const fetchedPaths = new Set();

const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://test').pathname;
  res.setHeader('Cache-Control', 'no-store');
  const override = release.assets.get(path);
  if (override) {
    res.setHeader('Content-Type', mime[extname(path)] ?? 'application/octet-stream');
    return res.end(override);
  }
  if (path.startsWith('/offline-download')) { res.statusCode = 404; return res.end('nope'); }
  const file = join(root, path === '/' ? 'index.html' : path);
  if (!existsSync(file)) { res.statusCode = 404; return res.end('not found'); }
  res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
  res.end(readFileSync(file));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const harness = (await build({
  entryPoints: [new URL('offlineHarness.ts', import.meta.url).pathname],
  bundle: true, write: false, platform: 'browser', format: 'iife',
  define: { __OFFLINE_BUILD_VERSION__: JSON.stringify(original.version) },
})).outputFiles[0].text;

const browser = await chromium.launch();
const context = await browser.newContext();
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64');
await context.route('**/*', route => {
  const u = new URL(route.request().url());
  if (u.origin === base) {
    if (u.searchParams.has('offline-download') && u.pathname !== '/offline-manifest.json') { siteFetches++; fetchedPaths.add(u.pathname); }
    return route.continue();
  }
  if (/raw\.githubusercontent|pokemonshowdown/.test(u.hostname)) {
    return route.fulfill({ status: 200, contentType: 'image/png', body: png, headers: { 'access-control-allow-origin': '*' } });
  }
  return route.abort();
});
const page = await context.newPage();
try {
  await page.goto(base);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.addScriptTag({ content: harness });

  // 1) Install release A completely.
  const first = await page.evaluate(async () => await window.offlineTest.downloadFullOfflinePackage([{ id: 1 }]));
  assert.equal(first.success, true);
  const aFetches = siteFetches;
  assert.ok(aFetches > 5, `first install fetches every file (got ${aFetches})`);

  // 2) Deploy B changing exactly one file, then re-download.
  const changedBytes = Buffer.concat([readFileSync(join(root, CHANGED)), Buffer.from('\n')]);
  release = deploy('b'.repeat(24), { url: CHANGED, bytes: changedBytes });
  siteFetches = 0; fetchedPaths.clear();
  const second = await page.evaluate(async () => await window.offlineTest.downloadFullOfflinePackage([{ id: 1 }]));
  assert.equal(second.success, true);
  // Only the changed data file and the version marker (which embeds the
  // release) may be re-fetched; every other site file is reused from storage.
  assert.deepEqual([...fetchedPaths].sort(), [CHANGED, '/offline-build.json'].sort(),
    `unexpected network fetches: ${[...fetchedPaths].join(', ')}`);
  assert.ok(siteFetches < aFetches, 'upgrade must fetch far less than a fresh install');

  const meta = await page.evaluate(() => window.offlineTest.getOfflinePackageMetadata());
  assert.equal(meta.version, 'b'.repeat(24));
  assert.equal(meta.isDownloaded, true);
  console.log(`PASS: upgrade fetched only ${[...fetchedPaths].join(' + ')} (fresh install fetched ${aFetches} files); everything else was reused from device storage`);
} finally {
  await context.close(); await browser.close();
  await new Promise(r => server.close(r));
}
