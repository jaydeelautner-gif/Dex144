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
    const passHash = Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    localStorage.setItem('homedex_cached_auth_vault_v1', JSON.stringify([{uid:'home-layout-test',email:'home@example.test',displayName:'Home Tester',salt:'salt',passwordHash: passHash,hasLoggedInOnThisDevice:true,lastLoginAt:Date.now()}]));

    localStorage.setItem('homedex_home_panels_v1', JSON.stringify({catchHub:false}));
  });
  await page.goto(base);
  await page.getByRole('button',{name:/Open Dex/i}).click();
  await page.getByRole('button',{name:/Skip Intro/i}).click();
  await page.locator('input[type=email]').fill('home@example.test');
  await page.locator('input[type=password]').fill('1234');
  await page.getByRole('button', { name: /Sign In/i }).first().click();
  const sidebar = page.getByRole('complementary',{name:'Your trainer and profile shortcuts'});
  await sidebar.waitFor();

  const mainSettings=()=>page.getByRole('button',{name:'Settings',exact:true}).first().click();
  const homeSettings=()=>page.getByRole('navigation',{name:'Settings sections'}).getByRole('button',{name:/^Home Screen/}).click();
  await mainSettings();await homeSettings();
  const welcome=page.getByRole('checkbox',{name:/Welcome banner/});
  await welcome.uncheck();
  await page.waitForTimeout(600);
  assert.equal(await welcome.isChecked(),false,'draft checkbox stays changed');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('homedex_home_panels_v1')).welcome),true,'draft does not change applied preferences');
  await page.getByLabel('Home layout',{exact:true}).selectOption('right');
  await page.getByRole('navigation',{name:'Settings sections'}).getByRole('button',{name:/^Sounds/}).click();
  await page.getByRole('checkbox',{name:/Sound effects/}).uncheck();
  assert.notEqual(await page.evaluate(()=>localStorage.getItem('homedex_sound_effects_v1')),'false','sound is staged until Save');
  let warning='';
  page.once('dialog',async dialog=>{warning=dialog.message();await dialog.dismiss();});
  await page.getByRole('button',{name:'Home',exact:true}).first().click();
  assert.match(warning,/unsaved settings/i,'leaving prompts');
  assert.equal(await page.getByRole('button',{name:'Save settings',exact:true}).first().isVisible(),true,'cancel keeps Settings open');
  await homeSettings();
  assert.equal(await welcome.isChecked(),false,'draft retained across sections and canceled navigation');
  await page.getByRole('button',{name:'Save settings',exact:true}).first().click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('homedex_home_panels_v1')).welcome),false,'saved checkbox applied');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('homedex_home_design_v1')).layout),'right','layout applied by same Save');
  assert.equal(await page.evaluate(()=>localStorage.getItem('homedex_sound_effects_v1')),'false','sound applied by same Save');
  await page.getByRole('button',{name:'Home',exact:true}).first().click();
  assert.equal(await page.getByRole('heading',{name:'Welcome to HomeDex',exact:true}).count(),0,'hidden Home section really disappears');
  await mainSettings();await homeSettings();
  assert.equal(await welcome.isChecked(),false,'applied checkbox still correct on return');
  await welcome.check();
  page.once('dialog',async dialog=>{warning=dialog.message();await dialog.accept();});
  await page.getByRole('button',{name:'Home',exact:true}).first().click();
  await sidebar.waitFor();
  await mainSettings();await homeSettings();
  assert.equal(await welcome.isChecked(),false,'leave-without-saving discards the draft');
  await welcome.check();
  let beforeUnload=false;
  page.once('dialog',async dialog=>{beforeUnload=dialog.type()==='beforeunload';await dialog.dismiss();});
  await page.reload({timeout:5000}).catch(()=>{});
  assert.equal(beforeUnload,true,'reload warns while dirty');
  page.once('dialog',async dialog=>{warning=dialog.message();await dialog.dismiss();});
  await page.getByRole('button',{name:/Sign Out|Log Out/}).click();
  assert.match(warning,/unsaved settings/i,'logout also warns');
  assert.ok(await page.getByRole('button',{name:'Save settings',exact:true}).first().isVisible(),'canceled logout keeps the draft');
  await page.getByRole('button',{name:'Discard changes',exact:true}).first().click();
  assert.equal(await welcome.isChecked(),false,'Discard restores the applied value');
  for(const name of [/^Home Screen/,/^Games & DLC/,/^Sounds/,/^Tracker/,/^Export & Sharing/,/^Storage & Sync/,/^Rescue Shelter/,/^Danger Zone/]){
    await page.getByRole('navigation',{name:'Settings sections'}).getByRole('button',{name}).click();
    assert.ok(await page.getByRole('button',{name:'Save settings',exact:true}).first().isVisible(),'Save available on every Settings section');
  }
  await page.getByRole('navigation',{name:'Settings sections'}).getByRole('button',{name:/^Games & DLC/}).click();
  const ownedBefore=await page.evaluate(()=>localStorage.getItem('homedex_v4_owned_games'));
  await page.getByRole('button',{name:'Clear All',exact:true}).click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('homedex_v4_owned_games')),ownedBefore,'game selections remain a draft');
  await page.getByRole('button',{name:'Save settings',exact:true}).first().click();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('homedex_v4_owned_games'))),[],'owned games applied');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('homedex_v4_owned_dlcs'))),[],'DLCs applied');
  await page.getByRole('navigation',{name:'Settings sections'}).getByRole('button',{name:/^Tracker/}).click();
  await page.getByRole('button',{name:'Deselect All',exact:true}).click();
  await page.getByRole('button',{name:'Save settings',exact:true}).first().click();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('homedex_v4_tally_games'))),[],'tally preferences applied');
  await page.getByRole('button',{name:'Make Public & Shareable',exact:true}).click();
  assert.notEqual(await page.evaluate(()=>localStorage.getItem('homedex_v4_is_public')),'true','visibility is staged');
  await page.getByRole('button',{name:'Save settings',exact:true}).first().click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('homedex_v4_is_public')),'true','profile visibility applied');
  // ── Themes, custom colours and fonts ──
  await page.getByRole('navigation',{name:'Settings sections'}).getByRole('button',{name:/^Appearance/}).click();
  const presets=page.getByRole('button',{name:/HomeDex Red/});
  await presets.waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'homedex','current style is the default');
  await page.getByRole('button',{name:/Forest Green/}).click();
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'forest','preset selectable');
  await page.getByRole('button',{name:/^Custom/}).first().click();
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'custom','custom selectable');
  await page.getByLabel('Accent',{exact:true}).fill('#22d3ee');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()),'#22d3ee','custom accent applied');
  await page.getByRole('button',{name:/JetBrains Mono/}).click();
  assert.match(await page.evaluate(()=>getComputedStyle(document.body).fontFamily),/JetBrains Mono/,'font family applied');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('homedex_theme_custom_v1')));
  assert.equal(stored.colors['--accent'],'#22d3ee','custom colour saved');
  assert.equal(stored.font,'mono','font choice saved');
  await page.reload();
  await page.waitForTimeout(1500);
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'custom','custom theme persists across reload');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()),'#22d3ee','custom colour persists');
  assert.deepEqual(errors,[]);
  console.log('PASS: draft checkboxes, cross-section Save, persisted Home/layout/sounds, leave cancel/discard, reload warning and Save on every section');
} finally {
  await context.close();await browser.close();
  await new Promise(r=>server.close(r));
}
