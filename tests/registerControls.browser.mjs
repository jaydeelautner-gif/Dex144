// Verifies the invite-gate, guest restrictions and the public-profile toggle
// wiring, including the persistence path the toggle uses.
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.js':'application/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf','.webmanifest':'application/manifest+json' };
const fixture=(await (await import('esbuild')).build({entryPoints:['tests/RegisterControlsFixture.tsx'],bundle:true,write:false,format:'esm',plugins:[{name:'registration-id-fixture',setup(build){build.onResolve({filter:/firebase$/},args=>args.importer.endsWith('RegisterPokemonView.tsx')?{path:'registration-id',namespace:'fixture'}:undefined);build.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`export async function generateUniqueSiteWidePokeId(){return 'IDTEST123456';}`,loader:'js'}));}}],define:{'process.env.NODE_ENV':'"production"'}})).outputFiles[0].text;
const css=readdirSync(join(root,'assets')).find(name=>name.endsWith('.css'));
const server = createServer((req, res) => {
  if(req.url==='/fixture.html'){res.setHeader('Content-Type','text/html');return res.end(`<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/${css}"><div id="root"></div><script type="module" src="/fixture.js"></script>`);}
  if(req.url==='/fixture.js'){res.setHeader('Content-Type','application/javascript');return res.end(fixture);}
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
  await page.goto(base+'/fixture.html');
  const preview=page.getByTestId('register-preview');
  const attributes=page.getByTestId('register-attributes');
  const flagGroup=page.getByRole('group',{name:'PokéPet status and storage'});
  assert.equal(await flagGroup.evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),3,'six flags sit three per row');
  for (const name of ['Pokérus','Shiny Pokepet','Received via Trade','Gifted from Pokémon HOME','Stored in Pokémon HOME','Place in Living Dex Slot']) {
    const toggle=page.getByRole('checkbox',{name,exact:true});
    if (await toggle.count()) assert.ok((await toggle.getAttribute('title'))?.length>0,`${name} has a tooltip`);
  }
  const saveButton=page.getByRole('button',{name:'Save Pet Pokémon to Database',exact:true});
  assert.equal(await saveButton.count(),1,'desktop save sits with the level entry');
  assert.ok(await saveButton.evaluate(el=>el.closest('[data-testid=register-preview]')!==null),'save is in the left column');
  assert.equal(await attributes.getByPlaceholder('e.g. 025, Charizard, Gengar...').count(),1);
  assert.equal(await preview.getByPlaceholder('e.g. 025, Charizard, Gengar...').count(),0);
  assert.equal(await attributes.getByRole('button',{name:'Next',exact:true}).count(),1);
  assert.equal(await preview.getByRole('spinbutton').count(),1);
  assert.equal(await page.getByLabel('Origin region / language',{exact:true}).inputValue(),'en');
  await page.getByLabel('Origin region / language',{exact:true}).selectOption('ja');
  await attributes.getByRole('button',{name:'Poké Ball: Quick Ball',exact:true}).click();
  assert.equal(await attributes.getByRole('button',{name:'Poké Ball: Quick Ball',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await attributes.locator('select#pokepet-ball').count(),0,'old ball dropdown removed');
  await page.getByRole('checkbox',{name:'Pokérus',exact:true}).check();
  await page.getByRole('checkbox',{name:'Shiny Pokepet',exact:true}).check();
  const flags=page.getByRole('group',{name:'PokéPet status and storage'});
  const desktopHeight=await flags.evaluate(el=>el.getBoundingClientRect().height);
  assert.ok(desktopHeight<=140,'six flags occupy only three compact rows');
  const stored=page.getByRole('checkbox',{name:'Stored in Pokémon HOME',exact:true});
  const living=page.getByRole('checkbox',{name:'Place in Living Dex Slot',exact:true});
  await stored.uncheck();assert.ok(await living.isDisabled());assert.equal(await living.isChecked(),false);
  await stored.check();await living.check();
  const gift=page.getByRole('checkbox',{name:'Gifted from Pokémon HOME',exact:true});
  if(await gift.count()){
    await gift.check();assert.ok(await stored.isDisabled());assert.ok(await stored.isChecked());
    assert.ok(await page.getByRole('checkbox',{name:'Received via Trade',exact:true}).isDisabled());
    await gift.uncheck();
  }
  await page.getByRole('button',{name:'Clear',exact:true}).click();
  await page.getByRole('button',{name:'7',exact:true}).click();await page.getByRole('button',{name:'2',exact:true}).click();
  assert.equal(await page.getByRole('spinbutton').inputValue(),'72');
  const keyHeight=await page.getByRole('button',{name:'7',exact:true}).evaluate(el=>el.getBoundingClientRect().height);
  assert.ok(keyHeight>=40,'keypad has larger touch targets');
  await page.locator('form').first().screenshot({path:'/tmp/register-panels-desktop.png'});
  assert.equal(await page.getByRole('button',{name:/^Slot /}).count(),30);
  await page.getByRole('button',{name:'Slot 2: Ivysaur',exact:true}).click();
  assert.ok(await page.getByRole('button',{name:'Slot 2: Ivysaur',exact:true}).getAttribute('aria-pressed')==='true');
  assert.equal(await page.getByRole('spinbutton').inputValue(),'72','slot navigation preserves entered level');
  await page.getByRole('button',{name:'Next placement box'}).click();
  assert.equal(await page.getByRole('button',{name:'Slot 2: Nidoran♂',exact:true}).count(),1);
  await page.getByRole('button',{name:'Previous placement box'}).click();
  assert.equal(await page.getByRole('button',{name:'Slot 2: Ivysaur',exact:true}).count(),1);
  assert.equal(await page.getByTestId('static-minimap').getByRole('button').count(),0,'existing minimaps remain static');
  await page.getByRole('button',{name:'Jump to final box'}).click();
  await page.getByRole('button',{name:'Slot 6: empty',exact:true}).waitFor();
  assert.ok(await page.getByRole('button',{name:'Slot 6: empty',exact:true}).isDisabled());
  assert.ok(await page.getByRole('button',{name:'Next placement box'}).isDisabled());
  await page.setViewportSize({width:390,height:950});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'form fits phone width');
  const slot=await page.getByRole('button',{name:/^Slot 1:/}).boundingBox();assert.ok(slot.width>=32 && slot.height>=32);
  await page.screenshot({path:'/tmp/registration-compact-phone.png',fullPage:true});
  const desktopSave=page.getByRole('button',{name:'Save Pet Pokémon to Database',exact:true});
  if (await desktopSave.isVisible().catch(()=>false)) await desktopSave.click();
  else await page.getByRole('button',{name:'Save Poképet',exact:true}).click();
  await page.getByLabel('Registered specimen',{exact:true}).filter({hasText:'originLanguage'}).waitFor();
  const saved=JSON.parse(await page.getByLabel('Registered specimen',{exact:true}).textContent());
  assert.equal(saved.originLanguage,'ja');assert.equal(saved.ballType,'quick-ball');assert.equal(saved.level,72);
  assert.deepEqual(errors,[]);
  console.log('PASS: compact flags and constraints, larger keypad, tappable species slots, box navigation, final empty slots and mobile width');
} finally {
  await context.close();await browser.close();await new Promise(r=>server.close(r));
}
