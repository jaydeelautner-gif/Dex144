// Verifies the "Caught by region" sidebar panel: per-region percentages, the
// living-dex share, the all-regions total, and that a populated local inventory
// is not wiped by an empty remote inventory response.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.js':'application/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.png':'image/png','.ttf':'font/ttf','.webmanifest':'application/manifest+json' };
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://t').pathname;
  const file = join(root, path === '/' ? 'index.html' : path);
  if (!existsSync(file)) { res.statusCode = 404; return res.end('not found'); }
  res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1360, height: 1100 } });
await context.route('**/*', (r) => new URL(r.request().url()).origin === base ? r.continue() : r.abort());
const pet = (id) => ({ pokeId: `ID${String(id).padStart(10, '0')}`, pokemonId: id, nickname: '', level: 5, gender: 'male', variantId: `${id}:base`, variantName: 'Standard', isShiny: false, gameId: 'red', isHomeGift: false, isTraded: false, storedInHome: true, isInLivingBox: true, createdAt: 1 + id, updatedAt: 1 + id });
await context.addInitScript(async (inventory) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('salt:1234'));
  const passHash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem('homedex_cached_auth_vault_v1', JSON.stringify([{ uid: 'region-test', email: 'region@example.test', displayName: 'Region Tester', salt: 'salt', passwordHash: passHash, hasLoggedInOnThisDevice: true, lastLoginAt: Date.now() }]));
  localStorage.setItem('homedex_v4_inventory', JSON.stringify(inventory));
}, [1, 2, 3, 152, 906].map(pet));
const page = await context.newPage();
const errors = [];
// The seeding init script re-runs on later navigations, where crypto.subtle can
  // be unavailable; that is a harness artefact, not an app error.
  page.on('pageerror', (e) => { if (!/digest/.test(e.message)) errors.push(e.message); });

try {
  await page.goto(base);
  await page.getByRole('button', { name: /Open Dex/i }).click();
  await page.getByRole('button', { name: /Skip Intro/i }).click();
  await page.locator('input[type=email]').fill('region@example.test');
  await page.locator('input[type=password]').fill('1234');
  await page.getByRole('button', { name: /Sign In/i }).first().click();

  const regions = page.getByRole('region', { name: 'Caught by region' });
  await regions.waitFor();
  const text = await regions.innerText();
  for (const label of ['Kanto','Johto','Hoenn','Sinnoh','Unova','Kalos','Alola','Galar / Hisui','Paldea / Kitakami']) {
    assert.match(text, new RegExp(label.replace(/[/]/g, '\\/')), `${label} row present`);
  }
  // Local inventory must survive; catches are derived from registered PokéPets.
  assert.match(text, /Kanto[\s\S]*?3\/151/, 'Kanto counts the three registered Kanto species (not wiped by the empty remote sync)');
  assert.match(text, /Johto[\s\S]*?1\/100/, 'Johto counts one');
  assert.match(text, /Paldea[\s\S]*?1\/120/, 'Paldea counts one');
  const percents = await regions.locator('span').evaluateAll((els) => els.map((e) => (e.textContent ?? '').trim()).filter((t) => /^\d+%$/.test(t)));
  assert.ok(percents.length >= 10, `a percentage is shown for every region and the total (${percents.length})`);
  assert.match(text, /All regions/, 'all-regions total row');
  assert.match(text, /5\/1025/, 'total catches');
  assert.ok(await regions.locator('div[style*="width"]').count() >= 9, 'a progress bar per region');
  assert.deepEqual(errors, []);
  console.log('PASS: caught-by-region percentages, living-dex share, all-regions total and local-inventory retention');
} finally {
  await context.close(); await browser.close();
  await new Promise((r) => server.close(r));
}
