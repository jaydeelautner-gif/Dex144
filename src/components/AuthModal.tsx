import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  WifiOff,
  HardDrive,
  Tablet,
} from 'lucide-react';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
} from '../firebase';
import { useOnlineStatus } from '../utils/offlineManager';
import {
  getCachedAuthAccounts,
  type CachedAuthAccount,
} from '../utils/offlineAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultMode?: 'signup' | 'signin';
  actionPrompt?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultMode = 'signup',
  actionPrompt,
}) => {
  const isOnline = useOnlineStatus();
  const [cachedAccounts, setCachedAccounts] = useState<CachedAuthAccount[]>([]);
  const [mode, setMode] = useState<'signup' | 'signin'>(() => {
    // If device is offline, default to signin since signup requires server
    return !isOnline ? 'signin' : defaultMode;
  });
  const [trainerName, setTrainerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load cached accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      const accounts = getCachedAuthAccounts();
      setCachedAccounts(accounts);
      if (!isOnline) {
        setMode('signin');
        if (accounts.length > 0 && !email) {
          setEmail(accounts[0].email);
        }
      }
    }
  }, [isOpen, isOnline]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (!isOnline && mode === 'signup') {
      setErrorMessage('Creating a new account requires an internet connection. Please switch to "Sign In" to authenticate with cached credentials.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const name = trainerName.trim() || 'Trainer';
        await signUpWithEmail(cleanEmail, password, name);
        setSuccessMessage(`Welcome, Trainer ${name}! Your account has been created and cached for offline use.`);
      } else {
        await signInWithEmail(cleanEmail, password);
        setSuccessMessage(
          !isOnline
            ? 'Authenticated locally from cached iPad/device storage! Restoring your Living Dex...'
            : 'Successfully signed in! Restoring your Dex...'
        );
      }

      setTimeout(() => {
        setIsLoading(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err: unknown) {
      setIsLoading(false);
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please switch to "Sign In" below.');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('Invalid email format. Please check and try again.');
      } else if (code === 'auth/weak-password') {
        setErrorMessage('Password must be at least 6 characters.');
      } else if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        setErrorMessage('Invalid email or password. Please verify your credentials.');
      } else {
        setErrorMessage((err as Error)?.message || 'Authentication failed. Please try again.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isOnline) {
      setErrorMessage('Google Sign-In is unavailable offline. Please log in with your email and password.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
      setIsLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setIsLoading(false);
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-blocked') {
        setErrorMessage('Google sign-in popup was blocked by your browser. Please use the Email/Password sign-up form above!');
      } else if (code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in popup was closed before completing.');
      } else {
        setErrorMessage('Google sign-in failed. Please use Email/Password sign-up instead.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0F1522] border border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          title="Continue as Guest"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col gap-1.5 pr-8">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold tracking-wider uppercase">
              TRAINER ACCOUNT
            </span>
            {!isOnline && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold">
                <WifiOff className="w-3 h-3" />
                OFFLINE MODE
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100">
            {mode === 'signup' ? 'Create Trainer Account' : 'Sign In to HomeDex'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {actionPrompt || (
              <>
                <strong className="text-amber-300">Guests can only view Pokémon via POKEID or explore public Living Dexes.</strong> Sign up to log Pokémon, track your Living Dex, and manage your inventory.
              </>
            )}
          </p>
        </div>

        {/* Offline notice & cached accounts helper */}
        {!isOnline && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2.5 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <HardDrive className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Offline Authentication Active</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              You are offline. You can authenticate locally with your email and password if you have previously logged in on this iPad or device.
            </p>

            {/* Quick-fill buttons for cached accounts */}
            {cachedAccounts.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1 border-t border-amber-500/20">
                <span className="text-[10px] font-mono text-amber-300/80">
                  CACHED ACCOUNTS ON THIS IPAD/DEVICE:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cachedAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => {
                        setEmail(acc.email);
                        setMode('signin');
                        setErrorMessage(null);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        email.toLowerCase() === acc.email.toLowerCase()
                          ? 'bg-amber-500 text-slate-950 font-bold shadow'
                          : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      <span>{acc.email}</span>
                      {acc.displayName && (
                        <span className="text-[10px] opacity-75">({acc.displayName})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Toggle: Sign Up vs Sign In */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
          <button
            type="button"
            disabled={!isOnline}
            onClick={() => {
              if (isOnline) {
                setMode('signup');
                setErrorMessage(null);
              }
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold cursor-pointer'
                : isOnline
                ? 'text-slate-400 hover:text-slate-200 cursor-pointer'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
          >
            Sign Up (Free) {!isOnline && '(Online only)'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In {!isOnline && '(Offline Supported)'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono font-bold text-slate-300">
                TRAINER NICKNAME
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  placeholder="e.g. Red, Cynthia, Ash..."
                  maxLength={20}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-amber-400 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-mono font-bold text-slate-300">
              EMAIL ADDRESS *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trainer@example.com"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-amber-400 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-mono font-bold text-slate-300">
              PASSWORD * {mode === 'signup' && <span className="text-slate-400 font-normal">(min 6 characters)</span>}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                required
                minLength={6}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-amber-400 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm tracking-wide transition-colors cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{!isOnline ? 'Authenticating Locally...' : 'Processing...'}</span>
              </>
            ) : mode === 'signup' ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create Trainer Account</span>
              </>
            ) : (
              <span>{!isOnline ? 'Sign In (Offline Auth)' : 'Sign In to Account'}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-[11px] font-mono text-slate-500">OR</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* Google Alternative Button */}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || !isOnline}
            className={`w-full py-2.5 rounded-xl border font-semibold text-xs transition-colors flex items-center justify-center gap-2.5 ${
              isOnline
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-200 cursor-pointer'
                : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
          <span className="text-[10px] text-slate-500 text-center">
            {!isOnline
              ? 'Google sign-in requires internet. Use Email/Password to authenticate offline.'
              : 'If Google popup is blocked in preview, use Email sign-up above.'}
          </span>
        </div>

        {/* Footer info: guest mode capabilities */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Guests:</span>
          <button
            type="button"
            onClick={onClose}
            className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline"
          >
            Continue in Guest Mode (Lookup & Public Dex)
          </button>
        </div>
      </div>
    </div>
  );
};
