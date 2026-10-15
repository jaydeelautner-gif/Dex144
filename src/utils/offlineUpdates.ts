import { useCallback, useEffect, useState } from 'react';
import { fetchOfflineManifest, getOfflinePackageMetadata, PACKAGE_EVENT, type OfflinePackageMeta } from './offlinePackage';
declare const __OFFLINE_BUILD_VERSION__: string;
export const RUNNING_OFFLINE_VERSION = typeof __OFFLINE_BUILD_VERSION__ === 'undefined' ? 'development' : __OFFLINE_BUILD_VERSION__;
const LATEST_KEY = 'homedex-offline-latest-version-v2';
let appWaiting = false;
let activateWorker: (()=>Promise<void>) | null = null;
let pendingCheck: Promise<string|null> | null = null;
export function setOfflineWorkerUpdater(updater: ()=>Promise<void>) { activateWorker=updater; }
export function markOfflineWorkerUpdate() { appWaiting=true; window.dispatchEvent(new Event(PACKAGE_EVENT)); }
export async function applyDownloadedOfflineUpdate() {
  if (!window.confirm('Reload to apply the downloaded update? Finish any unsaved form first.')) return;
  if (appWaiting && activateWorker) await activateWorker();
  else window.location.reload();
}
function lastKnown():string|null {
  try { return JSON.parse(localStorage.getItem(LATEST_KEY) ?? 'null')?.version ?? null; } catch { return null; }
}
export function offlineUpdateState(meta:OfflinePackageMeta|null, latest:string|null, running=RUNNING_OFFLINE_VERSION, waiting=appWaiting) {
  const downloaded=!!meta?.downloadedAt || !!meta?.hasPartialDownload;
  const packageOutdated=downloaded && (!meta?.isDownloaded || !meta.version || (!!latest && meta.version!==latest));
  const newerApp=!!latest && running!=='development' && latest!==running;
  const reloadNeeded=!!meta?.isDownloaded && !!latest && meta.version===latest && (newerApp || waiting);
  return {updateNeeded:packageOutdated || (newerApp && !reloadNeeded) || (waiting && !reloadNeeded),reloadNeeded};
}
async function checkDeployedVersion():Promise<string|null> {
  if (!navigator.onLine) return lastKnown();
  if(!pendingCheck) pendingCheck=(async()=>{
    try { const m=await fetchOfflineManifest(); try { localStorage.setItem(LATEST_KEY,JSON.stringify({version:m.version,checkedAt:Date.now()})); } catch { /* Still show the network result in memory. */ } return m.version; }
    catch { return lastKnown(); }
    finally { pendingCheck=null; }
  })();
  return pendingCheck;
}
export function useOfflineUpdateStatus() {
  const [meta,setMeta]=useState<OfflinePackageMeta|null>(null);
  const [latest,setLatest]=useState<string|null>(()=>lastKnown());
  const [checking,setChecking]=useState(false);
  const [waiting,setWaiting]=useState(appWaiting);
  const refresh=useCallback(async(checkNetwork=false)=>{
    setChecking(true);
    try {
      setMeta(await getOfflinePackageMetadata()); setWaiting(appWaiting);
      if(checkNetwork) setLatest(await checkDeployedVersion());
    } finally { setChecking(false); }
  },[]);
  useEffect(()=>{
    void refresh(true);
    const changed=()=>{ void refresh(false); };
    const online=()=>{ void refresh(true); };
    const focus=()=>{ if(document.visibilityState!=='hidden') void refresh(true); };
    window.addEventListener(PACKAGE_EVENT,changed); window.addEventListener('online',online); window.addEventListener('focus',focus);
    const timer=setInterval(online,5*60*1000);
    return ()=>{clearInterval(timer);window.removeEventListener(PACKAGE_EVENT,changed);window.removeEventListener('online',online);window.removeEventListener('focus',focus);};
  },[refresh]);
  return {meta,latest,checking,refresh,...offlineUpdateState(meta,latest,RUNNING_OFFLINE_VERSION,waiting)};
}
