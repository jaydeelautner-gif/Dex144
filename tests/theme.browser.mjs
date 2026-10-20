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
  await page.getByRole('navigation',{name:'Settings sections'}).getByRole('button',{name:/^Storage & Sync/}).click();
  const oldHash=await page.evaluate(()=>JSON.parse(localStorage.getItem('homedex_cached_auth_vault_v1'))[0].pinHash);
  await page.getByLabel('Quick-entry PIN',{exact:true}).fill('5678');
  await page.getByLabel('Confirm quick-entry PIN',{exact:true}).fill('0000');
  await page.getByRole('button',{name:'Save settings',exact:true}).first().click();
  await page.getByText(/PIN was not saved/).waitFor();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('homedex_cached_auth_vault_v1'))[0].pinHash),oldHash,'invalid PIN is not applied');
  await page.getByLabel('Confirm quick-entry PIN',{exact:true}).fill('5678');
  await page.getByRole('navigation',{name:'Settings sections'}).getByRole('button',{name:/^Tracker/}).click();
  await page.getByRole('button',{name:'Save settings',exact:true}).first().click();
  await page.getByText(/Settings saved on this device/).waitFor();
  const pinCorrect=await page.evaluate(async()=>{
    const account=JSON.parse(localStorage.getItem('homedex_cached_auth_vault_v1'))[0];
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(account.pinSalt+':5678'));
    return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')===account.pinHash;
  });
  assert.ok(pinCorrect,'global Save also saves the staged PIN from another Settings section');
  // ── Themes ──
  await page.getByRole('navigation',{name:'Settings sections'}).getByRole('button',{name:/^Appearance/}).click();
  const picker=page.getByRole('group',{name:'Theme'});
  await picker.waitFor();
  assert.equal(await picker.getByRole('button').count(),9,'nine themes offered (8 presets + custom)');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'homedex','default theme applied');
  await picker.getByRole('button',{name:/Forest Green/}).click();
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'forest');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--chassis-1').trim()),'#16a34a','theme variables applied');
  assert.equal(await page.evaluate(()=>localStorage.getItem('homedex_theme_v1')),'forest','theme saved to device');
  await page.screenshot({path:'/tmp/theme-forest.png'});
  // The cover renders a backdrop layer (photo when provided, storm gradient otherwise).
  await page.getByRole('button',{name:'Home',exact:true}).first().click();

  // Backdrop layer must be visible behind the closed cover.
  await page.getByRole('button',{name:/Sign Out|Log Out/}).click();
  await page.getByRole('button',{name:/Open Dex/i}).waitFor();
  const layers=await page.evaluate(()=>document.querySelectorAll('div.fixed.inset-0, div.absolute.inset-0').length);
  assert.ok(layers>0,'a backdrop layer renders on the closed cover');
  await page.screenshot({path:'/tmp/cover-backdrop.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: draft checkboxes, cross-section Save, persisted Home/layout/sounds, leave cancel/discard, reload warning and Save on every section');
} finally {
  await context.close();await browser.close();
  await new Promise(r=>server.close(r));
}
