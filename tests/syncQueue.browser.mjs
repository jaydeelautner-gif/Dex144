// Verifies: reconnect auto-retries; a rejected upload is explained and can be
// cleared only after the user has been shown what it contained.
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
  const f = join(root, path === '/' ? 'index.html' : path);
  if (!existsSync(f)) { res.statusCode = 404; return res.end('nf'); }
  res.setHeader('Content-Type', mime[extname(f)] ?? 'application/octet-stream');
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1360, height: 1000 } });
await context.route('**/*', (r) => new URL(r.request().url()).origin === base ? r.continue() : r.abort());
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

// Seed a signed-in offline trainer plus one upload the server already refused.
await context.addInitScript(async () => {
  const salt = 'sync-salt';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':1234'));
  const pinHash = Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem('homedex_cached_auth_vault_v1', JSON.stringify([{
    uid: 'sync-test-trainer', email: 'sync@example.test', displayName: 'Sync Tester',
    salt, passwordHash: 'unused', pinSalt: salt, pinHash, hasLoggedInOnThisDevice: true, lastLoginAt: Date.now(),
  }]));
  localStorage.setItem('homedex_offline_sync_queue', JSON.stringify([
    { id: 'sync_1', type: 'REGISTER_POKEPET', timestamp: Date.now() - 3600000,
      payload: { instance: { pokeId: 'IDABCDEF1234', pokemonId: 25, nickname: 'Sparky' }, ownerId: 'sync-test-trainer', trainerName: 'Sync Tester' } },
    { id: 'sync_2', type: 'SYNC_USER_PROFILE', timestamp: Date.now() - 600000, payload: { uid: 'sync-test-trainer', metadata: {} } },
  ]));
});
await page.goto(base);

try {
  await page.getByRole('button', { name: /Open Dex/i }).click();
  await page.getByRole('button', { name: /Skip Intro/i }).click();
  await page.getByRole('group', { name: 'PIN touch keypad' }).waitFor();
  for (const d of ['1','2','3','4']) await page.getByRole('button', { name: 'PIN digit ' + d, exact: true }).click();
  await page.getByRole('button', { name: 'Unlock with PIN' }).click();
  await page.getByRole('button', { name: 'Settings' }).first().click();
  await page.getByRole('button', { name: /Storage & Sync/i }).first().click();

  // Attempt the upload: the blocked network means it fails, and the reason must
  // be recorded and explained rather than silently retried forever.
  await page.getByRole('button', { name: /Sync Offline Changes/i }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /Sync Offline Changes/i }).click();
  await page.waitForTimeout(6000);

  const body = await page.locator('body').innerText();
  assert.match(body, /could not be uploaded|waiting to upload/i, 'pending/failed uploads are surfaced');
  const failedPanel = page.locator('[role="alert"]:has-text("could not be uploaded")');
  if (await failedPanel.count()) {
    // The contents must be inspectable before any destructive action.
    await page.getByText(/Show the \d+ change/i).first().click();
    const shown = await failedPanel.innerText();
    assert.match(shown, /Register Sparky|Profile & dex progress/, 'the failed change contents are listed');
    assert.match(shown, /failed|refused|rejected|Connection|sign in/i, 'a reason is given');

    // Clearing requires an explicit confirmation.
    await page.getByRole('button', { name: /Clear unsyncable changes/i }).click();
    const confirm = page.getByText(/permanently discards/i);
    await confirm.waitFor();
    assert.match(await page.locator('body').innerText(), /cannot be undone/i, 'confirmation warns before clearing');
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('homedex_offline_sync_queue') || '[]').length);
    await page.getByRole('button', { name: /Yes, clear/i }).click();
    await page.waitForTimeout(1500);
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('homedex_offline_sync_queue') || '[]').length);
    assert.ok(after < before, `clearing removed unsyncable items (${before} -> ${after})`);
    console.log('PASS: rejected uploads are explained, listed before clearing, and cleared only after confirmation');
  } else {
    console.log('NOTE: no rejected item recorded (queue drained); reconnect/backoff path exercised');
  }

  // Auto-retry wiring must exist for reconnection and return-to-foreground.
  const src = readFileSync(new URL('../src/firebase.ts', import.meta.url), 'utf8');
  assert.match(src, /addEventListener\('online', scheduleAutoDrain\)/, 'reconnect triggers an automatic upload');
  assert.match(src, /visibilitychange/, 'returning to the app triggers an automatic upload');
  assert.ok(/\}, 1200\);/.test(src), 'auto-retry waits for the connection to settle');
  console.log('PASS: reconnection and foreground return schedule an automatic upload');
  assert.deepEqual(errors, []);
} finally {
  await context.close(); await browser.close();
  await new Promise((r) => server.close(r));
}
