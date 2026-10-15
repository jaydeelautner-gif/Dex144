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
  setAccountPin,
  removeAccountPin,
  hasPinSet,
  verifyAccountPin,
  isFirstLoginOnDevice,
  type CachedAuthAccount,
} from './utils/offlineAuth';

import {
  getFirestore,
  runTransaction,
  collection,
  query,
  where,
  limit,
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

import type { EvolutionRecord } from './data/pokemonInventoryData';
import { sanitizeEvolutionHistory } from './utils/evolutionHistory';

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
  currentGameId?: string;
  evolutionHistory?: EvolutionRecord[];
}

/**
 * `inventory` and `rescueBin` are optional local-cache-only fields.
 * They are NOT stored on the Firestore parent document — they live in subcollections:
 *   userDexProfiles/{uid}/inventory/{pokeId}
 *   userDexProfiles/{uid}/rescueBin/{rescueId}
 *
 * `friendCode` and `friends` are stored on the parent document and are used
 * by the mutual friends system.
 */
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
  /** Local cache only — not stored in the Firestore parent document. */
  inventory?: SerializedPokemonInstance[];
  /** Local cache only — not stored in the Firestore parent document. */
  rescueBin?: RescueBinItem[];
  caughtCount: number;
  shinyCount: number;
  /** Unique short code (e.g. "DX-4K7P2M") that other trainers can use to add this user. */
  friendCode?: string;
  /** Array of UIDs this user has mutually friended. */
  friends?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export function removeUndefinedProperties<T>(val: T): T {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) {
    return val.map((item) => removeUndefinedProperties(item)) as unknown as T;
  }
  if (typeof val === 'object') {
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
    if (typeof rec.currentGameId === 'string' && ALL_GAME_IDS.includes(rec.currentGameId as GameId)) inst.currentGameId = rec.currentGameId;
    if (Array.isArray(rec.evolutionHistory)) inst.evolutionHistory = sanitizeEvolutionHistory(rec.evolutionHistory);
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

// -------------------- AUTH STATE --------------------

const authListeners = new Set<(user: User | null) => void>();
let currentSessionUser: User | null = null;
let isInitialAuthResolved = false;

const savedUid = getActiveOfflineUid();
if (savedUid) {
  const cachedAcc = getCachedAccountByUid(savedUid);
  if (cachedAcc) {
    currentSessionUser = createOfflineUser(cachedAcc);
  }
}

firebaseOnAuthStateChanged(auth, (fbUser) => {
  isInitialAuthResolved = true;
  if (fbUser) {
    currentSessionUser = fbUser;
    setActiveOfflineUid(fbUser.uid);
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
    // ignore
  }

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

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  if (isOffline) {
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

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const user = userCredential.user;

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
 * Sign in using quick-entry PIN on an offline-ready device.
 * Enforces: Cannot be used for the first time on a device.
 */
export async function signInWithPin(emailOrUid: string, pin: string): Promise<User> {
  const verifyResult = await verifyAccountPin(emailOrUid, pin);
  if (!verifyResult.success || !verifyResult.account) {
    throw new Error(verifyResult.error || 'PIN authentication failed.');
  }

  const offlineUser = createOfflineUser(verifyResult.account);
  currentSessionUser = offlineUser;
  setActiveOfflineUid(offlineUser.uid);
  authListeners.forEach((cb) => cb(offlineUser));
  return offlineUser;
}

export {
  setAccountPin,
  removeAccountPin,
  hasPinSet,
  verifyAccountPin,
  isFirstLoginOnDevice,
};

export async function signOutUser(): Promise<void> {
  clearActiveOfflineUid();
  currentSessionUser = null;
  authListeners.forEach((cb) => cb(null));
  try {
    await firebaseSignOut(auth);
  } catch {
    // ignore
  }
}

// -------------------- PROFILE PARSING --------------------

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
    // NEW: friend fields
    friendCode: raw.friendCode ? String(raw.friendCode).slice(0, 16) : undefined,
    friends: Array.isArray(raw.friends)
      ? raw.friends.filter((x): x is string => typeof x === 'string').slice(0, 500)
      : [],
    caughtCount: Number(raw.caughtCount || 0),
    shinyCount: Number(raw.shinyCount || 0),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// -------------------- PUBLIC PROFILE FETCH --------------------

export async function fetchPublicDexProfile(
  uid: string
): Promise<UserDexProfileData | null> {
  if (!uid || uid.length > MAX_OWNER_ID_LENGTH || !OWNER_ID_REGEX.test(uid)) {
    return null;
  }
  const docRef = doc(db, 'userDexProfiles', uid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;

  const raw = snap.data() as Record<string, unknown>;
  const profile = parseProfileSnapshotData(uid, raw);

  let inventory: SerializedPokemonInstance[] = [];
  let rescueBin: RescueBinItem[] = [];

  try {
    const invSnap = await getDocs(collection(db, 'userDexProfiles', uid, 'inventory'));
    inventory = invSnap.docs
      .map((d) => sanitizeInventory([d.data()])[0])
      .filter((x): x is SerializedPokemonInstance => Boolean(x));
  } catch (err) {
    console.warn('Could not fetch inventory subcollection:', err);
  }

  try {
    const binSnap = await getDocs(collection(db, 'userDexProfiles', uid, 'rescueBin'));
    rescueBin = sanitizeRescueBin(binSnap.docs.map((d) => d.data()));
  } catch (err) {
    console.warn('Could not fetch rescueBin subcollection:', err);
  }

  if (inventory.length === 0 && Array.isArray(raw.inventory) && raw.inventory.length > 0) {
    inventory = sanitizeInventory(raw.inventory);
  }
  if (rescueBin.length === 0 && Array.isArray(raw.rescueBin) && raw.rescueBin.length > 0) {
    rescueBin = sanitizeRescueBin(raw.rescueBin);
  }

  profile.inventory = inventory;
  profile.rescueBin = rescueBin;
  return profile;
}

// -------------------- SUBSCRIPTIONS --------------------

export function subscribeToUserDexProfile(
  uid: string,
  onData: (profile: UserDexProfileData | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const localCached = getLocallyCachedProfile(uid);
  if (localCached) {
    onData(localCached);
  }

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  if (isOffline) {
    const handleOnline = () => {
      subscribeToUserDexProfile(uid, onData, onError);
    };
    window.addEventListener('online', handleOnline, { once: true });
    return () => window.removeEventListener('online', handleOnline);
  }

  const path = `userDexProfiles/${uid}`;
  const docRef = doc(db, 'userDexProfiles', uid);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const parsed = parseProfileSnapshotData(uid, snapshot.data() as Record<string, unknown>);
        const localNow = getLocallyCachedProfile(uid);
        if (localNow) {
          parsed.inventory = localNow.inventory;
          parsed.rescueBin = localNow.rescueBin;
        }
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

export function subscribeToUserInventory(
  uid: string,
  onData: (items: SerializedPokemonInstance[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'userDexProfiles', uid, 'inventory'),
    (snap) => {
      const items: SerializedPokemonInstance[] = [];
      for (const d of snap.docs) {
        const clean = sanitizeInventory([d.data()]);
        if (clean[0]) items.push(clean[0]);
      }
      onData(items);
    },
    (err) => {
      console.warn('Inventory subcollection error:', err);
      if (onError) onError(err instanceof Error ? err : new Error(String(err)));
    }
  );
}

export function subscribeToUserRescueBin(
  uid: string,
  onData: (items: RescueBinItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return () => {};
  }
  return onSnapshot(
    collection(db, 'userDexProfiles', uid, 'rescueBin'),
    (snap) => {
      const items = sanitizeRescueBin(snap.docs.map((d) => d.data()));
      onData(items);
    },
    (err) => {
      console.warn('Rescue bin subcollection error:', err);
      if (onError) onError(err instanceof Error ? err : new Error(String(err)));
    }
  );
}

// -------------------- OFFLINE QUEUE --------------------

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
    try {
      window.dispatchEvent(new Event('homedex-sync-queue-changed'));
    } catch {
      // ignore
    }
  } catch (err) {
    console.warn('Failed to enqueue offline action:', err);
  }
}

export async function drainOfflineSyncQueue(): Promise<{ processed: number; failed: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { processed: 0, failed: 0 };
  }

  let queue: any[] = [];
  try {
    const raw = localStorage.getItem('homedex_offline_sync_queue');
    queue = raw ? JSON.parse(raw) : [];
  } catch {
    return { processed: 0, failed: 0 };
  }

  if (!Array.isArray(queue) || queue.length === 0) {
    return { processed: 0, failed: 0 };
  }

  const remaining: any[] = [];
  let processed = 0;
  let failed = 0;

  for (const action of queue) {
    try {
      switch (action.type) {
        case 'SYNC_USER_PROFILE': {
          const uid = action.payload.uid;
          const meta = action.payload.metadata || action.payload.profileData;
          if (uid && meta) {
            await writeProfileMetadataToFirestore(uid, meta);
          }
          break;
        }
        case 'REGISTER_POKEPET':
          await savePokepetToUniversalDatabase(
            action.payload.instance,
            action.payload.ownerId,
            action.payload.trainerName,
            false
          );
          break;
        case 'DELETE_POKEPET':
          await deletePokepetFromUniversalDatabase(action.payload.pokeId, false);
          break;
        case 'SAVE_POKEPET_SUBCOLLECTION':
          await writePokepetToSubcollection(action.payload.uid, action.payload.item);
          break;
        case 'DELETE_POKEPET_SUBCOLLECTION':
          await writeDeletePokepetFromSubcollection(action.payload.uid, action.payload.pokeId);
          break;
        case 'SAVE_RESCUE_SUBCOLLECTION':
          await writeRescueItemToSubcollection(action.payload.uid, action.payload.item);
          break;
        case 'DELETE_RESCUE_SUBCOLLECTION':
          await writeDeleteRescueItemFromSubcollection(action.payload.uid, action.payload.rescueId);
          break;
        default:
          throw new Error(`Unknown offline action type retained for retry: ${action.type}`);
      }
      processed++;
    } catch (err) {
      console.warn('Failed to drain action:', action.type, err);
      failed++;
      remaining.push(action);
    }
  }

  try {
    const attempted = new Set(queue.map(action => action.id));
    const latest = JSON.parse(localStorage.getItem('homedex_offline_sync_queue') || '[]');
    const appended = Array.isArray(latest) ? latest.filter(action => !attempted.has(action.id)) : [];
    localStorage.setItem('homedex_offline_sync_queue', JSON.stringify([...remaining, ...appended]));
  } catch {
    // ignore
  }

  try {
    window.dispatchEvent(new Event('homedex-sync-queue-changed'));
  } catch {
    // ignore
  }

  return { processed, failed };
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    drainOfflineSyncQueue().catch(() => {});
  });
}

// -------------------- PROFILE SAVE --------------------

async function writeProfileMetadataToFirestore(
  uid: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const cleanMetadata = removeUndefinedProperties(metadata);
  const docRef = doc(db, 'userDexProfiles', uid);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    await setDoc(docRef, {
      ...cleanMetadata,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    const { ownerId: _ignoredOwner, ...updateFields } = cleanMetadata;
    await updateDoc(docRef, {
      ...updateFields,
      updatedAt: serverTimestamp(),
    });
  }
}

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
  saveLocallyCachedProfile(uid, fullProfile);

  const metadata = {
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
    caughtCount: caughtIds.length,
    shinyCount: shinyIds.length,
  };

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOfflineActionHelper({
      type: 'SYNC_USER_PROFILE',
      payload: { uid, metadata },
    });
    return;
  }

  try {
    await writeProfileMetadataToFirestore(uid, metadata);
  } catch (error) {
    console.warn('Firestore metadata save failed, queued for retry:', error);
    enqueueOfflineActionHelper({
      type: 'SYNC_USER_PROFILE',
      payload: { uid, metadata },
    });
  }
}

// -------------------- SUBCOLLECTION WRITE HELPERS --------------------

async function writePokepetToSubcollection(
  uid: string,
  item: SerializedPokemonInstance
): Promise<void> {
  const clean = sanitizeInventory([item])[0];
  if (!clean) throw new Error('Invalid pokepet instance.');
  const docRef = doc(db, 'userDexProfiles', uid, 'inventory', clean.pokeId);
  await setDoc(
    docRef,
    removeUndefinedProperties({ ...clean, ownerId: uid, updatedAt: Date.now() }),
    { merge: true }
  );
}

async function writeDeletePokepetFromSubcollection(uid: string, pokeId: string): Promise<void> {
  await deleteDoc(doc(db, 'userDexProfiles', uid, 'inventory', pokeId));
}

async function writeRescueItemToSubcollection(uid: string, item: RescueBinItem): Promise<void> {
  const clean = sanitizeRescueBin([item]);
  if (!clean[0]) throw new Error('Invalid rescue item.');
  const docRef = doc(db, 'userDexProfiles', uid, 'rescueBin', clean[0].rescueId);
  await setDoc(docRef, removeUndefinedProperties(clean[0]), { merge: true });
}

async function writeDeleteRescueItemFromSubcollection(uid: string, rescueId: string): Promise<void> {
  await deleteDoc(doc(db, 'userDexProfiles', uid, 'rescueBin', rescueId));
}

export async function savePokepetToUserCollection(
  uid: string,
  item: SerializedPokemonInstance
): Promise<void> {
  if (!uid || !OWNER_ID_REGEX.test(uid)) throw new Error('Invalid UID.');
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOfflineActionHelper({
      type: 'SAVE_POKEPET_SUBCOLLECTION',
      payload: { uid, item },
    });
    return;
  }
  try {
    await writePokepetToSubcollection(uid, item);
  } catch (err) {
    console.error('savePokepetToUserCollection FAILED', err);
    enqueueOfflineActionHelper({
      type: 'SAVE_POKEPET_SUBCOLLECTION',
      payload: { uid, item },
    });
    throw err;
  }
}

export async function deletePokepetFromUserCollection(uid: string, pokeId: string): Promise<void> {
  if (!uid || !OWNER_ID_REGEX.test(uid)) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOfflineActionHelper({
      type: 'DELETE_POKEPET_SUBCOLLECTION',
      payload: { uid, pokeId },
    });
    return;
  }
  try {
    await writeDeletePokepetFromSubcollection(uid, pokeId);
  } catch (err) {
    enqueueOfflineActionHelper({
      type: 'DELETE_POKEPET_SUBCOLLECTION',
      payload: { uid, pokeId },
    });
  }
}

export async function saveRescueItemToUserCollection(uid: string, item: RescueBinItem): Promise<void> {
  if (!uid || !OWNER_ID_REGEX.test(uid)) throw new Error('Invalid UID.');
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOfflineActionHelper({
      type: 'SAVE_RESCUE_SUBCOLLECTION',
      payload: { uid, item },
    });
    return;
  }
  try {
    await writeRescueItemToSubcollection(uid, item);
  } catch (err) {
    enqueueOfflineActionHelper({
      type: 'SAVE_RESCUE_SUBCOLLECTION',
      payload: { uid, item },
    });
    throw err;
  }
}

export async function deleteRescueItemFromUserCollection(uid: string, rescueId: string): Promise<void> {
  if (!uid || !OWNER_ID_REGEX.test(uid)) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOfflineActionHelper({
      type: 'DELETE_RESCUE_SUBCOLLECTION',
      payload: { uid, rescueId },
    });
    return;
  }
  try {
    await writeDeleteRescueItemFromSubcollection(uid, rescueId);
  } catch (err) {
    enqueueOfflineActionHelper({
      type: 'DELETE_RESCUE_SUBCOLLECTION',
      payload: { uid, rescueId },
    });
  }
}

export async function migrateLegacyInventoryToSubcollection(
  uid: string
): Promise<{ migrated: number }> {
  if (!uid || !OWNER_ID_REGEX.test(uid)) return { migrated: 0 };
  const docRef = doc(db, 'userDexProfiles', uid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return { migrated: 0 };

  const raw = snap.data() as Record<string, unknown>;
  const legacyInventory = Array.isArray(raw.inventory) ? sanitizeInventory(raw.inventory) : [];
  const legacyRescueBin = Array.isArray(raw.rescueBin) ? sanitizeRescueBin(raw.rescueBin) : [];

  let migrated = 0;
  for (const item of legacyInventory) {
    await writePokepetToSubcollection(uid, item);
    migrated++;
  }
  for (const item of legacyRescueBin) {
    await writeRescueItemToSubcollection(uid, item);
    migrated++;
  }

  if (legacyInventory.length > 0 || legacyRescueBin.length > 0) {
    await updateDoc(docRef, { inventory: [], rescueBin: [] });
  }
  return { migrated };
}

// -------------------- UNIVERSAL REGISTERED POKEPETS --------------------

export async function getUserRegisteredPokepets(uid: string): Promise<SerializedPokemonInstance[]> {
  if (!uid || uid.length > MAX_OWNER_ID_LENGTH) return [];
  if (typeof navigator !== 'undefined' && !navigator.onLine) return [];

  try {
    const q = query(collection(db, 'registeredPokepets'), where('ownerId', '==', uid));
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
          item.evolutionHistory = sanitizeEvolutionHistory(data.evolutionHistory);
          if (data.currentGameId) item.currentGameId = String(data.currentGameId);
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
  return `ID${Date.now().toString(36).toUpperCase().padStart(10, 'X').slice(-10)}`;
}

export async function savePokepetToUniversalDatabase(
  item: SerializedPokemonInstance,
  ownerId: string,
  trainerName: string,
  queueOnFailure = true
): Promise<void> {
  const cleanPokeId = item.pokeId.trim().toUpperCase();
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
    currentGameId: item.currentGameId || null,
    evolutionHistory: sanitizeEvolutionHistory(item.evolutionHistory),
    livingBoxNumber: item.livingBoxNumber || null,
    livingBoxSlot: item.livingBoxSlot || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if(!queueOnFailure) throw new Error('Offline; registration remains pending.');
    enqueueOfflineActionHelper({
      type: 'REGISTER_POKEPET',
      payload: { instance: item, ownerId, trainerName },
    });
    return;
  }

  try {
    const existing = await getDoc(docRef);
    if(existing.exists()) {
      if(existing.data().ownerId !== ownerId || existing.data().pokemonId !== item.pokemonId) throw new Error('Registry identity changed; queued write requires review.');
      const {createdAt, ...mutable} = payload;
      await updateDoc(docRef, mutable);
    } else await setDoc(docRef, payload);
  } catch (error) {
    if(!queueOnFailure) throw error;
    enqueueOfflineActionHelper({
      type: 'REGISTER_POKEPET',
      payload: { instance: item, ownerId, trainerName },
    });
  }
}

export async function updatePokepetInUniversalDatabase(
  item: SerializedPokemonInstance,
  ownerId: string,
  trainerName: string
): Promise<void> {
  const cleanPokeId = item.pokeId.trim().toUpperCase();
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
      currentGameId: item.currentGameId || null,
      evolutionHistory: sanitizeEvolutionHistory(item.evolutionHistory),
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

/** Atomic species replacement under the SAME POKEID. No delete/re-register,
 * no offline queue (avoid stale species replay), and optimistic-concurrency checks. */
export async function persistPokepetEvolution(
  uid: string, previous: SerializedPokemonInstance, next: SerializedPokemonInstance, trainerName: string
): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('Reconnect before evolving so both records can be updated atomically.');
  if (previous.pokeId !== next.pokeId || previous.gender !== next.gender) throw new Error('Evolution must preserve POKEID and gender.');
  const clean = sanitizeInventory([next])[0];
  if (!clean) throw new Error('Invalid evolved PokéPet.');
  const userRef = doc(db, 'userDexProfiles', uid, 'inventory', clean.pokeId);
  const registryRef = doc(db, 'registeredPokepets', clean.pokeId);
  await runTransaction(db, async tx => {
    const userSnap = await tx.get(userRef);
    const registrySnap = await tx.get(registryRef);
    if (!userSnap.exists() || userSnap.data().pokemonId !== previous.pokemonId || userSnap.data().updatedAt !== previous.updatedAt) throw new Error('This PokéPet was changed on another device. Reopen it before evolving.');
    if (registrySnap.exists() && (registrySnap.data().ownerId !== uid || registrySnap.data().pokemonId !== previous.pokemonId)) throw new Error('The registry record has changed; evolution was not applied.');
    const metadata = { ownerId: uid, trainerName: sanitizeTrainerName(trainerName) };
    tx.set(userRef, removeUndefinedProperties({ ...clean, ...metadata }));
    tx.set(registryRef, removeUndefinedProperties({ ...clean, ...metadata,
      livingBoxNumber: clean.livingBoxNumber ?? null, livingBoxSlot: clean.livingBoxSlot ?? null,
      createdAt: registrySnap.exists() ? registrySnap.data().createdAt : serverTimestamp(), updatedAt: serverTimestamp(),
    }));
  });
}

export async function deletePokepetFromUniversalDatabase(pokeId: string, queueOnFailure = true): Promise<void> {
  const cleanPokeId = pokeId.trim().toUpperCase();
  const docRef = doc(db, 'registeredPokepets', cleanPokeId);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if(!queueOnFailure) throw new Error('Offline; deletion remains pending.');
    enqueueOfflineActionHelper({
      type: 'DELETE_POKEPET',
      payload: { pokeId: cleanPokeId },
    });
    return;
  }

  try {
    await deleteDoc(docRef);
  } catch (error) {
    if(!queueOnFailure) throw error;
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

  const localMatch = localInventory.find((inv) => inv.pokeId.toUpperCase() === cleanId);
  if (localMatch) {
    return {
      success: true,
      pokepet: localMatch,
      trainerName: currentTrainerName,
    };
  }

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
        currentGameId: data.currentGameId ? String(data.currentGameId) : undefined,
        evolutionHistory: sanitizeEvolutionHistory(data.evolutionHistory),
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

  return {
    success: false,
    error: `POKEID "${cleanId}" does not exist in the database. No pet Pokémon has been registered with this POKEID.`,
  };
}

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

export interface RandomRegisteredPokepetResult {
  pokepet: SerializedPokemonInstance;
  trainerName: string;
}

export const FALLBACK_SHOWCASE_PETS: RandomRegisteredPokepetResult[] = [
  {
    pokepet: {
      pokeId: 'ID8F3K9L2M4P',
      pokemonId: 6, // Charizard
      nickname: 'Blaze',
      level: 88,
      gender: 'male',
      variantId: '6:base',
      variantName: 'Standard',
      isShiny: true,
      gameId: 'firered',
      isHomeGift: false,
      isTraded: false,
      storedInHome: true,
      isInLivingBox: true,
      notes: 'Faithful champion partner from the Kanto region.',
      createdAt: 1672531199000,
      updatedAt: 1672531199000,
    },
    trainerName: 'Red (Kanto Champion)',
  },
  {
    pokepet: {
      pokeId: 'ID4M7K2P9Q1V',
      pokemonId: 445, // Garchomp
      nickname: 'Mach',
      level: 92,
      gender: 'female',
      variantId: '445:base',
      variantName: 'Standard',
      isShiny: false,
      gameId: 'platinum',
      isHomeGift: false,
      isTraded: false,
      storedInHome: true,
      isInLivingBox: true,
      notes: 'Ace Pokémon of the Sinnoh Pokémon League.',
      createdAt: 1672531199000,
      updatedAt: 1672531199000,
    },
    trainerName: 'Cynthia (Sinnoh Champion)',
  },
  {
    pokepet: {
      pokeId: 'ID3X9P8L5K2Z',
      pokemonId: 25, // Pikachu
      nickname: 'Sparky',
      level: 100,
      gender: 'male',
      variantId: '25:base',
      variantName: 'Standard',
      isShiny: false,
      gameId: 'yellow',
      isHomeGift: false,
      isTraded: false,
      storedInHome: true,
      isInLivingBox: true,
      notes: 'Never enters a Poké Ball. Partner from Pallet Town.',
      createdAt: 1672531199000,
      updatedAt: 1672531199000,
    },
    trainerName: 'Ash Ketchum (World Monarch)',
  },
  {
    pokepet: {
      pokeId: 'ID7V2N4C8X1K',
      pokemonId: 376, // Metagross
      nickname: 'Titan',
      level: 85,
      gender: 'genderless',
      variantId: '376:base',
      variantName: 'Standard',
      isShiny: true,
      gameId: 'emerald',
      isHomeGift: false,
      isTraded: false,
      storedInHome: true,
      isInLivingBox: true,
      notes: 'Rare shiny Steel/Psychic titan found in the Hoenn League.',
      createdAt: 1672531199000,
      updatedAt: 1672531199000,
    },
    trainerName: 'Steven Stone (Hoenn Champion)',
  },
  {
    pokepet: {
      pokeId: 'ID9B6J2T5Y8W',
      pokemonId: 448, // Lucario
      nickname: 'Aura',
      level: 82,
      gender: 'male',
      variantId: '448:base',
      variantName: 'Standard',
      isShiny: false,
      gameId: 'diamond',
      isHomeGift: false,
      isTraded: false,
      storedInHome: true,
      isInLivingBox: true,
      notes: 'Hatched from an egg gifted on Iron Island.',
      createdAt: 1672531199000,
      updatedAt: 1672531199000,
    },
    trainerName: 'Riley',
  },
  {
    pokepet: {
      pokeId: 'ID2W8M5X9P4T',
      pokemonId: 887, // Dragapult
      nickname: 'Phantom',
      level: 86,
      gender: 'female',
      variantId: '887:base',
      variantName: 'Standard',
      isShiny: true,
      gameId: 'sword',
      isHomeGift: false,
      isTraded: false,
      storedInHome: true,
      isInLivingBox: true,
      notes: 'Stealth Bomber Pokémon raised in the Galar Wild Area.',
      createdAt: 1672531199000,
      updatedAt: 1672531199000,
    },
    trainerName: 'Leon (Galar Champion)',
  },
];

export async function fetchRandomRegisteredPokepet(): Promise<RandomRegisteredPokepetResult> {
  // If online, attempt to fetch a random pet from the universal database
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      await ensureSignedInUser().catch(() => {});
      const q = query(collection(db, 'registeredPokepets'), limit(40));
      const snap = await getDocs(q);
      const list: RandomRegisteredPokepetResult[] = [];
      snap.forEach((docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          const cleanPokeId = String(d.pokeId || docSnap.id).trim().toUpperCase();
          if (cleanPokeId.startsWith('ID') && cleanPokeId.length === 12 && d.pokemonId) {
            list.push({
              pokepet: {
                pokeId: cleanPokeId,
                pokemonId: Number(d.pokemonId),
                nickname: d.nickname ? String(d.nickname) : undefined,
                level: Number(d.level || 50),
                gender: String(d.gender || 'genderless'),
                variantId: String(d.variantId || `${d.pokemonId}:base`),
                variantName: String(d.variantName || 'Standard'),
                isShiny: Boolean(d.isShiny),
                gameId: d.gameId ? String(d.gameId) : undefined,
                isHomeGift: Boolean(d.isHomeGift),
                isTraded: Boolean(d.isTraded),
                storedInHome: Boolean(d.storedInHome),
                isInLivingBox: Boolean(d.isInLivingBox),
                notes: d.notes ? String(d.notes) : undefined,
                createdAt: d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now(),
                updatedAt: d.updatedAt?.toMillis ? d.updatedAt.toMillis() : Date.now(),
              },
              trainerName: String(d.trainerName || 'Registered Trainer'),
            });
          }
        }
      });
      if (list.length > 0) {
        return list[Math.floor(Math.random() * list.length)];
      }
    } catch (err) {
      console.warn('Could not query registeredPokepets for random pet:', err);
    }
  }

  // Check local storage for any cached inventory/pets
  try {
    const rawInv = localStorage.getItem('homedex_v4_inventory');
    if (rawInv) {
      const parsed = JSON.parse(rawInv);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const localPet = parsed[Math.floor(Math.random() * parsed.length)];
        if (localPet && localPet.pokeId && localPet.pokemonId) {
          return {
            pokepet: localPet,
            trainerName: localPet.trainerName || 'Local Trainer',
          };
        }
      }
    }
  } catch {
    // ignore
  }

  // Fallback to random iconic specimen
  return FALLBACK_SHOWCASE_PETS[Math.floor(Math.random() * FALLBACK_SHOWCASE_PETS.length)];
}

// -------------------- FRIENDS SYSTEM --------------------

const FRIEND_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, L, O, 0, 1

export function generateFriendCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += FRIEND_CODE_ALPHABET.charAt(
      Math.floor(Math.random() * FRIEND_CODE_ALPHABET.length)
    );
  }
  return `DX-${code}`;
}

export async function reserveFriendCode(code: string, uid: string): Promise<boolean> {
  const clean = code.trim().toUpperCase();
  const codeRef = doc(db, 'friendCodes', clean);
  try {
    const existing = await getDoc(codeRef);
    if (existing.exists()) return false;
    await setDoc(codeRef, { uid, createdAt: Date.now() });
    return true;
  } catch (err) {
    console.warn('reserveFriendCode failed:', err);
    return false;
  }
}

export async function generateAndReserveFriendCode(uid: string): Promise<string | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateFriendCode();
    const ok = await reserveFriendCode(code, uid);
    if (ok) return code;
  }
  return null;
}

export async function lookupFriendCode(code: string): Promise<string | null> {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  try {
    const snap = await getDoc(doc(db, 'friendCodes', clean));
    if (!snap.exists()) return null;
    const uid = String(snap.data().uid || '');
    return uid || null;
  } catch {
    return null;
  }
}

export async function updateUserFriendCode(uid: string, friendCode: string): Promise<void> {
  await updateDoc(doc(db, 'userDexProfiles', uid), {
    friendCode: friendCode.slice(0, 16),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserFriends(uid: string, friends: string[]): Promise<void> {
  const unique = Array.from(
    new Set(friends.filter((f) => typeof f === 'string' && f.length > 0))
  ).slice(0, 500);
  await updateDoc(doc(db, 'userDexProfiles', uid), {
    friends: unique,
    updatedAt: serverTimestamp(),
  });
}

export interface FriendRequest {
  requestId: string;
  fromUid: string;
  toUid: string;
  fromTrainerName: string;
  fromFriendCode: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
  updatedAt: number;
}

function requestIdFor(fromUid: string, toUid: string): string {
  return `${fromUid}__${toUid}`;
}

export async function sendFriendRequest(
  fromUid: string,
  fromTrainerName: string,
  fromFriendCode: string,
  toUid: string
): Promise<void> {
  const id = requestIdFor(fromUid, toUid);
  const ref = doc(db, 'friendRequests', id);
  await setDoc(
    ref,
    {
      fromUid,
      toUid,
      fromTrainerName: sanitizeTrainerName(fromTrainerName),
      fromFriendCode: String(fromFriendCode || '').slice(0, 16),
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  await updateDoc(doc(db, 'friendRequests', requestId), {
    status: 'accepted',
    updatedAt: Date.now(),
  });
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, 'friendRequests', requestId));
}

function mapFriendRequestDoc(d: any): FriendRequest {
  const data = d.data() || {};
  return {
    requestId: d.id,
    fromUid: String(data.fromUid || ''),
    toUid: String(data.toUid || ''),
    fromTrainerName: String(data.fromTrainerName || 'Trainer'),
    fromFriendCode: String(data.fromFriendCode || ''),
    status: (data.status || 'pending') as FriendRequest['status'],
    createdAt: Number(data.createdAt || 0),
    updatedAt: Number(data.updatedAt || 0),
  };
}

export function subscribeToIncomingFriendRequests(
  uid: string,
  onData: (requests: FriendRequest[]) => void
): Unsubscribe {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db, 'friendRequests'),
    where('toUid', '==', uid),
    where('status', '==', 'pending')
  );
  return onSnapshot(
    q,
    (snap) => {
      const out: FriendRequest[] = [];
      snap.forEach((d) => out.push(mapFriendRequestDoc(d)));
      out.sort((a, b) => b.createdAt - a.createdAt);
      onData(out);
    },
    (err) => {
      console.warn('Incoming friend requests error:', err);
      onData([]);
    }
  );
}

export function subscribeToOutgoingAcceptedRequests(
  uid: string,
  onData: (requests: FriendRequest[]) => void
): Unsubscribe {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return () => {};
  }
  const q = query(
    collection(db, 'friendRequests'),
    where('fromUid', '==', uid),
    where('status', '==', 'accepted')
  );
  return onSnapshot(
    q,
    (snap) => {
      const out: FriendRequest[] = [];
      snap.forEach((d) => out.push(mapFriendRequestDoc(d)));
      onData(out);
    },
    (err) => {
      console.warn('Outgoing friend requests error:', err);
      onData([]);
    }
  );
}

export async function fetchFriendProfiles(
  uids: string[]
): Promise<Record<string, UserDexProfileData>> {
  const map: Record<string, UserDexProfileData> = {};
  if (typeof navigator !== 'undefined' && !navigator.onLine) return map;
  await Promise.all(
    uids.map(async (uid) => {
      try {
        const profile = await fetchPublicDexProfile(uid);
        if (profile) map[uid] = profile;
      } catch (err) {
        console.warn('Could not fetch friend profile:', uid, err);
      }
    })
  );
  return map;
}

export async function deleteFriendRequestByPair(
  fromUid: string,
  toUid: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'friendRequests', requestIdFor(fromUid, toUid)));
  } catch {
    // ignore
  }
}