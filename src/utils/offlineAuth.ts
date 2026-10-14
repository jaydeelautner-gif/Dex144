import type { User, UserInfo } from 'firebase/auth';
import type { UserDexProfileData } from '../firebase';

export const OFFLINE_AUTH_VAULT_KEY = 'homedex_cached_auth_vault_v1';
export const ACTIVE_OFFLINE_SESSION_KEY = 'homedex_active_offline_session_v1';
export const CACHED_PROFILE_PREFIX = 'homedex_cached_profile_';

export interface CachedAuthAccount {
  uid: string;
  email: string;
  displayName: string;
  salt: string;
  passwordHash: string;
  lastLoginAt: number;
}

/**
 * Computes a SHA-256 hash with a unique salt using Web Crypto API.
 */
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a cryptographically secure random salt.
 */
export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Retrieves all locally cached user accounts from localStorage.
 */
export function getCachedAuthAccounts(): CachedAuthAccount[] {
  try {
    const raw = localStorage.getItem(OFFLINE_AUTH_VAULT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Finds a cached user account by email (case-insensitive).
 */
export function getCachedAccountByEmail(email: string): CachedAuthAccount | undefined {
  const accounts = getCachedAuthAccounts();
  const cleanEmail = email.trim().toLowerCase();
  return accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);
}

/**
 * Finds a cached user account by UID.
 */
export function getCachedAccountByUid(uid: string): CachedAuthAccount | undefined {
  const accounts = getCachedAuthAccounts();
  return accounts.find((acc) => acc.uid === uid);
}

/**
 * Saves or updates a cached user account in the local vault.
 */
export function saveCachedAuthAccount(account: CachedAuthAccount): void {
  try {
    const accounts = getCachedAuthAccounts();
    const cleanEmail = account.email.trim().toLowerCase();
    const filtered = accounts.filter(
      (a) => a.email.toLowerCase() !== cleanEmail && a.uid !== account.uid
    );
    filtered.push({
      ...account,
      email: cleanEmail,
      lastLoginAt: Date.now(),
    });
    localStorage.setItem(OFFLINE_AUTH_VAULT_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Could not save cached auth account:', err);
  }
}

/**
 * Removes a cached account from the local vault.
 */
export function removeCachedAuthAccount(email: string): void {
  try {
    const accounts = getCachedAuthAccounts();
    const cleanEmail = email.trim().toLowerCase();
    const filtered = accounts.filter((a) => a.email.toLowerCase() !== cleanEmail);
    localStorage.setItem(OFFLINE_AUTH_VAULT_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

/**
 * Verifies credentials against the locally cached accounts.
 */
export async function verifyCachedCredentials(
  email: string,
  pass: string
): Promise<{ success: boolean; account?: CachedAuthAccount; error?: string }> {
  const account = getCachedAccountByEmail(email);
  if (!account) {
    return {
      success: false,
      error:
        'No cached account found for this email on this device. You must sign in online at least once on this iPad/device to cache your credentials.',
    };
  }

  const computedHash = await hashPasswordWithSalt(pass, account.salt);
  if (computedHash !== account.passwordHash) {
    return {
      success: false,
      error: 'Invalid password for cached offline account. Please enter the password you used previously.',
    };
  }

  // Update last login timestamp
  account.lastLoginAt = Date.now();
  saveCachedAuthAccount(account);

  return {
    success: true,
    account,
  };
}

/**
 * Constructs a fully compliant mock Firebase User for offline authentication.
 */
export function createOfflineUser(account: CachedAuthAccount): User {
  const providerData: UserInfo[] = [
    {
      uid: account.uid,
      displayName: account.displayName,
      email: account.email,
      phoneNumber: null,
      photoURL: null,
      providerId: 'password',
    },
  ];

  return {
    uid: account.uid,
    email: account.email,
    displayName: account.displayName,
    emailVerified: true,
    isAnonymous: false,
    phoneNumber: null,
    photoURL: null,
    providerId: 'password',
    tenantId: null,
    metadata: {
      creationTime: new Date(account.lastLoginAt).toUTCString(),
      lastSignInTime: new Date().toUTCString(),
    },
    providerData,
    refreshToken: 'offline_token_refresh',
    delete: async () => {},
    getIdToken: async () => 'offline_mock_id_token',
    getIdTokenResult: async () => ({
      token: 'offline_mock_id_token',
      authTime: new Date().toUTCString(),
      issuedAtTime: new Date().toUTCString(),
      expirationTime: new Date(Date.now() + 86400000).toUTCString(),
      signInProvider: 'password',
      signInSecondFactor: null,
      claims: {},
    }),
    reload: async () => {},
    toJSON: () => ({
      uid: account.uid,
      email: account.email,
      displayName: account.displayName,
      emailVerified: true,
      isAnonymous: false,
    }),
  } as unknown as User;
}

/**
 * Active offline session persistence.
 */
export function getActiveOfflineUid(): string | null {
  try {
    return localStorage.getItem(ACTIVE_OFFLINE_SESSION_KEY);
  } catch {
    return null;
  }
}

export function setActiveOfflineUid(uid: string): void {
  try {
    localStorage.setItem(ACTIVE_OFFLINE_SESSION_KEY, uid);
  } catch {
    // ignore
  }
}

export function clearActiveOfflineUid(): void {
  try {
    localStorage.removeItem(ACTIVE_OFFLINE_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Saves a user's full profile to localStorage as an offline backup.
 */
export function saveLocallyCachedProfile(uid: string, profile: UserDexProfileData): void {
  try {
    localStorage.setItem(`${CACHED_PROFILE_PREFIX}${uid}`, JSON.stringify(profile));
  } catch (err) {
    console.warn('Failed to cache user profile locally:', err);
  }
}

/**
 * Retrieves a user's locally cached profile from localStorage.
 */
export function getLocallyCachedProfile(uid: string): UserDexProfileData | null {
  try {
    const raw = localStorage.getItem(`${CACHED_PROFILE_PREFIX}${uid}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Requests persistent storage from the browser/iOS WebKit so data isn't evicted.
 */
export async function requestPersistentStorage(): Promise<{ supported: boolean; persisted: boolean }> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const persisted = await navigator.storage.persist();
      return { supported: true, persisted };
    } catch {
      return { supported: true, persisted: false };
    }
  }
  return { supported: false, persisted: false };
}

/**
 * Checks storage estimate (usage and quota) in bytes.
 */
export async function checkStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
} | null> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      const percentage = quota > 0 ? Math.round((usage / quota) * 100) : 0;
      return { usage, quota, percentage };
    } catch {
      return null;
    }
  }
  return null;
}
