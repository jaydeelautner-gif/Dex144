/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly, NetworkFirst, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ACTIVE_CACHE } from './utils/offlinePackage';
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{url:string;revision:string|null}> };
declare const __OFFLINE_BUILD_VERSION__: string;
clientsClaim();
self.addEventListener('message',event=>{ if(event.data?.type==='SKIP_WAITING') self.skipWaiting(); });
// Version checks and verified download requests must NEVER receive old cached bytes.
registerRoute(({url})=>url.origin===self.location.origin && (url.pathname==='/offline-manifest.json' || url.searchParams.has('offline-download')),new NetworkOnly());
async function packaged(request:Request, navigation=false):Promise<Response|undefined> {
  const control=await caches.open(ACTIVE_CACHE);
  const r=await control.match(new URL('/__offline-active',self.location.origin).href);
  if(!r) return undefined;
  const {cacheName}=await r.json();
  if(typeof cacheName!=='string' || !cacheName.startsWith('homedex-package-')) return undefined;
  const cache=await caches.open(cacheName);
  const key=navigation?new URL('/index.html',self.location.origin).href:request.url;
  return cache.match(key,{ignoreSearch:true});
}
registerRoute(({request})=>request.mode==='navigate',async({request})=>{
  const pinned=await packaged(request,true); if(pinned) return pinned;
  try { return await fetch(request); } catch { return (await matchPrecache('/index.html')) ?? Response.error(); }
});
registerRoute(({url})=>url.origin===self.location.origin && !url.pathname.startsWith('/api/'),async({request,event})=>{
  const pinned=await packaged(request); if(pinned) return pinned;
  const pre=await matchPrecache(request.url); if(pre) return pre;
  return new NetworkFirst({cacheName:`homedex-site-${__OFFLINE_BUILD_VERSION__}`,networkTimeoutSeconds:8,plugins:[new CacheableResponsePlugin({statuses:[200]})]}).handle({request,event});
});
registerRoute(({request})=>request.destination==='image',async({request,event})=>{
  const pinned=await packaged(request); if(pinned) return pinned;
  return new CacheFirst({cacheName:'homedex-viewed-images-v2',plugins:[new CacheableResponsePlugin({statuses:[200]})]}).handle({request,event});
});
// Precache the app shell, fonts and all sprites. The explicit download tool in
// Settings adds the large data bundles the precache cannot hold (see
// scripts/buildOfflineManifest.mjs).
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
