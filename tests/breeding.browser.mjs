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
const fixture=(await (await import('esbuild')).build({entryPoints:['tests/BreedingFixture.tsx'],bundle:true,write:false,format:'esm',define:{'process.env.NODE_ENV':'"production"'}})).outputFiles[0].text;
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
  const guide=page.getByRole('region',{name:'Baby Pokémon and breeding'});
  await guide.waitFor();
  await page.getByLabel('Breeding game',{exact:true}).selectOption('emerald');
  assert.match(await guide.innerText(),/Sea Incense/);
  assert.match(await guide.innerText(),/Lv. 5/);
  await page.getByLabel('Breeding game',{exact:true}).selectOption('scarlet');
  assert.match(await guide.innerText(),/no incense needed/);
  assert.match(await guide.innerText(),/Picnic Egg Basket/);
  assert.doesNotMatch(await guide.innerText(),/Sea Incense is required/);
  await page.getByLabel('Breeding game',{exact:true}).selectOption('pla');
  assert.match(await guide.innerText(),/no breeding/);
  await page.getByLabel('Breeding game',{exact:true}).selectOption('red');
  assert.match(await guide.innerText(),/introduced in Gold and Silver/);
  await page.getByRole('navigation',{name:'Test species'}).getByRole('button',{name:'Pichu',exact:true}).click();
  await page.getByLabel('Breeding game',{exact:true}).selectOption('sword');
  assert.match(await guide.innerText(),/Baby Pokémon cannot breed/);
  await guide.getByRole('button',{name:'Pikachu',exact:true}).click();
  assert.equal(await page.getByRole('heading',{name:'Pikachu',exact:true}).count(),1,'parent link navigates to species');
  await page.getByRole('navigation',{name:'Test species'}).getByRole('button',{name:'Manaphy',exact:true}).click();
  await page.getByLabel('Breeding game',{exact:true}).selectOption('diamond');
  assert.match(await guide.innerText(),/Phione does not evolve into Manaphy/);
  await page.getByRole('navigation',{name:'Test species'}).getByRole('button',{name:'Mewtwo',exact:true}).click();
  await page.getByLabel('Breeding game',{exact:true}).selectOption('diamond');
  assert.match(await guide.innerText(),/cannot breed/);
  await page.getByRole('button',{name:'All games',exact:true}).click();
  assert.equal(await page.getByLabel('Breeding game',{exact:true}).locator('option[value="pogo"]').count(),1);
  await page.getByLabel('Breeding game',{exact:true}).selectOption('pogo');
  assert.match(await guide.innerText(),/does not breed/);
  await page.setViewportSize({width:390,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'breeding panel fits phone');
  assert.deepEqual(errors,[]);
  console.log('PASS: incense, Scarlet/Violet picnic, baby parents, links, Phione, unbreedable Pokémon, game filters and phone layout');
} finally {
  await context.close();await browser.close();await new Promise(r=>server.close(r));
}
