import React from 'react';
import { useOfflineUpdateStatus, applyDownloadedOfflineUpdate } from '../utils/offlineUpdates';
export function OfflineUpdateNotice({onOpenSettings}:{onOpenSettings:()=>void}) {
  const {updateNeeded,reloadNeeded}=useOfflineUpdateStatus();
  if(!updateNeeded && !reloadNeeded) return null;
  return <div aria-live="polite" className="text-[10px] font-semibold text-amber-300 mt-1">
    <button type="button" className="underline underline-offset-2 cursor-pointer" onClick={reloadNeeded?()=>{void applyDownloadedOfflineUpdate();}:onOpenSettings}>
      {reloadNeeded?'Update downloaded — reload':'Update needed'}
    </button>
  </div>;
}
