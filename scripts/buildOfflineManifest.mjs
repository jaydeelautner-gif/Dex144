import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/',import.meta.url));
const version = JSON.parse(readFileSync(join(root,'offline-build.json'),'utf8')).version;
const files = [];
function walk(dir) {
  for (const e of readdirSync(dir,{withFileTypes:true})) {
    const path = join(dir,e.name);
    if (e.isDirectory()) walk(path);
    else if (!e.name.endsWith('.map') && e.name !== 'offline-manifest.json' && !e.name.startsWith('.')) {
      const bytes = readFileSync(path);
      files.push({url:'/'+relative(root,path).split('\\').join('/'),sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
    }
  }
}
walk(root); files.sort((a,b)=>a.url.localeCompare(b.url));
if (!files.some(f=>f.url==='/index.html') || !files.some(f=>f.url==='/data/encounters.json') || !files.some(f=>f.url==='/offline-media.json') || !files.some(f=>f.url==='/sw.js')) throw Error('Incomplete offline build output.');
writeFileSync(join(root,'offline-manifest.json'),JSON.stringify({schema:2,version,files}));
console.log(`Offline manifest ${version}: ${files.length} required site files, ${files.reduce((n,f)=>n+f.bytes,0)} bytes (before artwork).`);
