import { useState, useEffect, useCallback, useRef } from 'react';
import type { PokemonEntry } from '../data/pokemonData';
import {
  savePokepetToUniversalDatabase,
  deletePokepetFromUniversalDatabase,
  saveUserDexProfile,
  type SerializedPokemonInstance,
  type UserDexProfileData,
  type User,
} from '../firebase';

export const SPRITE_CACHE_NAME = 'homedex-sprites-v1';
export const OFFLINE_DATA_KEY = 'homedex_offline_full_dataset_v1';
export const OFFLINE_SYNC_QUEUE_KEY = 'homedex_offline_sync_queue';
export const OFFLINE_PACKAGE_METADATA_KEY = 'homedex_offline_package_meta';

export interface OfflinePackageMeta {
  isDownloaded: boolean;
  downloadedAt: number | null;
  cachedSpeciesCount: number;
  totalSpeciesCount: number;
  totalBytes: number;
}

export interface DownloadProgress {
  current: number;
  total: number;
  percentage: number;
  bytes: number;
  status: 'idle' | 'downloading' | 'completed' | 'error' | 'aborted';
  errorMessage?: string;
}

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
  const queue = getOfflineSyncQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, errors: [] };
  }

  let syncedCount = 0;
  const errors: string[] = [];
  const remainingQueue: SyncQueueAction[] = [];

  for (const item of queue) {
    try {
      if (item.type === 'REGISTER_POKEPET') {
        const ownerId = currentUser ? currentUser.uid : item.payload.ownerId || 'offline_trainer';
        const trainer = currentTrainerName || item.payload.trainerName || 'Trainer';
        await savePokepetToUniversalDatabase(item.payload.instance, ownerId, trainer);
        syncedCount++;
      } else if (item.type === 'DELETE_POKEPET') {
        await deletePokepetFromUniversalDatabase(item.payload.pokeId);
        syncedCount++;
      } else if (item.type === 'SYNC_USER_PROFILE') {
        if (currentUser && currentUser.uid === item.payload.uid) {
          await saveUserDexProfile(currentUser.uid, item.payload.profileData);
          syncedCount++;
        }
      }
    } catch (err: any) {
      errors.push(`Action ${item.type} failed: ${err?.message || 'Network error'}`);
      // Keep in queue to retry next time
      remainingQueue.push(item);
    }
  }

  try {
    if (remainingQueue.length === 0) {
      localStorage.removeItem(OFFLINE_SYNC_QUEUE_KEY);
    } else {
      localStorage.setItem(OFFLINE_SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
    }
  } catch {
    // ignore
  }

  return { syncedCount, errors };
}

/**
 * Retrieves metadata about the locally downloaded offline package.
 */
export async function getOfflinePackageMetadata(): Promise<OfflinePackageMeta> {
  const defaultMeta: OfflinePackageMeta = {
    isDownloaded: false,
    downloadedAt: null,
    cachedSpeciesCount: 0,
    totalSpeciesCount: 1025,
    totalBytes: 0,
  };

  try {
    const raw = localStorage.getItem(OFFLINE_PACKAGE_METADATA_KEY);
    let parsed: OfflinePackageMeta = raw ? JSON.parse(raw) : defaultMeta;

    // Verify cache in CacheStorage if available
    if (typeof caches !== 'undefined') {
      const hasCache = await caches.has(SPRITE_CACHE_NAME);
      if (hasCache) {
        const cache = await caches.open(SPRITE_CACHE_NAME);
        const keys = await cache.keys();
        parsed.cachedSpeciesCount = keys.length;
        parsed.isDownloaded = keys.length >= 800; // majority cached
      } else {
        parsed.cachedSpeciesCount = 0;
        parsed.isDownloaded = false;
      }
    }

    return parsed;
  } catch {
    return defaultMeta;
  }
}

/**
 * Saves metadata for the offline package.
 */
export function saveOfflinePackageMetadata(meta: OfflinePackageMeta): void {
  try {
    localStorage.setItem(OFFLINE_PACKAGE_METADATA_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

/**
 * Pre-downloads all 1,025 Pokémon species data and sprites into CacheStorage and local storage
 * with progress updates and cancellation support.
 */
export async function downloadFullOfflinePackage(
  dex: PokemonEntry[],
  onProgress?: (progress: DownloadProgress) => void,
  abortSignal?: AbortSignal
): Promise<{ success: boolean; cachedCount: number; bytes: number }> {
  if (typeof caches === 'undefined') {
    throw new Error('CacheStorage is not supported in this browser environment.');
  }

  const cache = await caches.open(SPRITE_CACHE_NAME);
  const total = dex.length;
  let current = 0;
  let totalBytes = 0;

  // 1. Cache full dex information JSON locally
  try {
    const compactDexData = dex.map((p) => ({
      id: p.id,
      name: p.name,
      gen: p.generation,
      region: p.region,
      types: p.types,
      category: p.category,
      boxNumber: p.boxNumber,
      boxSlot: p.boxSlot,
      homeTransfer: p.homeTransfer,
    }));
    localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(compactDexData));
  } catch (err) {
    console.warn('Could not cache full dex JSON to localStorage (quota exceeded?):', err);
  }

  // 2. Pre-fetch sprites in parallel batches of 15
  const CONCURRENCY = 15;
  const urlsToFetch: { id: number; url: string }[] = [];

  for (const p of dex) {
    urlsToFetch.push({
      id: p.id,
      url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`,
    });
  }

  for (let i = 0; i < urlsToFetch.length; i += CONCURRENCY) {
    if (abortSignal?.aborted) {
      if (onProgress) {
        onProgress({
          current,
          total,
          percentage: Math.round((current / total) * 100),
          bytes: totalBytes,
          status: 'aborted',
        });
      }
      return { success: false, cachedCount: current, bytes: totalBytes };
    }

    const batch = urlsToFetch.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ({ url }) => {
        try {
          const match = await cache.match(url);
          if (match) {
            current++;
            const blob = await match.clone().blob();
            totalBytes += blob.size;
            return;
          }

          const response = await fetch(url, {
            mode: 'cors',
            credentials: 'omit',
            signal: abortSignal,
          });

          if (response.ok) {
            const clone = response.clone();
            await cache.put(url, response);
            const blob = await clone.blob();
            totalBytes += blob.size;
          }
          current++;
        } catch {
          // Continue fetching others even if individual sprite fails
          current++;
        }
      })
    );

    if (onProgress) {
      onProgress({
        current,
        total,
        percentage: Math.min(100, Math.round((current / total) * 100)),
        bytes: totalBytes,
        status: current >= total ? 'completed' : 'downloading',
      });
    }
  }

  const meta: OfflinePackageMeta = {
    isDownloaded: true,
    downloadedAt: Date.now(),
    cachedSpeciesCount: current,
    totalSpeciesCount: total,
    totalBytes,
  };
  saveOfflinePackageMetadata(meta);

  return { success: true, cachedCount: current, bytes: totalBytes };
}

/**
 * Clears the offline sprites cache and metadata.
 */
export async function clearOfflinePackage(): Promise<void> {
  try {
    if (typeof caches !== 'undefined') {
      await caches.delete(SPRITE_CACHE_NAME);
    }
    localStorage.removeItem(OFFLINE_DATA_KEY);
    localStorage.removeItem(OFFLINE_PACKAGE_METADATA_KEY);
  } catch (err) {
    console.warn('Error clearing offline package:', err);
  }
}

/**
 * Resolves a sprite URL from CacheStorage as an Object URL if offline or cached.
 */
export async function getCachedSpriteObjectUrl(url: string): Promise<string | null> {
  if (typeof caches === 'undefined' || !url) return null;
  try {
    const cache = await caches.open(SPRITE_CACHE_NAME);
    const match = await cache.match(url);
    if (match) {
      const blob = await match.blob();
      return URL.createObjectURL(blob);
    }
    return null;
  } catch {
    return null;
  }
}
