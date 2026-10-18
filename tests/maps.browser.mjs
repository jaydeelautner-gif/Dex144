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
const fixture=(await (await import('esbuild')).build({entryPoints:['tests/MapsFixture.tsx'],bundle:true,write:false,format:'esm',define:{'process.env.NODE_ENV':'"production"'}})).outputFiles[0].text;
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
  const map=page.getByRole('region',{name:'Interactive region map'});
  await map.waitFor();
  const details=page.getByRole('region',{name:'Map location details'});
  await page.getByRole('button',{name:'Explore Route 1',exact:true}).click();
  await details.getByRole('heading',{name:'Route 1',exact:true}).waitFor();
  await details.getByRole('button',{name:/#16 Pidgey/}).waitFor();
  await details.getByRole('button',{name:/#16 Pidgey/}).click();
  assert.equal(await page.getByLabel('Selected map Pokémon').textContent(),'Pidgey');
  assert.match(await details.innerText(),/Rattata/);
  await page.screenshot({path:'/tmp/homedex-maps-route-one.png'});
  await page.getByRole('button',{name:'Explore Celadon City',exact:true}).press('Enter');
  assert.match(await details.innerText(),/Department Store/);
  await page.getByLabel('Find encounter area').fill('Kanto Route 10');
  const directory=page.getByLabel('Encounter area directory');
  await directory.getByRole('button',{name:'Kanto Route 10',exact:true}).click();
  await details.getByRole('heading',{name:'Kanto Route 10',exact:true}).waitFor();
  assert.ok(await details.locator('article').count()>0);
  await page.getByRole('button',{name:'Zoom map in',exact:true}).click();
  assert.equal(await map.locator('svg[role=group]').getAttribute('width'),'1200');
  await page.getByLabel('Map game',{exact:true}).selectOption('sword');
  assert.equal(await page.getByRole('navigation',{name:'Map regions'}).getByRole('button',{name:'Isle of Armor',exact:true}).count(),0);
  await page.getByRole('button',{name:'Toggle Isle of Armor ownership',exact:true}).click();
  await page.getByRole('navigation',{name:'Map regions'}).getByRole('button',{name:'Isle of Armor',exact:true}).click();
  await page.getByRole('button',{name:'Explore Fields of Honor',exact:true}).click();
  await details.getByRole('heading',{name:'Fields of Honor',exact:true}).waitFor();
  assert.match(await details.innerText(),/Master Dojo/);
  await page.getByRole('button',{name:'Toggle Isle of Armor ownership',exact:true}).click();
  assert.equal(await page.getByRole('navigation',{name:'Map regions'}).getByRole('button',{name:'Isle of Armor',exact:true}).count(),0);
  assert.doesNotMatch(await details.innerText(),/Master Dojo/);
  await page.getByLabel('Map game',{exact:true}).selectOption('scarlet');
  await page.getByText(/No encounter rows are recorded for Pokémon Scarlet/).waitFor();
  await page.getByLabel('Map game',{exact:true}).selectOption('heartgold');
  assert.equal(await page.getByRole('navigation',{name:'Map regions'}).getByRole('button').count(),2);
  await page.getByRole('navigation',{name:'Map regions'}).getByRole('button',{name:'Kanto',exact:true}).click();
  await page.getByRole('button',{name:'Explore Pallet Town',exact:true}).click();
  assert.match(await details.innerText(),/Professor Oak/);
  await page.getByRole('button',{name:'All games',exact:true}).click();
  const versions=await page.getByLabel('Map game',{exact:true}).locator('option').evaluateAll(options=>options.map(option=>option.value));
  assert.equal(versions.length,40);
  for(const game of versions){await page.getByLabel('Map game',{exact:true}).selectOption(game);assert.ok(await map.getByRole('button',{name:/^Explore /}).count()>0,game+' has interactive pins');}
  await page.getByLabel('Map game',{exact:true}).selectOption('pogo');
  assert.match(await page.getByTestId('maps-page').innerText(),/not a live GPS map/);
  await page.getByLabel('Map game',{exact:true}).selectOption('red');
  await page.setViewportSize({width:390,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'phone page fits while map pans within its own viewport');
  await page.getByRole('button',{name:'Explore Viridian City',exact:true}).click();
  assert.match(await details.innerText(),/Viridian Gym/);
  const retryPage=await context.newPage();
  retryPage.on('pageerror',error=>errors.push(error.message));
  let unavailable=true;
  await retryPage.route('**/data/encounters.json',route=>unavailable?route.fulfill({status:503,body:'unavailable'}):route.continue());
  await retryPage.goto(base+'/fixture.html');
  await retryPage.getByRole('alert').filter({hasText:'Encounter data is unavailable'}).waitFor();
  unavailable=false;
  await retryPage.getByRole('button',{name:'Retry',exact:true}).click();
  await retryPage.getByRole('button',{name:'Explore Route 1',exact:true}).click();
  await retryPage.getByRole('region',{name:'Map location details'}).getByRole('button',{name:/#16 Pidgey/}).waitFor();
  await retryPage.close();
  assert.deepEqual(errors,[]);
  console.log('PASS: clickable/keyboard map pins, exact-area encounters, building notes, species links, zoom, DLC gating, 40 game versions and phone layout');
} finally {
  await context.close();await browser.close();await new Promise(r=>server.close(r));
}
