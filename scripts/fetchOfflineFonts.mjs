import { mkdirSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const dir = new URL('../public/fonts/',import.meta.url); mkdirSync(dir,{recursive:true});
const url='https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
async function get(url) { const r = await fetch(url); if(!r.ok) throw Error(`${url}: ${r.status}`); return r; }
let css = await (await get(url)).text();
const urls = [...new Set([...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map(m=>m[1]))];
for(const url of urls) { const name=createHash('sha256').update(url).digest('hex').slice(0,16)+new URL(url).pathname.match(/\.[a-z0-9]+$/)[0]; writeFileSync(new URL(name,dir),Buffer.from(await (await get(url)).arrayBuffer())); css=css.split(url).join('./'+name); }
writeFileSync(new URL('site-fonts.css',dir),css);
for (const font of ['bricolagegrotesque','jetbrainsmono','plusjakartasans']) writeFileSync(new URL(`${font}-OFL.txt`,dir),await (await get(`https://raw.githubusercontent.com/google/fonts/main/ofl/${font}/OFL.txt`)).text());
console.log(`Self-hosted ${urls.length} font files and their OFL licenses.`);
