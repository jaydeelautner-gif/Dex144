import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search,
  Check,
  Sparkles,
  LayoutGrid,
  List,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Maximize2,
  Globe,
  Plus,
  Home,
  PlusCircle,
  Settings,
  RefreshCw,
  Trophy,
  UserCircle,
} from 'lucide-react';
import {
  buildInitialNationalDex,
  GENERATIONS,
  GAMES,
  ALL_GAME_IDS,
  createEmptyGameCatchesMap,
  getGameRunningTotalStats,
  type PokemonEntry,
  type GameId,
  type DlcId,
  type GameCatchesMap,
} from './data/pokemonData';
import {
  getVariationsForPokemon,
  hasRegionalVariations,
} from './data/regionalVariantsData';
import {
  formatOriginSourceLabel,
  formatStorageLocationLabel,
  generatePokeId,
  type PokemonInstance,
  type RescueBinItem,
  pruneExpiredRescueBin,
  RESCUE_BIN_RETENTION_MS,
} from './data/pokemonInventoryData';
// ── GAME PROGRESS TRACKING ──
import { useGameProgress } from './hooks/useGameProgress';
import { getLockedDexNumbers } from './data/milestoneGates';
import { GameProgressTracker } from './components/GameProgressTracker';
// ── END GAME PROGRESS TRACKING ──
import { getActiveOfflineUid } from './utils/offlineAuth';
import { PokemonSprite } from './components/PokemonSprite';
import { PokemonDetailDrawer } from './components/PokemonDetailDrawer';
import { PokemonFullPageView } from './components/PokemonFullPageView';
import { LivingBoxesView } from './components/LivingBoxesView';
import { GameRunningTotalsPanel } from './components/GameRunningTotalsPanel';
import { PublicStatsPageView } from './components/PublicStatsPageView';
import { HomeView } from './components/HomeView';
import { SettingsView } from './components/SettingsView';
import { RegisterPokemonView } from './components/RegisterPokemonView';
import { InventoryView } from './components/InventoryView';
import { PokepetTrainerCardModal } from './components/PokepetTrainerCardModal';
import { GameLogoBadge } from './components/GameLogoBadge';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthModal } from './components/AuthModal';
import { DeviceAccessModal } from './components/DeviceAccessModal';
import { FriendsView } from './components/FriendsView';

import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signOutUser,
  subscribeToUserDexProfile,
  subscribeToUserInventory,
  subscribeToUserRescueBin,
  saveUserDexProfile,
  savePokepetToUserCollection,
  deletePokepetFromUserCollection,
  saveRescueItemToUserCollection,
  deleteRescueItemFromUserCollection,
  drainOfflineSyncQueue,
  migrateLegacyInventoryToSubcollection,
  fetchPublicDexProfile,
  searchPokepetByPokeId,
  savePokepetToUniversalDatabase,
  updatePokepetInUniversalDatabase,
  deletePokepetFromUniversalDatabase,
  // Friends system
  generateAndReserveFriendCode,
  lookupFriendCode,
  updateUserFriendCode,
  updateUserFriends,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  subscribeToIncomingFriendRequests,
  subscribeToOutgoingAcceptedRequests,
  fetchFriendProfiles,
  deleteFriendRequestByPair,
  type User,
  type UserDexProfileData,
  type SerializedPokemonInstance,
  type FriendRequest,
} from './firebase';

type MainWorkspaceTab =
  | 'home'
  | 'register'
  | 'pokedex'
  | 'profile'
  | 'progress'    // ── GAME PROGRESS TRACKING ──
  | 'public_stats'
  | 'settings';

type StatusFilter =
  | 'all'
  | 'caught'
  | 'uncaught'
  | 'shiny'
  | 'living'
  | 'regional_variants'
  | 'home_restricted'
  | 'bank_closure_risk';

type AvailabilityFilter =
  | 'all'
  | 'obtainable_owned'
  | 'unobtainable_owned'
  | 'base_only'
  | 'requires_dlc'
  | 'version_exclusive';

type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline';

const LS_CAUGHT_KEY = 'homedex_v4_caught';
const LS_SHINY_KEY = 'homedex_v4_shiny';
const LS_LIVING_KEY = 'homedex_v4_living';
const LS_CAUGHT_VARIANTS_KEY = 'homedex_v4_caught_variants';
const LS_BOX_VARIANTS_KEY = 'homedex_v4_box_selected_variants';
const LS_BOX_GAMES_KEY = 'homedex_v4_box_selected_games';
const LS_OWNED_GAMES_KEY = 'homedex_v4_owned_games';
const LS_GAME_CATCHES_KEY = 'homedex_v4_game_catches';
const LS_DLCS_KEY = 'homedex_v4_owned_dlcs';
const LS_TRAINER_KEY = 'homedex_v4_trainer_name';
const LS_PUBLIC_KEY = 'homedex_v4_is_public';
const LS_INVENTORY_KEY = 'homedex_v4_inventory';
const LS_TALLY_GAMES_KEY = 'homedex_v4_tally_games';
const LS_FRIENDS_KEY = 'homedex_v4_friends';

const DEFAULT_OWNED_GAMES: GameId[] = ['sv', 'swsh', 'pla', 'bdsp', 'lgpe', 'pogo'];
const DEFAULT_OWNED_DLCS: DlcId[] = [];

function loadNumberArrayFromStorage(key: string, fallback: number[]): number[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    return parsed.filter((n) => typeof n === 'number' && n >= 1 && n <= 1025);
  } catch {
    return fallback;
  }
}

function loadStringArrayFromStorage<T extends string>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    return parsed.filter((s) => typeof s === 'string') as T[];
  } catch {
    return fallback;
  }
}

function loadGameCatchesFromStorage(): GameCatchesMap {
  const empty = createEmptyGameCatchesMap();
  try {
    const raw = localStorage.getItem(LS_GAME_CATCHES_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return empty;
    for (const gId of ALL_GAME_IDS) {
      if (Array.isArray(parsed[gId])) {
        empty[gId] = parsed[gId].filter(
          (n: unknown) => typeof n === 'number' && n >= 1 && n <= 1025
        );
      }
    }
    return empty;
  } catch {
    return empty;
  }
}

const LS_RESCUE_BIN_KEY = 'homedex_v4_rescue_bin';

function loadRescueBinFromStorage(): RescueBinItem[] {
  try {
    const raw = localStorage.getItem(LS_RESCUE_BIN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return pruneExpiredRescueBin(parsed);
  } catch {
    return [];
  }
}

function loadInventoryFromStorage(): PokemonInstance[] {
  try {
    const raw = localStorage.getItem(LS_INVENTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item && typeof item === 'object' && typeof item.pokeId === 'string' && typeof item.pokemonId === 'number'
    );
  } catch {
    return [];
  }
}

function parseBoxSelectedVariants(entries: string[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const item of entries) {
    const parts = item.split(':');
    if (parts.length >= 2) {
      const pId = Number(parts[0]);
      if (Number.isInteger(pId) && pId >= 1 && pId <= 1025) {
        map.set(pId, item);
      }
    }
  }
  return map;
}

function serializeBoxSelectedVariants(map: Map<number, string>): string[] {
  return Array.from(map.values());
}

function parseBoxSelectedGames(entries: string[]): Map<number, GameId> {
  const map = new Map<number, GameId>();
  for (const item of entries) {
    const [idStr, gameStr] = item.split(':');
    const pId = Number(idStr);
    if (
      Number.isInteger(pId) &&
      pId >= 1 &&
      pId <= 1025 &&
      ALL_GAME_IDS.includes(gameStr as GameId)
    ) {
      map.set(pId, gameStr as GameId);
    }
  }
  return map;
}

function serializeBoxSelectedGames(map: Map<number, GameId>): string[] {
  const out: string[] = [];
  map.forEach((gameId, pokemonId) => {
    out.push(`${pokemonId}:${gameId}`);
  });
  return out;
}

function isExclusiveLabel(label: string): boolean {
  const lower = label.toLowerCase();
  return lower.includes('exclusive') || lower.includes('only');
}

export function App() {
  const dex = useMemo(() => buildInitialNationalDex(), []);

  // Shared Public Stats Profile URL param (?publicProfile=UID)
  const [sharedProfileUid, setSharedProfileUid] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get('publicProfile');
    return uid && uid.trim() ? uid.trim() : null;
  });
  const [sharedProfileData, setSharedProfileData] = useState<UserDexProfileData | null>(null);
  const [sharedProfileLoading, setSharedProfileLoading] = useState<boolean>(false);
  const [sharedProfileError, setSharedProfileError] = useState<string | null>(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState<MainWorkspaceTab>('home');
  const [profileSubTab, setProfileSubTab] = useState<'boxes' | 'inventory' | 'friends'>('boxes');
  const navigateToProfile = (sub: 'boxes' | 'inventory' | 'friends') => {
    setProfileSubTab(sub);
    setFullPagePokemon(null);
    setActiveTab('profile');
  };
  const [registerTargetPokemonId, setRegisterTargetPokemonId] = useState<number | undefined>(undefined);
  const [selectedGame, setSelectedGame] = useState<GameId | 'all'>('all');
  const [selectedGen, setSelectedGen] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [availFilter, setAvailFilter] = useState<AvailabilityFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeBox, setActiveBox] = useState<number>(1);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonEntry | null>(null);
  const [fullPagePokemon, setFullPagePokemon] = useState<PokemonEntry | null>(null);

  // Active Specimen Trainer Card Modal
  const [activeTrainerCardInstance, setActiveTrainerCardInstance] = useState<PokemonInstance | null>(null);

  // Auth & Multi-Device Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authActionPrompt, setAuthActionPrompt] = useState<string | undefined>(undefined);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState<boolean>(false);

  // Refresh button state
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // ── Friends system state ──
  const [myFriendCode, setMyFriendCode] = useState<string | undefined>(undefined);
  const [myFriends, setMyFriends] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(LS_FRIENDS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x: unknown) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, UserDexProfileData>>({});
  const [friendsLoading, setFriendsLoading] = useState<boolean>(false);
  const [activeFriendUid, setActiveFriendUid] = useState<string | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Persist myFriends to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_FRIENDS_KEY, JSON.stringify(myFriends));
    } catch {
      // ignore
    }
  }, [myFriends]);

  // User Specimen Inventory State
  const [inventory, setInventory] = useState<PokemonInstance[]>(() =>
    loadInventoryFromStorage()
  );

  // 30-Day Rescue Bin State
  const [rescueBin, setRescueBin] = useState<RescueBinItem[]>(() =>
    loadRescueBinFromStorage()
  );

  // Automatically prune expired rescue bin items (kept for 30 days and automatically deleted)
  useEffect(() => {
    const prune = () => {
      setRescueBin((prev) => {
        const pruned = pruneExpiredRescueBin(prev);
        if (pruned.length !== prev.length) {
          try {
            localStorage.setItem(LS_RESCUE_BIN_KEY, JSON.stringify(pruned));
          } catch {
            // ignore
          }
          return pruned;
        }
        return prev;
      });
    };
    prune();
    const interval = setInterval(prune, 60000);
    return () => clearInterval(interval);
  }, []);

  // User Progress State
  const [caughtIds, setCaughtIds] = useState<number[]>(() => {
    const initialInv = loadInventoryFromStorage();
    return Array.from(new Set(initialInv.map((item) => item.pokemonId))).sort((a, b) => a - b);
  });
  const [shinyIds, setShinyIds] = useState<number[]>(() => {
    const initialInv = loadInventoryFromStorage();
    return Array.from(
      new Set(initialInv.filter((item) => item.isShiny).map((item) => item.pokemonId))
    ).sort((a, b) => a - b);
  });
  const [livingIds, setLivingIds] = useState<number[]>(() => {
    const initialInv = loadInventoryFromStorage();
    return Array.from(
      new Set(
        initialInv
          .filter((item) => item.isInLivingBox && item.storedInHome)
          .map((item) => item.pokemonId)
      )
    ).sort((a, b) => a - b);
  });
  const [caughtVariants, setCaughtVariants] = useState<string[]>(() =>
    loadStringArrayFromStorage<string>(LS_CAUGHT_VARIANTS_KEY, [])
  );
  const [boxSelectedVariants, setBoxSelectedVariants] = useState<string[]>(() =>
    loadStringArrayFromStorage<string>(LS_BOX_VARIANTS_KEY, [])
  );
  const [boxSelectedGames, setBoxSelectedGames] = useState<string[]>(() =>
    loadStringArrayFromStorage<string>(LS_BOX_GAMES_KEY, [])
  );
  const [ownedGames, setOwnedGames] = useState<GameId[]>(() =>
    loadStringArrayFromStorage<GameId>(LS_OWNED_GAMES_KEY, DEFAULT_OWNED_GAMES)
  );
  const [tallyGames, setTallyGames] = useState<GameId[]>(() =>
    loadStringArrayFromStorage<GameId>(LS_TALLY_GAMES_KEY, DEFAULT_OWNED_GAMES)
  );
  const [gameCatches, setGameCatches] = useState<GameCatchesMap>(() =>
    loadGameCatchesFromStorage()
  );
  const [ownedDlcs, setOwnedDlcs] = useState<DlcId[]>(() =>
    loadStringArrayFromStorage<DlcId>(LS_DLCS_KEY, DEFAULT_OWNED_DLCS)
  );
  const [trainerName, setTrainerName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LS_TRAINER_KEY);
      if (!saved || !saved.trim()) return 'Guest';
      return saved.trim();
    } catch {
      return 'Guest';
    }
  });
  const [isPublic, setIsPublic] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_PUBLIC_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [includePokemonGoInSuggestions, setIncludePokemonGoInSuggestions] = useState<boolean>(() => {
    try {
      return localStorage.getItem('homedex_include_pogo_suggestions') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleIncludePokemonGoInSuggestions = useCallback(() => {
    setIncludePokemonGoInSuggestions((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('homedex_include_pogo_suggestions', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // ── GAME PROGRESS TRACKING ──
  const {
    progress: gameProgress,
    trackedGames,
    starterChoices,
    chooseStarter,
    clearStarterChoice,
    mergedCompletedSet,
    toggleMilestone,
    toggleTracking,
    resetGame: resetGameProgress,
    completeAll: completeAllMilestones,
  } = useGameProgress();

  // Dex numbers currently locked because the user hasn't reached the milestone yet.
  // Only applies when at least one game is being tracked.
  const lockedByProgressSet = useMemo(() => {
    if (trackedGames.size === 0) return new Set<number>();
    // Merge gates from every tracked game so a Pokemon obtainable in an unlocked
    // game doesn't get hidden just because it's still locked in another.
    const merged = new Set<number>();
    const unlockedAcrossTracked = new Set<number>();

    for (const gId of trackedGames) {
      const lockedForGame = getLockedDexNumbers(mergedCompletedSet, gId);
      // Pokemon NOT in lockedForGame for this game are considered reachable here.
      for (const p of dex) {
        if (!lockedForGame.has(p.id)) {
          // Available in this game — mark as unlocked overall
          unlockedAcrossTracked.add(p.id);
        }
      }
      lockedForGame.forEach((id) => merged.add(id));
    }

    // A Pokemon is only "locked" if it is locked in every tracked game.
    const finalLocked = new Set<number>();
    merged.forEach((id) => {
      if (!unlockedAcrossTracked.has(id)) finalLocked.add(id);
    });
    return finalLocked;
  }, [mergedCompletedSet, trackedGames, dex]);
  // ── END GAME PROGRESS TRACKING ──

  // Theme State — locked to dark mode
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    document.documentElement.classList.remove('light');
    try {
      localStorage.setItem('homedex_theme', 'dark');
    } catch {
      // ignore
    }
  }, []);

  // Firebase Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [cloudLoaded, setCloudLoaded] = useState<boolean>(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);
  const isApplyingRemoteRef = useRef<boolean>(false);

  // Live sync status indicator state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [pendingWrites, setPendingWrites] = useState<number>(0);

  // Keep the sync indicator in step with auth, network, and the offline queue
  useEffect(() => {
    const update = () => {
      if (!authReady) {
        setSyncStatus('syncing');
        return;
      }
      if (!user) {
        setSyncStatus('offline');
        return;
      }
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (!isOnline) {
        setSyncStatus('offline');
        return;
      }

      let queueLen = 0;
      try {
        const raw = localStorage.getItem('homedex_offline_sync_queue');
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) queueLen = parsed.length;
      } catch {
        queueLen = 0;
      }
      setPendingWrites(queueLen);

      if (queueLen > 0) {
        setSyncStatus('pending');
        return;
      }
      if (isApplyingRemoteRef.current) {
        setSyncStatus('syncing');
        return;
      }
      setSyncStatus('synced');
    };

    update();
    const interval = setInterval(update, 2500);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    window.addEventListener('homedex-sync-queue-changed', update);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      window.removeEventListener('homedex-sync-queue-changed', update);
    };
  }, [user, authReady]);

  // Sync caughtIds, livingIds, shinyIds, and box selections from inventory
  useEffect(() => {
    const speciesInInventory = new Set(inventory.map((item) => item.pokemonId));

    const uniqueIdsInInventory = Array.from(speciesInInventory).sort((a, b) => a - b);
    setCaughtIds(uniqueIdsInInventory);

    const uniqueLivingInInventory = Array.from(
      new Set(
        inventory
          .filter((item) => item.isInLivingBox && item.storedInHome)
          .map((item) => item.pokemonId)
      )
    ).sort((a, b) => a - b);
    setLivingIds(uniqueLivingInInventory);

    const uniqueShinyInInventory = Array.from(
      new Set(
        inventory
          .filter((item) => item.isShiny)
          .map((item) => item.pokemonId)
      )
    ).sort((a, b) => a - b);
    setShinyIds(uniqueShinyInInventory);

    setBoxSelectedVariants((prev) => {
      const map = parseBoxSelectedVariants(prev);
      let changed = false;
      for (const [pId] of map.entries()) {
        if (!speciesInInventory.has(pId)) {
          map.delete(pId);
          changed = true;
        }
      }
      return changed ? serializeBoxSelectedVariants(map) : prev;
    });

    setBoxSelectedGames((prev) => {
      const map = parseBoxSelectedGames(prev);
      let changed = false;
      for (const [pId] of map.entries()) {
        if (!speciesInInventory.has(pId)) {
          map.delete(pId);
          changed = true;
        }
      }
      return changed ? serializeBoxSelectedGames(map) : prev;
    });
  }, [inventory]);

  // Fast Sets & Maps for O(1) lookups
  const caughtSet = useMemo(() => new Set(caughtIds), [caughtIds]);
  const shinySet = useMemo(() => new Set(shinyIds), [shinyIds]);
  const livingSet = useMemo(() => new Set(livingIds), [livingIds]);
  const caughtVariantsSet = useMemo(() => new Set(caughtVariants), [caughtVariants]);
  const boxSelectedVariantsMap = useMemo(
    () => parseBoxSelectedVariants(boxSelectedVariants),
    [boxSelectedVariants]
  );
  const boxSelectedGamesMap = useMemo(
    () => parseBoxSelectedGames(boxSelectedGames),
    [boxSelectedGames]
  );

  // Load shared public profile if URL has ?publicProfile=<uid>
  useEffect(() => {
    if (!sharedProfileUid) return;
    let cancelled = false;
    setSharedProfileLoading(true);
    setSharedProfileError(null);
    fetchPublicDexProfile(sharedProfileUid)
      .then((profile) => {
        if (cancelled) return;
        if (!profile) {
          setSharedProfileError('This trainer’s Public Stats Page is private or does not exist.');
        } else {
          setSharedProfileData(profile);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSharedProfileError('Unable to load this Public Stats Page.');
        }
      })
      .finally(() => {
        if (!cancelled) setSharedProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sharedProfileUid]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (!currentUser) {
        setCloudLoaded(false);
      } else if (currentUser.displayName) {
        setTrainerName(currentUser.displayName);
      }
    });
    return () => unsub();
  }, []);

  // Drain offline sync queue once auth is ready and user is signed in
  useEffect(() => {
    if (!authReady || !user) return;
    drainOfflineSyncQueue().catch(() => {});
  }, [authReady, user?.uid]);

  // Subscribe to Firestore: metadata + inventory subcollection + rescueBin subcollection
  useEffect(() => {
    if (!user) return;
    let isInitialFetch = true;

    const unsubProfile = subscribeToUserDexProfile(
      user.uid,
      (remoteProfile) => {
        if (remoteProfile) {
          isApplyingRemoteRef.current = true;

          // Metadata-only sync — inventory comes from its own subscription below
          setCaughtVariants(remoteProfile.caughtVariants);
          setBoxSelectedVariants(remoteProfile.boxSelectedVariants);
          setBoxSelectedGames(remoteProfile.boxSelectedGames);
          setOwnedGames(remoteProfile.ownedGames);
          setGameCatches(remoteProfile.gameCatches);
          setOwnedDlcs(remoteProfile.ownedDlcs as DlcId[]);
          setIsPublic(Boolean(remoteProfile.isPublic));
          if (remoteProfile.trainerName && remoteProfile.trainerName !== 'Guest') {
            setTrainerName(remoteProfile.trainerName);
          }
          // Friend code + friends from the profile doc
          if (remoteProfile.friendCode) {
            setMyFriendCode(remoteProfile.friendCode);
          }
          if (Array.isArray(remoteProfile.friends)) {
            setMyFriends((prev) => {
              const merged = Array.from(new Set([...remoteProfile.friends!, ...prev]));
              return merged;
            });
          }
          setCloudLoaded(true);
          setTimeout(() => {
            isApplyingRemoteRef.current = false;
          }, 50);
        } else if (isInitialFetch) {
          // First sign-in for this user: create a metadata-only profile
          const effectiveName = user.displayName || 'Guest';
          setTrainerName(effectiveName);
          setCloudLoaded(true);
          saveUserDexProfile(user.uid, {
            trainerName: effectiveName,
            activeGameFilter: selectedGame,
            isPublic,
            caughtIds: [],
            shinyIds: [],
            livingIds: [],
            caughtVariants: [],
            boxSelectedVariants: [],
            boxSelectedGames: [],
            ownedGames,
            ownedDlcs,
            gameCatches,
          }).catch(() => {});
        }
        isInitialFetch = false;
      },
      () => {
        setCloudLoaded(true);
      }
    );

    const unsubInventory = subscribeToUserInventory(user.uid, (items) => {
      const mapped: PokemonInstance[] = items.map((inv) => ({
        pokeId: inv.pokeId,
        pokemonId: inv.pokemonId,
        nickname: inv.nickname || '',
        level: inv.level,
        gender: inv.gender as 'male' | 'female' | 'genderless',
        variantId: inv.variantId,
        variantName: inv.variantName,
        isShiny: inv.isShiny,
        gameId: inv.gameId as GameId | undefined,
        isHomeGift: inv.isHomeGift,
        isTraded: inv.isTraded,
        storedInHome: inv.storedInHome,
        isInLivingBox: inv.isInLivingBox,
        livingBoxNumber: inv.livingBoxNumber,
        livingBoxSlot: inv.livingBoxSlot,
        notes: inv.notes,
        ownerId: inv.ownerId || user.uid,
        ownerEmail: inv.ownerEmail || user.email || undefined,
        trainerName: inv.trainerName || 'Trainer',
        isRescued: Boolean(inv.isRescued),
        rescuedAt: inv.rescuedAt,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
      }));
      setInventory(mapped);
    });

    const unsubRescueBin = subscribeToUserRescueBin(user.uid, (items) => {
      setRescueBin(items);
    });

    return () => {
      unsubProfile();
      unsubInventory();
      unsubRescueBin();
    };
  }, [user]);

  // ── Friend code generation (one-time per user) ──
  useEffect(() => {
    if (!user?.uid || !cloudLoaded) return;
    if (myFriendCode) return;
    let cancelled = false;
    (async () => {
      const code = await generateAndReserveFriendCode(user.uid);
      if (!code || cancelled) return;
      try {
        await updateUserFriendCode(user.uid, code);
        if (!cancelled) setMyFriendCode(code);
      } catch (err) {
        console.warn('Failed to save friend code to profile:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, cloudLoaded, myFriendCode]);

  // ── Subscribe to incoming pending friend requests ──
  useEffect(() => {
    if (!user?.uid) {
      setIncomingRequests([]);
      return;
    }
    return subscribeToIncomingFriendRequests(user.uid, setIncomingRequests);
  }, [user?.uid]);

  // ── Watch accepted outgoing requests ──
  useEffect(() => {
    if (!user?.uid) return;
    return subscribeToOutgoingAcceptedRequests(user.uid, (accepted) => {
      if (accepted.length === 0) return;
      setMyFriends((prev) => {
        const next = [...prev];
        let changed = false;
        for (const req of accepted) {
          if (req.toUid && !next.includes(req.toUid)) {
            next.push(req.toUid);
            changed = true;
          }
        }
        if (!changed) return prev;
        updateUserFriends(user.uid, next).catch(() => {});
        return next;
      });
    });
  }, [user?.uid]);

  // ── Fetch friend profiles whenever the list changes ──
  useEffect(() => {
    if (myFriends.length === 0) {
      setFriendProfiles({});
      return;
    }
    let cancelled = false;
    setFriendsLoading(true);
    fetchFriendProfiles(myFriends)
      .then((map) => {
        if (!cancelled) setFriendProfiles(map);
      })
      .finally(() => {
        if (!cancelled) setFriendsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [myFriends]);

  // One-time migration of legacy inline inventory/rescueBin arrays to subcollections
  useEffect(() => {
    if (!user?.uid || !cloudLoaded) return;
    migrateLegacyInventoryToSubcollection(user.uid)
      .then(({ migrated }) => {
        if (migrated > 0) {
          setToast({
            message: `Migrated ${migrated} Poképet${migrated === 1 ? '' : 's'} to cloud storage.`,
            type: 'success',
          });
        }
      })
      .catch(() => {});
  }, [user?.uid, cloudLoaded]);

  // Persist to localStorage & Firestore (metadata only now)
  useEffect(() => {
    try {
      localStorage.setItem(LS_CAUGHT_KEY, JSON.stringify(caughtIds));
      localStorage.setItem(LS_SHINY_KEY, JSON.stringify(shinyIds));
      localStorage.setItem(LS_LIVING_KEY, JSON.stringify(livingIds));
      localStorage.setItem(LS_CAUGHT_VARIANTS_KEY, JSON.stringify(caughtVariants));
      localStorage.setItem(LS_BOX_VARIANTS_KEY, JSON.stringify(boxSelectedVariants));
      localStorage.setItem(LS_BOX_GAMES_KEY, JSON.stringify(boxSelectedGames));
      localStorage.setItem(LS_OWNED_GAMES_KEY, JSON.stringify(ownedGames));
      localStorage.setItem(LS_GAME_CATCHES_KEY, JSON.stringify(gameCatches));
      localStorage.setItem(LS_DLCS_KEY, JSON.stringify(ownedDlcs));
      localStorage.setItem(LS_TRAINER_KEY, trainerName);
      localStorage.setItem(LS_PUBLIC_KEY, String(isPublic));
      localStorage.setItem(LS_INVENTORY_KEY, JSON.stringify(inventory));
      localStorage.setItem(LS_RESCUE_BIN_KEY, JSON.stringify(rescueBin));
    } catch {
      // quota handling
    }

    if (user && cloudLoaded && !isApplyingRemoteRef.current) {
      const timer = setTimeout(() => {
        saveUserDexProfile(user.uid, {
          trainerName,
          activeGameFilter: selectedGame,
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
          inventory: inventory as SerializedPokemonInstance[],
          rescueBin,
        }).catch(() => {});
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [
    caughtIds,
    shinyIds,
    livingIds,
    caughtVariants,
    boxSelectedVariants,
    boxSelectedGames,
    ownedGames,
    gameCatches,
    ownedDlcs,
    trainerName,
    isPublic,
    inventory,
    rescueBin,
    user,
    cloudLoaded,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGame, selectedGen, statusFilter, availFilter, searchQuery]);

  // Add a newly registered pokepet instance
  const handleSaveNewInstance = useCallback((newInstance: PokemonInstance) => {
    const ownerId =
      user?.uid ||
      getActiveOfflineUid() ||
      (localStorage.getItem('homedex_guest_uuid') ||
        'guest_' + Math.random().toString(36).slice(2, 10));
    const effectiveTrainerName = user?.displayName || trainerName || 'Trainer';
    const effectiveOwnerEmail = user?.email || undefined;

    const taggedInstance: PokemonInstance = {
      ...newInstance,
      ownerId,
      ownerEmail: effectiveOwnerEmail,
      trainerName: effectiveTrainerName,
      isRescued: Boolean(newInstance.isRescued),
    };

    setInventory((prev) => [taggedInstance, ...prev]);

    savePokepetToUniversalDatabase(taggedInstance, ownerId, effectiveTrainerName).catch((err) => {
      console.warn('Failed to save pokepet to universal database:', err);
    });

    if (user?.uid) {
      savePokepetToUserCollection(user.uid, taggedInstance as SerializedPokemonInstance).catch((err) =>
        console.warn('Failed to save pokepet to user subcollection:', err)
      );
    }

    setCaughtVariants((prev) =>
      prev.includes(newInstance.variantId) ? prev : [...prev, newInstance.variantId]
    );

    if (newInstance.isShiny) {
      setShinyIds((prev) =>
        prev.includes(newInstance.pokemonId) ? prev : [...prev, newInstance.pokemonId]
      );
    }

    if (newInstance.storedInHome && newInstance.isInLivingBox) {
      setLivingIds((prev) =>
        prev.includes(newInstance.pokemonId) ? prev : [...prev, newInstance.pokemonId]
      );
      setBoxSelectedVariants((prev) => {
        const map = parseBoxSelectedVariants(prev);
        map.set(newInstance.pokemonId, newInstance.variantId);
        return serializeBoxSelectedVariants(map);
      });
      if (newInstance.gameId) {
        setBoxSelectedGames((prev) => {
          const map = parseBoxSelectedGames(prev);
          map.set(newInstance.pokemonId, newInstance.gameId!);
          return serializeBoxSelectedGames(map);
        });
      }
    }

    if (newInstance.gameId) {
      setGameCatches((prev) => {
        const list = prev[newInstance.gameId!] || [];
        if (list.includes(newInstance.pokemonId)) return prev;
        return {
          ...prev,
          [newInstance.gameId!]: [...list, newInstance.pokemonId],
        };
      });
    }
  }, [user, trainerName]);

  // Update existing instance
  const handleUpdateInstance = useCallback((updatedInstance: PokemonInstance) => {
    setInventory((prev) =>
      prev.map((item) => (item.pokeId === updatedInstance.pokeId ? updatedInstance : item))
    );

    const ownerId = user?.uid || (localStorage.getItem('homedex_guest_uuid') || 'guest');
    updatePokepetInUniversalDatabase(updatedInstance, ownerId, trainerName).catch((err) => {
      console.warn('Failed to update pokepet in universal database:', err);
    });

    if (user?.uid) {
      savePokepetToUserCollection(user.uid, updatedInstance as SerializedPokemonInstance).catch((err) =>
        console.warn('Failed to update user subcollection:', err)
      );
    }

    if (updatedInstance.storedInHome && updatedInstance.isInLivingBox) {
      setLivingIds((prev) =>
        prev.includes(updatedInstance.pokemonId) ? prev : [...prev, updatedInstance.pokemonId]
      );
      setBoxSelectedVariants((prev) => {
        const map = parseBoxSelectedVariants(prev);
        map.set(updatedInstance.pokemonId, updatedInstance.variantId);
        return serializeBoxSelectedVariants(map);
      });
      if (updatedInstance.gameId) {
        setBoxSelectedGames((prev) => {
          const map = parseBoxSelectedGames(prev);
          map.set(updatedInstance.pokemonId, updatedInstance.gameId!);
          return serializeBoxSelectedGames(map);
        });
      }
    }
  }, [user, trainerName]);

  // Delete instance → moves to 30-Day Rescue Bin
  const handleDeleteInstance = useCallback((pokeId: string) => {
    deletePokepetFromUniversalDatabase(pokeId).catch((err) => {
      console.warn('Failed to delete pokepet from universal database:', err);
    });

    setInventory((prev) => {
      const target = prev.find((item) => item.pokeId === pokeId);
      if (!target) return prev;

      const now = Date.now();
      const rescueItem: RescueBinItem = {
        rescueId: target.pokeId,
        instance: { ...target },
        deletedAt: now,
        expiresAt: now + RESCUE_BIN_RETENTION_MS,
        deletedFrom: 'inventory',
        originalOwnerId: target.ownerId || user?.uid,
        originalTrainerName: target.trainerName || user?.displayName || trainerName || 'Trainer',
      };

      setRescueBin((binPrev) => {
        const nextBin = [rescueItem, ...binPrev.filter((b) => b.rescueId !== pokeId)];
        try {
          localStorage.setItem(LS_RESCUE_BIN_KEY, JSON.stringify(nextBin));
        } catch {
          // ignore
        }
        return nextBin;
      });

      if (user?.uid) {
        deletePokepetFromUserCollection(user.uid, pokeId).catch(() => {});
        saveRescueItemToUserCollection(user.uid, rescueItem).catch(() => {});
      }

      const next = prev.filter((item) => item.pokeId !== pokeId);
      const remainingOfThisSpecies = next.filter((item) => item.pokemonId === target.pokemonId);

      if (remainingOfThisSpecies.length === 0) {
        setLivingIds((lPrev) => lPrev.filter((id) => id !== target.pokemonId));
        setShinyIds((sPrev) => sPrev.filter((id) => id !== target.pokemonId));
        setBoxSelectedVariants((bPrev) => {
          const map = parseBoxSelectedVariants(bPrev);
          map.delete(target.pokemonId);
          return serializeBoxSelectedVariants(map);
        });
        setBoxSelectedGames((gPrev) => {
          const map = parseBoxSelectedGames(gPrev);
          map.delete(target.pokemonId);
          return serializeBoxSelectedGames(map);
        });
        setCaughtVariants((vPrev) =>
          vPrev.filter((vid) => !vid.startsWith(`${target.pokemonId}:`))
        );
      }
      return next;
    });

    setToast({
      message: 'PokéPet moved to 30-Day Rescue Bin in Settings > Rescue Pokémon.',
      type: 'info',
    });
  }, [user, trainerName]);

  // Rescue a single pokepet from the 30-day bin
  const handleRescuePokepet = useCallback((rescueId: string) => {
    setRescueBin((binPrev) => {
      const targetItem = binPrev.find((b) => b.rescueId === rescueId);
      if (!targetItem) return binPrev;

      const restored: PokemonInstance = {
        ...targetItem.instance,
        isRescued: true,
        rescuedAt: Date.now(),
        updatedAt: Date.now(),
      };

      setInventory((invPrev) => {
        if (invPrev.some((i) => i.pokeId === restored.pokeId)) return invPrev;
        return [restored, ...invPrev];
      });

      setCaughtIds((cPrev) => (cPrev.includes(restored.pokemonId) ? cPrev : [...cPrev, restored.pokemonId]));
      if (restored.isShiny) {
        setShinyIds((sPrev) => (sPrev.includes(restored.pokemonId) ? sPrev : [...sPrev, restored.pokemonId]));
      }
      if (restored.variantId) {
        setCaughtVariants((vPrev) => {
          const key = `${restored.pokemonId}:${restored.variantId}`;
          return vPrev.includes(key) ? vPrev : [...vPrev, key];
        });
      }

      savePokepetToUniversalDatabase(
        restored,
        user?.uid || restored.ownerId || 'restored_trainer',
        restored.trainerName || 'Trainer'
      ).catch(() => {});

      if (user?.uid) {
        savePokepetToUserCollection(user.uid, restored as SerializedPokemonInstance).catch(() => {});
        deleteRescueItemFromUserCollection(user.uid, rescueId).catch(() => {});
      }

      const nextBin = binPrev.filter((b) => b.rescueId !== rescueId);
      try {
        localStorage.setItem(LS_RESCUE_BIN_KEY, JSON.stringify(nextBin));
      } catch {
        // ignore
      }
      return nextBin;
    });

    setToast({
      message: 'PokéPet rescued and restored to your inventory!',
      type: 'success',
    });
  }, [user]);

  // Rescue all pokepets from the 30-day bin
  const handleRescueAll = useCallback(() => {
    const binPrev = rescueBin;
    if (binPrev.length === 0) return;

    const now = Date.now();
    const restoredList: PokemonInstance[] = binPrev.map((b) => ({
      ...b.instance,
      isRescued: true,
      rescuedAt: now,
      updatedAt: now,
    }));

    setInventory((invPrev) => {
      const existingIds = new Set(invPrev.map((i) => i.pokeId));
      const novel = restoredList.filter((r) => !existingIds.has(r.pokeId));
      return [...novel, ...invPrev];
    });

    const restoredSpeciesIds = restoredList.map((r) => r.pokemonId);
    const restoredShinyIds = restoredList.filter((r) => r.isShiny).map((r) => r.pokemonId);

    setCaughtIds((cPrev) => Array.from(new Set([...cPrev, ...restoredSpeciesIds])));
    if (restoredShinyIds.length > 0) {
      setShinyIds((sPrev) => Array.from(new Set([...sPrev, ...restoredShinyIds])));
    }

    restoredList.forEach((r) => {
      savePokepetToUniversalDatabase(
        r,
        user?.uid || r.ownerId || 'restored_trainer',
        r.trainerName || 'Trainer'
      ).catch(() => {});
      if (user?.uid) {
        savePokepetToUserCollection(user.uid, r as SerializedPokemonInstance).catch(() => {});
      }
    });

    if (user?.uid) {
      binPrev.forEach((b) => {
        deleteRescueItemFromUserCollection(user.uid, b.rescueId).catch(() => {});
      });
    }

    try {
      localStorage.removeItem(LS_RESCUE_BIN_KEY);
    } catch {
      // ignore
    }
    setRescueBin([]);

    setToast({
      message: 'All Pokémon have been rescued and restored!',
      type: 'success',
    });
  }, [user, rescueBin]);

  const handleToggleOwnedGame = useCallback((gameId: GameId) => {
    setOwnedGames((prev) =>
      prev.includes(gameId) ? prev.filter((item) => item !== gameId) : [...prev, gameId]
    );
  }, []);

  const handleToggleOwnedDlc = useCallback((dlcId: DlcId) => {
    setOwnedDlcs((prev) =>
      prev.includes(dlcId) ? prev.filter((item) => item !== dlcId) : [...prev, dlcId]
    );
  }, []);

  const handleToggleTallyGame = useCallback((gameId: GameId) => {
    setTallyGames((prev) => {
      const next = prev.includes(gameId)
        ? prev.filter((item) => item !== gameId)
        : [...prev, gameId];
      try {
        localStorage.setItem(LS_TALLY_GAMES_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleSetAllTallyGames = useCallback((games: GameId[]) => {
    setTallyGames(games);
    try {
      localStorage.setItem(LS_TALLY_GAMES_KEY, JSON.stringify(games));
    } catch {
      // ignore
    }
  }, []);

  const handleLookupPokeId = useCallback(
    async (pokeIdToFind: string): Promise<string | null> => {
      const cleanId = pokeIdToFind.trim().toUpperCase();
      if (!cleanId.startsWith('ID') || cleanId.length !== 12) {
        const errorMsg = 'POKEID must be exactly 12 characters and start with "ID" (e.g. ID8F3K9L2M4P).';
        setToast({ message: errorMsg, type: 'error' });
        return errorMsg;
      }

      const localMatch = inventory.find((inv) => inv.pokeId.toUpperCase() === cleanId);
      if (localMatch) {
        setActiveTrainerCardInstance(localMatch);
        return null;
      }

      if (sharedProfileData?.inventory) {
        const profileMatch = sharedProfileData.inventory.find(
          (inv) => inv.pokeId.toUpperCase() === cleanId
        );
        if (profileMatch) {
          setActiveTrainerCardInstance({
            ...profileMatch,
            nickname: profileMatch.nickname || '',
          } as PokemonInstance);
          return null;
        }
      }

      try {
        const result = await searchPokepetByPokeId(
          cleanId,
          inventory,
          trainerName || 'Trainer'
        );
        if (result.success && result.pokepet) {
          setActiveTrainerCardInstance(result.pokepet as PokemonInstance);
          return null;
        } else {
          const errorMsg =
            result.error ||
            `POKEID "${cleanId}" does not exist in the database. Only registered pet Pokémon have a POKEID.`;
          setToast({ message: errorMsg, type: 'error' });
          return errorMsg;
        }
      } catch (err: any) {
        const errorMsg = `Database lookup error: ${err?.message || 'Could not query registered pokepets.'}`;
        setToast({ message: errorMsg, type: 'error' });
        return errorMsg;
      }
    },
    [inventory, sharedProfileData, trainerName]
  );

  const handleSelectBoxVariant = useCallback((pokemonId: number, variantId: string) => {
    setBoxSelectedVariants((prev) => {
      const map = parseBoxSelectedVariants(prev);
      map.set(pokemonId, variantId);
      return serializeBoxSelectedVariants(map);
    });
  }, []);

  const handleResetAllProgress = useCallback(() => {
    if (inventory.length > 0) {
      const now = Date.now();
      const newBinItems: RescueBinItem[] = inventory.map((item) => ({
        rescueId: item.pokeId,
        instance: { ...item },
        deletedAt: now,
        expiresAt: now + RESCUE_BIN_RETENTION_MS,
        deletedFrom: 'reset_all',
        originalOwnerId: item.ownerId || user?.uid,
        originalTrainerName: item.trainerName || user?.displayName || trainerName || 'Trainer',
      }));

      setRescueBin((prev) => {
        const existingRescueIds = new Set(prev.map((p) => p.rescueId));
        const nonDuplicate = newBinItems.filter((n) => !existingRescueIds.has(n.rescueId));
        const merged = [...nonDuplicate, ...prev];
        try {
          localStorage.setItem(LS_RESCUE_BIN_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
        return merged;
      });

      if (user?.uid) {
        inventory.forEach((item) => {
          deletePokepetFromUserCollection(user.uid, item.pokeId).catch(() => {});
        });
        newBinItems.forEach((r) => {
          saveRescueItemToUserCollection(user.uid, r).catch(() => {});
        });
      }
    }

    setInventory([]);
    setCaughtIds([]);
    setShinyIds([]);
    setLivingIds([]);
    setCaughtVariants([]);
    setBoxSelectedVariants([]);
    setBoxSelectedGames([]);
    setGameCatches(createEmptyGameCatchesMap());
    try {
      localStorage.removeItem(LS_CAUGHT_KEY);
      localStorage.removeItem(LS_SHINY_KEY);
      localStorage.removeItem(LS_LIVING_KEY);
      localStorage.removeItem(LS_CAUGHT_VARIANTS_KEY);
      localStorage.removeItem(LS_BOX_VARIANTS_KEY);
      localStorage.removeItem(LS_BOX_GAMES_KEY);
      localStorage.removeItem(LS_GAME_CATCHES_KEY);
      localStorage.removeItem(LS_INVENTORY_KEY);
    } catch {
      // ignore
    }

    setToast({
      message: inventory.length > 0
        ? `Pokédex reset. ${inventory.length} PokéPet(s) transferred safely to 30-Day Rescue Bin in Settings!`
        : 'Pokédex progress reset successfully.',
      type: 'info',
    });
  }, [inventory, user, trainerName]);

  const handleImportProgress = (
    data: {
      caughtIds: number[];
      shinyIds: number[];
      livingIds: number[];
      ownedDlcs?: DlcId[];
      trainerName?: string;
    },
    mode: 'merge' | 'replace'
  ) => {
    if (mode === 'replace') {
      setCaughtIds(data.caughtIds);
      setShinyIds(data.shinyIds);
      setLivingIds(data.livingIds);
      if (data.ownedDlcs) setOwnedDlcs(data.ownedDlcs);
      if (data.trainerName) setTrainerName(data.trainerName);
    } else {
      setCaughtIds((prev) => Array.from(new Set([...prev, ...data.caughtIds])));
      setShinyIds((prev) => Array.from(new Set([...prev, ...data.shinyIds])));
      setLivingIds((prev) => Array.from(new Set([...prev, ...data.livingIds])));
      if (data.ownedDlcs) {
        setOwnedDlcs((prev) => Array.from(new Set([...prev, ...data.ownedDlcs!])));
      }
    }
  };

  const handleOpenAuth = (prompt?: string) => {
    setAuthErrorMsg(null);
    setAuthActionPrompt(prompt);
    setIsAuthModalOpen(true);
  };

  const handleGoogleSignIn = async () => {
    handleOpenAuth();
  };

  const handleSignOut = async () => {
    await signOutUser();
    setTrainerName('Guest');
    setMyFriendCode(undefined);
    setIncomingRequests([]);
    // Keep myFriends in localStorage so the list persists if they sign back in
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await drainOfflineSyncQueue();
    } catch {
      // ignore — reload anyway
    }
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  // ── Friend handlers ──

  const handleAddFriendByCode = async (code: string) => {
    if (!user?.uid) return;
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    try {
      const toUid = await lookupFriendCode(clean);
      if (!toUid) {
        setToast({ message: 'No user found with that friend code.', type: 'error' });
        return;
      }
      if (toUid === user.uid) {
        setToast({ message: "That's your own friend code!", type: 'info' });
        return;
      }
      if (myFriends.includes(toUid)) {
        setToast({ message: 'You are already friends with that trainer.', type: 'info' });
        return;
      }
      await sendFriendRequest(
        user.uid,
        displayTrainerName,
        myFriendCode || '',
        toUid
      );
      setToast({ message: 'Friend request sent!', type: 'success' });
    } catch (err) {
      console.warn('Failed to send friend request:', err);
      setToast({ message: 'Could not send the request. Try again.', type: 'error' });
    }
  };

  const handleAcceptRequest = async (req: FriendRequest) => {
    if (!user?.uid) return;
    try {
      const next = myFriends.includes(req.fromUid)
        ? myFriends
        : [...myFriends, req.fromUid];
      await updateUserFriends(user.uid, next);
      setMyFriends(next);
      await acceptFriendRequest(req.requestId);
      setToast({ message: `You're now friends with ${req.fromTrainerName}.`, type: 'success' });
    } catch (err) {
      console.warn('Failed to accept request:', err);
      setToast({ message: 'Could not accept the request. Try again.', type: 'error' });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
    } catch (err) {
      console.warn('Failed to decline request:', err);
      setToast({ message: 'Could not decline the request.', type: 'error' });
    }
  };

  const handleRemoveFriend = async (friendUid: string) => {
    if (!user?.uid) return;
    const next = myFriends.filter((f) => f !== friendUid);
    const prev = myFriends;
    setMyFriends(next);
    try {
      await updateUserFriends(user.uid, next);
      await deleteFriendRequestByPair(user.uid, friendUid);
      await deleteFriendRequestByPair(friendUid, user.uid);
      setToast({ message: 'Friend removed.', type: 'info' });
    } catch (err) {
      console.warn('Failed to remove friend:', err);
      setMyFriends(prev);
      setToast({ message: 'Could not remove friend.', type: 'error' });
    }
  };

  // Availability tooltip summary for owned games
  const getOwnedGamesAvailabilitySummary = useCallback(
    (p: PokemonEntry) => {
      const obtainableOwnedGames = ownedGames.filter((gId) => {
        const av = p.availability[gId];
        if (!av) return false;
        if (av.status === 'base') return true;
        if (av.status === 'dlc') {
          return !av.dlcId || ownedDlcs.includes(av.dlcId);
        }
        return false;
      });

      if (obtainableOwnedGames.length === 0) {
        return {
          obtainableInOwned: false,
          shortLabel: 'Not obtainable with current games',
          locationLabel: 'Not obtainable with current games',
          tooltip: 'Not obtainable with current games',
          gamesList: [] as GameId[],
        };
      }

      const primaryGameId =
        selectedGame !== 'all' && obtainableOwnedGames.includes(selectedGame)
          ? selectedGame
          : obtainableOwnedGames[0];
      const primaryGameMeta = GAMES.find((g) => g.id === primaryGameId);
      const primaryAvail = p.availability[primaryGameId];
      const gameTitle = primaryGameMeta?.shortTitle || primaryAvail?.gameShortTitle || primaryGameId.toUpperCase();
      const otherCount = obtainableOwnedGames.length - 1;
      const versExcl = primaryAvail?.versionExclusive || 'Both Versions';
      const whereFind = primaryAvail?.whereToFind || 'In-game catchable';
      const shortLabel =
        otherCount > 0
          ? `${gameTitle} (${versExcl}) +${otherCount} owned`
          : `${gameTitle} • ${versExcl}`;
      const locationLabel = `${gameTitle}: ${whereFind}`;

      return {
        obtainableInOwned: true,
        shortLabel,
        locationLabel,
        tooltip: `${gameTitle}: ${whereFind}`,
        gamesList: obtainableOwnedGames,
      };
    },
    [ownedGames, ownedDlcs, selectedGame]
  );

  // Filtered Dex List
  const filteredDex = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dex.filter((p) => {
      if (selectedGen !== 'all' && p.generation !== selectedGen) return false;
      if (statusFilter === 'caught' && !caughtSet.has(p.id)) return false;
      if (statusFilter === 'uncaught' && caughtSet.has(p.id)) return false;
      if (statusFilter === 'shiny' && !shinySet.has(p.id)) return false;
      if (statusFilter === 'living' && !livingSet.has(p.id)) return false;
      if (statusFilter === 'regional_variants' && !hasRegionalVariations(p.id)) return false;
      if (statusFilter === 'home_restricted' && !p.homeTransfer.hasExcludedVariants) return false;
      if (statusFilter === 'bank_closure_risk' && !p.homeTransfer.pokeBankClosureRisk.isAtRiskAfterBankClosure) return false;

      const ownedSummary = getOwnedGamesAvailabilitySummary(p);
      if (availFilter === 'obtainable_owned' && !ownedSummary.obtainableInOwned) return false;
      if (availFilter === 'unobtainable_owned' && ownedSummary.obtainableInOwned) return false;

      if (selectedGame !== 'all') {
        const avail = p.availability[selectedGame];
        if (!avail) return false;
        if (availFilter === 'base_only' && avail.status !== 'base') return false;
        if (availFilter === 'requires_dlc' && !avail.requiresDlc) return false;
        if (availFilter === 'version_exclusive' && !isExclusiveLabel(avail.versionExclusive)) return false;
        if (availFilter === 'all' && avail.status === 'unavailable') return false;
      }

      if (q) {
        const idStr = String(p.id);
        const paddedId = idStr.padStart(4, '0');
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesId = idStr.includes(q) || paddedId.includes(q);
        const matchesType = p.types.some((t) => t.toLowerCase().includes(q));
        const matchesRegion = p.region.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesType && !matchesRegion) {
          return false;
        }
      }
      return true;
    });
  }, [
    dex,
    selectedGen,
    statusFilter,
    selectedGame,
    availFilter,
    searchQuery,
    caughtSet,
    shinySet,
    livingSet,
    getOwnedGamesAvailabilitySummary,
  ]);

  const pageSize = viewLayout === 'grid' ? 60 : 50;
  const totalPages = Math.max(1, Math.ceil(filteredDex.length / pageSize));
  const paginatedDex = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDex.slice(start, start + pageSize);
  }, [filteredDex, currentPage, pageSize]);

  // KPI Calculations
  const totalCount = dex.length;
  const caughtCount = caughtSet.size;
  const shinyCount = shinySet.size;
  const livingCount = livingSet.size;
  const caughtPct = ((caughtCount / totalCount) * 100).toFixed(1);

  const selectedGameStats = useMemo(() => {
    const gId: GameId = selectedGame === 'all' ? 'sv' : selectedGame;
    return getGameRunningTotalStats(dex, gId, ownedDlcs, gameCatches[gId] || []);
  }, [dex, selectedGame, ownedDlcs, gameCatches]);

  const tallyStats = useMemo(() => {
    const activeTallyGames = ownedGames.filter((gId) => tallyGames.includes(gId));
    let possiblePokemonCount = 0;
    let caughtPossibleCount = 0;
    let totalCatchesInActiveGames = 0;

    for (const p of dex) {
      let isPossible = false;
      for (const gId of activeTallyGames) {
        const avail = p.availability[gId];
        if (!avail) continue;
        if (avail.status === 'base') {
          isPossible = true;
          break;
        }
        if (avail.status === 'dlc' && avail.dlcId && ownedDlcs.includes(avail.dlcId)) {
          isPossible = true;
          break;
        }
      }

      if (isPossible) {
        possiblePokemonCount++;
        if (caughtSet.has(p.id)) {
          caughtPossibleCount++;
        }
      }
    }

    for (const gId of activeTallyGames) {
      totalCatchesInActiveGames += gameCatches[gId]?.length || 0;
    }

    const percentage =
      possiblePokemonCount > 0
        ? Math.round((caughtPossibleCount / possiblePokemonCount) * 100)
        : 0;

    return {
      activeTallyGames,
      possiblePokemonCount,
      caughtPossibleCount,
      totalCatchesInActiveGames,
      percentage,
    };
  }, [dex, ownedGames, tallyGames, ownedDlcs, caughtSet, gameCatches]);

  const publicShareUrl = useMemo(() => {
    if (user) {
      return `${window.location.origin}${window.location.pathname}?publicProfile=${user.uid}`;
    }
    return `${window.location.origin}${window.location.pathname}`;
  }, [user]);

  const displayTrainerName = user
    ? trainerName && trainerName.trim()
      ? trainerName.trim()
      : user.displayName || 'Guest'
    : trainerName && trainerName.trim()
    ? trainerName.trim()
    : 'Guest';

  // Shared Public Stats View
  if (sharedProfileUid) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
          {sharedProfileLoading ? (
            <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-12 text-center">
              <p className="text-sm font-mono-tabular text-slate-300">
                Loading Public Living Dex Showcase...
              </p>
            </div>
          ) : sharedProfileError || !sharedProfileData ? (
            <div className="bg-[#0F1522] border border-rose-500/40 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
              <p className="text-base font-bold text-rose-300">
                {sharedProfileError || 'Profile unavailable'}
              </p>
              <button
                type="button"
                onClick={() => {
                  window.history.replaceState({}, '', window.location.pathname);
                  setSharedProfileUid(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Open Your Own Pokédex Tracker
              </button>
            </div>
          ) : (
            <PublicStatsPageView
              dex={dex}
              trainerName={sharedProfileData.trainerName || 'Guest'}
              caughtSet={new Set(sharedProfileData.caughtIds)}
              shinySet={new Set(sharedProfileData.shinyIds)}
              livingSet={new Set(sharedProfileData.livingIds)}
              caughtVariantsSet={new Set(sharedProfileData.caughtVariants)}
              boxSelectedVariantsMap={parseBoxSelectedVariants(
                sharedProfileData.boxSelectedVariants || []
              )}
              boxSelectedGamesMap={parseBoxSelectedGames(
                sharedProfileData.boxSelectedGames || []
              )}
              ownedGames={sharedProfileData.ownedGames || DEFAULT_OWNED_GAMES}
              ownedDlcs={(sharedProfileData.ownedDlcs as DlcId[]) || []}
              gameCatches={sharedProfileData.gameCatches || createEmptyGameCatchesMap()}
              shareUrl={window.location.href}
              inventory={(sharedProfileData.inventory as PokemonInstance[]) || []}
              onExitPublicView={() => {
                window.history.replaceState({}, '', window.location.pathname);
                setSharedProfileUid(null);
              }}
            />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Sticky App Header */}
      <header className="sticky top-0 z-30 h-14 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setFullPagePokemon(null);
              setActiveTab('home');
            }}
            className="flex items-center gap-2.5 text-left cursor-pointer"
          >
            <div
              className="w-8 h-8 rounded-full border border-purple-500/50 shadow-md relative overflow-hidden flex items-center justify-center shrink-0"
              style={{
                background:
                  'linear-gradient(180deg, #7C3AED 0%, #6D28D9 48%, #1E1B4B 48%, #0F172A 52%, #F8FAFC 52%, #E2E8F0 100%)',
              }}
              title="Master Ball"
            >
              <div className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-pink-500 border border-pink-300 opacity-90 pointer-events-none" />
              <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-pink-500 border border-pink-300 opacity-90 pointer-events-none" />
              <span className="absolute top-0.5 text-[8px] font-black text-white font-mono pointer-events-none drop-shadow">
                M
              </span>
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-slate-900 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-white border border-slate-900 shadow-inner flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-slate-400" />
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-slate-100 flex items-center gap-1.5">
                <span>HomeDex</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-tabular font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  HOME
                </span>
              </span>
            </div>
          </button>
        </div>

        {/* Primary Workspace Navigation Tabs */}
        <nav
          aria-label="Primary Workspace"
          className="hidden md:flex items-center gap-0.5 p-1 bg-[#0F1522] border border-slate-800/80 rounded-xl overflow-x-auto"
        >
          {(
            [
              { id: 'home', label: 'Home' },
              { id: 'register', label: 'Register' },
              { id: 'pokedex', label: 'Pokédex' },
              { id: 'profile', label: displayTrainerName || 'Profile' },
              { id: 'progress', label: 'Progress' },  // ── GAME PROGRESS TRACKING ──
              { id: 'public_stats', label: 'Living Dex' },
              { id: 'settings', label: 'Settings' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFullPagePokemon(null);
                setActiveTab(tab.id);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tab.id && !fullPagePokemon
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {tab.id === 'profile' ? <span className="max-w-[11rem] truncate">{tab.label}</span> : tab.label}
            </button>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Refresh button — drains offline queue, then reloads */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh app and sync pending changes"
            aria-label="Refresh app and sync pending changes"
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {authErrorMsg && (
            <span className="hidden lg:inline text-xs text-rose-400 font-mono-tabular">
              {authErrorMsg}
            </span>
          )}

          {authReady && user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span
                  className={`text-[11px] font-mono font-semibold ${
                    syncStatus === 'synced'
                      ? 'text-emerald-400'
                      : syncStatus === 'syncing'
                      ? 'text-sky-400'
                      : syncStatus === 'pending'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {syncStatus === 'synced'
                    ? 'Synced'
                    : syncStatus === 'syncing'
                    ? 'Syncing...'
                    : syncStatus === 'pending'
                    ? `Pending (${pendingWrites})`
                    : 'Offline'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                  {user.email || user.displayName || 'Trainer'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenAuth()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Sign In / Sync</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-6 pb-24 md:pb-8">
        {fullPagePokemon ? (
          <PokemonFullPageView
            pokemon={fullPagePokemon}
            dex={dex}
            onSelectPokemon={(p) => setFullPagePokemon(p)}
            onCloseFullPage={() => setFullPagePokemon(null)}
            onSwitchToSidebar={() => {
              const target = fullPagePokemon;
              setFullPagePokemon(null);
              setSelectedPokemon(target);
            }}
            isCaught={caughtSet.has(fullPagePokemon.id) && inventory.some((inv) => inv.pokemonId === fullPagePokemon.id)}
            isShiny={shinySet.has(fullPagePokemon.id) && inventory.some((inv) => inv.pokemonId === fullPagePokemon.id)}
            isLiving={livingSet.has(fullPagePokemon.id) && inventory.some((inv) => inv.pokemonId === fullPagePokemon.id)}
            caughtVariantsSet={caughtVariantsSet}
            selectedBoxVariantId={boxSelectedVariantsMap.get(fullPagePokemon.id)}
            selectedBoxGameId={boxSelectedGamesMap.get(fullPagePokemon.id)}
            ownedGames={ownedGames}
            ownedDlcs={ownedDlcs}
            gameCatches={gameCatches}
            onJumpToBox={(boxNum) => {
              setFullPagePokemon(null);
              setActiveBox(boxNum);
              navigateToProfile('boxes');
            }}
            inventory={inventory}
            onDeleteInstance={handleDeleteInstance}
            onOpenTrainerCardForPokeId={(inst) => setActiveTrainerCardInstance(inst)}
            onNavigateToRegister={(pId) => {
              setFullPagePokemon(null);
              setRegisterTargetPokemonId(pId);
              setActiveTab('register');
            }}
          />
        ) : (
          <>
            {/* Top Global KPI Progress Strip */}
            <section
              aria-label="Global Progress Summary"
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between gap-2 shadow-lg">
                <div className="flex items-center justify-between text-xs font-mono-tabular text-slate-400">
                  <span>NATIONAL POKÉDEX CAUGHT ({displayTrainerName.toUpperCase()})</span>
                  <span className="text-emerald-400 font-semibold">{caughtPct}%</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-mono-tabular text-slate-100">
                  {caughtCount} <span className="text-slate-500 text-lg">/ {totalCount}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-emerald-500 transition-transform duration-150 origin-left"
                    style={{ transform: `scaleX(${caughtCount / totalCount})` }}
                  />
                </div>
              </div>

              <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between gap-2 shadow-lg">
                <div className="flex items-center justify-between text-xs font-mono-tabular text-slate-400">
                  <span>STORED IN POKÉMON HOME (LIVING DEX)</span>
                  <span className="text-sky-400 font-semibold">
                    {((livingCount / totalCount) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-mono-tabular text-slate-100">
                  {livingCount} <span className="text-slate-500 text-lg">/ {totalCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono-tabular mt-1">
                  <span>Logged Specimens: {inventory.length}</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('public_stats')}
                    className="text-amber-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Globe className="w-3 h-3" />
                    Share Public Dex
                  </button>
                </div>
              </div>

              <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between gap-2 shadow-lg">
                <div className="flex items-center justify-between text-xs font-mono-tabular text-slate-400">
                  <span className="font-semibold text-amber-300">
                    {selectedGame === 'all'
                      ? 'OWNED GAMES & DLC RUNNING TOTAL'
                      : `${GAMES.find((g) => g.id === selectedGame)?.shortTitle.toUpperCase()} TOTAL`}
                  </span>
                  <span className="text-amber-400 font-semibold">
                    {selectedGame === 'all'
                      ? `${tallyStats.percentage}%`
                      : `${selectedGameStats.percentage}%`}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-mono-tabular text-slate-100">
                  {selectedGame === 'all' ? tallyStats.caughtPossibleCount : selectedGameStats.caughtCount}{' '}
                  <span className="text-slate-500 text-lg">
                    / {selectedGame === 'all' ? tallyStats.possiblePokemonCount : selectedGameStats.effectiveTotal}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono-tabular mt-1">
                  <span>
                    {selectedGame === 'all'
                      ? `${tallyStats.activeTallyGames.length} / ${ownedGames.length} Owned Games in Tally`
                      : `Shinies: ${shinyCount}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="text-amber-300 hover:underline font-mono text-[11px] cursor-pointer"
                  >
                    Adjust Tally Games →
                  </button>
                </div>
              </div>
            </section>

            {/* TAB 0: HOME */}
            {activeTab === 'home' && (
              <HomeView
                dex={dex}
                caughtSet={caughtSet}
                shinySet={shinySet}
                livingSet={livingSet}
                ownedGames={ownedGames}
                ownedDlcs={ownedDlcs}
                gameCatches={gameCatches}
                inventory={inventory}
                boxSelectedGames={boxSelectedGamesMap}
                includePokemonGoInSuggestions={includePokemonGoInSuggestions}
                isGuest={!user}
                onRequestAuth={(prompt) => handleOpenAuth(prompt)}
                onSelectPokemon={(p) => setSelectedPokemon(p)}
                onOpenFullPage={(p) => setFullPagePokemon(p)}
                onNavigateToRegister={(pId) => {
                  setRegisterTargetPokemonId(pId);
                  setActiveTab('register');
                }}
                onNavigateToTracker={() => setActiveTab('pokedex')}
                onNavigateToLivingDex={() => navigateToProfile('boxes')}
                onNavigateToInventory={() => navigateToProfile('inventory')}
                onNavigateToSettings={() => setActiveTab('settings')}
                onLookupPokeId={handleLookupPokeId}
                // ── GAME PROGRESS TRACKING ──
                lockedByProgressSet={lockedByProgressSet}
                gameProgress={gameProgress}
                trackedGames={trackedGames}
                starterChoices={starterChoices}
                onChooseStarter={chooseStarter}
                onClearStarter={clearStarterChoice}
                onToggleMilestone={toggleMilestone}
                onToggleTracking={toggleTracking}
                onResetGameProgress={resetGameProgress}
                onCompleteAllMilestones={completeAllMilestones}
                onNavigateToProgress={() => setActiveTab('progress')}
                // ── END GAME PROGRESS TRACKING ──
              />
            )}

            {/* TAB 1: REGISTER POKÉMON */}
            {activeTab === 'register' && (
              <RegisterPokemonView
                dex={dex}
                ownedGames={ownedGames}
                inventory={inventory}
                initialPokemonId={registerTargetPokemonId}
                onSaveNewInstance={handleSaveNewInstance}
                onOpenPokemonPage={(p) => setFullPagePokemon(p)}
                onNavigateToInventory={() => navigateToProfile('inventory')}
              />
            )}

            {/* TAB 2: POKÉDEX TRACKER */}
            {activeTab === 'pokedex' && (
              <div className="flex flex-col gap-5">
                <GameRunningTotalsPanel
                  dex={dex}
                  ownedGames={ownedGames}
                  ownedDlcs={ownedDlcs}
                  gameCatches={gameCatches}
                  selectedGame={selectedGame}
                  onSelectGameFilter={(g) => setSelectedGame(g)}
                  onNavigateToSettings={() => setActiveTab('settings')}
                />

                {/* Filter and Search Bar */}
                <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Pokémon by name, #0001–#1025, type, or region..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <select
                        value={selectedGame}
                        onChange={(e) => setSelectedGame(e.target.value as GameId | 'all')}
                        aria-label="Filter by Game"
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="all">All Games</option>
                        {GAMES.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.generationLabel}: {g.title} {ownedGames.includes(g.id) ? '(Owned)' : ''}
                          </option>
                        ))}
                      </select>

                      <select
                        value={availFilter}
                        onChange={(e) => setAvailFilter(e.target.value as AvailabilityFilter)}
                        aria-label="Filter by Availability"
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="all">All Availability</option>
                        <option value="obtainable_owned">Obtainable in My Owned Games</option>
                        <option value="unobtainable_owned">Not Obtainable with Current Games</option>
                        <option value="base_only">Base Game Catchable</option>
                        <option value="requires_dlc">Requires Paid DLC</option>
                        <option value="version_exclusive">Version Exclusives Only</option>
                      </select>

                      <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setViewLayout('grid')}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            viewLayout === 'grid'
                              ? 'bg-slate-800 text-amber-400'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                          aria-label="Grid View"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewLayout('table')}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            viewLayout === 'table'
                              ? 'bg-slate-800 text-amber-400'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                          aria-label="Table View"
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Generation Tabs & Status Filters */}
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 xl:pb-0">
                      <button
                        type="button"
                        onClick={() => setSelectedGen('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono-tabular font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          selectedGen === 'all'
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        All Gens (1025)
                      </button>
                      {GENERATIONS.map((gen) => (
                        <button
                          key={gen.gen}
                          type="button"
                          onClick={() => setSelectedGen(gen.gen)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono-tabular font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            selectedGen === gen.gen
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {gen.roman} • {gen.region}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
                        {(
                          [
                            { id: 'all', label: 'All' },
                            { id: 'uncaught', label: 'Missing' },
                            { id: 'caught', label: 'Caught' },
                            { id: 'shiny', label: 'Shiny' },
                            { id: 'living', label: 'Living Box' },
                            { id: 'regional_variants', label: 'Regional Forms' },
                            { id: 'bank_closure_risk', label: 'Poké Bank Risk' },
                          ] as const
                        ).map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setStatusFilter(st.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              statusFilter === st.id
                                ? 'bg-slate-800 text-slate-100 font-bold'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('register')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Register</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Counter Strip */}
                <div className="flex flex-wrap items-center justify-between gap-4 px-1 text-xs text-slate-400 font-mono-tabular">
                  <div>
                    Showing <span className="text-slate-200 font-semibold">{paginatedDex.length}</span> of{' '}
                    <span className="text-slate-200 font-semibold">{filteredDex.length}</span> matching Pokémon
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg bg-[#0F1522] border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
                        aria-label="Previous Page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span>
                        Page <strong className="text-slate-100">{currentPage}</strong> of {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg bg-[#0F1522] border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
                        aria-label="Next Page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Dex Grid View */}
                {viewLayout === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                    {paginatedDex.map((p) => {
                      const isCaught = caughtSet.has(p.id);
                      const isShiny = shinySet.has(p.id);
                      const specimenCount = inventory.filter((inv) => inv.pokemonId === p.id).length;
                      const ownedSummary = getOwnedGamesAvailabilitySummary(p);
                      const variations = getVariationsForPokemon(p);
                      const savedVariantId = boxSelectedVariantsMap.get(p.id);
                      const displayVariant =
                        variations.find((v) => v.variantId === savedVariantId) || variations[0];
                      const isLockedByProgress = lockedByProgressSet.has(p.id);

                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPokemon(p)}
                          title={ownedSummary.tooltip}
                          className={`group rounded-2xl border p-3.5 flex flex-col justify-between transition-all cursor-pointer select-none shadow-md ${
                            isCaught
                              ? 'bg-emerald-950/15 border-emerald-500/40 hover:border-emerald-400'
                              : 'bg-[#0F1522] border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-mono-tabular text-slate-400">
                              #{String(p.id).padStart(4, '0')}
                            </span>
                            <div className="flex items-center gap-1">
                              {isLockedByProgress && (
                                <span
                                  className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono text-[9px] font-bold border border-slate-700"
                                  title="Not yet reachable with your current game progress"
                                >
                                  🔒
                                </span>
                              )}
                              {specimenCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono text-[9px] font-bold border border-amber-400/40">
                                  {specimenCount} {specimenCount === 1 ? 'specimen' : 'specimens'}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFullPagePokemon(p);
                                }}
                                aria-label={`Open ${p.name} page`}
                                className="p-1 rounded bg-slate-900 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div
                            className={`my-2 flex flex-col items-center transition-opacity ${
                              isCaught ? 'opacity-100' : 'opacity-55 group-hover:opacity-95'
                            }`}
                          >
                            <PokemonSprite
                              id={displayVariant.spriteId}
                              name={displayVariant.formName}
                              shiny={isShiny}
                              size="md"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <div className="text-sm font-bold text-slate-100 truncate group-hover:text-amber-300 transition-colors">
                              {p.name}
                            </div>
                            <div className="text-[11px] font-mono-tabular flex flex-col gap-0.5 pt-1 border-t border-slate-800/70">
                              {isLockedByProgress ? (
                                <span className="text-amber-400 font-semibold truncate">
                                  Locked — progress
                                </span>
                              ) : !ownedSummary.obtainableInOwned ? (
                                <span className="text-rose-400 font-semibold truncate">
                                  Not in owned games
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-semibold truncate">
                                  {ownedSummary.shortLabel}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                <span className="truncate">{ownedSummary.locationLabel}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Table View */
                  <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[11px] font-mono-tabular text-slate-400 uppercase">
                            <th className="py-3 px-4">Dex #</th>
                            <th className="py-3 px-4">Pokémon</th>
                            <th className="py-3 px-4">Owned Games Availability</th>
                            <th className="py-3 px-4">Inventory Instances</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-sm">
                          {paginatedDex.map((p) => {
                            const isCaught = caughtSet.has(p.id);
                            const specimenCount = inventory.filter((inv) => inv.pokemonId === p.id).length;
                            const ownedSummary = getOwnedGamesAvailabilitySummary(p);
                            const isLockedByProgress = lockedByProgressSet.has(p.id);
                            return (
                              <tr
                                key={p.id}
                                onClick={() => setSelectedPokemon(p)}
                                className={`transition-colors cursor-pointer ${
                                  isCaught ? 'bg-emerald-950/10 hover:bg-emerald-950/20' : 'hover:bg-slate-900/60'
                                }`}
                              >
                                <td className="py-2.5 px-4 font-mono-tabular text-xs text-slate-400">
                                  #{String(p.id).padStart(4, '0')}
                                </td>
                                <td className="py-2.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <PokemonSprite id={p.id} name={p.name} size="sm" />
                                    <div>
                                      <div className="font-semibold text-slate-100">{p.name}</div>
                                      <div className="text-xs text-slate-400 font-mono-tabular">
                                        {p.types.join(' / ')} • Gen {p.generation}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-4 text-xs">
                                  {isLockedByProgress ? (
                                    <span className="text-amber-400 font-mono-tabular font-semibold">
                                      🔒 Locked — reach next milestone
                                    </span>
                                  ) : !ownedSummary.obtainableInOwned ? (
                                    <span className="text-rose-400 font-mono-tabular font-semibold">
                                      Not obtainable with current games
                                    </span>
                                  ) : (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-emerald-400 font-semibold">{ownedSummary.shortLabel}</span>
                                      <span className="text-slate-400 text-[11px]">{ownedSummary.locationLabel}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-xs font-mono-tabular">
                                  {specimenCount > 0 ? (
                                    <span className="text-emerald-400 font-bold">
                                      {specimenCount} {specimenCount === 1 ? 'Specimen' : 'Specimens'}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">None</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRegisterTargetPokemonId(p.id);
                                      setActiveTab('register');
                                    }}
                                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                                  >
                                    Register
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: LIVING BOXES */}
            {/* TAB: PROFILE — Boxes / Inventory / Friends */}
            {activeTab === 'profile' && (
              <div className="flex flex-col gap-4">
                {/* Profile sub-navigation */}
                <div className="flex items-center gap-1 p-1 bg-[#0F1522] border border-slate-800/80 rounded-xl w-fit max-w-full overflow-x-auto">
                  {(
                    [
                      { id: 'boxes', label: 'Boxes' },
                      { id: 'inventory', label: `Inventory (${inventory.length})` },
                      { id: 'friends', label: `Friends${incomingRequests.length > 0 ? ` (${incomingRequests.length})` : ''}` },
                    ] as const
                  ).map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setProfileSubTab(sub.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        profileSubTab === sub.id
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {profileSubTab === 'boxes' && (
                  <LivingBoxesView
                    dex={dex}
                    activeBox={activeBox}
                    onChangeBox={setActiveBox}
                    selectedGame={selectedGame}
                    caughtSet={caughtSet}
                    shinySet={shinySet}
                    livingSet={livingSet}
                    caughtVariantsSet={caughtVariantsSet}
                    boxSelectedVariantsMap={boxSelectedVariantsMap}
                    boxSelectedGamesMap={boxSelectedGamesMap}
                    onSelectBoxVariant={handleSelectBoxVariant}
                    onSelectPokemon={(p) => setSelectedPokemon(p)}
                    inventory={inventory}
                    onNavigateToRegister={(pId) => {
                      setRegisterTargetPokemonId(pId);
                      setActiveTab('register');
                    }}
                  />
                )}

                {profileSubTab === 'inventory' && (
                  <InventoryView
                    dex={dex}
                    inventory={inventory}
                    rescueBinCount={rescueBin.length}
                    onUpdateInstance={handleUpdateInstance}
                    onDeleteInstance={handleDeleteInstance}
                    onOpenPokemonPage={(p) => setFullPagePokemon(p)}
                    onOpenTrainerCardForPokeId={(inst) => setActiveTrainerCardInstance(inst)}
                    onNavigateToRegister={() => setActiveTab('register')}
                    onNavigateToSettings={() => setActiveTab('settings')}
                  />
                )}

                {profileSubTab === 'friends' && (
                  <FriendsView
                    dex={dex}
                    user={user}
                    myFriendCode={myFriendCode}
                    myFriends={myFriends}
                    incomingRequests={incomingRequests}
                    friendProfiles={friendProfiles}
                    friendsLoading={friendsLoading}
                    isGuest={!user}
                    onRequestAuth={() => handleOpenAuth()}
                    onAddFriendByCode={handleAddFriendByCode}
                    onAcceptRequest={handleAcceptRequest}
                    onDeclineRequest={handleDeclineRequest}
                    onRemoveFriend={handleRemoveFriend}
                    onOpenFriendProfile={(uid) => setActiveFriendUid(uid)}
                  />
                )}
              </div>
            )}

            {/* ── GAME PROGRESS TRACKING TAB ── */}
            {activeTab === 'progress' && (
              <GameProgressTracker
                progress={gameProgress}
                trackedGames={trackedGames}
                ownedGames={ownedGames}
                onToggle={toggleMilestone}
                onToggleTracking={toggleTracking}
                onReset={resetGameProgress}
                onCompleteAll={completeAllMilestones}
              />
            )}
            {/* ── END GAME PROGRESS TRACKING TAB ── */}

            {/* TAB 5: PUBLIC LIVING DEX */}
            {activeTab === 'public_stats' && (
              <PublicStatsPageView
                dex={dex}
                trainerName={displayTrainerName}
                caughtSet={caughtSet}
                shinySet={shinySet}
                livingSet={livingSet}
                caughtVariantsSet={caughtVariantsSet}
                boxSelectedVariantsMap={boxSelectedVariantsMap}
                boxSelectedGamesMap={boxSelectedGamesMap}
                ownedGames={ownedGames}
                ownedDlcs={ownedDlcs}
                gameCatches={gameCatches}
                shareUrl={publicShareUrl}
                isOwnPreview={true}
                inventory={inventory}
                onExitPublicView={() => setActiveTab('pokedex')}
              />
            )}

            {/* TAB 6: SETTINGS */}
            {activeTab === 'settings' && (
              <SettingsView
                dex={dex}
                caughtSet={caughtSet}
                shinySet={shinySet}
                livingSet={livingSet}
                ownedGames={ownedGames}
                ownedDlcs={ownedDlcs}
                gameCatches={gameCatches}
                inventoryCount={inventory.length}
                rescueBin={rescueBin}
                onRescuePokepet={handleRescuePokepet}
                onRescueAll={handleRescueAll}
                onToggleOwnedGame={handleToggleOwnedGame}
                onSetAllOwnedGames={(games) => setOwnedGames(games)}
                onToggleOwnedDlc={handleToggleOwnedDlc}
                onSetAllOwnedDlcs={(dlcs) => setOwnedDlcs(dlcs)}
                tallyGames={tallyGames}
                onToggleTallyGame={handleToggleTallyGame}
                onSetAllTallyGames={handleSetAllTallyGames}
                includePokemonGoInSuggestions={includePokemonGoInSuggestions}
                onToggleIncludePokemonGoInSuggestions={handleToggleIncludePokemonGoInSuggestions}
                theme={theme}
                onToggleTheme={(t) => setTheme(t)}
                trainerName={displayTrainerName}
                isCloudSynced={Boolean(user)}
                isPublic={isPublic}
                onTogglePublic={(nextVal) => setIsPublic(nextVal)}
                publicShareUrl={publicShareUrl}
                onOpenPublicPreview={() => setActiveTab('public_stats')}
                onImportProgress={handleImportProgress}
                onResetAllProgress={handleResetAllProgress}
                onNavigateToTracker={() => setActiveTab('pokedex')}
                user={user}
                onSyncSuccess={(syncedCount) =>
                  setToast({
                    message: `Synced ${syncedCount} offline changes to Cloud!`,
                    type: 'success',
                  })
                }
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (< md) for Phone Users */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0B0F17]/95 backdrop-blur-lg border-t border-slate-800/90 px-1 py-1.5 flex items-center justify-around shadow-2xl pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <button
          type="button"
          onClick={() => {
            setFullPagePokemon(null);
            setActiveTab('home');
          }}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'home' && !fullPagePokemon
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFullPagePokemon(null);
            setActiveTab('register');
          }}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'register' && !fullPagePokemon
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFullPagePokemon(null);
            setActiveTab('pokedex');
          }}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'pokedex' && !fullPagePokemon
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Tracker</span>
        </button>

        <button
          type="button"
          onClick={() => navigateToProfile('boxes')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'profile' && !fullPagePokemon
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCircle className="w-4 h-4" />
          <span>Profile</span>
        </button>

        {/* ── GAME PROGRESS TRACKING MOBILE TAB ── */}
        <button
          type="button"
          onClick={() => {
            setFullPagePokemon(null);
            setActiveTab('progress');
          }}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'progress' && !fullPagePokemon
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Progress</span>
        </button>
        {/* ── END GAME PROGRESS TRACKING MOBILE TAB ── */}

        <button
          type="button"
          onClick={() => {
            setFullPagePokemon(null);
            setActiveTab('settings');
          }}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'settings' && !fullPagePokemon
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Slide-Over Drawer */}
      <PokemonDetailDrawer
        pokemon={selectedPokemon}
        dex={dex}
        onSelectPokemon={(p) => setSelectedPokemon(p)}
        onOpenFullPage={(p) => {
          setSelectedPokemon(null);
          setFullPagePokemon(p);
        }}
        onClose={() => setSelectedPokemon(null)}
        isCaught={selectedPokemon ? caughtSet.has(selectedPokemon.id) && inventory.some((inv) => inv.pokemonId === selectedPokemon.id) : false}
        isShiny={selectedPokemon ? shinySet.has(selectedPokemon.id) && inventory.some((inv) => inv.pokemonId === selectedPokemon.id) : false}
        isLiving={selectedPokemon ? livingSet.has(selectedPokemon.id) && inventory.some((inv) => inv.pokemonId === selectedPokemon.id) : false}
        caughtVariantsSet={caughtVariantsSet}
        selectedBoxGameId={selectedPokemon ? boxSelectedGamesMap.get(selectedPokemon.id) : undefined}
        ownedGames={ownedGames}
        ownedDlcs={ownedDlcs}
        gameCatches={gameCatches}
        inventory={inventory}
        onNavigateToRegister={(pId) => {
          setSelectedPokemon(null);
          setRegisterTargetPokemonId(pId);
          setActiveTab('register');
        }}
        onOpenTrainerCardForPokeId={(inst) => setActiveTrainerCardInstance(inst)}
      />

      {/* Dedicated Pokepet Trainer Card Modal for POKEID */}
      {activeTrainerCardInstance && (
        <PokepetTrainerCardModal
          instance={activeTrainerCardInstance}
          pokemon={dex.find((p) => p.id === activeTrainerCardInstance.pokemonId) || null}
          trainerName={displayTrainerName}
          onClose={() => setActiveTrainerCardInstance(null)}
        />
      )}

      {/* Friend Profile Modal */}
      {activeFriendUid && friendProfiles[activeFriendUid] && (
        <div className="fixed inset-0 z-50 bg-[#0B0F17] overflow-y-auto">
          <div className="sticky top-0 z-10 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
              Viewing
              <span className="text-sky-300">
                {friendProfiles[activeFriendUid].trainerName || 'Trainer'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setActiveFriendUid(null)}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="p-4 sm:p-6">
            <PublicStatsPageView
              dex={dex}
              trainerName={friendProfiles[activeFriendUid].trainerName || 'Trainer'}
              caughtSet={new Set(friendProfiles[activeFriendUid].caughtIds)}
              shinySet={new Set(friendProfiles[activeFriendUid].shinyIds)}
              livingSet={new Set(friendProfiles[activeFriendUid].livingIds)}
              caughtVariantsSet={new Set(friendProfiles[activeFriendUid].caughtVariants || [])}
              boxSelectedVariantsMap={parseBoxSelectedVariants(
                friendProfiles[activeFriendUid].boxSelectedVariants || []
              )}
              boxSelectedGamesMap={parseBoxSelectedGames(
                friendProfiles[activeFriendUid].boxSelectedGames || []
              )}
              ownedGames={friendProfiles[activeFriendUid].ownedGames || DEFAULT_OWNED_GAMES}
              ownedDlcs={(friendProfiles[activeFriendUid].ownedDlcs as DlcId[]) || []}
              gameCatches={
                friendProfiles[activeFriendUid].gameCatches || createEmptyGameCatchesMap()
              }
              shareUrl=""
              isOwnPreview={false}
              inventory={(friendProfiles[activeFriendUid].inventory as PokemonInstance[]) || []}
              onExitPublicView={() => setActiveFriendUid(null)}
            />
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-rose-500/50 shadow-2xl text-rose-300 text-xs font-medium max-w-md animate-in fade-in slide-in-from-bottom-2">
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-200 ml-auto cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
      {/* Global Offline Indicator Banner */}
      <OfflineIndicator />

      {/* Auth Modal with Email/Password & Offline Cached Account Login */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        actionPrompt={authActionPrompt}
        onSuccess={() => {
          setToast({
            message: 'Successfully authenticated! Your Living Dex data is synchronized.',
            type: 'success',
          });
        }}
      />

      {/* Cross-Device Access Modal (Phone, PC, iPad) */}
      <DeviceAccessModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
      />
    </div>
  );
}

export default App;