import type { PokemonEntry } from '../data/pokemonData';
export const SPRITE_CACHE_NAME = 'homedex-sprites-v1'; // read-only legacy cache, cleared on package reset
export const OFFLINE_DATA_KEY = 'homedex_offline_full_dataset_v1';
export const OFFLINE_PACKAGE_METADATA_KEY = 'homedex_offline_package_meta';
export const PACKAGE_PREFIX = 'homedex-package-';
export const ACTIVE_CACHE = 'homedex-offline-control-v2';
export const PACKAGE_EVENT = 'homedex-offline-package-changed';
export interface OfflineFile { url: string; sha256: string; bytes: number }
export interface OfflineManifest { schema: 2; version: string; files: OfflineFile[] }
export interface OfflinePackageMeta {
  isDownloaded: boolean; downloadedAt: number | null; totalBytes: number; version?: string;
  siteFileCount?: number; totalSiteFileCount?: number; missingCount?: number; hasPartialDownload?: boolean;
}
export interface DownloadProgress {
  current: number; total: number; percentage: number; bytes: number;
  status: 'idle' | 'downloading' | 'completed' | 'error' | 'aborted'; errorMessage?: string;
  failedCount?: number;
}
const origin = () => location.origin;
const url = (path: string) => new URL(path,origin()).href;
const pointer = () => url('/__offline-active');
const emptyMeta = (): OfflinePackageMeta => ({ isDownloaded:false, downloadedAt:null, totalBytes:0 });
export function validateOfflineManifest(raw: unknown): OfflineManifest {
  const m = raw as OfflineManifest;
  if (m?.schema !== 2 || !/^[a-f0-9]{24}$/.test(m.version) || !Array.isArray(m.files) || !m.files.length) throw Error('Invalid offline manifest. Use a production build of the app.');
  const seen = new Set<string>();
  for (const f of m.files) {
    if (!/^\/(?!\/)/.test(f.url) || f.url.includes('..') || f.url.includes('?') || seen.has(f.url) || !/^[a-f0-9]{64}$/.test(f.sha256) || !Number.isSafeInteger(f.bytes) || f.bytes < 0) throw Error('Invalid offline file entry.');
    seen.add(f.url);
  }
  for (const required of ['/index.html','/sw.js','/data/encounters.json']) if (!seen.has(required)) throw Error(`Missing required offline file: ${required}`);
  return m;
}
export async function fetchOfflineManifest(signal?: AbortSignal): Promise<OfflineManifest> {
  const r = await fetch(`/offline-manifest.json?check=${Date.now()}`,{cache:'no-store',signal});
  if (!r.ok || !r.headers.get('content-type')?.includes('json')) throw Error('Offline manifest unavailable. Build and deploy the updated app first.');
  return validateOfflineManifest(await r.json());
}
async function active() {
  if (typeof caches === 'undefined') return null;
  const r = await (await caches.open(ACTIVE_CACHE)).match(pointer());
  return r ? await r.json() as {cacheName:string;meta:OfflinePackageMeta} : null;
}
export async function getOfflinePackageMetadata(): Promise<OfflinePackageMeta> {
  try {
    const a = await active();
    if (!a || !(await caches.has(a.cacheName))) {
      const legacy = JSON.parse(localStorage.getItem(OFFLINE_PACKAGE_METADATA_KEY) ?? 'null');
      const hasPartialDownload=typeof caches!=='undefined' && (await caches.keys()).some(name=>name.startsWith(PACKAGE_PREFIX));
      return {...emptyMeta(),downloadedAt:legacy?.downloadedAt ?? null,hasPartialDownload};
    }
    const cache = await caches.open(a.cacheName);
    const mr = await cache.match(url('/offline-manifest.json'));
    if (!mr) return {...a.meta,isDownloaded:false};
    const m = validateOfflineManifest(await mr.json());
    const keys = new Set((await cache.keys()).map(r=>r.url));
    const missing = m.files.filter(f=>!keys.has(url(f.url))).length;
    return {...a.meta, isDownloaded: missing===0,
      siteFileCount:m.files.length-missing, totalSiteFileCount:m.files.length, missingCount:missing};
  } catch { return emptyMeta(); }
}
export function saveOfflinePackageMetadata(meta: OfflinePackageMeta): void {
  try { localStorage.setItem(OFFLINE_PACKAGE_METADATA_KEY,JSON.stringify(meta)); } catch { /* CacheStorage's active marker is authoritative. */ }
  window.dispatchEvent(new Event(PACKAGE_EVENT));
}
async function sha256(bytes: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
async function verifyFile(response: Response, file: OfflineFile): Promise<boolean> {
  if (!response.ok) return false;
  const bytes = await response.clone().arrayBuffer();
  return bytes.byteLength===file.bytes && await sha256(bytes)===file.sha256;
}
async function fetchWithDeadline(input: RequestInfo | URL, init: RequestInit, parent?: AbortSignal, ms=90000): Promise<Response> {
  const controller=new AbortController();
  const cancel=()=>controller.abort();
  if(parent?.aborted) controller.abort();
  parent?.addEventListener('abort',cancel,{once:true});
  const timer=setTimeout(cancel,ms);
  try {
    const response=await fetch(input,{...init,signal:controller.signal});
    const body=await response.arrayBuffer(); // timeout/cancel also covers the body download
    return new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers});
  }
  finally { clearTimeout(timer); parent?.removeEventListener('abort',cancel); }
}
let downloadRunning=false;
export async function downloadFullOfflinePackage(_dex:PokemonEntry[], onProgress?:(p:DownloadProgress)=>void, signal?:AbortSignal) {
  if(downloadRunning) throw Error('An offline download is already running. Wait for it to finish or cancel it.');
  downloadRunning=true;
  try { return await performDownload(onProgress,signal); } finally { downloadRunning=false; window.dispatchEvent(new Event(PACKAGE_EVENT)); }
}
/**
 * Downloads the whole deployed site so it reopens offline. Sprites and artwork
 * are part of the site data itself, so there is no separate image phase.
 */
async function performDownload(
  onProgress?: (p:DownloadProgress)=>void, signal?:AbortSignal
): Promise<{success:boolean;fileCount:number;bytes:number;failedCount:number}> {
  if (typeof caches==='undefined') throw Error('Offline downloads require CacheStorage (HTTPS or localhost).');
  if (!('serviceWorker' in navigator)) throw Error('A service worker is required for offline reopening. Use HTTPS/localhost in a supported browser.');
  let readyTimer: ReturnType<typeof setTimeout> | undefined;
  let abortReady=()=>{};
  try { await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>{
    abortReady=()=>reject(new DOMException('Download cancelled','AbortError'));
    if(signal?.aborted) abortReady();
    signal?.addEventListener('abort',abortReady,{once:true});
    readyTimer=setTimeout(()=>reject(Error('Offline app installation is not ready. Reload online and retry.')),20000);
  })]); } finally { clearTimeout(readyTimer); signal?.removeEventListener('abort',abortReady); }
  const manifest=await fetchOfflineManifest(signal);
  if (navigator.storage?.estimate) {
    const storage=await navigator.storage.estimate();
    if (storage.quota && storage.quota-(storage.usage ?? 0)<manifest.files.reduce((n,f)=>n+f.bytes,0)) throw Error('Not enough device storage for all site data. Free space and retry.');
  }
  const cacheName=PACKAGE_PREFIX+manifest.version;
  const stage=await caches.open(cacheName);
  const previous=await active();
  const old=previous ? await caches.open(previous.cacheName) : null;
  let current=0, total=manifest.files.length, bytes=0, failures=0;
  const progress=(status:DownloadProgress['status'],errorMessage?:string)=>onProgress?.({current,total,percentage:Math.floor(current/Math.max(total,1)*100),bytes,status,failedCount:failures,errorMessage});
  const checkAbort=()=>{ if(signal?.aborted) throw new DOMException('Download cancelled','AbortError'); };
  progress('downloading');
  try {
    // Required local files are hash-verified. A changed deployment cannot be
    // mixed into a package built for another release, even during a rolling deploy.
    for (const file of manifest.files) {
      checkAbort(); let r=await stage.match(url(file.url));
      if (!r || !(await verifyFile(r,file))) {
        // PATCH, DON'T RE-DOWNLOAD: a byte-identical copy already on this
        // device (previous package) is promoted into the new package, so a
        // version bump only fetches the files that changed.
        const local=old?await old.match(url(file.url)):undefined;
        if (local && (await verifyFile(local,file))) {
          await stage.put(url(file.url),local.clone());
        } else {
          const fetchUrl=new URL(file.url,origin()); fetchUrl.searchParams.set('offline-download',manifest.version);
          r=await fetchWithDeadline(fetchUrl,{cache:'no-store'},signal);
          if (!(await verifyFile(r,file))) { failures++; current++; progress('downloading'); continue; }
          await stage.put(url(file.url),r.clone());
        }
      }
      bytes+=file.bytes; current++; progress('downloading');
    }
    checkAbort();
    const buildInfo=await (await stage.match(url('/offline-build.json')))!.json();
    if(buildInfo.version!==manifest.version) throw Error('Build version does not match the package manifest. Retry after deployment finishes.');
    const meta:OfflinePackageMeta={isDownloaded:failures===0,downloadedAt:Date.now(),version:manifest.version,
      totalBytes:bytes,siteFileCount:current-failures,totalSiteFileCount:manifest.files.length,missingCount:failures};
    await stage.put(url('/offline-manifest.json'),new Response(JSON.stringify(manifest),{headers:{'content-type':'application/json'}}));
    // Keep a complete previous package active if anything failed. On a first
    // install, publish what did verify so the user can retry the rest.
    if(!failures || !previous) {
      await (await caches.open(ACTIVE_CACHE)).put(pointer(),new Response(JSON.stringify({cacheName,meta}),{headers:{'content-type':'application/json'}}));
      saveOfflinePackageMetadata(meta);
    }
    if(!failures) {
      // Keep one previous release as rollback; never clear user data/queues.
      for(const name of await caches.keys()) if(name.startsWith(PACKAGE_PREFIX) && name!==cacheName && name!==previous?.cacheName) await caches.delete(name);
    }
    progress(failures?'error':'completed',failures?`${failures} site files could not be saved. Retry to resume; no failures were counted as successes.`:undefined);
    return {success:failures===0,fileCount:current-failures,bytes,failedCount:failures};
  } catch(e) {
    progress(signal?.aborted?'aborted':'error',e instanceof Error?e.message:String(e));
    if(signal?.aborted) return {success:false,fileCount:0,bytes,failedCount:failures};
    throw e;
  }
}
export async function clearOfflinePackage(): Promise<void> {
  if(typeof caches!=='undefined') for(const name of await caches.keys()) if(name.startsWith(PACKAGE_PREFIX) || name===SPRITE_CACHE_NAME || name===ACTIVE_CACHE || name==='homedex-viewed-images-v2' || name==='dex-data-v1' || name.startsWith('homedex-site-')) await caches.delete(name);
  localStorage.removeItem(OFFLINE_DATA_KEY); localStorage.removeItem(OFFLINE_PACKAGE_METADATA_KEY);
  window.dispatchEvent(new Event(PACKAGE_EVENT));
}
