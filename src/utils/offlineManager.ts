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

export type SyncQueueAction =
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
    };

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

// Versioned, verified app/data/artwork downloads (separate from cloud sync).
export {
  SPRITE_CACHE_NAME, OFFLINE_DATA_KEY, OFFLINE_PACKAGE_METADATA_KEY,
  getOfflinePackageMetadata, saveOfflinePackageMetadata, downloadFullOfflinePackage,
  clearOfflinePackage, getCachedSpriteObjectUrl,
  type OfflinePackageMeta, type DownloadProgress,
} from './offlinePackage';
