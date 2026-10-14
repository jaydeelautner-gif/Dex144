import React from 'react';
import { WifiOff, HardDrive, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus, getOfflineSyncQueue } from '../utils/offlineManager';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const queue = getOfflineSyncQueue();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl border border-amber-300 animate-in fade-in slide-in-from-bottom-3">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
      </span>
      <div className="flex items-center gap-1.5 font-sans">
        <WifiOff className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Offline Mode</span>
        <span className="text-[11px] font-normal text-slate-900 ml-1">
          • Serving from iPad/Device Storage
          {queue.length > 0 ? ` (${queue.length} pending sync)` : ''}
        </span>
      </div>
    </div>
  );
};
