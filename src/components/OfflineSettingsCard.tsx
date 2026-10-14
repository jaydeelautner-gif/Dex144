import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  Download,
  CheckCircle2,
  Trash2,
  RefreshCw,
  HardDrive,
  Tablet,
  AlertCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  KeyRound,
  ExternalLink,
  Share,
  PlusSquare,
  Lock,
} from 'lucide-react';
import type { PokemonEntry } from '../data/pokemonData';
import {
  useOnlineStatus,
  getOfflineSyncQueue,
  flushOfflineSyncQueue,
  getOfflinePackageMetadata,
  downloadFullOfflinePackage,
  clearOfflinePackage,
  type OfflinePackageMeta,
  type DownloadProgress,
  type SyncQueueAction,
} from '../utils/offlineManager';
import {
  getCachedAuthAccounts,
  removeCachedAuthAccount,
  requestPersistentStorage,
  checkStorageEstimate,
  type CachedAuthAccount,
} from '../utils/offlineAuth';
import { usePWAInstall } from '../utils/usePWAInstall';
import { type User } from '../firebase';

interface OfflineSettingsCardProps {
  dex: PokemonEntry[];
  user: User | null;
  trainerName: string;
  onSyncSuccess?: (syncedCount: number) => void;
}

export const OfflineSettingsCard: React.FC<OfflineSettingsCardProps> = ({
  dex,
  user,
  trainerName,
  onSyncSuccess,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstalled, isIOS, isIPad } = usePWAInstall();

  const [packageMeta, setPackageMeta] = useState<OfflinePackageMeta | null>(null);
  const [syncQueue, setSyncQueue] = useState<SyncQueueAction[]>([]);
  const [cachedAccounts, setCachedAccounts] = useState<CachedAuthAccount[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Storage info
  const [persistentStorage, setPersistentStorage] = useState<{
    supported: boolean;
    persisted: boolean;
  }>({ supported: false, persisted: false });
  const [storageEstimate, setStorageEstimate] = useState<{
    usage: number;
    quota: number;
    percentage: number;
  } | null>(null);

  // Download state
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Refresh status
  const refreshStatus = async () => {
    const meta = await getOfflinePackageMetadata();
    setPackageMeta(meta);
    setSyncQueue(getOfflineSyncQueue());
    setCachedAccounts(getCachedAuthAccounts());

    // Storage persistence check
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      try {
        const isPersisted = await navigator.storage.persisted();
        setPersistentStorage({ supported: true, persisted: isPersisted });
      } catch {
        setPersistentStorage({ supported: false, persisted: false });
      }
    }

    // Storage estimate
    const estimate = await checkStorageEstimate();
    if (estimate) {
      setStorageEstimate(estimate);
    }
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  // Request storage persistence (critical for iPad WebApps to avoid iOS cache eviction)
  const handleRequestPersistence = async () => {
    const res = await requestPersistentStorage();
    setPersistentStorage(res);
    if (res.persisted) {
      setSyncMessage({
        text: 'Persistent WebApp storage granted! iOS Safari will not evict your offline Pokédex data.',
        type: 'success',
      });
    } else {
      setSyncMessage({
        text: 'Persistent storage could not be locked. In Safari, saving HomeDex to Home Screen automatically grants elevated storage priority.',
        type: 'info',
      });
    }
    refreshStatus();
  };

  // Handle manual sync
  const handleManualSync = async () => {
    if (!isOnline) {
      setSyncMessage({
        text: 'Your device is currently offline. Connect to internet to sync changes.',
        type: 'error',
      });
      return;
    }

    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const result = await flushOfflineSyncQueue(user, trainerName);
      if (result.errors.length > 0) {
        setSyncMessage({
          text: `Synced ${result.syncedCount} changes, but some errors occurred: ${result.errors[0]}`,
          type: 'error',
        });
      } else if (result.syncedCount > 0) {
        setSyncMessage({
          text: `Successfully synced ${result.syncedCount} offline change${result.syncedCount > 1 ? 's' : ''} to HomeDex Cloud!`,
          type: 'success',
        });
        if (onSyncSuccess) onSyncSuccess(result.syncedCount);
      } else {
        setSyncMessage({
          text: 'All changes are already in sync with HomeDex Cloud.',
          type: 'info',
        });
      }
      refreshStatus();
    } catch (err: any) {
      setSyncMessage({
        text: `Sync failed: ${err?.message || 'Could not reach server'}`,
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Download Full Offline Package to iPad / Device Storage
  const handleStartDownload = async () => {
    if (!isOnline) {
      setSyncMessage({
        text: 'Cannot download offline package while device is offline.',
        type: 'error',
      });
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setDownloadProgress({
      current: 0,
      total: dex.length,
      percentage: 0,
      bytes: 0,
      status: 'downloading',
    });

    try {
      const result = await downloadFullOfflinePackage(
        dex,
        (progress) => {
          setDownloadProgress(progress);
        },
        abortController.signal
      );

      if (result.success) {
        setSyncMessage({
          text: `Full package downloaded to device storage! ${result.cachedCount} species specifications & official artwork sprites are ready for 100% offline access.`,
          type: 'success',
        });
      }
      refreshStatus();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setSyncMessage({
          text: `Download interrupted: ${err?.message || 'Network error'}`,
          type: 'error',
        });
      }
    } finally {
      abortControllerRef.current = null;
      setDownloadProgress(null);
    }
  };

  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setDownloadProgress(null);
      setSyncMessage({
        text: 'Offline package download paused/cancelled.',
        type: 'info',
      });
    }
  };

  // Handle Clear Offline Cache
  const handleClearCache = async () => {
    if (
      window.confirm(
        'Are you sure you want to remove the cached offline sprites and data from this device?'
      )
    ) {
      await clearOfflinePackage();
      await refreshStatus();
      setSyncMessage({
        text: 'Offline sprite and Pokédex cache cleared from local device storage.',
        type: 'info',
      });
    }
  };

  const handleForgetAccount = (accEmail: string) => {
    if (
      window.confirm(
        `Remove cached offline credentials for "${accEmail}" from this device? You will need internet to sign back in.`
      )
    ) {
      removeCachedAuthAccount(accEmail);
      setCachedAccounts(getCachedAuthAccounts());
      setSyncMessage({
        text: `Removed offline credentials for ${accEmail}.`,
        type: 'info',
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <section className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isOnline
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <WifiOff className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">
                Offline Mode & Device WebApp Storage
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider border ${
                  isOnline
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`}
                />
                {isOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Download required Pokédex data and official artwork to your computer browser, mobile phone, or iPad storage for uninterrupted offline access and local credential authentication.
            </p>
          </div>
        </div>

        {/* Sync Now button */}
        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing || !isOnline}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            !isOnline
              ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
              : syncQueue.length > 0
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
          <span>
            {isSyncing
              ? 'Syncing...'
              : syncQueue.length > 0
              ? `Sync Offline Changes (${syncQueue.length})`
              : 'Sync Cloud Now'}
          </span>
        </button>
      </div>

      {/* Sync Message Notification */}
      {syncMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            syncMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : syncMessage.type === 'error'
              ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
              : 'bg-slate-900 border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {syncMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{syncMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncMessage(null)}
            className="text-slate-400 hover:text-slate-200 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* iPad Saved WebApp Storage Info Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/30 border border-sky-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 shrink-0 mt-0.5">
            <Tablet className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">
                Device & WebApp Environment
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  isInstalled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                }`}
              >
                {isInstalled ? 'Standalone WebApp' : 'Browser Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              {isInstalled
                ? 'HomeDex is running as an installed WebApp on your device. All data and sprites are stored in isolated local storage for offline use.'
                : 'HomeDex runs in any web browser on computers, phones, and tablets. You can also install or add it to your Home Screen for a dedicated window and offline storage.'}
            </p>
          </div>
        </div>

        {/* Persistence button */}
        <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
          {persistentStorage.persisted ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Storage Lock: Protected</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRequestPersistence}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Lock Persistent Storage</span>
            </button>
          )}

          {storageEstimate && (
            <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-200 font-bold">
                {formatBytes(storageEstimate.usage)}
              </span>{' '}
              / {formatBytes(storageEstimate.quota)}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Download Package & Offline Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Full Offline Pokédex Package */}
        <div className="p-5 rounded-xl bg-[#0B0F17] border border-slate-800 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Download Required Data to Device Storage
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Downloads all 1,025 Pokémon species specifications, origin game availability, item
                requirements, and official artwork sprites to local CacheStorage on your computer, phone, or tablet.
              </p>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-800/80 pt-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Cached Artwork Sprites:</span>
              <span className="font-bold text-slate-200">
                {packageMeta?.cachedSpeciesCount || 0} / {packageMeta?.totalSpeciesCount || 1025}
              </span>
            </div>
            {packageMeta?.totalBytes ? (
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Estimated WebApp Storage Used:</span>
                <span className="font-bold text-emerald-400">
                  {formatBytes(packageMeta.totalBytes)}
                </span>
              </div>
            ) : null}
            {packageMeta?.downloadedAt ? (
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Last Download:</span>
                <span className="text-slate-300">
                  {new Date(packageMeta.downloadedAt).toLocaleString()}
                </span>
              </div>
            ) : null}
          </div>

          {/* Download progress UI */}
          {downloadProgress && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/40 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-300 font-bold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving to Device Storage...
                </span>
                <span className="text-amber-400 font-bold">
                  {downloadProgress.current} / {downloadProgress.total} (
                  {downloadProgress.percentage}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2.5 transition-all duration-150"
                  style={{ width: `${downloadProgress.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{formatBytes(downloadProgress.bytes)} saved to CacheStorage</span>
                <button
                  type="button"
                  onClick={handleCancelDownload}
                  className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer underline"
                >
                  Cancel Download
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!downloadProgress && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleStartDownload}
                disabled={!isOnline}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  packageMeta?.isDownloaded
                    ? 'bg-slate-900 hover:bg-slate-800 border border-emerald-500/50 text-emerald-300'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                } ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {packageMeta?.isDownloaded
                    ? 'Re-download / Update Device Storage'
                    : 'Download to Device'}
                </span>
              </button>

              {packageMeta?.cachedSpeciesCount && packageMeta.cachedSpeciesCount > 0 ? (
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Storage</span>
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Card 2: Offline Credential Authentication Vault */}
        <div className="p-5 rounded-xl bg-[#0B0F17] border border-slate-800 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Offline Account Credentials
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                When you log in online, your credentials are securely hashed and cached locally. You
                can log in with your email and password even when this device is completely offline!
              </p>
            </div>
          </div>

          {/* List of cached accounts */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Cached Trainer Accounts:</span>
              <span className="font-bold text-amber-400">
                {cachedAccounts.length} account{cachedAccounts.length === 1 ? '' : 's'} ready
              </span>
            </div>

            {cachedAccounts.length === 0 ? (
              <div className="p-3 rounded-lg bg-slate-900/80 border border-dashed border-slate-700 text-slate-400 text-xs text-center">
                No accounts cached yet. Log in once online to cache your credentials for offline
                access.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                {cachedAccounts.map((acc) => (
                  <div
                    key={acc.email}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-200">{acc.email}</div>
                        <div className="text-[10px] text-slate-400">
                          {acc.displayName || 'Trainer'} • Active on device
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleForgetAccount(acc.email)}
                      title="Forget this account from this device"
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Local SHA-256 Auth Active
              </span>
              <span>{user ? user.email || 'Online' : 'Signed out'}</span>
            </div>
          </div>

          {/* Offline Sync info */}
          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Pending Offline Changes:</span>
            </div>
            <span
              className={`font-mono font-bold ${
                syncQueue.length > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {syncQueue.length} action{syncQueue.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
