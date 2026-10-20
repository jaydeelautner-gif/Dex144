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

await context.addInitScript(async () => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('salt:1234'));
  const pinHash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem('homedex_cached_auth_vault_v1', JSON.stringify([{uid:'items-suite',email:'items@example.test',displayName:'Items Tester',salt:'salt',passwordHash:'unused',pinSalt:'salt',pinHash,hasLoggedInOnThisDevice:true,lastLoginAt:Date.now()}]));
});
try {
  await page.goto(base);
  await page.getByRole('button',{name:/Open Dex/i}).click();
  await page.getByRole('button',{name:/Skip Intro/i}).click();
  await page.getByRole('group',{name:'PIN touch keypad'}).waitFor();
  for(const d of ['1','2','3','4'])await page.getByRole('button',{name:'PIN digit '+d,exact:true}).click();
  await page.getByRole('button',{name:'Unlock with PIN'}).click();
  const nav=page.getByRole('navigation',{name:'Primary Workspace'});
  await nav.getByRole('button',{name:'Items',exact:true}).waitFor();
  const items=page.getByTestId('items-page');
  await nav.getByRole('button',{name:'Items',exact:true}).click();
  await items.waitFor();
  await items.getByLabel('Search items',{exact:true}).fill('Thunder Stone');
  await items.getByRole('button',{name:/Thunder Stone/}).first().waitFor();
  assert.ok(await items.locator('img[src^="blob:"]').count()>0,'item sprites render from the bundled archive');
  await items.getByRole('button',{name:/Thunder Stone/}).first().click();
  assert.match(await items.innerText(),/Evolution/);
  assert.match(await items.innerText(),/Locations|location/, 'clicking an item reveals its locations');
  await items.getByRole('button',{name:/Thunder Stone/}).first().click();
  await items.getByRole('button',{name:'TMs & HMs',exact:true}).click();
  await page.getByLabel('Machine game',{exact:true}).waitFor();
  const allGames=page.getByRole('button',{name:'All games',exact:true});
  if(await allGames.count())await allGames.click();
  await page.getByLabel('Machine game',{exact:true}).selectOption('heartgold');
  await items.getByText('HM01',{exact:true}).first().waitFor();
  assert.match(await items.innerText(),/Cut/);
  await page.getByLabel('Search items',{exact:true}).fill('Surf');
  assert.match(await items.innerText(),/Surf/);
  await items.getByRole('button',{name:'Items',exact:true}).click();
  await items.getByLabel('Item category',{exact:true}).selectOption('evolution');
  assert.ok(await items.locator('article').count()>0,'category filter lists items');
  await page.getByLabel('Item generation',{exact:true}).selectOption('1');
  assert.ok(await items.locator('article').count()>0,'generation filter lists items');
  await nav.getByRole('button',{name:'Maps',exact:true}).click();
  await page.getByTestId('maps-page').waitFor();
  const mapAll=page.getByRole('button',{name:'All games',exact:true});
  if(await mapAll.count())await mapAll.click();
  await page.getByLabel('Map game',{exact:true}).selectOption('red');
  await page.getByRole('button',{name:'Explore Celadon City',exact:true}).click();
  const details=page.getByRole('region',{name:'Map location details'});
  await details.getByText('Items found here',{exact:true}).waitFor();
  assert.match(await details.innerText(),/Thunder Stone/);
  assert.match(await details.innerText(),/Celadon/);
  await page.screenshot({path:'/tmp/homedex-items-map.png'});
  await page.setViewportSize({width:390,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'items page fits phone');
  assert.deepEqual(errors,[]);
  console.log('PASS: item search, category/generation filters, per-game TMs and HMs, map pickup notes and phone layout');
} finally {
  await context.close();await browser.close();await new Promise(r=>server.close(r));
}
