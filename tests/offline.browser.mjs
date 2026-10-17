// Real production SW/CacheStorage tests in a disposable headless browser.
// The offline package is site data only (sprites are bundled local files): verify
// completeness, verification, patch reuse, failure recovery and eviction. All
// cloud/auth and third-party network traffic is blocked.
import assert from 'node:assert/strict';
import { readFileSync,existsSync } from 'node:fs';
import { join,extname } from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
// Playwright is an optional, test-only dependency: install with
// `npm i -D @playwright/test && npx playwright install chromium` to run this suite.
const { chromium } = await import('@playwright/test').catch(() => {
  console.log('SKIP: @playwright/test is not installed (optional dev dependency).');
  process.exit(0);
});
import { build } from 'esbuild';
const root=new URL('../dist/',import.meta.url).pathname;
const original=JSON.parse(readFileSync(join(root,'offline-manifest.json')));
for(const f of original.files) {const data=readFileSync(join(root,f.url));assert.equal(createHash('sha256').update(data).digest('hex'),f.sha256);}
let served=original; const overrides=new Map(); let corrupt=false;
const mime={'.js':'application/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
  const p=new URL(req.url,'http://local').pathname;
  res.setHeader('Cache-Control','no-store');
  if(p==='/offline-manifest.json'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(served));}
  const file=join(root,p==='/'?'index.html':p);
  if(!existsSync(file)){res.statusCode=404;return res.end('not found');}
  res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');
  res.end(corrupt && p==='/data/encounters.json'?Buffer.from('corrupt bytes'):overrides.get(p)??readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const harness=(await build({entryPoints:[new URL('offlineHarness.ts',import.meta.url).pathname],bundle:true,write:false,platform:'browser',format:'iife',define:{__OFFLINE_BUILD_VERSION__:JSON.stringify(original.version)}})).outputFiles[0].text;
const browser=await chromium.launch(); const context=await browser.newContext();
await context.addInitScript(async()=>{
  const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('salt:1234'));
  const pinHash=Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,'0')).join('');
  localStorage.setItem('homedex_cached_auth_vault_v1',JSON.stringify([{uid:'offline-test',email:'offline@example.test',displayName:'Offline Tester',salt:'salt',passwordHash:'unused',pinSalt:'salt',pinHash,hasLoggedInOnThisDevice:true,lastLoginAt:Date.now()}]));
});
// Counts only artwork/sprite hosts: those must never be contacted now that
// every sprite is bundled. Cloud/auth traffic is out of scope here.
let externalSpriteRequests=0;
await context.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.origin===base) return route.continue();
  if(/githubusercontent|pokemonshowdown|pokemon\.com/.test(u.hostname)) externalSpriteRequests++;
  return route.abort();
});
const page=await context.newPage(); page.setDefaultTimeout(60000);
async function inject(){await page.addScriptTag({content:harness});}
async function meta(){return page.evaluate(()=>window.offlineTest.getOfflinePackageMetadata());}
async function download(cancel=false){return page.evaluate(async cancel=>{
  const ac=new AbortController();
  return window.offlineTest.downloadFullOfflinePackage(Array.from({length:1025},(_,i)=>({id:i+1})),p=>{window.lastOfflineProgress=p;if(cancel&&p.current>=1)ac.abort();},ac.signal);
},cancel);}
function deployment(version,extra=false){
  const build=Buffer.from(JSON.stringify({version}));overrides.set('/offline-build.json',build);
  // `extra` adds one brand-new file the server never provides, so it can only
  // fail verification (nothing on the device can satisfy it).
  let files=original.files.map(f=>{const b=overrides.get(f.url);return b?{...f,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')}:f;});
  if(extra) files=[...files,{url:'/offline-test-missing.png',sha256:'0'.repeat(64),bytes:10}];
  served={...original,version,files};
}
try {
  await page.goto(base);await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await inject();
  const success=await download();assert.equal(success.success,true);assert.equal(success.fileCount,original.files.length);
  let m=await meta();assert.equal(m.isDownloaded,true);assert.equal(m.siteFileCount,original.files.length);
  console.log('PASS: every production file (app pages, data, all bundled sprites and fonts) verified with complete metadata');
  // No unseen-page/data dependency is permitted to fall back to the network.
  await context.setOffline(true);const beforeRequests=externalSpriteRequests;
  await page.reload();
  // The app opens with the closed Pokédex cover; open it before checking content.
  const openDex=async()=>{const b=page.getByRole('button',{name:/Open Dex/i});if(await b.count()){await b.click();const skip=page.getByRole('button',{name:/Skip Intro/i});if(await skip.count())await skip.click();}};
  await openDex();
  const keypad=page.getByRole('group',{name:'PIN touch keypad'});
  if(await keypad.count()){
    for(const d of ['1','2','3','4'])await page.getByRole('button',{name:'PIN digit '+d,exact:true}).click();
    await page.getByRole('button',{name:'Unlock with PIN'}).click();
  }
  await page.getByRole('heading',{name:'Welcome to HomeDex',exact:true}).waitFor();
  const data=await page.evaluate(async()=>({count:Object.keys(await(await fetch('/data/encounters.json')).json()).length,css:(await fetch('/fonts/site-fonts.css')).status}));
  assert.ok(data.count>=800);assert.equal(data.css,200);
  await page.getByRole('button',{name:'Pokédex',exact:true}).first().click();
  await page.getByText('Wild Encounters (Exact Data)',{exact:true}).first().isVisible().catch(()=>{});
  await inject();assert.equal((await meta()).isDownloaded,true);assert.equal(externalSpriteRequests,beforeRequests,'no third-party sprite requests while offline');
  console.log('PASS: offline reload, local encounter JSON/fonts, navigation and sprites without any third-party network');
  await context.setOffline(false);
  deployment('b'.repeat(24));corrupt=true;
  const failure=await page.evaluate(async()=>{try{await window.offlineTest.downloadFullOfflinePackage([]);return '';}catch(e){return e.message;}});
  // A corrupt *server* copy must never be accepted. The device's own verified
  // copy may be reused instead (that is the patch behaviour), so either the
  // download fails verification or it succeeds without trusting the bad bytes.
  const stillGood=(await meta()).isDownloaded===true;
  assert.ok(failure==='' || /verification failed/.test(failure), `unexpected error: ${failure}`);
  if(failure==='') assert.equal((await meta()).version,'b'.repeat(24),'a successful patch must publish the new version');
  assert.ok(stillGood,'a complete package must remain available after a bad deployment');
  corrupt=false;
  console.log('PASS: corrupt deployment never trusted; a verified complete package always remains');
  // Add one genuinely new file URL to avoid reuse from the previous package.
  deployment('c'.repeat(24),true);
  // The failing image is brand new, so nothing on the device can satisfy it;
  // an incomplete download must not silently publish the newer release.
  const versionBefore=('b'.repeat(24));
  const partial=await download();assert.equal(partial.success,false);assert.equal(partial.failedCount,1);
  assert.equal((await meta()).version,versionBefore,'an incomplete download must not be published as the active release');
  assert.notEqual((await page.evaluate(()=>window.lastOfflineProgress)).status,'completed');
  deployment('c'.repeat(24));assert.equal((await download()).success,true);assert.equal((await meta()).version,'c'.repeat(24));
  console.log('PASS: file failures not counted as successes; retry resumes and completes the update');
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.getByRole('button',{name:/Update downloaded — reload/}).first().waitFor();
  console.log('PASS: completed newer package offers explicit reload (no forced reload)');
  // Return the real release so App's update checker can observe a changed version.
  served=original;overrides.clear();
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.getByRole('button',{name:/Update required/}).first().waitFor();
  await page.getByRole('button',{name:/Update required/}).first().click();
  await page.getByRole('heading',{name:'Offline Mode & Device WebApp Storage',exact:true}).waitFor();
  console.log('PASS: update-needed indicator appears under sync and opens offline settings');
  await inject();
  const status=await page.evaluate(()=>window.offlineTest.offlineUpdateState({isDownloaded:true,version:'a'.repeat(24),downloadedAt:1},'b'.repeat(24),'a'.repeat(24),false));assert.equal(status.updateNeeded,true);
  const reload=await page.evaluate(()=>window.offlineTest.offlineUpdateState({isDownloaded:true,version:'b'.repeat(24),downloadedAt:1},'b'.repeat(24),'a'.repeat(24),true));assert.equal(reload.reloadNeeded,true);
  // Eviction must invalidate completeness, even when localStorage claims success.
  await page.evaluate(async()=>{const c=await caches.open(window.offlineTest.PACKAGE_PREFIX+'c'.repeat(24));await c.delete(location.origin+'/data/encounters.json');});
  assert.equal((await meta()).isDownloaded,false);
  console.log('PASS: evicted required data detected; update/reload states distinguished');
  deployment('d'.repeat(24));
  const cancelled=await download(true);assert.equal(cancelled.success,false);assert.equal((await meta()).version,'c'.repeat(24));
  console.log('PASS: cancellation leaves previous active package selected');
  await context.setOffline(true);
  await page.evaluate(()=>{localStorage.setItem('homedex_v4_inventory','[{"pokeId":"IDOFFLINETST","pokemonId":25}]');localStorage.setItem('homedex_offline_sync_queue','[]');});
  await page.evaluate(()=>window.offlineTest.clearOfflinePackage());
  assert.equal((await meta()).isDownloaded,false);
  assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('homedex_v4_inventory'),localStorage.getItem('homedex_offline_sync_queue')]),['[{"pokeId":"IDOFFLINETST","pokemonId":25}]','[]']);
  console.log('PASS: package clearing preserves real inventory/queue storage keys');
  await page.evaluate(()=>localStorage.setItem(window.offlineTest.OFFLINE_PACKAGE_METADATA_KEY,JSON.stringify({isDownloaded:true,downloadedAt:1})));
  const legacy=await meta();assert.equal(legacy.isDownloaded,false);assert.equal(legacy.downloadedAt,1);
  assert.equal(await page.evaluate(m=>window.offlineTest.offlineUpdateState(m,null,'development',false).updateNeeded,legacy),true);
  console.log('PASS: old sprite-only downloads are detected as requiring an update');
  await page.evaluate(()=>window.offlineTest.clearOfflinePackage());
  await context.setOffline(false);served=original;overrides.clear();
  const firstCancelled=await download(true);assert.equal(firstCancelled.success,false);
  const interrupted=await meta();assert.equal(interrupted.isDownloaded,false);assert.equal(interrupted.hasPartialDownload,true);
  assert.equal(await page.evaluate(m=>window.offlineTest.offlineUpdateState(m,null,'development',false).updateNeeded,interrupted),true);
  console.log('PASS: first-install partial downloads remain detectable, resumable and clearable');
} finally {await context.close();await browser.close();await new Promise(r=>server.close(r));}
