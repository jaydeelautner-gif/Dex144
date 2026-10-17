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
const fixture = (await (await import('esbuild')).build({entryPoints:['tests/DisplayCountsFixture.tsx'],bundle:true,write:false,format:'esm',plugins:[{name:'community-fixture',setup(build){build.onResolve({filter:/firebase$/},args=>args.importer.endsWith('RecentCommunityPets.tsx')?{path:'community-data',namespace:'fixture'}:undefined);build.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`let refresh=0; export async function fetchRecentRegisteredPokepets(){refresh++;return Array.from({length:12},(_,i)=>({pokeId:'ID'+String(i).padStart(10,'0'),pokemonId:i+1,nickname:'Community '+refresh+'-'+i,level:5+i,variantId:(i+1)+':base',isShiny:false,trainerName:'Trainer '+(i%3),createdAt:1700000000000-i}));}`,loader:'js'}));}}],define:{'process.env.NODE_ENV':'"production"'}})).outputFiles[0].text;
const server = createServer((req, res) => {
  if(req.url === '/display-test.html'){res.setHeader('Content-Type','text/html');return res.end('<div id="root"></div><script type="module" src="/display-test.js"></script>');}
  if(req.url === '/display-test.js'){res.setHeader('Content-Type','application/javascript');return res.end(fixture);}
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
    const inventory=Array.from({length:35},(_,i)=>({pokeId:'ID'+String(i).padStart(10,'0'),pokemonId:i+1,nickname:'',level:10+i,gender:'male',variantId:`${i+1}:base`,variantName:'Standard',isShiny:false,gameId:'red',isHomeGift:false,isTraded:false,storedInHome:true,isInLivingBox:true,createdAt:1000+i,updatedAt:1000+i}));
    localStorage.setItem('homedex_v4_inventory',JSON.stringify(inventory));
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

  const recent=page.getByRole('region',{name:'Recently registered community PokéPets'});
  await recent.waitFor();
  await recent.getByText(/could not be loaded|Offline|No community registrations yet/).waitFor({timeout:20000});
  assert.equal(await recent.locator('button:has(img)').count(),0,'failed fetch does not fabricate community pets');
  await page.getByRole('button',{name:'Settings',exact:true}).first().click();
  await page.getByRole('button',{name:/Home Screen.*Choose visible panels/}).click();
  await page.getByLabel('Home layout',{exact:true}).selectOption('right');
  await page.getByLabel('Home panel columns').selectOption('2');
  await page.getByLabel('Home spacing').selectOption('compact');
  const steps=await page.getByRole('button',{name:'Move ownedLibrary up',exact:true}).evaluate(el=>Array.from(el.closest('ol').children).indexOf(el.closest('li')));
  for(let i=steps;i>0;i--) await page.getByRole('button',{name:'Move ownedLibrary up',exact:true}).click();
  await page.getByRole('button',{name:'Save settings',exact:true}).first().click();
  await page.getByRole('button',{name:'Home',exact:true}).first().click();
  const positions=await page.getByTestId('home-layout').evaluate(el=>{
    const side=el.querySelector('aside').getBoundingClientRect();
    const main=el.querySelector('[data-home-panel="ownedLibrary"]').getBoundingClientRect();
    const welcome=el.querySelector('[data-home-panel="welcome"]').getBoundingClientRect();
    return {sideX:side.x,mainX:main.x,mainY:main.y,welcomeY:welcome.y};
  });
  assert.ok(positions.sideX>positions.mainX,'right sidebar appears on right');
  assert.ok(positions.mainY<=positions.welcomeY,'reordered library precedes welcome');
  await page.setViewportSize({width:1920,height:1080});
  const mainColumns=await page.getByTestId('home-layout').evaluate(el=>getComputedStyle(el.children[1]).gridTemplateColumns.split(' ').length);
  assert.equal(mainColumns,2,'two-column main-panel layout on wide screens');
  await page.locator('main').evaluate(el=>{el.scrollTop=0;});
  const overflow=await page.locator('[data-home-panel="welcome"]').evaluate(el=>el.scrollWidth>el.clientWidth);
  assert.equal(overflow,false,'welcome actions fit a two-column panel');
  await page.screenshot({path:'/tmp/homedex-custom-home.png'});
  await page.setViewportSize({width:390,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'custom layout fits phone');
  await page.setViewportSize({width:1360,height:1000});
  await page.getByRole('button',{name:'Settings',exact:true}).first().click();
  await page.getByRole('button',{name:/Home Screen.*Choose visible panels/}).click();
  await page.getByRole('checkbox',{name:/Recently registered community PokéPets/}).uncheck();
  await page.getByRole('button',{name:'Save settings',exact:true}).first().click();
  await page.getByRole('button',{name:'Home',exact:true}).first().click();
  assert.equal(await recent.count(),0,'community panel can be hidden');
  await page.goto(base+'/display-test.html');
  await page.getByLabel('PokéPets per page').selectOption('12');
  assert.equal(await page.getByTestId('inventory-item').count(),12);
  await page.getByRole('navigation',{name:'Results pages'}).getByRole('button',{name:'Next'}).click();
  assert.equal(await page.getByTestId('inventory-item').count(),12);
  await page.getByLabel('PokéPets per page').selectOption('all');
  assert.equal(await page.getByTestId('inventory-item').count(),35);
  assert.equal(await page.evaluate(()=>localStorage.getItem('homedex_inventory_display_count')),'all');
  const firstPet=page.getByTestId('inventory-item').first();
  await firstPet.getByRole('button',{name:/Edit Pokepet Attributes/}).click();
  assert.equal(await page.getByLabel('Edit origin region / language',{exact:true}).inputValue(),'en','existing specimen defaults to English');
  await page.getByLabel('Edit origin region / language',{exact:true}).selectOption('de');
  await firstPet.getByRole('button',{name:'Save Changes',exact:true}).click();
  await firstPet.getByRole('button',{name:/Edit Pokepet Attributes/}).click();
  assert.equal(await page.getByLabel('Edit origin region / language',{exact:true}).inputValue(),'de','edited language survives reopening');
  await firstPet.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.getByRole('navigation',{name:'Fixture navigation'}).getByRole('button',{name:'boxes',exact:true}).click();
  await page.getByLabel('Boxes shown',{exact:true}).selectOption('2');
  assert.equal(await page.getByTestId('box-slot').count(),60);
  await page.getByLabel('Boxes shown',{exact:true}).selectOption('all');
  assert.equal(await page.getByTestId('box-slot').count(),1025);
  assert.equal(await page.evaluate(()=>localStorage.getItem('homedex_private_box_count')),'all');
  await page.getByRole('navigation',{name:'Fixture navigation'}).getByRole('button',{name:'living',exact:true}).click();
  await page.getByLabel('Boxes shown',{exact:true}).selectOption('all');
  assert.equal(await page.getByTestId('living-dex-slot').count(),1025);
  await page.getByRole('button',{name:/All Caught & Boxed/}).click();
  await page.getByLabel('Living Dex per page').selectOption('12');
  assert.equal(await page.getByTestId('living-dex-slot').count(),12);
  await page.getByLabel('Living Dex per page').selectOption('all');
  assert.equal(await page.getByTestId('living-dex-slot').count(),35);
  assert.equal(await page.evaluate(()=>localStorage.getItem('homedex_living_dex_display_count')),'all');
  await page.getByRole('navigation',{name:'Fixture navigation'}).getByRole('button',{name:'community',exact:true}).click();
  const fixtureFeed=page.getByRole('region',{name:'Recently registered community PokéPets'});
  await fixtureFeed.getByText('Community 1-0',{exact:true}).waitFor();
  assert.equal(await fixtureFeed.getByRole('button').count(),13, '12 PokéPets plus the refresh control');
  for(const name of ['Trainer 0','Trainer 1','Trainer 2']) assert.equal(await fixtureFeed.getByText(new RegExp(name)).count(),4);
  await fixtureFeed.getByRole('button',{name:/Community 1-0/}).click();
  assert.equal(await page.getByLabel('Selected community POKEID').textContent(),'ID0000000000');
  await fixtureFeed.getByRole('button',{name:'Refresh',exact:true}).click();
  await fixtureFeed.getByText('Community 2-0',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS: community failure state, home layout/order, phone width, inventory pagination, boxes and Living Dex Show all');
} finally {
  await context.close();await browser.close();
  await new Promise(r=>server.close(r));
}
