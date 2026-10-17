import { useState, useEffect, useCallback, useRef } from 'react';
import type { PokemonEntry } from '../data/pokemonData';
import {
  drainOfflineSyncQueue,
  deletePokepetFromUniversalDatabase,
  saveUserDexProfile,
  type SerializedPokemonInstance,
  type UserDexProfileData,
  type User,
} from '../firebase';

export const OFFLINE_SYNC_QUEUE_KEY = 'homedex_offline_sync_queue';

/** Failure metadata attached when an upload attempt is rejected. */
export interface SyncFailureInfo {
  failureReason?: string;
  failureTitle?: string;
  failureDetail?: string;
  failureAction?: string;
  failureRetryable?: boolean;
  failureRaw?: string;
  lastAttemptAt?: number;
  attempts?: number;
}

export type SyncQueueAction = SyncFailureInfo & (
  | {
      id: string;
      type: 'REGISTER_POKEPET';
      timestamp: number;
      payload: {
        instance: SerializedPokemonInstance;
        ownerId: string;
        trainerName: string;
      };
    }
  | {
      id: string;
      type: 'DELETE_POKEPET';
      timestamp: number;
      payload: {
        pokeId: string;
      };
    }
  | {
      id: string;
      type: 'SYNC_USER_PROFILE';
      timestamp: number;
      payload: {
        uid: string;
        profileData: UserDexProfileData;
      };
    }
);

/**
 * Hook to track browser online/offline status in real time.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => {
      // Confirm with a quick fetch check if available
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Retrieves the pending offline synchronization queue.
 */
export function getOfflineSyncQueue(): SyncQueueAction[] {
  try {
    const raw = localStorage.getItem(OFFLINE_SYNC_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Enqueues a mutation action to be synced when the network returns.
 */
export function enqueueOfflineAction(action: Omit<SyncQueueAction, 'id' | 'timestamp'>): void {
  try {
    const queue = getOfflineSyncQueue();
    const item: SyncQueueAction = {
      ...action,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    } as SyncQueueAction;

    // Deduplicate profile syncs to prevent bloat: keep only the latest profile snapshot
    let updatedQueue: SyncQueueAction[];
    if (item.type === 'SYNC_USER_PROFILE') {
      updatedQueue = queue.filter((q) => q.type !== 'SYNC_USER_PROFILE');
      updatedQueue.push(item);
    } else {
      updatedQueue = [...queue, item];
    }

    localStorage.setItem(OFFLINE_SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (err) {
    console.warn('Failed to enqueue offline action:', err);
  }
}

/**
 * Clears the offline synchronization queue.
 */
export function clearOfflineSyncQueue(): void {
  try {
    localStorage.removeItem(OFFLINE_SYNC_QUEUE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Flushes all pending offline actions to Firestore when back online.
 */
export async function flushOfflineSyncQueue(
  currentUser: User | null,
  currentTrainerName: string
): Promise<{ syncedCount: number; errors: string[] }> {
  if (!currentUser) return {syncedCount:0,errors:['Sign in to synchronize saved changes. The queue was kept.']};
  const result = await drainOfflineSyncQueue();
  return {syncedCount:result.processed,errors:result.failed ? [`${result.failed} changes remain pending; retry when connected.`] : []};
}

// Versioned, verified site-data downloads (separate from cloud sync).
export {
  SPRITE_CACHE_NAME, OFFLINE_DATA_KEY, OFFLINE_PACKAGE_METADATA_KEY,
  getOfflinePackageMetadata, saveOfflinePackageMetadata, downloadFullOfflinePackage,
  clearOfflinePackage,
  type OfflinePackageMeta, type DownloadProgress,
} from './offlinePackage';

/** Removes one pending change by id (used to discard an unsyncable item). */
export function removeOfflineAction(id: string): void {
  try {
    const queue = getOfflineSyncQueue().filter((a) => a.id !== id);
    localStorage.setItem(OFFLINE_SYNC_QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new Event('homedex-sync-queue-changed'));
  } catch { /* ignore */ }
}

/** Clears every pending change. Returns how many were discarded. */
export function clearOfflineSyncQueueItems(): number {
  try {
    const count = getOfflineSyncQueue().length;
    localStorage.removeItem(OFFLINE_SYNC_QUEUE_KEY);
    window.dispatchEvent(new Event('homedex-sync-queue-changed'));
    return count;
  } catch { return 0; }
}

/** Human-readable description of one pending offline change. */
export function describeSyncAction(action: SyncQueueAction): string {
  const payload = (action as { payload?: Record<string, unknown> }).payload ?? {};
  const type = String((action as { type?: string }).type || '');
  switch (type) {
    case 'REGISTER_POKEPET': {
      const inst = payload.instance as { nickname?: string; pokemonId?: number; speciesName?: string } | undefined;
      const name = inst?.nickname || inst?.speciesName || (inst?.pokemonId ? `PokéPet #${inst.pokemonId}` : 'a PokéPet');
      return `Register ${name}`;
    }
    case 'DELETE_POKEPET':
      return `Delete PokéPet (${String(payload.pokeId ?? '').slice(-6) || 'unknown ID'})`;
    case 'SYNC_USER_PROFILE':
      return 'Profile & dex progress';
    default:
      if (type.startsWith('SAVE_')) return 'Save PokéPet detail';
      if (type.startsWith('DELETE_')) return 'Delete PokéPet detail';
      return 'Unknown change';
  }
}

/** Short relative time like "just now", "12m ago", "3h ago". */
export function describeSyncAge(timestamp: number): string {
  const mins = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
