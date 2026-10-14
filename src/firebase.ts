import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  generateSalt,
  hashPasswordWithSalt,
  saveCachedAuthAccount,
  verifyCachedCredentials,
  createOfflineUser,
  getActiveOfflineUid,
  setActiveOfflineUid,
  clearActiveOfflineUid,
  saveLocallyCachedProfile,
  getLocallyCachedProfile,
  getCachedAccountByUid,
  type CachedAuthAccount,
} from './utils/offlineAuth';

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  ALL_GAME_IDS,
  createEmptyGameCatchesMap,
  type GameId,
  type GameCatchesMap,
} from './data/pokemonData';
import {
  type PokemonInstance,
  type RescueBinItem,
  RESCUE_BIN_RETENTION_MS,
} from './data/pokemonInventoryData';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const OWNER_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
export const MAX_OWNER_ID_LENGTH = 128;
export const MAX_TRAINER_NAME_LENGTH = 60;
export const MAX_GAME_FILTER_LENGTH = 32;
export const MAX_DEX_ARRAY_SIZE = 1050;
export const MAX_VARIANTS_ARRAY_SIZE = 1500;
export const MAX_BOX_SELECTED_VARIANTS_SIZE = 1050;
export const MAX_BOX_SELECTED_GAMES_SIZE = 1050;
export const MAX_VARIANT_ID_LENGTH = 32;
export const MAX_OWNED_GAMES_SIZE = 35;
export const MAX_GAME_ID_LENGTH = 20;
export const MAX_OWNED_DLCS_SIZE = 20;
export const MAX_DLC_ID_LENGTH = 40;
export const MAX_INVENTORY_ITEMS_SIZE = 2000;

export interface SerializedPokemonInstance {
  pokeId: string;
  pokemonId: number;
  nickname?: string;
  level: number;
  gender: string;
  variantId: string;
  variantName: string;
  isShiny: boolean;
  gameId?: string;
  isHomeGift: boolean;
  isTraded: boolean;
  storedInHome: boolean;
  isInLivingBox: boolean;
  livingBoxNumber?: number;
  livingBoxSlot?: number;
  notes?: string;
  ownerId?: string;
  ownerEmail?: string;
  trainerName?: string;
  isRescued?: boolean;
  rescuedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface UserDexProfileData {
  ownerId: string;
  trainerName: string;
  activeGameFilter: string;
  isPublic: boolean;
  caughtIds: number[];
  shinyIds: number[];
  livingIds: number[];
  caughtVariants: string[];
  boxSelectedVariants: string[];
  boxSelectedGames: string[];
  ownedGames: GameId[];
  ownedDlcs: string[];
  gameCatches: GameCatchesMap;
  inventory?: SerializedPokemonInstance[];
  rescueBin?: RescueBinItem[];
  caughtCount: number;
  shinyCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/**
 * Deeply removes all undefined properties from objects and arrays so Firestore never rejects writes.
 */
export function removeUndefinedProperties<T>(val: T): T {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) {
    return val.map((item) => removeUndefinedProperties(item)) as unknown as T;
  }
  if (typeof val === 'object') {
    // Preserve Date and FieldValue objects like serverTimestamp
    if (val instanceof Date || ('toMillis' in (val as any)) || ('_methodName' in (val as any))) {
      return val;
    }
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(val as Record<string, any>)) {
      if (v !== undefined) {
        cleaned[k] = removeUndefinedProperties(v);
      }
    }
    return cleaned as T;
  }
  return val;
}

export function sanitizeInventory(raw: unknown): SerializedPokemonInstance[] {
  if (!Array.isArray(raw)) return [];
  const out: SerializedPokemonInstance[] = [];
  const seenPokeIds = new Set<string>();

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const pokeId = String(rec.pokeId || '').trim();
    if (!pokeId.startsWith('ID') || pokeId.length !== 12 || seenPokeIds.has(pokeId)) {
      continue;
    }
    seenPokeIds.add(pokeId);

    const pokemonId = Math.trunc(Number(rec.pokemonId));
    if (!Number.isInteger(pokemonId) || pokemonId < 1 || pokemonId > 1025) continue;

    const level = Math.max(1, Math.min(100, Math.trunc(Number(rec.level || 1))));
    const gender = String(rec.gender || 'genderless').slice(0, 16);
    const variantId = String(rec.variantId || `${pokemonId}:base`).slice(0, 32);
    const variantName = String(rec.variantName || 'Standard').slice(0, 60);
    const isShiny = Boolean(rec.isShiny);
    const isHomeGift = Boolean(rec.isHomeGift);
    const isTraded = Boolean(rec.isTraded);
    const storedInHome = Boolean(rec.storedInHome);
    const isInLivingBox = Boolean(rec.isInLivingBox);
    const isRescued = Boolean(rec.isRescued);
    const createdAt = typeof rec.createdAt === 'number' ? rec.createdAt : Date.now();
    const updatedAt = typeof rec.updatedAt === 'number' ? rec.updatedAt : Date.now();

    const inst: SerializedPokemonInstance = {
      pokeId,
      pokemonId,
      level,
      gender,
      variantId,
      variantName,
      isShiny,
      isHomeGift,
      isTraded,
      storedInHome,
      isInLivingBox,
      isRescued,
      createdAt,
      updatedAt,
    };

    if (!isHomeGift && rec.gameId) {
      inst.gameId = String(rec.gameId).slice(0, 20);
    }
    if (rec.nickname) {
      inst.nickname = String(rec.nickname).trim().slice(0, 10);
    }
    if (rec.notes) {
      inst.notes = String(rec.notes).slice(0, 120);
    }
    if (rec.livingBoxNumber) {
      inst.livingBoxNumber = Math.max(1, Math.min(35, Math.trunc(Number(rec.livingBoxNumber))));
    }
    if (rec.livingBoxSlot) {
      inst.livingBoxSlot = Math.max(1, Math.min(30, Math.trunc(Number(rec.livingBoxSlot))));
    }
    if (rec.ownerId) {
      inst.ownerId = String(rec.ownerId).slice(0, 128);
    }
    if (rec.ownerEmail) {
      inst.ownerEmail = String(rec.ownerEmail).slice(0, 100);
    }
    if (rec.trainerName) {
      inst.trainerName = String(rec.trainerName).slice(0, 60);
    }
    if (typeof rec.rescuedAt === 'number') {
      inst.rescuedAt = rec.rescuedAt;
    }

    out.push(inst);
  }
  return out.slice(0, MAX_INVENTORY_ITEMS_SIZE);
}

export function sanitizeRescueBin(raw: unknown): RescueBinItem[] {
  if (!Array.isArray(raw)) return [];
  const out: RescueBinItem[] = [];
  const now = Date.now();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const deletedAt = typeof rec.deletedAt === 'number' ? rec.deletedAt : now;
    const expiresAt = typeof rec.expiresAt === 'number' ? rec.expiresAt : deletedAt + RESCUE_BIN_RETENTION_MS;

    // 30-day automatic deletion check: if past expiration, automatically pruned
    if (expiresAt <= now) continue;

    const instList = sanitizeInventory([rec.instance]);
    if (instList.length === 0) continue;
    const rawInst = instList[0];
    const mappedInstance: PokemonInstance = {
      pokeId: rawInst.pokeId,
      pokemonId: rawInst.pokemonId,
      nickname: rawInst.nickname || '',
      level: rawInst.level,
      gender: (rawInst.gender as 'male' | 'female' | 'genderless') || 'genderless',
      variantId: rawInst.variantId,
      variantName: rawInst.variantName,
      isShiny: Boolean(rawInst.isShiny),
      gameId: rawInst.gameId as GameId | undefined,
      isHomeGift: Boolean(rawInst.isHomeGift),
      isTraded: Boolean(rawInst.isTraded),
      storedInHome: Boolean(rawInst.storedInHome),
      isInLivingBox: Boolean(rawInst.isInLivingBox),
      livingBoxNumber: rawInst.livingBoxNumber,
      livingBoxSlot: rawInst.livingBoxSlot,
      notes: rawInst.notes,
      ownerId: rawInst.ownerId,
      ownerEmail: rawInst.ownerEmail,
      trainerName: rawInst.trainerName,
      isRescued: Boolean(rawInst.isRescued),
      rescuedAt: rawInst.rescuedAt,
      createdAt: rawInst.createdAt,
      updatedAt: rawInst.updatedAt,
    };

    out.push({
      rescueId: String(rec.rescueId || mappedInstance.pokeId),
      instance: mappedInstance,
      deletedAt,
      expiresAt,
      deletedFrom: (rec.deletedFrom as any) || 'inventory',
      originalOwnerId: rec.originalOwnerId ? String(rec.originalOwnerId) : mappedInstance.ownerId,
      originalTrainerName: rec.originalTrainerName ? String(rec.originalTrainerName) : mappedInstance.trainerName,
    });
  }
  return out.slice(0, 1000);
}

export function sanitizeDexArray(ids: number[]): number[] {
  const unique = Array.from(
    new Set(
      ids
        .map((n) => Math.trunc(Number(n)))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 1025)
    )
  ).sort((a, b) => a - b);
  return unique.slice(0, MAX_DEX_ARRAY_SIZE);
}

export function sanitizeCaughtVariants(variants: string[]): string[] {
  const unique = Array.from(
    new Set(
      variants
        .map((v) => String(v).trim().slice(0, MAX_VARIANT_ID_LENGTH))
        .filter((v) => v.length > 0)
    )
  );
  return unique.slice(0, MAX_VARIANTS_ARRAY_SIZE);
}

export function sanitizeBoxSelectedVariants(variants: string[]): string[] {
  const byPokemon = new Map<string, string>();
  for (const raw of variants) {
    const clean = String(raw).trim().slice(0, MAX_VARIANT_ID_LENGTH);
    if (!clean.includes(':')) continue;
    const [pokeId] = clean.split(':');
    if (pokeId) {
      byPokemon.set(pokeId, clean);
    }
  }
  return Array.from(byPokemon.values()).slice(0, MAX_BOX_SELECTED_VARIANTS_SIZE);
}

export function sanitizeBoxSelectedGames(entries: string[]): string[] {
  const validGames = new Set<string>(ALL_GAME_IDS);
  const byPokemon = new Map<string, string>();
  for (const raw of entries) {
    const clean = String(raw).trim().slice(0, MAX_VARIANT_ID_LENGTH);
    if (!clean.includes(':')) continue;
    const [pokeId, gameId] = clean.split(':');
    const num = Number(pokeId);
    if (Number.isInteger(num) && num >= 1 && num <= 1025 && validGames.has(gameId)) {
      byPokemon.set(String(num), `${num}:${gameId}`);
    }
  }
  return Array.from(byPokemon.values()).slice(0, MAX_BOX_SELECTED_GAMES_SIZE);
}

export function sanitizeOwnedGames(games: string[]): GameId[] {
  const validSet = new Set<string>(ALL_GAME_IDS);
  const unique = Array.from(
    new Set(
      games
        .map((g) => String(g).trim().slice(0, MAX_GAME_ID_LENGTH))
        .filter((g) => validSet.has(g))
    )
  ) as GameId[];
  return unique.slice(0, MAX_OWNED_GAMES_SIZE);
}

export function sanitizeOwnedDlcs(dlcs: string[]): string[] {
  const unique = Array.from(
    new Set(
      dlcs
        .map((d) => String(d).trim().slice(0, MAX_DLC_ID_LENGTH))
        .filter((d) => d.length > 0)
    )
  );
  return unique.slice(0, MAX_OWNED_DLCS_SIZE);
}

export function sanitizeGameCatchesMap(rawMap: unknown): GameCatchesMap {
  const clean = createEmptyGameCatchesMap();
  if (!rawMap || typeof rawMap !== 'object') return clean;
  const record = rawMap as Record<string, unknown>;
  for (const gameId of ALL_GAME_IDS) {
    const val = record[gameId];
    clean[gameId] = Array.isArray(val) ? sanitizeDexArray(val) : [];
  }
  return clean;
}

export function sanitizeTrainerName(name: string): string {
  const trimmed = String(name || 'Guest').trim().slice(0, MAX_TRAINER_NAME_LENGTH);
  return trimmed.length >= 1 ? trimmed : 'Guest';
}

export function sanitizeGameFilter(filter: string): string {
  const trimmed = String(filter || 'all').trim().slice(0, MAX_GAME_FILTER_LENGTH);
  return trimmed.length >= 1 ? trimmed : 'all';
}

// Track active session and listeners for both Firebase Auth and offline cached auth
const authListeners = new Set<(user: User | null) => void>();
let currentSessionUser: User | null = null;
let isInitialAuthResolved = false;

// Check if we already have an active offline user session from earlier
const savedUid = getActiveOfflineUid();
if (savedUid) {
  const cachedAcc = getCachedAccountByUid(savedUid);
  if (cachedAcc) {
    currentSessionUser = createOfflineUser(cachedAcc);
  }
}

// Hook into Firebase Auth
firebaseOnAuthStateChanged(auth, (fbUser) => {
  isInitialAuthResolved = true;
  if (fbUser) {
    currentSessionUser = fbUser;
    setActiveOfflineUid(fbUser.uid);
    // Cache account details if displayName exists
    const existing = getCachedAccountByUid(fbUser.uid);
    if (existing && fbUser.displayName && fbUser.displayName !== existing.displayName) {
      existing.displayName = fbUser.displayName;
      saveCachedAuthAccount(existing);
    }
    authListeners.forEach((listener) => {
      try {
        listener(fbUser);
      } catch (err) {
        console.warn('Auth listener error:', err);
      }
    });
  } else {
    // If device is currently offline and we have a cached session, preserve it
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    const activeUid = getActiveOfflineUid();
    if (isOffline && activeUid) {
      const cachedAcc = getCachedAccountByUid(activeUid);
      if (cachedAcc) {
        currentSessionUser = createOfflineUser(cachedAcc);
        authListeners.forEach((listener) => listener(currentSessionUser));
        return;
      }
    }
    currentSessionUser = null;
    clearActiveOfflineUid();
    authListeners.forEach((listener) => listener(null));
  }
});

/**
 * Universal auth state subscriber supporting both online Firebase accounts and offline cached users.
 */
export function onAuthStateChanged(
  _auth: unknown,
  callback: (user: User | null) => void
): Unsubscribe {
  authListeners.add(callback);
  if (currentSessionUser) {
    callback(currentSessionUser);
  } else if (isInitialAuthResolved) {
    callback(null);
  } else {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      const activeUid = getActiveOfflineUid();
      if (activeUid) {
        const cachedAcc = getCachedAccountByUid(activeUid);
        if (cachedAcc) {
          const offlineUser = createOfflineUser(cachedAcc);
          currentSessionUser = offlineUser;
          callback(offlineUser);
          return () => authListeners.delete(callback);
        }
      }
      callback(null);
    }
  }

  return () => {
    authListeners.delete(callback);
  };
}

export { type User };

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Creates an account with email & password online and caches credentials locally for future offline login.
 */
export async function signUpWithEmail(
  email: string,
  pass: string,
  trainerName?: string
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  if (isOffline) {
    throw new Error(
      'Account creation requires an internet connection. If you previously created an account on this iPad/device, please switch to "Sign In" to authenticate offline.'
    );
  }

  const name = trainerName && trainerName.trim() ? trainerName.trim().slice(0, 24) : 'Trainer';
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  const user = userCredential.user;

  try {
    await updateProfile(user, { displayName: name });
  } catch {
    // ignore non-critical display name update error
  }

  // Cache credentials locally for future offline login on this device/iPad
  try {
    const salt = generateSalt();
    const passwordHash = await hashPasswordWithSalt(pass, salt);
    saveCachedAuthAccount({
      uid: user.uid,
      email: cleanEmail,
      displayName: name,
      salt,
      passwordHash,
      lastLoginAt: Date.now(),
    });
    setActiveOfflineUid(user.uid);
  } catch (err) {
    console.warn('Failed to cache credentials for offline use:', err);
  }

  currentSessionUser = user;
  authListeners.forEach((cb) => cb(user));
  return user;
}

/**
 * Signs in with email and password.
 * When online, authenticates via Firebase and updates cached credentials.
 * When offline, authenticates locally through cached account credentials.
 */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  if (isOffline) {
    // Authenticate locally through cached data
    const verifyResult = await verifyCachedCredentials(cleanEmail, pass);
    if (!verifyResult.success || !verifyResult.account) {
      throw new Error(
        verifyResult.error ||
          'No cached account found for this email on this device. Connect to the internet once to cache your credentials.'
      );
    }
    const offlineUser = createOfflineUser(verifyResult.account);
    currentSessionUser = offlineUser;
    setActiveOfflineUid(offlineUser.uid);
    authListeners.forEach((cb) => cb(offlineUser));
    return offlineUser;
  }

  // Attempt online Firebase sign-in
  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const user = userCredential.user;

    // Save/update cached credentials for future offline login
    try {
      const salt = generateSalt();
      const passwordHash = await hashPasswordWithSalt(pass, salt);
      saveCachedAuthAccount({
        uid: user.uid,
        email: cleanEmail,
        displayName: user.displayName || 'Trainer',
        salt,
        passwordHash,
        lastLoginAt: Date.now(),
      });
      setActiveOfflineUid(user.uid);
    } catch (err) {
      console.warn('Failed to update cached offline credentials:', err);
    }

    currentSessionUser = user;
    authListeners.forEach((cb) => cb(user));
    return user;
  } catch (onlineError: any) {
    const code = onlineError?.code || '';
    const msg = (onlineError?.message || '').toLowerCase();
    // If the network failed or client is offline, fall back to cached credentials
    if (
      code === 'auth/network-request-failed' ||
      code === 'auth/internal-error' ||
      msg.includes('network') ||
      msg.includes('offline')
    ) {
      const verifyResult = await verifyCachedCredentials(cleanEmail, pass);
      if (verifyResult.success && verifyResult.account) {
        const offlineUser = createOfflineUser(verifyResult.account);
        currentSessionUser = offlineUser;
        setActiveOfflineUid(offlineUser.uid);
        authListeners.forEach((cb) => cb(offlineUser));
        return offlineUser;
      }
      throw new Error(
        verifyResult.error ||
          'Network connection unavailable and no cached offline account found for this email.'
      );
    }

    throw onlineError;
  }
}

/**
 * Signs out the current user session (clears active session while preserving cached offline credentials).
 */
export async function signOutUser(): Promise<void> {
  clearActiveOfflineUid();
  currentSessionUser = null;
  authListeners.forEach((cb) => cb(null));
  try {
    await firebaseSignOut(auth);
  } catch {
    // ignore offline sign-out error
  }
}

function parseProfileSnapshotData(uid: string, raw: Record<string, unknown>): UserDexProfileData {
  return {
    ownerId: String(raw.ownerId || uid),
    trainerName: sanitizeTrainerName(String(raw.trainerName || 'Guest')),
    activeGameFilter: sanitizeGameFilter(String(raw.activeGameFilter || 'all')),
    isPublic: Boolean(raw.isPublic),
    caughtIds: sanitizeDexArray(Array.isArray(raw.caughtIds) ? raw.caughtIds : []),
    shinyIds: sanitizeDexArray(Array.isArray(raw.shinyIds) ? raw.shinyIds : []),
    livingIds: sanitizeDexArray(Array.isArray(raw.livingIds) ? raw.livingIds : []),
    caughtVariants: sanitizeCaughtVariants(
      Array.isArray(raw.caughtVariants) ? raw.caughtVariants : []
    ),
    boxSelectedVariants: sanitizeBoxSelectedVariants(
      Array.isArray(raw.boxSelectedVariants) ? raw.boxSelectedVariants : []
    ),
    boxSelectedGames: sanitizeBoxSelectedGames(
      Array.isArray(raw.boxSelectedGames) ? raw.boxSelectedGames : []
    ),
    ownedGames: Array.isArray(raw.ownedGames)
      ? sanitizeOwnedGames(raw.ownedGames)
      : ALL_GAME_IDS,
    ownedDlcs: sanitizeOwnedDlcs(Array.isArray(raw.ownedDlcs) ? raw.ownedDlcs : []),
    gameCatches: sanitizeGameCatchesMap(raw.gameCatches),
    inventory: sanitizeInventory(raw.inventory),
    rescueBin: sanitizeRescueBin(raw.rescueBin),
    caughtCount: Number(raw.caughtCount || 0),
    shinyCount: Number(raw.shinyCount || 0),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export async function fetchPublicDexProfile(
  uid: string
): Promise<UserDexProfileData | null> {
  if (!uid || uid.length > MAX_OWNER_ID_LENGTH || !OWNER_ID_REGEX.test(uid)) {
    return null;
  }
  const docRef = doc(db, 'userDexProfiles', uid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return parseProfileSnapshotData(uid, snap.data() as Record<string, unknown>);
}

/**
 * Subscribes to user profile changes. Emits locally cached data immediately,
 * and falls back gracefully when offline.
 */
export function subscribeToUserDexProfile(
  uid: string,
  onData: (profile: UserDexProfileData | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  // 1. Immediately emit locally cached profile if available
  const localCached = getLocallyCachedProfile(uid);
  if (localCached) {
    onData(localCached);
  }

  // 2. If device is currently offline, don't initiate remote onSnapshot
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return () => {};
  }

  const path = `userDexProfiles/${uid}`;
  const docRef = doc(db, 'userDexProfiles', uid);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const parsed = parseProfileSnapshotData(uid, snapshot.data() as Record<string, unknown>);
        saveLocallyCachedProfile(uid, parsed);
        onData(parsed);
      } else {
        if (!localCached) onData(null);
      }
    },
    (error) => {
      if (localCached) {
        onData(localCached);
      } else if (onError) {
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch (formattedErr) {
          if (onError && formattedErr instanceof Error) {
            onError(formattedErr);
          }
        }
      }
    }
  );
}

function enqueueOfflineActionHelper(action: any) {
  try {
    const raw = localStorage.getItem('homedex_offline_sync_queue');
    const queue = raw ? JSON.parse(raw) : [];
    const item = {
      ...action,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    let updatedQueue: any[];
    if (item.type === 'SYNC_USER_PROFILE') {
      updatedQueue = queue.filter((q: any) => q.type !== 'SYNC_USER_PROFILE');
      updatedQueue.push(item);
    } else {
      updatedQueue = [...queue, item];
    }
    localStorage.setItem('homedex_offline_sync_queue', JSON.stringify(updatedQueue));
  } catch (err) {
    console.warn('Failed to enqueue offline action:', err);
  }
}

/**
 * Saves user profile to local cache always, and syncs to Firestore or queues for offline sync.
 */
export async function saveUserDexProfile(
  uid: string,
  payload: {
    trainerName: string;
    activeGameFilter: string;
    isPublic: boolean;
    caughtIds: number[];
    shinyIds: number[];
    livingIds: number[];
    caughtVariants: string[];
    boxSelectedVariants: string[];
    boxSelectedGames: string[];
    ownedGames: string[];
    ownedDlcs: string[];
    gameCatches: GameCatchesMap;
    inventory?: SerializedPokemonInstance[];
    rescueBin?: RescueBinItem[];
  }
): Promise<void> {
  if (!uid || uid.length > MAX_OWNER_ID_LENGTH || !OWNER_ID_REGEX.test(uid)) {
    throw new Error('Invalid owner UID format.');
  }

  const caughtIds = sanitizeDexArray(payload.caughtIds);
  const shinyIds = sanitizeDexArray(payload.shinyIds);
  const livingIds = sanitizeDexArray(payload.livingIds);
  const caughtVariants = sanitizeCaughtVariants(payload.caughtVariants);
  const boxSelectedVariants = sanitizeBoxSelectedVariants(payload.boxSelectedVariants);
  const boxSelectedGames = sanitizeBoxSelectedGames(payload.boxSelectedGames);
  const ownedGames = sanitizeOwnedGames(payload.ownedGames);
  const ownedDlcs = sanitizeOwnedDlcs(payload.ownedDlcs);
  const gameCatches = sanitizeGameCatchesMap(payload.gameCatches);
  const inventory = sanitizeInventory(payload.inventory);
  const rescueBin = sanitizeRescueBin(payload.rescueBin);
  const trainerName = sanitizeTrainerName(payload.trainerName);
  const activeGameFilter = sanitizeGameFilter(payload.activeGameFilter);
  const isPublic = Boolean(payload.isPublic);

  const fullProfile: UserDexProfileData = {
    ownerId: uid,
    trainerName,
    activeGameFilter,
    isPublic,
    caughtIds,
    shinyIds,
    livingIds,
    caughtVariants,
    boxSelectedVariants,
    boxSelectedGames,
    ownedGames,
    ownedDlcs,
    gameCatches,
    inventory,
    rescueBin,
    caughtCount: caughtIds.length,
    shinyCount: shinyIds.length,
    updatedAt: Date.now(),
  };

  // Always save locally first for instant access
  saveLocallyCachedProfile(uid, fullProfile);

  // If offline, enqueue offline sync action
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOfflineActionHelper({
      type: 'SYNC_USER_PROFILE',
      payload: { uid, profileData: fullProfile },
    });
    return;
  }

  const path = `userDexProfiles/${uid}`;
  const docRef = doc(db, 'userDexProfiles', uid);

  try {
    const snap = await getDoc(docRef);
    const profilePayload = removeUndefinedProperties({
      ownerId: uid,
      trainerName,
      activeGameFilter,
      isPublic,
      caughtIds,
      shinyIds,
      livingIds,
      caughtVariants,
      boxSelectedVariants,
      boxSelectedGames,
      ownedGames,
      ownedDlcs,
      gameCatches,
      inventory,
      rescueBin,
      caughtCount: caughtIds.length,
      shinyCount: shinyIds.length,
    });

    if (!snap.exists()) {
      await setDoc(docRef, {
        ...profilePayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const { ownerId: _ignoredOwner, ...updateFields } = profilePayload;
      await updateDoc(docRef, {
        ...updateFields,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    // If saving remotely fails due to network error, queue offline sync
    enqueueOfflineActionHelper({
      type: 'SYNC_USER_PROFILE',
      payload: { uid, profileData: fullProfile },
    });
  }
}

/**
 * Queries all registered Pokepets created by or owned by the given UID
 * from the universal registeredPokepets collection across all devices.
 */
export async function getUserRegisteredPokepets(uid: string): Promise<SerializedPokemonInstance[]> {
  if (!uid || uid.length > MAX_OWNER_ID_LENGTH) return [];
  if (typeof navigator !== 'undefined' && !navigator.onLine) return [];

  try {
    const q = query(
      collection(db, 'registeredPokepets'),
      where('ownerId', '==', uid)
    );
    const snap = await getDocs(q);
    const results: SerializedPokemonInstance[] = [];
    snap.forEach((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const cleanPokeId = String(data.pokeId || docSnap.id).trim().toUpperCase();
        if (cleanPokeId.startsWith('ID') && cleanPokeId.length === 12) {
          const item: SerializedPokemonInstance = {
            pokeId: cleanPokeId,
            pokemonId: Number(data.pokemonId),
            level: Number(data.level || 50),
            gender: String(data.gender || 'genderless') as any,
            variantId: String(data.variantId || `${data.pokemonId}:base`),
            variantName: String(data.variantName || 'Standard'),
            isShiny: Boolean(data.isShiny),
            isHomeGift: Boolean(data.isHomeGift),
            isTraded: Boolean(data.isTraded),
            storedInHome: Boolean(data.storedInHome),
            isInLivingBox: Boolean(data.isInLivingBox),
            isRescued: Boolean(data.isRescued),
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
          };
          if (data.nickname) item.nickname = String(data.nickname);
          if (data.notes) item.notes = String(data.notes);
          if (data.gameId) item.gameId = String(data.gameId) as any;
          if (data.livingBoxNumber) item.livingBoxNumber = Number(data.livingBoxNumber);
          if (data.livingBoxSlot) item.livingBoxSlot = Number(data.livingBoxSlot);
          if (data.ownerId) item.ownerId = String(data.ownerId);
          if (data.ownerEmail) item.ownerEmail = String(data.ownerEmail);
          if (data.trainerName) item.trainerName = String(data.trainerName);
          results.push(item);
        }
      }
    });
    return results;
  } catch (err) {
    console.warn('Could not query user registeredPokepets:', err);
    return [];
  }
}


export async function ensureSignedInUser(): Promise<User> {
  if (auth.currentUser) return auth.currentUser;
  const anonCredential = await signInAnonymously(auth);
  return anonCredential.user;
}

/**
 * Checks if a 12-digit POKEID is already registered across the entire database.
 */
export async function checkIsPokeIdTakenInDatabase(pokeId: string): Promise<boolean> {
  const cleanId = pokeId.trim().toUpperCase();
  if (!cleanId.startsWith('ID') || cleanId.length !== 12) return false;
  try {
    const snap = await getDoc(doc(db, 'registeredPokepets', cleanId));
    return snap.exists();
  } catch {
    return false;
  }
}

/**
 * Generates an automatically unique, non-sequential 12-digit POKEID site-wide.
 * Checks Firestore registeredPokepets to ensure no collisions across all users.
 */
export async function generateUniqueSiteWidePokeId(existingLocalIds?: Set<string>): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let attempts = 0;
  while (attempts < 100) {
    attempts++;
    let randomPart = '';
    for (let i = 0; i < 10; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const candidate = `ID${randomPart}`;
    if (existingLocalIds && existingLocalIds.has(candidate)) {
      continue;
    }
    const isTaken = await checkIsPokeIdTakenInDatabase(candidate);
    if (!isTaken) {
      return candidate;
    }
  }
  // Fallback timestamp mix
  return `ID${Date.now().toString(36).toUpperCase().padStart(10, 'X').slice(-10)}`;
}

/**
 * Saves a registered Pokepet into the central universal registeredPokepets collection.
 */
export async function savePokepetToUniversalDatabase(
  item: SerializedPokemonInstance,
  ownerId: string,
  trainerName: string
): Promise<void> {
  const cleanPokeId = item.pokeId.trim().toUpperCase();
  const path = `registeredPokepets/${cleanPokeId}`;
  const docRef = doc(db, 'registeredPokepets', cleanPokeId);

  const payload = {
    pokeId: cleanPokeId,
    ownerId,
    trainerName: sanitizeTrainerName(trainerName),
    pokemonId: item.pokemonId,
    level: item.level,
    gender: item.gender,
    variantId: item.variantId,
    variantName: item.variantName,
    isShiny: item.isShiny,
    isHomeGift: item.isHomeGift,
    isTraded: item.isTraded,
    storedInHome: item.storedInHome,
    isInLivingBox: item.isInLivingBox,
    gameId: item.gameId || null,
    nickname: item.nickname || '',
    notes: item.notes || '',
    livingBoxNumber: item.livingBoxNumber || null,
    livingBoxSlot: item.livingBoxSlot || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // If offline, enqueue offline sync immediately
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOfflineActionHelper({
      type: 'REGISTER_POKEPET',
      payload: { instance: item, ownerId, trainerName },
    });
    return;
  }

  try {
    await setDoc(docRef, payload);
  } catch (error) {
    // Fail-soft: enqueue offline action so it syncs once connection is restored
    enqueueOfflineActionHelper({
      type: 'REGISTER_POKEPET',
      payload: { instance: item, ownerId, trainerName },
    });
  }
}

/**
 * Updates a registered Pokepet in the universal database.
 * Notice: pokeId and pokemonId (species) CANNOT be edited.
 */
export async function updatePokepetInUniversalDatabase(
  item: SerializedPokemonInstance,
  ownerId: string,
  trainerName: string
): Promise<void> {
  const cleanPokeId = item.pokeId.trim().toUpperCase();
  const path = `registeredPokepets/${cleanPokeId}`;
  const docRef = doc(db, 'registeredPokepets', cleanPokeId);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOfflineActionHelper({
      type: 'REGISTER_POKEPET',
      payload: { instance: item, ownerId, trainerName },
    });
    return;
  }

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      // If it doesn't exist remotely yet, create it
      await savePokepetToUniversalDatabase(item, ownerId, trainerName);
      return;
    }

    await updateDoc(docRef, {
      trainerName: sanitizeTrainerName(trainerName),
      level: item.level,
      gender: item.gender,
      variantId: item.variantId,
      variantName: item.variantName,
      isShiny: item.isShiny,
      isHomeGift: item.isHomeGift,
      isTraded: item.isTraded,
      storedInHome: item.storedInHome,
      isInLivingBox: item.isInLivingBox,
      gameId: item.gameId || null,
      nickname: item.nickname || '',
      notes: item.notes || '',
      livingBoxNumber: item.livingBoxNumber || null,
      livingBoxSlot: item.livingBoxSlot || null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    enqueueOfflineActionHelper({
      type: 'REGISTER_POKEPET',
      payload: { instance: item, ownerId, trainerName },
    });
  }
}

/**
 * Deletes a registered Pokepet from the universal database.
 */
export async function deletePokepetFromUniversalDatabase(pokeId: string): Promise<void> {
  const cleanPokeId = pokeId.trim().toUpperCase();
  const path = `registeredPokepets/${cleanPokeId}`;
  const docRef = doc(db, 'registeredPokepets', cleanPokeId);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOfflineActionHelper({
      type: 'DELETE_POKEPET',
      payload: { pokeId: cleanPokeId },
    });
    return;
  }

  try {
    await deleteDoc(docRef);
  } catch (error) {
    enqueueOfflineActionHelper({
      type: 'DELETE_POKEPET',
      payload: { pokeId: cleanPokeId },
    });
  }
}

export interface PokepetSearchResult {
  success: boolean;
  pokepet?: SerializedPokemonInstance;
  trainerName?: string;
  error?: string;
}

/**
 * Searches for any Pokepet matching a 12-digit POKEID.
 * Checks local inventory, universal registeredPokepets database, and cached profiles.
 * If not found / not created, returns an explicit error.
 */
export async function searchPokepetByPokeId(
  pokeId: string,
  localInventory: SerializedPokemonInstance[],
  currentTrainerName: string
): Promise<PokepetSearchResult> {
  const cleanId = pokeId.trim().toUpperCase();
  if (!cleanId.startsWith('ID') || cleanId.length !== 12) {
    return {
      success: false,
      error: 'Invalid POKEID format. POKEIDs must be exactly 12 characters and start with "ID" (e.g. ID8F3K9L2M4P).',
    };
  }

  // 1. Check local inventory first
  const localMatch = localInventory.find((inv) => inv.pokeId.toUpperCase() === cleanId);
  if (localMatch) {
    return {
      success: true,
      pokepet: localMatch,
      trainerName: currentTrainerName,
    };
  }

  // 2. Query universal Firestore registeredPokepets database
  try {
    const snap = await getDoc(doc(db, 'registeredPokepets', cleanId));
    if (snap.exists()) {
      const data = snap.data();
      const pokepet: SerializedPokemonInstance = {
        pokeId: String(data.pokeId || cleanId),
        pokemonId: Number(data.pokemonId),
        nickname: data.nickname ? String(data.nickname) : undefined,
        level: Number(data.level || 50),
        gender: String(data.gender || 'genderless'),
        variantId: String(data.variantId || `${data.pokemonId}:base`),
        variantName: String(data.variantName || 'Standard'),
        isShiny: Boolean(data.isShiny),
        gameId: data.gameId ? String(data.gameId) : undefined,
        isHomeGift: Boolean(data.isHomeGift),
        isTraded: Boolean(data.isTraded),
        storedInHome: Boolean(data.storedInHome),
        isInLivingBox: Boolean(data.isInLivingBox),
        livingBoxNumber: data.livingBoxNumber ? Number(data.livingBoxNumber) : undefined,
        livingBoxSlot: data.livingBoxSlot ? Number(data.livingBoxSlot) : undefined,
        notes: data.notes ? String(data.notes) : undefined,
        ownerId: data.ownerId ? String(data.ownerId) : undefined,
        trainerName: data.trainerName ? String(data.trainerName) : undefined,
        isRescued: Boolean(data.isRescued),
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
      };
      return {
        success: true,
        pokepet,
        trainerName: String(data.trainerName || 'Registered Trainer'),
      };
    }
  } catch (err) {
    console.warn('Error reading from registeredPokepets:', err);
  }

  // 3. Check public profiles cache stored in localStorage
  try {
    const rawPublic = localStorage.getItem('homedex_cached_public_profiles');
    if (rawPublic) {
      const parsed = JSON.parse(rawPublic);
      if (Array.isArray(parsed)) {
        for (const prof of parsed) {
          if (prof && Array.isArray(prof.inventory)) {
            const hit = prof.inventory.find(
              (inv: SerializedPokemonInstance) => inv.pokeId.toUpperCase() === cleanId
            );
            if (hit) {
              return {
                success: true,
                pokepet: hit,
                trainerName: prof.trainerName || 'Shared Trainer',
              };
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // 4. If not found in any database, return error
  return {
    success: false,
    error: `POKEID "${cleanId}" does not exist in the database. No pet Pokémon has been registered with this POKEID.`,
  };
}

// Backwards-compatible alias for any callers
export async function searchSpecimenByPokeId(
  pokeId: string,
  localInventory: SerializedPokemonInstance[],
  currentTrainerName: string
): Promise<{ specimen: SerializedPokemonInstance; trainerName: string } | null> {
  const res = await searchPokepetByPokeId(pokeId, localInventory, currentTrainerName);
  if (res.success && res.pokepet) {
    return {
      specimen: res.pokepet,
      trainerName: res.trainerName || currentTrainerName,
    };
  }
  return null;
}

