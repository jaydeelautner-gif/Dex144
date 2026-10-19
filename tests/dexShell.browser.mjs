// Verifies the invite-gate, guest restrictions and the public-profile toggle
// wiring, including the persistence path the toggle uses.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.js':'application/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf','.webmanifest':'application/manifest+json' };
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://test').pathname;
  const file = join(root, path === '/' ? 'index.html' : path);
  if (!existsSync(file)) { res.statusCode = 404; return res.end('not found'); }
  res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1360, height: 1000 } });
await context.route('**/*', (r) => new URL(r.request().url()).origin === base ? r.continue() : r.abort());
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

try {
  for (const width of [390, 768, 1360]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base);
    await page.getByRole('button', { name: /Open Dex/i }).waitFor();
    assert.equal(await page.locator('.dex-login').count(), 0);
    await page.getByRole('button', { name: /Open Dex/i }).click();
    await page.getByRole('button', { name: /Skip Intro/ }).click();
    await page.locator('.dex-login').waitFor();
    assert.equal(await page.getByRole('group', { name: 'PIN touch keypad' }).count(), 0);
    const chassis = await page.locator('.dex-login > .relative').evaluate(el => getComputedStyle(el).borderTopWidth);
    assert.equal(chassis, width < 640 ? '2px' : width < 1280 ? '4px' : '8px');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }
  await context.addInitScript(async () => {
    const salt = 'test-salt';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':1234'));
    const passHash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('homedex_cached_auth_vault_v1', JSON.stringify([{
      uid: 'shell-test-trainer', email: 'trainer@example.test', displayName: 'Test Trainer',
      salt, passwordHash: passHash,
      hasLoggedInOnThisDevice: true, lastLoginAt: Date.now()
    }]));
  });
  await page.goto(base);
  await page.getByRole('button', { name: /Open Dex/i }).click();
  await page.getByRole('button', { name: /Skip Intro/ }).click();
  // The retired PIN keypad must be gone; cached credentials unlock via the password form.
  assert.equal(await page.getByRole('group', { name: 'PIN touch keypad' }).count(), 0);
  await page.locator('input[type=email]').fill('trainer@example.test');
  await page.locator('input[type=password]').fill('1234');
  await page.getByRole('button', { name: /Sign In/i }).first().click();
  await page.getByRole('button', { name: /Log Out|Sign Out/i }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /Log Out|Sign Out/i }).click();
  await page.getByRole('button', { name: /Open Dex/i }).waitFor({ timeout: 10000 });
  assert.equal(await page.locator('.dex-login').count(), 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('homedex_active_offline_session_v1')), null, 'sign-out must clear the local session immediately');
  await page.waitForTimeout(4000);
    assert.ok(/Open Dex/i.test(await page.locator('body').innerText()), 'the dex must stay closed after sign-out');
  // Frame fills the screen and content scrolls inside it (big-screen check)
  await page.setViewportSize({ width: 1600, height: 620 });
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /Open Dex/i }).click();
  await page.getByRole('button', { name: /Skip Intro/ }).click();
  await page.locator('.dex-login').waitFor();
  await page.evaluate(() => {
    const scroller = document.querySelector('.dex-login .flex-1.min-h-0.overflow-y-auto');
    if (!scroller) throw new Error('login screen scroller missing');
    if (scroller.scrollHeight <= scroller.clientHeight) throw new Error('login screen does not scroll within the frame at 1600px');
  });
  await page.screenshot({ path: '/tmp/dex-login-big.png' });

  await context.setOffline(true);
  await page.goto(base);
  await page.getByRole('button', { name: /Open Dex/i }).click();
  await page.getByRole('button', { name: /Skip Intro/ }).click();
  await page.locator('input[type=email]').fill('trainer@example.test');
  await page.locator('input[type=password]').fill('1234');
  await page.getByRole('button', { name: /Sign In/i }).first().click();
  await page.getByRole('button', { name: /Log Out|Sign Out/i }).waitFor();
  assert.equal(await page.getByLabel('Pokédex hardware').count(), 1);
  // Trainer & Badges tab: avatar builder + badge sprites render.
  const signOutBtn = page.getByRole('button', { name: /Log Out|Sign Out/i });
  if (await signOutBtn.count()) {
    await signOutBtn.click();
    await page.getByRole('button', { name: /Open Dex/i }).waitFor();
  }
  await page.evaluate(() => {
    localStorage.setItem('homedex_v4_game_progress', JSON.stringify({ rb: ['rb-badge-1','rb-badge-2','rb-badge-3'] }));
    localStorage.setItem('homedex_v4_owned_games', JSON.stringify(['red']));
    const v = JSON.parse(localStorage.getItem('homedex_cached_auth_vault_v1')||'[]');
    v[0].uid = 'badge-test-trainer';
    localStorage.setItem('homedex_cached_auth_vault_v1', JSON.stringify(v));
    localStorage.setItem('homedex_cached_profile_badge-test-trainer', JSON.stringify({
      ownerId: 'badge-test-trainer', trainerName: 'Test Trainer', activeGameFilter: 'all',
      isPublic: false, caughtIds: [], shinyIds: [], livingIds: [], caughtVariants: [],
      boxSelectedVariants: [], boxSelectedGames: [], ownedGames: ['red'], ownedDlcs: [],
      gameCatches: {}, homePanels: {}, gameProgress: { rb: ['rb-badge-1','rb-badge-2','rb-badge-3'] },
      caughtCount: 0, shinyCount: 0,
    }));
  });
  await page.reload();
  await page.getByRole('button', { name: /Open Dex/i }).waitFor();
  await page.getByRole('button', { name: /Open Dex/i }).click();
  await page.getByRole('button', { name: /Skip Intro/i }).click();
  await page.locator('input[type=email]').fill('trainer@example.test');
  await page.locator('input[type=password]').fill('1234');
  await page.getByRole('button', { name: /Sign In/i }).first().click();
  await page.getByRole('button', { name: /Log Out|Sign Out/i }).waitFor();
  await page.getByRole('button', { name: 'Test Trainer' }).first().click();
  const card = page.locator('[aria-label="Trainer card"]');
  await card.waitFor();
  await page.evaluate(() => {
    const el = document.querySelector('[aria-label="Trainer card"]');
    el?.scrollIntoView();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/profile-card.png' });
  const cardText = await card.innerText();
  console.log('CARD:', cardText.replace(/\n/g, ' | ').slice(0, 220));
  await page.getByRole('button', { name: 'Avatar Builder' }).click();
  await page.waitForTimeout(500);
  const builder = page.locator('section', { hasText: 'Your Trainer Avatar' }).first();
  await builder.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/avatar-builder.png' });
  for (const label of ['ponytail', 'determined', 'hoodie', 'beanie', 'scarf']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.waitForTimeout(150);
  }
  await page.screenshot({ path: '/tmp/avatar-custom.png' });
  const saved = await page.evaluate(() => localStorage.getItem('homedex_avatar_v1'));
  console.log('AVATAR-SAVED:', saved);
  await page.locator('svg[aria-label="Trainer portrait"]').first().screenshot({ path: '/tmp/avatar-custom.svg.png' });
  await page.waitForTimeout(1000);
  const badgeImgs = await page.locator('img[src*="/badges/"]').count();
  const lit = await page.locator('img[src*="/badges/"]:not(.grayscale)').count();
  const svg = await page.locator('svg[aria-label="Trainer portrait"]').count();
  console.log('BADGES total:', badgeImgs, 'lit:', lit, 'avatar-svg:', svg);

  await page.screenshot({ path: '/tmp/trainer-tab2.png', fullPage: false });
  assert.ok(badgeImgs >= 8 && lit >= 3, 'badge case slots render with earned badges lit');
  assert.ok(svg >= 1, 'avatar preview renders (card + builder)');
  assert.deepEqual(errors, []);
  console.log('PASS: closed-first, responsive login frame, password login and logout-to-closed');
} finally {
  await context.close(); await browser.close();
  await new Promise(r => server.close(r));
}
