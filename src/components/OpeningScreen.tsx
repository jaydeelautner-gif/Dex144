import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  Search,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  RefreshCw,
  KeyRound,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Dice5,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import type { PokemonEntry } from '../data/pokemonData';
import {
  signInWithEmail,
  signInWithPin,
  fetchRandomRegisteredPokepet,
  searchPokepetByPokeId,
  lookupFriendCode,
  fetchPublicDexProfile,
  type RandomRegisteredPokepetResult,
  type SerializedPokemonInstance,
} from '../firebase';
import {
  getCachedAuthAccounts,
  isFirstLoginOnDevice,
  hasPinSet,
  type CachedAuthAccount,
} from '../utils/offlineAuth';
import { useOnlineStatus } from '../utils/offlineManager';
import { useOfflineUpdateStatus } from '../utils/offlineUpdates';
import { PokemonSprite } from './PokemonSprite';
import { GameLogoBadge } from './GameLogoBadge';
import { playGameboyPowerOnSound, primeGameboyAudio } from '../utils/gameboySound';

interface OpeningScreenProps {
  dex: PokemonEntry[];
  onSuccessfulLogin: () => void;
  onOpenTrainerCard: (instance: SerializedPokemonInstance, trainerName: string) => void;
  onOpenPublicProfile: (uid: string) => void;
}

export const OpeningScreen: React.FC<OpeningScreenProps> = ({
  dex,
  onSuccessfulLogin,
  onOpenTrainerCard,
  onOpenPublicProfile,
}) => {
  const isOnline = useOnlineStatus();
  const updateStatus = useOfflineUpdateStatus();

  // Left Column: Random Registered PokéPet state
  const [randomPetData, setRandomPetData] = useState<RandomRegisteredPokepetResult | null>(null);
  const [isLoadingPet, setIsLoadingPet] = useState<boolean>(true);

  // Left Column: Search / Lookup state
  const [lookupQuery, setLookupQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSuccessMsg, setLookupSuccessMsg] = useState<string | null>(null);

  // Right Column: Auth form state
  const [authMode, setAuthMode] = useState<'password' | 'pin'>('password');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('');
  const [selectedPinAccount, setSelectedPinAccount] = useState<string>('');
  const [cachedAccounts, setCachedAccounts] = useState<CachedAuthAccount[]>([]);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  // Load cached accounts on mount
  useEffect(() => {
    const accounts = getCachedAuthAccounts();
    setCachedAccounts(accounts);
    if (accounts.length > 0) {
      if (!email) setEmail(accounts[0].email);
      setSelectedPinAccount(accounts[0].email);
    }
    // If device is offline and cached accounts exist, default to password or pin if configured
    if (!isOnline && accounts.length > 0) {
      const firstWithPin = accounts.find((a) => hasPinSet(a.uid));
      if (firstWithPin) {
        setSelectedPinAccount(firstWithPin.email);
      }
    }
  }, [isOnline]);

  // Load a random registered PokéPet
  const loadRandomPokepet = useCallback(async () => {
    setIsLoadingPet(true);
    try {
      const result = await fetchRandomRegisteredPokepet();
      setRandomPetData(result);
    } catch (err) {
      console.warn('Failed to fetch random registered pokepet:', err);
    } finally {
      setIsLoadingPet(false);
    }
  }, []);

  useEffect(() => {
    loadRandomPokepet();
  }, [loadRandomPokepet]);

  // Look up POKEID or Trainer Friend Code / UID
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupSuccessMsg(null);
    const query = lookupQuery.trim().toUpperCase();

    if (!query) {
      setLookupError('Please enter a POKEID (e.g. ID8F3K9L2M4P) or Trainer Code (e.g. DX-ABCDEF).');
      return;
    }

    setIsSearching(true);
    try {
      // 1. Is it a POKEID? (Starts with ID and length 12)
      if (query.startsWith('ID') && query.length === 12) {
        const res = await searchPokepetByPokeId(query, [], 'Trainer');
        if (res.success && res.pokepet) {
          setLookupSuccessMsg(`Found PokéPet ${res.pokepet.pokeId}! Opening details...`);
          onOpenTrainerCard(res.pokepet, res.trainerName || 'Registered Trainer');
          return;
        } else {
          setLookupError(res.error || `No registered PokéPet found matching POKEID "${query}".`);
          return;
        }
      }

      // 2. Is it a Trainer Friend Code? (Starts with DX- or 6 chars)
      const friendCodeTarget = query.startsWith('DX-') ? query : `DX-${query}`;
      if (friendCodeTarget.length === 9) {
        const targetUid = await lookupFriendCode(friendCodeTarget);
        if (targetUid) {
          const profile = await fetchPublicDexProfile(targetUid);
          if (profile && profile.isPublic) {
            setLookupSuccessMsg(`Found public profile for Trainer "${profile.trainerName || 'Trainer'}"!`);
            onOpenPublicProfile(targetUid);
            return;
          } else {
            setLookupError(`Trainer profile found for "${friendCodeTarget}", but their profile is private.`);
            return;
          }
        }
      }

      // 3. Is it a direct UID?
      const directProfile = await fetchPublicDexProfile(query);
      if (directProfile && directProfile.isPublic) {
        setLookupSuccessMsg(`Found public profile for Trainer "${directProfile.trainerName || 'Trainer'}"!`);
        onOpenPublicProfile(query);
        return;
      }

      setLookupError(
        `No registered PokéPet or public Trainer profile found for "${query}". Ensure the ID is valid or that the profile is set to Public.`
      );
    } catch (err: unknown) {
      setLookupError((err as Error)?.message || 'Lookup failed. Please check network connection.');
    } finally {
      setIsSearching(false);
    }
  };

  // Email + Password Submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMessage(null);
    primeGameboyAudio();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setAuthErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setAuthErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      await signInWithEmail(cleanEmail, password);
      // Play authentic Game Boy power-on sound effect upon login & rest of site loaded!
      playGameboyPowerOnSound();
      onSuccessfulLogin();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Sign in failed. Please check your credentials.';
      setAuthErrorMessage(msg);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Quick PIN Submission (for offline quick entry)
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMessage(null);
    primeGameboyAudio();

    const targetAccountEmail = (selectedPinAccount || email).trim().toLowerCase();
    if (!targetAccountEmail) {
      setAuthErrorMessage('Please select or enter the account email.');
      return;
    }

    const cleanPin = pin.trim();
    if (!cleanPin || cleanPin.length < 4) {
      setAuthErrorMessage('Please enter your 4-8 digit PIN.');
      return;
    }

    // STRICT REQUIREMENT: "Do not allow this to be used to login for the first time on a device."
    if (isFirstLoginOnDevice(targetAccountEmail)) {
      setAuthErrorMessage(
        'PIN quick entry cannot be used to log in for the first time on this device. Please sign in with your email and password first to verify your credentials.'
      );
      return;
    }

    setIsSubmittingAuth(true);
    try {
      await signInWithPin(targetAccountEmail, cleanPin);
      // Play authentic Game Boy power-on sound effect upon login & rest of site loaded!
      playGameboyPowerOnSound();
      onSuccessfulLogin();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'PIN verification failed.';
      setAuthErrorMessage(msg);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Find dex entry for the random pet
  const randomPetPokemon = randomPetData
    ? dex.find((p) => p.id === randomPetData.pokepet.pokemonId) || null
    : null;

  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Top Device State & Update Bar (Minimal, strictly non-actionable before login) */}
      <div className="w-full pb-4 sm:pb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full border border-purple-500/50 shadow-md relative overflow-hidden flex items-center justify-center shrink-0"
            style={{
              background:
                'linear-gradient(180deg, #7C3AED 0%, #6D28D9 48%, #1E1B4B 48%, #0F172A 52%, #F8FAFC 52%, #E2E8F0 100%)',
            }}
          >
            <div className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-pink-500 border border-pink-300 opacity-90 pointer-events-none" />
            <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-pink-500 border border-pink-300 opacity-90 pointer-events-none" />
            <span className="absolute top-0 text-[7px] font-black text-white font-mono pointer-events-none">
              M
            </span>
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-200">
            HomeDex <span className="text-amber-400 font-mono text-xs">Gateway</span>
          </span>
        </div>

        {/* Minimal, non-actionable device status indicator */}
        <div
          aria-label="Device Status Indicator"
          className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono pointer-events-none select-none cursor-default shadow-sm"
        >
          {/* Network State */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className={isOnline ? 'text-emerald-300 font-medium' : 'text-amber-300 font-medium'}>
              {isOnline ? 'Online · Connected' : 'Offline Mode · Local Storage'}
            </span>
          </div>

          <span className="text-slate-600">|</span>

          {/* Update State */}
          <div className="flex items-center gap-1 text-slate-400">
            <span>
              {updateStatus.updateNeeded
                ? 'Update available (login to apply)'
                : updateStatus.checking
                ? 'Checking update status...'
                : 'App v4.2.0 · Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Body: Left Hand Side (Showcase & Lookup) | Right Hand Side (Email/Password Login) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 my-auto py-6">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Random Registered PokéPet & Public Lookup   */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Section Banner */}
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                COMMUNITY SHOWCASE
              </span>
              <span className="text-xs text-slate-400 font-mono">Public Guest Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Registered PokéPets & Public Profiles
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
              Explore verified specimens and public Living Dexes registered across the network.
              Sign in on the right to track your personal collection.
            </p>
          </div>

          {/* Random Registered PokéPet Card */}
          <div className="relative rounded-2xl bg-[#0F1522] border border-slate-800/90 p-5 sm:p-6 shadow-xl overflow-hidden flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Featured Registered PokéPet
                </span>
              </div>
              <button
                type="button"
                onClick={loadRandomPokepet}
                disabled={isLoadingPet}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-300 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                title="Roll another random registered PokéPet"
              >
                <Dice5 className={`w-3.5 h-3.5 ${isLoadingPet ? 'animate-spin' : ''}`} />
                <span>Shuffle Pet</span>
              </button>
            </div>

            {isLoadingPet ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                <span className="text-xs font-mono">Locating registered specimen...</span>
              </div>
            ) : randomPetData ? (
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Sprite preview container */}
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-700/70 p-2 flex items-center justify-center shrink-0 shadow-inner group">
                  {randomPetPokemon ? (
                    <PokemonSprite
                      id={randomPetData.pokepet.pokemonId}
                      name={randomPetPokemon.name}
                      shiny={randomPetData.pokepet.isShiny}
                      size="xl"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-slate-600">?</div>
                  )}

                  {randomPetData.pokepet.isShiny && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-0.5 shadow">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>SHINY</span>
                    </div>
                  )}

                  {randomPetData.pokepet.gender && (
                    <div className="absolute bottom-2 left-2 text-[11px] font-mono font-bold">
                      {randomPetData.pokepet.gender === 'male' ? (
                        <span className="text-sky-400">♂ Male</span>
                      ) : randomPetData.pokepet.gender === 'female' ? (
                        <span className="text-pink-400">♀ Female</span>
                      ) : (
                        <span className="text-slate-500">Genderless</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Details Column */}
                <div className="flex-1 flex flex-col gap-2.5 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl font-black text-slate-100">
                          {randomPetData.pokepet.nickname
                            ? `“${randomPetData.pokepet.nickname}”`
                            : randomPetPokemon?.name || `Pokémon #${randomPetData.pokepet.pokemonId}`}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                          Lv. {randomPetData.pokepet.level}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        {randomPetPokemon ? `${randomPetPokemon.name} • #${String(randomPetPokemon.id).padStart(4, '0')}` : `#${randomPetData.pokepet.pokemonId}`}
                      </div>
                    </div>

                    {randomPetData.pokepet.gameId && (
                      <GameLogoBadge gameId={randomPetData.pokepet.gameId as any} size="sm" />
                    )}
                  </div>

                  {/* POKEID & Owner Tags */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase">POKEID CODE</span>
                      <span className="font-bold text-amber-300 tracking-wider">
                        {randomPetData.pokepet.pokeId}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase">ORIGINAL TRAINER</span>
                      <span className="font-bold text-slate-200 truncate">
                        {randomPetData.trainerName || 'Registered Trainer'}
                      </span>
                    </div>
                  </div>

                  {randomPetData.pokepet.notes && (
                    <p className="text-xs text-slate-300 italic bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80 line-clamp-2">
                      “{randomPetData.pokepet.notes}”
                    </p>
                  )}

                  {/* Inspect PokéPet Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenTrainerCard(randomPetData.pokepet, randomPetData.trainerName)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold transition cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Inspect Trainer Card for this PokéPet</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Trainer and POKEID Lookup Box */}
          <div className="rounded-2xl bg-[#0F1522] border border-slate-800/90 p-5 sm:p-6 shadow-xl flex flex-col gap-3.5">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-slate-100">
                Public Lookup: Trainer Code or POKEID
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter any 12-character <strong className="text-amber-300">POKEID</strong> (e.g. <code className="text-slate-200 font-mono">ID8F3K9L2M4P</code>) to verify a pet, or a <strong className="text-sky-300">Trainer Code</strong> (e.g. <code className="text-slate-200 font-mono">DX-ABCDEF</code>) to view their public Living Dex.
            </p>

            <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value.toUpperCase())}
                  placeholder="Enter POKEID (ID...) or Trainer Code (DX-...)"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-sky-400 text-slate-100 font-mono text-xs sm:text-sm focus:outline-none placeholder:text-slate-600 uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !lookupQuery.trim()}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md flex items-center justify-center gap-2 shrink-0"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Lookup</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {lookupError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{lookupError}</span>
              </div>
            )}

            {lookupSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{lookupSuccessMsg}</span>
              </div>
            )}

            <div className="text-[11px] text-slate-500 font-mono border-t border-slate-800/80 pt-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
              <span>Guest access is strictly limited to looking up verified cards and public showcases.</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Trainer Sign In (Email/Password or PIN)      */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="rounded-3xl bg-[#0F1522] border border-amber-500/60 p-6 sm:p-8 shadow-2xl flex flex-col gap-5 text-slate-100">
            {/* Header */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold tracking-wider uppercase">
                  TRAINER AUTHENTICATION
                </span>
                {!isOnline && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold">
                    <WifiOff className="w-3 h-3" />
                    OFFLINE
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                Sign In to HomeDex
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log in to sync your Living Dex, register Pokémon, track progress, and manage your inventory.
              </p>
            </div>

            {/* Offline Mode Selector: Password vs Quick PIN */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('password');
                  setAuthErrorMessage(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  authMode === 'password'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('pin');
                  setAuthErrorMessage(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'pin'
                    ? 'bg-purple-600 text-white shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Quick PIN Entry</span>
              </button>
            </div>

            {/* Cached Credentials Quick Fill */}
            {cachedAccounts.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                <span className="text-[10px] font-mono text-amber-400/90 font-bold uppercase tracking-wider">
                  Cached Credentials on this Device:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cachedAccounts.map((acc) => {
                    const isSelected =
                      (authMode === 'password' ? email : selectedPinAccount).toLowerCase() ===
                      acc.email.toLowerCase();
                    return (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => {
                          setEmail(acc.email);
                          setSelectedPinAccount(acc.email);
                          setAuthErrorMessage(null);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold shadow'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <UserCheck className="w-3 h-3 text-emerald-400" />
                        <span>{acc.email}</span>
                        {acc.displayName && (
                          <span className="text-[10px] opacity-75 font-sans">
                            ({acc.displayName})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PASSWORD LOGIN FORM */}
            {authMode === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trainer@pokemon.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-amber-400 text-slate-100 text-sm font-mono placeholder:text-slate-600 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-amber-400 text-slate-100 text-sm font-mono placeholder:text-slate-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authErrorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span className="leading-relaxed">{authErrorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full mt-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingAuth ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating Trainer...</span>
                    </>
                  ) : (
                    <>
                      <span>{!isOnline ? 'Sign In with Offline Credentials' : 'Sign In to HomeDex'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* QUICK PIN LOGIN FORM (OFFLINE QUICK ENTRY) */}
            {authMode === 'pin' && (
              <form onSubmit={handlePinSubmit} className="flex flex-col gap-3.5">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs leading-relaxed">
                  <strong className="text-purple-300 font-bold block mb-1">
                    Offline Quick-Entry PIN
                  </strong>
                  Enter your configured PIN to quickly unlock this device without re-entering your full password.
                  <span className="block mt-1 text-[11px] text-purple-300/80">
                    * For device security, PIN quick entry cannot be used to log in for the first time on a new device.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    <span>Trainer Account</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={selectedPinAccount || email}
                    onChange={(e) => setSelectedPinAccount(e.target.value)}
                    placeholder="trainer@pokemon.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-purple-400 text-slate-100 text-sm font-mono placeholder:text-slate-600 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                    <span>Enter 4-8 Digit PIN</span>
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={8}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-purple-400 text-slate-100 text-center font-mono text-xl tracking-widest focus:outline-none placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-sm"
                  />
                </div>

                {authErrorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span className="leading-relaxed">{authErrorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingAuth || !pin}
                  className="w-full mt-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-black text-sm tracking-wide shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingAuth ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying PIN...</span>
                    </>
                  ) : (
                    <>
                      <span>Unlock with PIN</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="text-[11px] text-slate-500 text-center font-mono pt-1">
              Protected by Local SHA-256 Storage & Firebase Cloud Auth
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer note */}
      <div className="w-full pt-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <span>HomeDex National Living Dex System • All rights reserved</span>
      </div>
    </div>
  );
};
