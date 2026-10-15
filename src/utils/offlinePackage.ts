import type { PokemonEntry } from '../data/pokemonData';
export const SPRITE_CACHE_NAME = 'homedex-sprites-v1'; // read-only legacy cache migration
export const OFFLINE_DATA_KEY = 'homedex_offline_full_dataset_v1';
export const OFFLINE_PACKAGE_METADATA_KEY = 'homedex_offline_package_meta';
export const PACKAGE_PREFIX = 'homedex-package-';
export const ACTIVE_CACHE = 'homedex-offline-control-v2';
export const PACKAGE_EVENT = 'homedex-offline-package-changed';
export interface OfflineFile { url: string; sha256: string; bytes: number }
export interface OfflineManifest { schema: 2; version: string; files: OfflineFile[] }
export interface MediaGroup { id: string; speciesId: number; candidates: string[] }
export interface OfflinePackageMeta {
  isDownloaded: boolean; downloadedAt: number | null; cachedSpeciesCount: number;
  totalSpeciesCount: number; totalBytes: number; version?: string;
  cachedAssetCount?: number; totalAssetCount?: number; missingCount?: number; hasPartialDownload?: boolean;
}
export interface DownloadProgress {
  current: number; total: number; percentage: number; bytes: number;
  status: 'idle' | 'downloading' | 'completed' | 'error' | 'aborted'; errorMessage?: string;
  phase?: 'site-data' | 'artwork'; failedCount?: number;
}
const origin = () => location.origin;
const url = (path: string) => new URL(path,origin()).href;
const pointer = () => url('/__offline-active');
const emptyMeta = (): OfflinePackageMeta => ({ isDownloaded:false, downloadedAt:null, cachedSpeciesCount:0,totalSpeciesCount:1025,totalBytes:0 });
export function validateOfflineManifest(raw: unknown): OfflineManifest {
  const m = raw as OfflineManifest;
  if (m?.schema !== 2 || !/^[a-f0-9]{24}$/.test(m.version) || !Array.isArray(m.files) || !m.files.length) throw Error('Invalid offline manifest. Use a production build of the app.');
  const seen = new Set<string>();
  for (const f of m.files) {
    if (!/^\/(?!\/)/.test(f.url) || f.url.includes('..') || f.url.includes('?') || seen.has(f.url) || !/^[a-f0-9]{64}$/.test(f.sha256) || !Number.isSafeInteger(f.bytes) || f.bytes < 0) throw Error('Invalid offline file entry.');
    seen.add(f.url);
  }
  for (const required of ['/index.html','/sw.js','/offline-media.json','/data/encounters.json']) if (!seen.has(required)) throw Error(`Missing required offline file: ${required}`);
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
    const media = await cache.match(url('/offline-media.json'));
    if (!mr || !media) return {...a.meta,isDownloaded:false};
    const m = validateOfflineManifest(await mr.json());
    const groups: MediaGroup[] = (await media.json()).groups;
    const keys = new Set((await cache.keys()).map(r=>r.url));
    const coreMissing = m.files.filter(f=>!keys.has(url(f.url))).length;
    const missing = groups.filter(g=>!keys.has(g.id));
    const incompleteSpecies = new Set(missing.map(g=>g.speciesId));
    return {...a.meta, isDownloaded:coreMissing===0 && missing.length===0,
      cachedSpeciesCount:new Set(groups.map(g=>g.speciesId).filter(id=>!incompleteSpecies.has(id))).size,
      cachedAssetCount:m.files.length+groups.length-coreMissing-missing.length,
      totalAssetCount:m.files.length+groups.length,missingCount:coreMissing+missing.length};
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
async function fetchWithDeadline(input: RequestInfo | URL, init: RequestInit, parent?: AbortSignal, ms=20000): Promise<Response> {
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
async function imageValid(r?: Response): Promise<boolean> {
  return !!r?.ok && !!r.headers.get('content-type')?.startsWith('image/') && (await r.clone().blob()).size>0;
}
let downloadRunning=false;
export async function downloadFullOfflinePackage(dex:PokemonEntry[], onProgress?:(p:DownloadProgress)=>void, signal?:AbortSignal) {
  if(downloadRunning) throw Error('An offline download is already running. Wait for it to finish or cancel it.');
  downloadRunning=true;
  try { return await performDownload(dex,onProgress,signal); } finally { downloadRunning=false; window.dispatchEvent(new Event(PACKAGE_EVENT)); }
}
async function performDownload(
  dex: PokemonEntry[], onProgress?: (p:DownloadProgress)=>void, signal?: AbortSignal
): Promise<{success:boolean;cachedCount:number;bytes:number;failedCount:number}> {
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
  const legacy=await caches.open(SPRITE_CACHE_NAME);
  let current=0, total=manifest.files.length, bytes=0, failures=0;
  let phase: DownloadProgress['phase']='site-data';
  const progress=(status:DownloadProgress['status'],errorMessage?:string)=>onProgress?.({current,total,percentage:Math.floor(current/Math.max(total,1)*100),bytes,status,phase,failedCount:failures,errorMessage});
  const checkAbort=()=>{ if(signal?.aborted) throw new DOMException('Download cancelled','AbortError'); };
  progress('downloading');
  try {
    // Required local files are hash-verified. A changed deployment cannot be
    // mixed into a package built for another release, even during a rolling deploy.
    for (const file of manifest.files) {
      checkAbort(); let r=await stage.match(url(file.url));
      if (!r || !(await verifyFile(r,file))) {
        // PATCH, DON'T RE-DOWNLOAD: a byte-identical copy already on this
        // device (previous package or legacy cache) is promoted into the new
        // package, so a version bump only fetches the files that changed.
        const local=(old?await old.match(url(file.url)):undefined) ?? await legacy.match(url(file.url));
        if (local && (await verifyFile(local,file))) {
          await stage.put(url(file.url),local.clone());
        } else {
          const fetchUrl=new URL(file.url,origin()); fetchUrl.searchParams.set('offline-download',manifest.version);
          r=await fetchWithDeadline(fetchUrl,{cache:'no-store'},signal,90000);
          if (!(await verifyFile(r,file))) throw Error(`Offline file verification failed: ${file.url}. The deployment may have changed; retry.`);
          await stage.put(url(file.url),r.clone());
        }
      }
      bytes+=file.bytes; current++; progress('downloading');
    }
    const buildInfo=await (await stage.match(url('/offline-build.json')))!.json();
    if(buildInfo.version!==manifest.version) throw Error('Build version does not match the package manifest. Retry after deployment finishes.');
    const groups: MediaGroup[]=(await (await stage.match(url('/offline-media.json')))!.json()).groups;
    if (!Array.isArray(groups) || !groups.length) throw Error('Offline artwork catalog is empty.');
    total+=groups.length; phase='artwork'; progress('downloading');
    let cursor=0; const completeSpecies=new Set<number>(); const failedSpecies=new Set<number>();
    let workerError: unknown;
    const workers=Array.from({length:4},async()=>{
      try {
      while(cursor<groups.length) {
        checkAbort(); if(workerError) return; const group=groups[cursor++]; let saved=false;
        let r=await stage.match(group.id);
        if (!(await imageValid(r))) r=await old?.match(group.id) ?? await legacy.match(group.id);
        if (await imageValid(r)) { await stage.put(group.id,r!.clone()); saved=true; }
        else for(const candidate of group.candidates) {
          checkAbort();
          try {
            // Bounded requests keep Cancel responsive even for failed remote hosts.
            r=await fetchWithDeadline(candidate,{mode:'cors',credentials:'omit',cache:'reload'},signal,15000);
            if (await imageValid(r)) { await stage.put(group.id,r.clone()); saved=true; break; }
          } catch(e) { if(signal?.aborted) throw e; if(e instanceof DOMException && e.name==='QuotaExceededError') throw e; }
        }
        if(saved) { current++; bytes+=(await r!.clone().blob()).size; completeSpecies.add(group.speciesId); }
        else { failures++; failedSpecies.add(group.speciesId); }
        progress('downloading');
      }
      } catch(e) { workerError=e; }
    });
    await Promise.all(workers);
    if(workerError) throw workerError;
    checkAbort();
    const meta:OfflinePackageMeta={isDownloaded:failures===0,downloadedAt:Date.now(),version:manifest.version,
      cachedSpeciesCount:[...completeSpecies].filter(id=>!failedSpecies.has(id)).length,totalSpeciesCount:dex.length,
      totalBytes:bytes,cachedAssetCount:current,totalAssetCount:total,missingCount:failures};
    await stage.put(url('/offline-manifest.json'),new Response(JSON.stringify(manifest),{headers:{'content-type':'application/json'}}));
    // Keep a complete previous package active if any new artwork failed. On
    // a first install, publish the core/data even if some images need retry.
    if(!failures || !previous) {
      await (await caches.open(ACTIVE_CACHE)).put(pointer(),new Response(JSON.stringify({cacheName,meta}),{headers:{'content-type':'application/json'}}));
      invalidateInstalledCache();
      saveOfflinePackageMetadata(meta);
    }
    if(!failures) {
      // Keep one previous release as rollback; never clear user data/queues.
      for(const name of await caches.keys()) if(name.startsWith(PACKAGE_PREFIX) && name!==cacheName && name!==previous?.cacheName) await caches.delete(name);
    }
    progress(failures?'error':'completed',failures?`${failures} artwork files could not be saved. Retry to resume; no failures were counted as successes.`:undefined);
    return {success:failures===0,cachedCount:meta.cachedSpeciesCount,bytes,failedCount:failures};
  } catch(e) {
    progress(signal?.aborted?'aborted':'error',e instanceof Error?e.message:String(e));
    if(signal?.aborted) return {success:false,cachedCount:0,bytes,failedCount:failures};
    throw e;
  }
}
export async function clearOfflinePackage(): Promise<void> {
  invalidateInstalledCache();
  objectUrlCache.clear();
  if(typeof caches!=='undefined') for(const name of await caches.keys()) if(name.startsWith(PACKAGE_PREFIX) || name===SPRITE_CACHE_NAME || name===ACTIVE_CACHE || name==='homedex-viewed-images-v2' || name==='dex-data-v1' || name.startsWith('homedex-site-')) await caches.delete(name);
  localStorage.removeItem(OFFLINE_DATA_KEY); localStorage.removeItem(OFFLINE_PACKAGE_METADATA_KEY);
  window.dispatchEvent(new Event(PACKAGE_EVENT));
}
/** Resolves an installed package's cache once, invalidated when it changes. */
let installedCacheName: string | null | undefined;
async function installedCache(): Promise<Cache | null> {
  if (typeof caches === 'undefined') return null;
  if (installedCacheName === undefined) {
    const a = await active();
    installedCacheName = a?.cacheName ?? null;
  }
  if (!installedCacheName) return null;
  if (!(await caches.has(installedCacheName))) { installedCacheName = null; return null; }
  return caches.open(installedCacheName);
}
/** Called when a package is installed/cleared so the next lookup re-resolves. */
export function invalidateInstalledCache(): void { installedCacheName = undefined; }

/** Object URLs already created this session, keyed by the cached source. */
const objectUrlCache = new Map<string, string | null>();

/**
 * Device-first sprite lookup: once the offline package is installed, artwork is
 * served from the downloaded cache (blob URL) instead of the network. Returns
 * null when nothing is cached, so the caller can fall back to a remote URL.
 */
export async function getCachedSpriteObjectUrl(source: string): Promise<string | null> {
  if (!source) return null;
  if (objectUrlCache.has(source)) return objectUrlCache.get(source) ?? null;
  try {
    const cache = await installedCache();
    let response = cache ? await cache.match(source) : undefined;
    if (!response) {
      // Pre-download caches from older installs.
      response = await (await caches.open(SPRITE_CACHE_NAME)).match(source);
    }
    const blobUrl = (await imageValid(response)) ? URL.createObjectURL(await response!.blob()) : null;
    objectUrlCache.set(source, blobUrl);
    return blobUrl;
  } catch {
    return null;
  }
}

/** True when artwork is served from the downloaded package (device-first). */
export async function isArtworkAvailableOnDevice(): Promise<boolean> {
  return (await installedCache()) !== null;
}
