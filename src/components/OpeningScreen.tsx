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
  UserPlus,
  X,
  Key,
} from 'lucide-react';
import type { PokemonEntry } from '../data/pokemonData';
import {
  signInWithEmail,
  signInWithPin,
  signUpWithEmail,
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
import { PokedexOpeningAnimation } from './PokedexOpeningAnimation';

import './dexFrame.css';

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
  const [authMode, setAuthMode] = useState<'password' | 'pin' | 'signup'>(() => getCachedAuthAccounts().some(a => a.hasLoggedInOnThisDevice && hasPinSet(a.uid)) ? 'pin' : 'password');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('');
  const [selectedPinAccount, setSelectedPinAccount] = useState<string>('');
  const [cachedAccounts, setCachedAccounts] = useState<CachedAuthAccount[]>([]);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  // Invite code & Sign Up state (Secret code: poketester - NEVER shown to user)
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteCodeInput, setInviteCodeInput] = useState<string>('');
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);
  const [hasUnlockedSignup, setHasUnlockedSignup] = useState<boolean>(false);

  // Sign up fields
  const [signupTrainerName, setSignupTrainerName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState<string>('');
  const [showSignupPassword, setShowSignupPassword] = useState<boolean>(false);

  // Phone guest lookup modal state
  const [showMobileLookupModal, setShowMobileLookupModal] = useState<boolean>(false);

  // Pokédex Opening Animation state
  const [showPokedexAnimation, setShowPokedexAnimation] = useState<boolean>(false);
  const [bootScanlineActive, setBootScanlineActive] = useState<boolean>(false);

  const handleAnimationComplete = useCallback(() => {
    setShowPokedexAnimation(false);
    setBootScanlineActive(true);
    const timer = setTimeout(() => {
      setBootScanlineActive(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Load cached accounts on mount
  useEffect(() => {
    const accounts = getCachedAuthAccounts();
    setCachedAccounts(accounts);
    if (accounts.length > 0) {
      if (!email) setEmail(accounts[0].email);
      setSelectedPinAccount(accounts[0].email);
    }
    // If device is offline and cached accounts exist, default to password or pin if configured
    if (accounts.length > 0) {
      const firstWithPin = accounts.find((a) => a.hasLoggedInOnThisDevice && hasPinSet(a.uid));
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

  // Invite Code Verification Handler (Secret code: poketester - NEVER shown to user)
  const handleVerifyInviteCode = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteCodeError(null);
    const clean = inviteCodeInput.trim().toLowerCase();
    if (clean === 'poketester') {
      setHasUnlockedSignup(true);
      setShowInviteModal(false);
      setAuthMode('signup');
      setInviteCodeInput('');
      setAuthErrorMessage(null);
    } else {
      setInviteCodeError('Invalid invite code. Early registration is currently invite-only.');
    }
  };

  // Sign Up with Email & Password Submission
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMessage(null);
    primeGameboyAudio();

    if (!hasUnlockedSignup) {
      setAuthErrorMessage('A valid invite code is required to register an account.');
      return;
    }

    const cleanEmail = signupEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setAuthErrorMessage('Please enter an email address.');
      return;
    }

    if (!signupPassword || signupPassword.length < 6) {
      setAuthErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setAuthErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      await signUpWithEmail(cleanEmail, signupPassword, signupTrainerName);
      playGameboyPowerOnSound();
      onSuccessfulLogin();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Account registration failed. Please check your details.';
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
    <div className="dex-login w-full h-screen overflow-hidden flex justify-center p-0.5 sm:p-2 lg:p-2.5 select-text relative">
      {/* 1. Early-Style Pokédex Opening Animation Overlay */}
      {showPokedexAnimation && (
        <PokedexOpeningAnimation onComplete={handleAnimationComplete} />
      )}

      {/* 2. CRT Screen Boot Scanline Flash Effect */}
      {bootScanlineActive && (
        <div className="fixed inset-0 pointer-events-none z-30 bg-gradient-to-b from-transparent via-cyan-400/15 to-transparent animate-pulse" />
      )}

      {/* 3. The Opened Early-Style Pokédex Unit with Outer Red Chassis & Recessed Screen Edge */}
      <div className="relative w-full max-w-[1800px] flex-1 min-h-0 rounded-xl sm:rounded-[2.4rem] lg:rounded-[3rem] bg-gradient-to-b from-[#DC2626] via-[#B91C1C] to-[#881337] border sm:border-4 lg:border-8 border-[#7F1D1D] shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_60px_rgba(220,38,38,0.35)] p-2 sm:p-5 lg:p-7 flex flex-col gap-4 sm:gap-5 flex-1 min-h-0 overflow-hidden">
        {/* Left Knuckle Hinges (Authentic Pokédex Lid Hinge Collars) */}
        <div className="absolute left-0 inset-y-16 w-3 sm:w-4 flex flex-col justify-between py-6 pointer-events-none z-20">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-full h-8 sm:h-12 rounded-r-md bg-gradient-to-r from-[#450A0A] via-[#7F1D1D] to-[#991B1B] border-y border-r border-[#300] shadow-md"
            />
          ))}
        </div>

        {/* Top Rim Highlight */}
        <div className="absolute inset-x-0 top-0 h-2 bg-white/25 rounded-t-[2.5rem] sm:rounded-t-[3.2rem] pointer-events-none" />

        {/* Top Pokédex Sensor Header Bar */}
        <div className="w-full pb-3 sm:pb-4 flex flex-wrap items-center justify-between gap-4 border-b-2 border-red-950/70 pt-1">
          <div className="flex items-center gap-3.5">
            {/* Big Cobalt Blue Optical Sensor Dome */}
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full p-1 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 border-2 border-slate-600 shadow-xl flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 via-sky-600 to-blue-900 shadow-[inset_0_0_12px_rgba(6,182,212,0.9)] relative overflow-hidden flex items-center justify-center animate-pulse">
                <div className="absolute top-1 left-2 w-4 h-2 rounded-full bg-white/80 rotate-[-35deg] blur-[0.4px]" />
                <div className="w-4 h-4 rounded-full bg-cyan-300/80 blur-[0.8px] shadow-[0_0_10px_#22d3ee]" />
              </div>
            </div>

            {/* Three Round Signal Indicator LEDs (Red, Yellow, Green) */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full p-0.5 bg-gradient-to-b from-slate-300 to-slate-500 border border-slate-600 shadow-md">
                <div
                  className="w-full h-full rounded-full bg-rose-500 border border-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse"
                  title="Pokédex Terminal Power: Active"
                />
              </div>
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full p-0.5 bg-gradient-to-b from-slate-300 to-slate-500 border border-slate-600 shadow-md">
                <div
                  className="w-full h-full rounded-full bg-amber-400 border border-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                  title="Storage Buffer: Ready"
                />
              </div>
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full p-0.5 bg-gradient-to-b from-slate-300 to-slate-500 border border-slate-600 shadow-md">
                <div
                  className={`w-full h-full rounded-full border shadow-[0_0_8px_rgba(52,211,153,0.9)] ${
                    isOnline
                      ? 'bg-emerald-400 border-emerald-200 animate-pulse'
                      : 'bg-slate-600 border-slate-500 opacity-40'
                  }`}
                  title={isOnline ? 'Link Cable Network: Connected' : 'Network: Offline Mode'}
                />
              </div>
            </div>

            <div className="h-6 w-px bg-red-950/80 hidden sm:block mx-1" />

            {/* Pokédex Model Stencil */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg tracking-widest text-slate-100 font-sans uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  POKÉDEX
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-red-950/80 text-red-200 border border-red-500/60 uppercase tracking-wider shadow-inner">
                  DevRaccoon
                </span>
              </div>
              <span className="text-[10px] font-mono tracking-widest text-red-200/80 uppercase font-semibold">
                DEVRACCOON • LIVING DEX TERMINAL
              </span>
            </div>
          </div>

          {/* Right Controls: Replay Pokédex Opening Animation + Minimal Non-Actionable Device Status */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Replay Pokédex Opening Animation Button */}
            <button
              type="button"
              onClick={() => setShowPokedexAnimation(true)}
              className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-amber-300 hover:text-amber-200 transition cursor-pointer flex items-center gap-1.5 shadow-md group"
              title="Replay Early Style Pokédex Opening Animation (5s)"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Replay Intro</span>
            </button>

            {/* Minimal, non-actionable device status indicator */}
            <div
              aria-label="Device Status Indicator"
              className="flex items-center gap-2.5 sm:gap-3 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono pointer-events-none select-none cursor-default shadow-md"
            >
              {/* Network State */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className={isOnline ? 'text-emerald-300 font-medium' : 'text-amber-300 font-medium'}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <span className="text-slate-600">|</span>

              {/* Update State */}
              <div className="flex items-center gap-1 text-slate-400">
                <span>
                  {updateStatus.updateNeeded
                    ? 'Update available (login to apply)'
                    : updateStatus.checking
                    ? 'Checking updates...'
                    : 'App v4.2.0 · Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* POKÉDEX RECESSED SCREEN EDGE (The Screen Edge Around The Login Screen)   */}
        {/* ========================================================================= */}
        <div className="relative flex-1 min-h-0 rounded-xl sm:rounded-3xl bg-[#0B0F19] border sm:border-4 lg:border-8 border-[#1E293B] shadow-[inset_0_4px_35px_rgba(0,0,0,0.95),0_12px_28px_rgba(0,0,0,0.6)] p-3 sm:p-6 md:p-8 flex flex-col gap-6 overflow-hidden">
          {/* 4 Corner Screws */}
          <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 rounded-full bg-slate-700 border border-slate-500 shadow-inner flex items-center justify-center text-[9px] text-slate-400 font-bold select-none z-20">+</div>
          <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 rounded-full bg-slate-700 border border-slate-500 shadow-inner flex items-center justify-center text-[9px] text-slate-400 font-bold select-none z-20">+</div>
          <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 rounded-full bg-slate-700 border border-slate-500 shadow-inner flex items-center justify-center text-[9px] text-slate-400 font-bold select-none z-20">+</div>
          <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 rounded-full bg-slate-700 border border-slate-500 shadow-inner flex items-center justify-center text-[9px] text-slate-400 font-bold select-none z-20">+</div>

          {/* Screen Top Status Banner with hardware LEDs */}
          <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse border border-rose-300 shadow-[0_0_6px_#f43f5e]" />
                <span className="text-[10px] font-mono font-bold text-rose-300 uppercase tracking-widest">
                  SCREEN PWR
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-cyan-200 shadow-[0_0_6px_#22d3ee]" />
                <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest">
                  LCD 60HZ ACTIVE
                </span>
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 tracking-wider hidden sm:block">
              DISPLAY CHASSIS v4.2 • DEXTER NATIONAL LIVING DEX VIEWPORT
            </div>
          </div>

          {/* CRT scanline overlay across LCD screen */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.22)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40 z-0" />

          {/* Main Content inside the Screen: Left Column (Showcase & Lookup) on Tablets/Desktop | Right Column (Login) */}
          <div className="relative z-10 flex-1 min-h-0 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start pr-1">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Random Registered PokéPet & Public Lookup (Tablets & Desktop) */}
        {/* ========================================================= */}
        <div className="hidden md:flex md:col-span-6 lg:col-span-7 flex-col gap-6">
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
        <div className="w-full col-span-1 md:col-span-6 lg:col-span-5 flex flex-col justify-center">
          <div className="rounded-3xl bg-[#0F1522] border border-amber-500/60 p-5 sm:p-7 md:p-8 shadow-2xl flex flex-col gap-5 text-slate-100">
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
                {authMode === 'signup' ? 'Create Trainer Account' : 'Sign In to HomeDex'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {authMode === 'signup'
                  ? 'Early access unlocked via invite code. Register your credentials to begin tracking.'
                  : 'Log in to sync your Living Dex, register Pokémon, track progress, and manage your inventory.'}
              </p>
            </div>

            {/* Mode Selector */}
            <div className="flex gap-1 [&>button]:flex-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
              {(isOnline || !cachedAccounts.some(a => a.hasLoggedInOnThisDevice)) && <button
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
              </button>}
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
                <span>Quick PIN</span>
              </button>
              {hasUnlockedSignup && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthErrorMessage(null);
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMode === 'signup'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-emerald-400 hover:text-emerald-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up ✓</span>
                </button>
              )}
            </div>

            {/* Cached Credentials Quick Fill (for login) */}
            {authMode !== 'signup' && cachedAccounts.length > 0 && (
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
            {authMode === 'password' && (isOnline || !cachedAccounts.some(a => a.hasLoggedInOnThisDevice)) && (
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

            {authMode === 'password' && !isOnline && cachedAccounts.some(a => a.hasLoggedInOnThisDevice) && (
              <p className="text-sm text-amber-200">Connect to the internet to use your password, or choose Quick PIN if you have configured a PIN on this device.</p>
            )}
            {/* QUICK PIN LOGIN FORM (OFFLINE QUICK ENTRY) */}
            {authMode === 'pin' && (
              <form onSubmit={handlePinSubmit} className="flex flex-col gap-3.5">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs leading-relaxed">
                  <strong className="text-purple-300 font-bold block mb-1">
                    Quick-Entry PIN
                  </strong>
                  Enter your configured PIN to quickly unlock this device without re-entering your full password.
                  <span className="block mt-2 text-amber-200">
                    To upload offline changes to the cloud, connect to the internet and use Password Login. PIN unlocks this device locally; your pending changes remain saved until you can sync.
                  </span>
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

                <div role="group" aria-label="PIN touch keypad" className="grid grid-cols-3 gap-2">
                  {['1','2','3','4','5','6','7','8','9','Clear','0','⌫'].map(key => (
                    <button key={key} type="button" disabled={isSubmittingAuth}
                      aria-label={key === '⌫' ? 'Delete last PIN digit' : key === 'Clear' ? 'Clear PIN' : `PIN digit ${key}`}
                      onClick={() => setPin(value => key === 'Clear' ? '' : key === '⌫' ? value.slice(0, -1) : (value + key).slice(0, 8))}
                      className="min-h-12 rounded-xl bg-slate-800 border border-slate-600 text-white text-lg font-bold active:bg-purple-700 disabled:opacity-50">
                      {key}
                    </button>
                  ))}
                </div>
                {authErrorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span className="leading-relaxed">{authErrorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingAuth || pin.length < 4}
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

            {/* SIGN UP FORM (Only accessible when unlocked via invite code) */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-3.5">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Invite Code Verified: Early Access Granted</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setAuthMode('password')}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Trainer Name</label>
                  <input
                    type="text"
                    value={signupTrainerName}
                    onChange={(e) => setSignupTrainerName(e.target.value)}
                    placeholder="e.g. Red, Blue, Cynthia"
                    maxLength={24}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-amber-400 text-slate-100 text-sm font-sans placeholder:text-slate-600 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="trainer@pokemon.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-amber-400 text-slate-100 text-sm font-mono placeholder:text-slate-600 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Password (min. 6 characters)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-amber-400 text-slate-100 text-sm font-mono placeholder:text-slate-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-amber-400 text-slate-100 text-sm font-mono placeholder:text-slate-600 focus:outline-none"
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
                  disabled={isSubmittingAuth}
                  className="w-full mt-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingAuth ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Account & Syncing Dex...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Trainer Account</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Invite Code Trigger Button (Signup hidden behind invite code) */}
            {!hasUnlockedSignup && (
              <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(true);
                    setInviteCodeError(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer group"
                >
                  <Key className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span>Have an Invite Code? Unlock Registration</span>
                </button>
              </div>
            )}

            {/* Phone Only: Button to open Guest Lookup for public PokéPets & profiles */}
            <div className="block md:hidden pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowMobileLookupModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-sky-300 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-sky-400" />
                <span>Guest Portal: Lookup Public PokéPets & Profiles</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 text-center font-mono pt-1">
              Protected by Local SHA-256 Storage & Firebase Cloud Auth
            </div>
          </div>
        </div>
      </div>
      {/* End of Main Content Grid */}

      {/* Invite Code Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-text">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0F1522] border border-amber-500/60 p-6 shadow-2xl flex flex-col gap-4">
            <button
              type="button"
              onClick={() => {
                setShowInviteModal(false);
                setInviteCodeError(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Enter Trainer Invite Code
                </h3>
                <p className="text-xs text-slate-400">
                  Account registration is restricted to authorized testers and invited trainers.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyInviteCode} className="flex flex-col gap-3.5 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Invite Code</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={inviteCodeInput}
                  onChange={(e) => {
                    setInviteCodeInput(e.target.value);
                    if (inviteCodeError) setInviteCodeError(null);
                  }}
                  placeholder="Enter your invite code"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-slate-100 text-sm font-mono placeholder:text-slate-600 focus:outline-none"
                />
              </div>

              {inviteCodeError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{inviteCodeError}</span>
                </div>
              )}

              <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                Without a valid invite code, you cannot register an account or save Pokémon. You can still freely explore public PokéPets and public profiles.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteCodeError(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-md"
                >
                  Unlock Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Phone Only: Modal for Community Showcase & Public Lookup */}
      {showMobileLookupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 select-text overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0B0F19] border-2 border-slate-700 p-5 shadow-2xl flex flex-col gap-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Community Showcase & Lookup
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileLookupModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Random Pet Section inside mobile modal */}
            {randomPetData && (
              <div className="p-3.5 rounded-xl bg-[#0F1522] border border-slate-800 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                  {randomPetPokemon && (
                    <PokemonSprite
                      id={randomPetData.pokepet.pokemonId}
                      name={randomPetPokemon.name}
                      shiny={randomPetData.pokepet.isShiny}
                      size="sm"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-100 truncate">
                    {randomPetData.pokepet.nickname || randomPetPokemon?.name}
                  </div>
                  <div className="text-[11px] text-amber-400 font-mono">
                    POKEID: {randomPetData.pokepet.pokeId}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Trainer: {randomPetData.trainerName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileLookupModal(false);
                    onOpenTrainerCard(randomPetData.pokepet, randomPetData.trainerName);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
                >
                  View
                </button>
              </div>
            )}

            {/* Lookup Form */}
            <form onSubmit={handleLookup} className="flex flex-col gap-2.5">
              <label className="text-xs font-semibold text-slate-300">
                Lookup POKEID or Trainer Friend Code / UID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="e.g. ID8F3K9L2M4P or DX-ABCDEF"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-sky-400 text-slate-100 text-xs font-mono placeholder:text-slate-600 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                >
                  {isSearching ? '...' : 'Lookup'}
                </button>
              </div>
            </form>

            {lookupError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {lookupError}
              </div>
            )}

            {lookupSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {lookupSuccessMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen Frame Bottom Footer Bar */}
      <div className="relative z-10 flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
        <span>POKÉDEX DISPLAY v4.2 • LIQUID CRYSTAL MATRIX</span>
        <span>SECURITY LEVEL: ENCRYPTED GUEST GATEWAY</span>
      </div>
    </div>
    {/* End of Recessed Screen Edge */}

    {/* Bottom Hardware Controls on Red Pokédex Chassis */}
    <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-2 px-2 border-t-2 border-red-950/70 text-slate-900 select-none">
      {/* Directional D-Pad */}
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute w-12 h-4 bg-slate-900 border border-slate-700 rounded-sm shadow-md" />
          <div className="absolute w-4 h-12 bg-slate-900 border border-slate-700 rounded-sm shadow-md" />
          <div className="relative w-3.5 h-3.5 rounded-full bg-slate-950 shadow-inner" />
        </div>
        <div className="flex flex-col text-[10px] font-mono text-red-200/90 font-bold uppercase tracking-widest">
          <span>CONTROLLER</span>
          <span className="text-[9px] text-red-300/60 font-semibold">KANTO GEN-1</span>
        </div>
      </div>

      {/* Serial Stencil */}
      <div className="text-center hidden md:block">
        <span className="text-[10px] font-mono font-bold text-red-200/80 tracking-widest uppercase">
          • DEVRACCOON LIVING DEX SYSTEM •
        </span>
      </div>

      {/* Action Buttons & Speaker Slits */}
      <div className="flex items-center gap-5 sm:gap-6">
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col items-center gap-1">
            <div className="w-9 h-3 rounded-full bg-sky-500 shadow-md border border-sky-300" />
            <span className="text-[8px] font-mono font-bold text-red-200">KEY-A</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-9 h-3 rounded-full bg-rose-500 shadow-md border border-rose-300" />
            <span className="text-[8px] font-mono font-bold text-red-200">KEY-B</span>
          </div>
        </div>

        {/* Speaker Slots */}
        <div className="flex flex-col gap-1 w-14 sm:w-16">
          <div className="h-1 bg-black/40 rounded-full shadow-inner" />
          <div className="h-1 bg-black/40 rounded-full shadow-inner" />
          <div className="h-1 bg-black/40 rounded-full shadow-inner" />
          <div className="h-1 bg-black/40 rounded-full shadow-inner" />
        </div>
      </div>
    </div>
    {/* End of Pokédex Chassis */}
  </div>
</div>
);
};
