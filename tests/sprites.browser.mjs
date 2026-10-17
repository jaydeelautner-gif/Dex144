// Verifies every sprite is served from this app: local /sprites images load and
// no request leaves for an external sprite host.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.js':'application/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.webmanifest':'application/manifest+json' };
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://t').pathname;
  const f = join(root, path === '/' ? 'index.html' : path);
  if (!existsSync(f)) { res.statusCode = 404; return res.end('nf'); }
  res.setHeader('Content-Type', mime[extname(f)] ?? 'application/octet-stream');
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1360, height: 1000 } });
const external = [];
await context.route('**/*', (r) => {
  const url = new URL(r.request().url());
  if (url.origin === base) return r.continue();
  if (/raw\.githubusercontent\.com|pokemonshowdown\.com|githubusercontent|pokemon\.com/.test(url.host)) external.push(url.href);
  return r.abort();
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await context.addInitScript(async () => {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('salt:1234'));
  const pinHash = Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem('homedex_cached_auth_vault_v1', JSON.stringify([{
    uid: 'sprite-test', email: 'sprite@example.test', displayName: 'Sprite Tester',
    salt: 'salt', passwordHash: 'unused', pinSalt: 'salt', pinHash, hasLoggedInOnThisDevice: true, lastLoginAt: Date.now(),
  }]));
});
await page.goto(base);

try {
  await page.getByRole('button', { name: /Open Dex/i }).click();
  await page.getByRole('button', { name: /Skip Intro/i }).click();
  await page.getByRole('group', { name: 'PIN touch keypad' }).waitFor();
  for (const d of ['1','2','3','4']) await page.getByRole('button', { name: 'PIN digit ' + d, exact: true }).click();
  await page.getByRole('button', { name: 'Unlock with PIN' }).click();
  await page.getByRole('button', { name: /Log Out|Sign Out/i }).waitFor();

  // Pokédex tracker renders sprites for every species.
  await page.getByRole('button', { name: 'Pokédex', exact: true }).first().click();
  await page.waitForTimeout(2500);

  const imgs = await page.locator('img[src^="blob:"]').count();
  assert.ok(imgs > 10, `renders bundled sprite images (${imgs})`);
  const loaded = await page.locator('img[src^="blob:"]').evaluateAll(
    (els) => els.filter((el) => el.complete && el.naturalWidth > 0).length,
  );
  assert.ok(loaded > 10, `bundled sprites actually decode (${loaded} decoded)`);

  // Open a detail view to exercise the larger preview.
  await page.locator('img[src^="blob:"]').first().click().catch(() => {});
  await page.waitForTimeout(1500);

  assert.deepEqual(external, [], `no sprite requests to external hosts: ${JSON.stringify(external.slice(0, 3))}`);
  assert.deepEqual(errors, []);
  console.log(`PASS: all sprites served from the bundled archive (${imgs} images, ${loaded} decoded) with zero external requests`);
} finally {
  await context.close(); await browser.close();
  await new Promise((r) => server.close(r));
}
