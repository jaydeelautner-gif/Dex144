import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search,
  Check,
  Sparkles,
  Box,
  LayoutGrid,
  List,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Maximize2,
  Globe,
  User as UserIcon,
  Sun,
  Moon,
  Plus,
  Home,
  PlusCircle,
  Layers,
  Settings,
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
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthModal } from './components/AuthModal';
import { DeviceAccessModal } from './components/DeviceAccessModal';

import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signOutUser,
  subscribeToUserDexProfile,
  saveUserDexProfile,
  fetchPublicDexProfile,
  searchPokepetByPokeId,
  savePokepetToUniversalDatabase,
  updatePokepetInUniversalDatabase,
  deletePokepetFromUniversalDatabase,
  type User,
  type UserDexProfileData,
  type SerializedPokemonInstance,
} from './firebase';

type MainWorkspaceTab =
  | 'home'
  | 'register'
  | 'pokedex'
  | 'boxes'
  | 'inventory'
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

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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

  // User Progress State - strictly synchronized with registered PokePets in inventory:
  // "pokemon should not be allowed to classed as caught on any box view if the user has no PokePets registered with that species."
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
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
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

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('homedex_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    try {
      localStorage.setItem('homedex_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Firebase Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [cloudLoaded, setCloudLoaded] = useState<boolean>(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);
  const isApplyingRemoteRef = useRef<boolean>(false);

  // Sync caughtIds, livingIds, shinyIds, and box selections from inventory:
  // "pokemon should not be allowed to classed as caught on any box view if the user has no PokePets registered with that species."
  // Having 0 means not caught and any inventory of that pokemon above 1 is classed as caught.
  // If the last pokemon in the inventory is deleted then the pokemon is no longer marked as caught.
  // HOME gifts: They’re the only pokemon that can be counted as caught in the dex without an origin game.
  // It still counts on the overall count even if it is the only instance.
  useEffect(() => {
    const speciesInInventory = new Set(inventory.map((item) => item.pokemonId));

    // 1. Caught IDs strictly restricted to species with at least 1 registered PokePet
    const uniqueIdsInInventory = Array.from(speciesInInventory).sort((a, b) => a - b);
    setCaughtIds(uniqueIdsInInventory);

    // 2. Living IDs strictly restricted to species with registered PokePets stored in HOME & assigned to living box
    const uniqueLivingInInventory = Array.from(
      new Set(
        inventory
          .filter((item) => item.isInLivingBox && item.storedInHome)
          .map((item) => item.pokemonId)
      )
    ).sort((a, b) => a - b);
    setLivingIds(uniqueLivingInInventory);

    // 3. Shiny IDs strictly restricted to species with at least one shiny registered PokePet
    const uniqueShinyInInventory = Array.from(
      new Set(
        inventory
          .filter((item) => item.isShiny)
          .map((item) => item.pokemonId)
      )
    ).sort((a, b) => a - b);
    setShinyIds(uniqueShinyInInventory);

    // 4. Box selected variants: clean up any that don't belong to species in inventory
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

    // 5. Box selected games: clean up any that don't belong to species in inventory
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

  // Subscribe to Firestore userDexProfiles/{uid}
  useEffect(() => {
    if (!user) return;
    let isInitialFetch = true;
    const unsub = subscribeToUserDexProfile(
      user.uid,
      (remoteProfile) => {
        if (remoteProfile) {
          isApplyingRemoteRef.current = true;
          const mappedRemoteInventory: PokemonInstance[] = (remoteProfile.inventory || []).map((inv) => ({
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
            trainerName: inv.trainerName || remoteProfile.trainerName || user.displayName || 'Trainer',
            isRescued: Boolean(inv.isRescued),
            rescuedAt: inv.rescuedAt,
            createdAt: inv.createdAt,
            updatedAt: inv.updatedAt,
          }));

          // Multi-Device sync & Offline iPad sync merge:
          // If a user registered pokepets on this device while offline or before login,
          // merge them into the profile so they are preserved and uploaded to cloud!
          const remotePokeIdSet = new Set(mappedRemoteInventory.map((i) => i.pokeId));
          const currentLocalInventory = loadInventoryFromStorage();
          const unsyncedFromLocal = currentLocalInventory.filter(
            (localItem) => !remotePokeIdSet.has(localItem.pokeId)
          );

          let finalInventory = mappedRemoteInventory;
          if (unsyncedFromLocal.length > 0) {
            const taggedUnsynced = unsyncedFromLocal.map((loc) => ({
              ...loc,
              ownerId: user.uid,
              ownerEmail: user.email || undefined,
              trainerName: user.displayName || trainerName || 'Trainer',
            }));
            finalInventory = [...mappedRemoteInventory, ...taggedUnsynced];

            // Upload unsynced to central universal database
            taggedUnsynced.forEach((item) => {
              savePokepetToUniversalDatabase(item, user.uid, item.trainerName || 'Trainer').catch(() => {});
            });
          }

          setInventory(finalInventory);

          // Sync rescueBin
          if (remoteProfile.rescueBin && Array.isArray(remoteProfile.rescueBin)) {
            setRescueBin(pruneExpiredRescueBin(remoteProfile.rescueBin));
          }

          // Filter remote progress strictly by registered species in finalInventory:
          const finalSpeciesSet = new Set(finalInventory.map((item) => item.pokemonId));
          setCaughtIds(Array.from(finalSpeciesSet).sort((a, b) => a - b));
          setShinyIds(
            Array.from(
              new Set(
                finalInventory
                  .filter((item) => item.isShiny)
                  .map((item) => item.pokemonId)
              )
            ).sort((a, b) => a - b)
          );
          setLivingIds(
            Array.from(
              new Set(
                finalInventory
                  .filter((item) => item.isInLivingBox && item.storedInHome)
                  .map((item) => item.pokemonId)
              )
            ).sort((a, b) => a - b)
          );
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
          setCloudLoaded(true);
          setTimeout(() => {
            isApplyingRemoteRef.current = false;
          }, 50);
        } else if (isInitialFetch) {
          const effectiveName = user.displayName || 'Guest';
          setTrainerName(effectiveName);
          setCloudLoaded(true);
          saveUserDexProfile(user.uid, {
            trainerName: effectiveName,
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
        }
        isInitialFetch = false;
      },
      () => {
        setCloudLoaded(true);
      }
    );
    return () => unsub();
  }, [user]);

  // Persist to localStorage & Firestore
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

  // Add a newly registered pokepet instance to the database
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

    // Save to central universal database
    savePokepetToUniversalDatabase(taggedInstance, ownerId, effectiveTrainerName).catch((err) => {
      console.warn('Failed to save pokepet to universal database:', err);
    });

    // 1. Variant caught
    setCaughtVariants((prev) =>
      prev.includes(newInstance.variantId) ? prev : [...prev, newInstance.variantId]
    );

    // 2. Shiny caught
    if (newInstance.isShiny) {
      setShinyIds((prev) =>
        prev.includes(newInstance.pokemonId) ? prev : [...prev, newInstance.pokemonId]
      );
    }

    // 3. Stored in HOME / Living Box assignment
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

    // 4. Per-game catch map (only if origin game is present, not for HOME gifts)
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

  // Delete instance:
  // "PokePets, their POKEID and all it’s data that a user choses deleted go into a bin, which is kept for 30 days and then automatically deleted."
  const handleDeleteInstance = useCallback((pokeId: string) => {
    // Delete from universal database (marked inactive)
    deletePokepetFromUniversalDatabase(pokeId).catch((err) => {
      console.warn('Failed to delete pokepet from universal database:', err);
    });

    setInventory((prev) => {
      const target = prev.find((item) => item.pokeId === pokeId);
      if (!target) return prev;

      // Transfer to 30-Day Rescue Bin
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

      const next = prev.filter((item) => item.pokeId !== pokeId);
      const remainingOfThisSpecies = next.filter((item) => item.pokemonId === target.pokemonId);

      // If no instances remain, remove from living and shiny
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

  // Rescue a single pokepet from the 30-day bin:
  // "Users can rescue pokemon in the new rescue section in the settings menu. These should then be fully restored to the user and no longer eligible to be deleted."
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

      // Restore to active inventory
      setInventory((invPrev) => {
        if (invPrev.some((i) => i.pokeId === restored.pokeId)) return invPrev;
        return [restored, ...invPrev];
      });

      // Mark species caught
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

      // Re-save to central database
      savePokepetToUniversalDatabase(
        restored,
        user?.uid || restored.ownerId || 'restored_trainer',
        restored.trainerName || 'Trainer'
      ).catch(() => {});

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
    setRescueBin((binPrev) => {
      if (binPrev.length === 0) return binPrev;

      const now = Date.now();
      const restoredList: PokemonInstance[] = binPrev.map((b) => ({
        ...b.instance,
        isRescued: true,
        rescuedAt: now,
        updatedAt: now,
      }));

      // Add all to inventory without duplicate pokeIds
      setInventory((invPrev) => {
        const existingIds = new Set(invPrev.map((i) => i.pokeId));
        const novel = restoredList.filter((r) => !existingIds.has(r.pokeId));
        return [...novel, ...invPrev];
      });

      // Mark caught and shiny
      const restoredSpeciesIds = restoredList.map((r) => r.pokemonId);
      const restoredShinyIds = restoredList.filter((r) => r.isShiny).map((r) => r.pokemonId);

      setCaughtIds((cPrev) => Array.from(new Set([...cPrev, ...restoredSpeciesIds])));
      if (restoredShinyIds.length > 0) {
        setShinyIds((sPrev) => Array.from(new Set([...sPrev, ...restoredShinyIds])));
      }

      // Re-save to central database
      restoredList.forEach((r) => {
        savePokepetToUniversalDatabase(
          r,
          user?.uid || r.ownerId || 'restored_trainer',
          r.trainerName || 'Trainer'
        ).catch(() => {});
      });

      try {
        localStorage.removeItem(LS_RESCUE_BIN_KEY);
      } catch {
        // ignore
      }
      return [];
    });

    setToast({
      message: 'All Pokémon have been rescued and restored!',
      type: 'success',
    });
  }, [user]);

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

      // 1. Search local user inventory
      const localMatch = inventory.find((inv) => inv.pokeId.toUpperCase() === cleanId);
      if (localMatch) {
        setActiveTrainerCardInstance(localMatch);
        return null;
      }

      // 2. Search shared profile data
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

      // 3. Search central Firestore database of registered pokepets
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
    // If there were active PokéPets in inventory, safeguard them in the 30-Day Rescue Bin
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

        {/* Primary Workspace Navigation Tabs (Desktop / Laptop / Tablet Landscape) */}
        <nav
          aria-label="Primary Workspace"
          className="hidden md:flex items-center gap-1 p-1 bg-[#0F1522] border border-slate-800/80 rounded-xl overflow-x-auto"
        >
          {(
            [
              { id: 'home', label: 'Home' },
              { id: 'register', label: 'Register Pokémon' },
              { id: 'pokedex', label: 'Pokédex Tracker' },
              { id: 'boxes', label: 'Living Boxes (35)' },
              { id: 'inventory', label: `Inventory (${inventory.length})` },
              { id: 'public_stats', label: 'Public Living Dex' },
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tab.id && !fullPagePokemon
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <PWAInstallButton />

          <button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0F1522] border border-slate-800">
            <UserIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            {isEditingName ? (
              <input
                type="text"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                onBlur={() => {
                  if (!trainerName.trim()) setTrainerName('Guest');
                  setIsEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (!trainerName.trim()) setTrainerName('Guest');
                    setIsEditingName(false);
                  }
                }}
                autoFocus
                className="w-28 bg-slate-900 border border-amber-400/60 rounded px-1.5 py-0.5 text-xs text-slate-100 focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                title="Click to edit Trainer Name"
                className="text-xs font-medium text-slate-200 hover:text-amber-300 transition-colors cursor-pointer"
              >
                {displayTrainerName}
              </button>
            )}
          </div>

          {authErrorMsg && (
            <span className="hidden lg:inline text-xs text-rose-400 font-mono-tabular">
              {authErrorMsg}
            </span>
          )}

          {authReady && user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-[11px] font-mono font-semibold text-emerald-400">
                  {(user as any).isOffline ? 'Offline Auth' : 'Synced'}
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
        {/* Full-Screen Pokémon Page View */}
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
              setActiveTab('boxes');
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
                onNavigateToLivingDex={() => setActiveTab('boxes')}
                onNavigateToInventory={() => setActiveTab('inventory')}
                onNavigateToSettings={() => setActiveTab('settings')}
                onLookupPokeId={handleLookupPokeId}
              />
            )}

            {/* TAB 1: REGISTER POKÉMON (Exclusive Gateway for Inputting Pokémon!) */}
            {activeTab === 'register' && (
              <RegisterPokemonView
                dex={dex}
                ownedGames={ownedGames}
                inventory={inventory}
                initialPokemonId={registerTargetPokemonId}
                onSaveNewInstance={handleSaveNewInstance}
                onOpenPokemonPage={(p) => setFullPagePokemon(p)}
                onNavigateToInventory={() => setActiveTab('inventory')}
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
                      const isLiving = livingSet.has(p.id);
                      const specimenCount = inventory.filter((inv) => inv.pokemonId === p.id).length;
                      const ownedSummary = getOwnedGamesAvailabilitySummary(p);
                      const variations = getVariationsForPokemon(p);
                      const savedVariantId = boxSelectedVariantsMap.get(p.id);
                      const displayVariant =
                        variations.find((v) => v.variantId === savedVariantId) || variations[0];

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
                              {!ownedSummary.obtainableInOwned ? (
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
                                  {!ownedSummary.obtainableInOwned ? (
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
            {activeTab === 'boxes' && (
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

            {/* TAB 4: INVENTORY (Replaces Trainer Card & Export on menu bar) */}
            {activeTab === 'inventory' && (
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

            {/* TAB 6: SETTINGS (Includes Trainer Card & Export embedded under Settings) */}
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
          onClick={() => {
            setFullPagePokemon(null);
            setActiveTab('boxes');
          }}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'boxes' && !fullPagePokemon
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Boxes</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFullPagePokemon(null);
            setActiveTab('inventory');
          }}
          className={`relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'inventory' && !fullPagePokemon
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Inventory</span>
          {inventory.length > 0 && (
            <span className="absolute -top-0.5 right-1 px-1 rounded-full bg-amber-500 text-slate-950 font-bold text-[8px] leading-tight">
              {inventory.length}
            </span>
          )}
        </button>

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
