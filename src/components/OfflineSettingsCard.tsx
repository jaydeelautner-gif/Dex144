import { useOfflineUpdateStatus, applyDownloadedOfflineUpdate } from '../utils/offlineUpdates';
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
  describeSyncAction,
  describeSyncAge,
  removeOfflineAction,
} from '../utils/offlineManager';
import {
  getCachedAuthAccounts,
  removeCachedAuthAccount,
  requestPersistentStorage,
  checkStorageEstimate,
  setAccountPin,
  removeAccountPin,
  hasPinSet,
  type CachedAuthAccount,
} from '../utils/offlineAuth';
import { usePWAInstall } from '../utils/usePWAInstall';
import { auth, type User } from '../firebase';

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
  const updateStatus = useOfflineUpdateStatus();
  const { isInstalled, isIOS, isIPad } = usePWAInstall();

  const [packageMeta, setPackageMeta] = useState<OfflinePackageMeta | null>(null);
  const [syncQueue, setSyncQueue] = useState<SyncQueueAction[]>([]);
  const [confirmClearFailed, setConfirmClearFailed] = useState(false);
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
  useEffect(() => () => { abortControllerRef.current?.abort(); }, []);

  // PIN state
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinStatusMsg, setPinStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      setHasPin(hasPinSet(user.uid));
    }
  }, [user?.uid, cachedAccounts]);

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinStatusMsg(null);
    if (!user?.uid) {
      setPinStatusMsg({ text: 'You must be signed in to configure a quick-entry PIN.', type: 'error' });
      return;
    }
    const cleanPin = pinInput.trim();
    if (cleanPin.length < 4 || cleanPin.length > 8 || !/^\d+$/.test(cleanPin)) {
      setPinStatusMsg({ text: 'PIN must be between 4 and 8 digits (numeric only).', type: 'error' });
      return;
    }
    if (cleanPin !== confirmPinInput.trim()) {
      setPinStatusMsg({ text: 'PINs do not match. Please re-enter to confirm.', type: 'error' });
      return;
    }
    try {
      await setAccountPin(user.uid, cleanPin);
      setHasPin(true);
      setPinInput('');
      setConfirmPinInput('');
      setPinStatusMsg({ text: 'Offline quick-entry PIN saved successfully on this device!', type: 'success' });
      refreshStatus();
    } catch (err: unknown) {
      setPinStatusMsg({ text: (err as Error)?.message || 'Failed to save PIN.', type: 'error' });
    }
  };

  const handleRemovePin = () => {
    if (!user?.uid) return;
    removeAccountPin(user.uid);
    setHasPin(false);
    setPinInput('');
    setConfirmPinInput('');
    setPinStatusMsg({ text: 'Quick-entry PIN removed from this device.', type: 'success' });
    refreshStatus();
  };

  // Actions the server has actively rejected, versus ones simply still waiting.
  const failedQueue = React.useMemo(
    () => syncQueue.filter((a) => Boolean(a.failureReason)),
    [syncQueue]
  );

  /** Re-read the pending queue from device storage. */
  const refreshQueue = async () => {
    setSyncQueue(getOfflineSyncQueue());
  };

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
        text: 'Persistent storage requested/granted by this browser. Keep a backup: storage pressure, device settings or manual clearing can still remove local data.',
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
          text: `Offline package verified: app pages, encounter data, all bundled datasets, fonts and normal/shiny/form artwork for ${result.cachedCount} species saved. Reload if prompted before disconnecting. Cloud-only operations still require internet.`,
          type: 'success',
        });
      } else if (!abortController.signal.aborted) {
        setSyncMessage({text:`Download incomplete: ${result.failedCount} artwork groups failed. Successfully saved files are kept for retry; an older complete package remains active.`,type:'error'});
      }
      await refreshStatus();
      await updateStatus.refresh(true);
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
      // Keep progress until active requests settle, preventing overlapping downloads.
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

      {syncQueue.length > 0 && (!user || auth.currentUser?.uid !== user.uid) && (
        <div role="status" className="p-3 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-200 text-xs leading-relaxed">
          <strong className="block mb-1">Password login is needed to upload offline changes</strong>
          Quick PIN unlocks this device locally. To upload pending changes, connect to the internet and sign in with your account password. Your offline changes stay saved on this device while waiting to sync. Do not clear device storage.
        </div>
      )}

      {/* Failed uploads: say WHY, show WHAT, then offer to discard. */}
      {failedQueue.length > 0 && (
        <div role="alert" className="p-4 rounded-xl border border-rose-500/50 bg-rose-950/40 text-rose-100 text-xs flex flex-col gap-3">
          <div>
            <strong className="block text-sm text-rose-200">
              {failedQueue.length} change{failedQueue.length > 1 ? 's' : ''} could not be uploaded
            </strong>
            <p className="mt-1 text-rose-200/90">
              {failedQueue[0].failureDetail ?? 'The server rejected these changes.'}
            </p>
            <p className="mt-1 text-rose-200/80">{failedQueue[0].failureAction ?? ''}</p>
          </div>

          {/* What the failed data contains */}
          <details className="rounded-lg bg-black/30 border border-rose-500/30 px-3 py-2">
            <summary className="cursor-pointer font-bold text-rose-200">
              Show the {failedQueue.length} change{failedQueue.length > 1 ? 's' : ''} that failed
            </summary>
            <ul className="mt-2 flex flex-col gap-1.5">
              {failedQueue.map((action) => (
                <li key={action.id} className="rounded-lg bg-slate-900/70 border border-slate-800 px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-100 truncate">{describeSyncAction(action)}</span>
                    <span className="shrink-0 font-mono text-[10px] text-slate-500">
                      {describeSyncAge(action.timestamp)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-rose-300/90">
                    {action.failureTitle ?? 'Upload failed'}
                    {action.attempts ? ` · ${action.attempts} attempt${action.attempts > 1 ? 's' : ''}` : ''}
                  </div>
                  {action.failureRaw && (
                    <div className="mt-0.5 font-mono text-[10px] text-slate-500 break-words">{action.failureRaw}</div>
                  )}
                </li>
              ))}
            </ul>
          </details>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isSyncing || !isOnline || !user}
              onClick={handleManualSync}
              className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Try uploading again
            </button>
            <button
              type="button"
              onClick={() => setConfirmClearFailed(true)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-xs font-bold cursor-pointer"
            >
              Clear unsyncable changes…
            </button>
          </div>

          {/* Confirmation: only after the contents above have been shown. */}
          {confirmClearFailed && (
            <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/40 text-amber-200">
              <p className="mb-2">
                This permanently discards the {failedQueue.length} saved change{failedQueue.length > 1 ? 's' : ''} listed above on
                <strong> this device only</strong>. Anything already uploaded stays in the cloud. This cannot be undone.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    failedQueue.forEach((a) => removeOfflineAction(a.id));
                    setConfirmClearFailed(false);
                    setSyncMessage({ text: `Discarded ${failedQueue.length} unsyncable offline change${failedQueue.length > 1 ? 's' : ''}.`, type: 'info' });
                    void refreshQueue();
                  }}
                  className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black cursor-pointer"
                >
                  Yes, clear {failedQueue.length} change{failedQueue.length > 1 ? 's' : ''}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearFailed(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-xs font-bold cursor-pointer"
                >
                  Keep them
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Everything else is healthy — reassure that reconnection uploads by itself. */}
      {failedQueue.length === 0 && syncQueue.length > 0 && isOnline && user && (
        <div role="status" className="p-3 rounded-xl border border-sky-500/40 bg-sky-950/30 text-sky-200 text-xs">
          {syncQueue.length} change{syncQueue.length > 1 ? 's' : ''} waiting to upload. They are saved on this device and upload
          automatically as soon as the connection and sign-in allow it.
        </div>
      )}

      {/* Package updates are separate from personal-data cloud sync. */}
      <div role="status" aria-live="polite" className="-mt-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap justify-between gap-3 text-xs">
        <div>
          <strong className={updateStatus.updateNeeded || updateStatus.reloadNeeded ? 'text-amber-300' : 'text-slate-300'}>
            {updateStatus.reloadNeeded ? 'Update downloaded — reload to apply' : updateStatus.updateNeeded ? 'Update required' : 'No known offline package update'}
          </strong>
          <p className="text-slate-400 mt-1">{!isOnline ? 'Offline — showing the last known update status. Reconnect to check for newer data.' : 'Checks app code, every site data file and artwork catalog against the deployed release.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" disabled={!isOnline || updateStatus.checking} onClick={() => { void updateStatus.refresh(true); }} className="text-sky-300 disabled:opacity-40">Check for updates</button>
          {updateStatus.reloadNeeded ? <button type="button" onClick={() => { void applyDownloadedOfflineUpdate(); }} className="px-3 py-2 bg-amber-500 text-slate-950 rounded-lg font-bold">Reload update</button>
            : updateStatus.updateNeeded && <button type="button" disabled={!isOnline || !!downloadProgress} onClick={handleStartDownload} className="px-3 py-2 bg-amber-500 text-slate-950 rounded-lg font-bold disabled:opacity-40">Update offline package</button>}
        </div>
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
                ? 'HomeDex is installed. Download/update the complete package below and reload if prompted before disconnecting.'
                : 'HomeDex runs in any web browser on computers, phones, and tablets. You can also install or add it to your Home Screen for a dedicated window and offline storage.'}
            </p>
          </div>
        </div>

        {/* Persistence button */}
        <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
          {persistentStorage.persisted ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Persistence Granted</span>
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
                Downloads every app page and bundled dataset (species, games, encounters, evolutions, items, forms and hints), fonts/icons, and normal/shiny/form/gender artwork. Allow several hundred MB of device storage. Registrations/settings remain in their existing local storage; cloud lookups, sign-in and signed-in atomic evolution still require internet.
              </p>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-800/80 pt-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Species with Complete Artwork:</span>
              <span className="font-bold text-slate-200">
                {packageMeta?.cachedSpeciesCount || 0} / {packageMeta?.totalSpeciesCount || 1025}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono"><span className="text-slate-400">Verified Files / Artwork Groups:</span><span className="text-slate-200">{packageMeta?.cachedAssetCount || 0} / {packageMeta?.totalAssetCount || '—'}</span></div>
            {packageMeta?.hasPartialDownload && <p className="text-xs text-amber-300">An interrupted download is saved. Retry to resume, or clear its cached files.</p>}
            {!!packageMeta?.missingCount && <p className="text-xs text-amber-300">Incomplete: {packageMeta.missingCount} files/groups need downloading again.</p>}
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
                  {downloadProgress.phase === 'site-data' ? 'Verifying app & data files…' : 'Saving artwork variants…'}
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
                <span>{formatBytes(downloadProgress.bytes)} saved · {downloadProgress.failedCount || 0} failed</span>
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

              {packageMeta?.hasPartialDownload || (packageMeta?.cachedSpeciesCount ?? 0) > 0 ? (
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

      {/* Card 3: Offline Quick-Entry PIN */}
      <div className="p-5 rounded-xl bg-[#0B0F17] border border-slate-800 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-purple-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Offline Quick-Entry PIN
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    hasPin
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {hasPin ? 'PIN Active' : 'Not Configured'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
                Allow quick numerical entry to unlock your Living Dex when this device is in an offline state.
                For device security, PIN quick entry cannot be used to log in for the first time on a new device.
              </p>
            </div>
          </div>
        </div>

        {user ? (
          <form onSubmit={handleSavePin} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-bold text-slate-300">
                {hasPin ? 'UPDATE 4-8 DIGIT PIN' : 'NEW 4-8 DIGIT PIN'}
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-purple-400 text-slate-100 font-mono tracking-widest text-center text-sm focus:outline-none placeholder:tracking-normal placeholder:text-slate-600"
              />
            </div>

            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-bold text-slate-300">
                CONFIRM PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={confirmPinInput}
                onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-purple-400 text-slate-100 font-mono tracking-widest text-center text-sm focus:outline-none placeholder:tracking-normal placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!pinInput || !confirmPinInput}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition cursor-pointer shadow-md"
              >
                {hasPin ? 'Update PIN' : 'Save PIN'}
              </button>

              {hasPin && (
                <button
                  type="button"
                  onClick={handleRemovePin}
                  className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-700 text-slate-400 hover:text-rose-300 text-xs font-semibold transition cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-center text-xs text-slate-400">
            Sign in to configure a quick-entry PIN for this device.
          </div>
        )}

        {pinStatusMsg && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              pinStatusMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {pinStatusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{pinStatusMsg.text}</span>
          </div>
        )}
      </div>
    </section>
  );
};
