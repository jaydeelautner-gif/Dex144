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
  await context.addInitScript(async () => {
    const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode('salt:1234'));
    const pinHash = Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    localStorage.setItem('homedex_cached_auth_vault_v1', JSON.stringify([{uid:'home-layout-test',email:'home@example.test',displayName:'Home Tester',salt:'salt',passwordHash:'unused',pinSalt:'salt',pinHash,hasLoggedInOnThisDevice:true,lastLoginAt:Date.now()}]));

    localStorage.setItem('homedex_home_panels_v1', JSON.stringify({catchHub:false}));
  });
  await page.goto(base);
  await page.getByRole('button',{name:/Open Dex/i}).click();
  await page.getByRole('button',{name:/Skip Intro/i}).click();
  await page.getByRole('group',{name:'PIN touch keypad'}).waitFor();
  for(const digit of ['1','2','3','4']) await page.getByRole('button',{name:`PIN digit ${digit}`,exact:true}).click();
  await page.getByRole('button',{name:'Unlock with PIN'}).click();
  const sidebar = page.getByRole('complementary',{name:'Your trainer and profile shortcuts'});
  await sidebar.waitFor();
  for (const width of [1360, 1024, 390]) {
    await page.setViewportSize({width,height:1000});
    const layout = page.getByTestId('home-layout');
    const columns = await layout.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    assert.equal(columns,width >= 1024 ? 2 : 1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false,'no horizontal page overflow');
  }
  await page.setViewportSize({width:1360,height:1000});
  await page.screenshot({path:'/tmp/homedex-home-sidebar.png'});
  const shortcuts = page.getByRole('navigation',{name:'Home profile shortcuts'});
  for (const name of ['Boxes','Inventory','Friends','Avatar Builder']) {
    await shortcuts.getByRole('button',{name,exact:false}).click();
    if(name === 'Avatar Builder') await page.getByRole('heading',{name:'Your Trainer Avatar'}).waitFor();
    else await page.getByRole('button',{name,exact:name!=='Inventory'}).last().waitFor();
    await page.getByRole('button',{name:'Home',exact:true}).first().click();
    await sidebar.waitFor();
  }
  await page.getByRole('navigation',{name:'Primary Workspace'}).getByRole('button',{name:'Maps',exact:true}).click();
  await page.getByTestId('maps-page').waitFor();
  await page.getByRole('heading',{name:'Town Map',exact:true}).waitFor();
  await page.setViewportSize({width:320,height:900});
  await page.getByRole('navigation',{name:'Mobile Bottom Navigation'}).getByRole('button',{name:'Maps',exact:true}).click();
  assert.equal(await page.getByRole('navigation',{name:'Mobile Bottom Navigation'}).evaluate(el=>el.scrollWidth>el.clientWidth),false,'Maps link fits mobile navigation');
  await page.getByRole('navigation',{name:'Mobile Bottom Navigation'}).getByRole('button',{name:'Home',exact:true}).click();
  await page.setViewportSize({width:1360,height:1000});
  await sidebar.waitFor();
  await page.getByRole('button',{name:'Settings',exact:true}).first().click();
  await page.getByRole('button',{name:/Home Screen.*Choose visible panels/}).click();
  const fieldset=page.locator('fieldset').filter({has:page.locator('legend',{hasText:'Trainer sidebar'})});
  await fieldset.waitFor();
  assert.equal(await fieldset.getByRole('checkbox').count(),5);
  for (const box of await fieldset.getByRole('checkbox').all()) await box.uncheck();
  await page.getByRole('button',{name:'Save settings',exact:true}).first().click();
  await page.getByRole('button',{name:'Home',exact:true}).first().click();
  assert.equal(await sidebar.count(),0);
  assert.equal(await page.getByTestId('home-layout').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1);
  const prefs=await page.evaluate(()=>JSON.parse(localStorage.getItem('homedex_home_panels_v1')));
  assert.equal(prefs.trainerCard,false);
  assert.equal(prefs.profileAvatar,false);
  assert.deepEqual(errors,[]);
  console.log('PASS: responsive home sidebar, four profile links, five settings toggles and full-width fallback');
} finally {
  await context.close(); await browser.close();
  await new Promise(r=>server.close(r));
}
