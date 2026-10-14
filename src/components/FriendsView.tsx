import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  X,
  LogIn,
  Loader2,
  ChevronRight,
  Sparkles,
  Box,
  Trash2,
} from 'lucide-react';
import type { User, UserDexProfileData, FriendRequest } from '../firebase';
import type { PokemonEntry } from '../data/pokemonData';

interface FriendsViewProps {
  dex: PokemonEntry[];
  user: User | null;
  myFriendCode?: string;
  myFriends: string[];
  incomingRequests: FriendRequest[];
  friendProfiles: Record<string, UserDexProfileData>;
  friendsLoading: boolean;
  isGuest: boolean;
  onRequestAuth: () => void;
  onAddFriendByCode: (code: string) => Promise<void>;
  onAcceptRequest: (req: FriendRequest) => Promise<void>;
  onDeclineRequest: (requestId: string) => Promise<void>;
  onRemoveFriend: (uid: string) => Promise<void>;
  onOpenFriendProfile: (uid: string) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  dex,
  user,
  myFriendCode,
  myFriends,
  incomingRequests,
  friendProfiles,
  friendsLoading,
  isGuest,
  onRequestAuth,
  onAddFriendByCode,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriend,
  onOpenFriendProfile,
}) => {
  const [addCode, setAddCode] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalPokemon = dex.length;

  const handleCopyCode = async () => {
    if (!myFriendCode) return;
    try {
      await navigator.clipboard.writeText(myFriendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleAdd = async () => {
    if (!addCode.trim() || isAdding) return;
    setIsAdding(true);
    try {
      await onAddFriendByCode(addCode);
      setAddCode('');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      <div className="bg-[#0F1522] border border-sky-500/40 rounded-2xl p-6 sm:p-8 flex flex-col gap-3 shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/50 text-sky-300 text-[11px] font-mono font-bold">
            FRIENDS & NETWORK
          </span>
          <span className="text-xs text-slate-400">Mutual trainer connections</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-sky-400" />
          Your Trainer Network
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
          Add other trainers by their friend code. Once they accept, you'll see each
          other's progress in real time and can compare caught, living, and shiny counts.
        </p>
      </div>

      {isGuest || !user ? (
        <div className="bg-[#0F1522] border border-amber-500/40 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40">
            <Users className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">Sign in to use Friends</h2>
          <p className="text-sm text-slate-400 max-w-md">
            Friends are tied to your account, so you'll need to sign in to add them or
            see their progress.
          </p>
          <button
            type="button"
            onClick={onRequestAuth}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold cursor-pointer shadow-lg shadow-amber-500/25"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-300">Your Friend Code</span>
              {myFriendCode ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-sky-500/40 font-mono text-lg font-bold text-sky-300 tracking-widest text-center select-all">
                      {myFriendCode}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Share this with other trainers so they can add you.
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating your friend code...</span>
                </div>
              )}
            </div>

            <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-300">Add a Friend</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={addCode}
                  onChange={(e) => setAddCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd();
                  }}
                  placeholder="DX-XXXXXX"
                  maxLength={16}
                  className="flex-1 px-3 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono font-bold text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400 tracking-widest"
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isAdding || !addCode.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 text-xs font-extrabold cursor-pointer transition-colors shadow-lg shadow-sky-500/20"
                >
                  {isAdding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>Add</span>
                </button>
              </div>
              <span className="text-[11px] text-slate-400">
                Enter a friend code from another trainer. They'll need to accept before
                you're connected.
              </span>
            </div>
          </div>

          {incomingRequests.length > 0 && (
            <div className="bg-[#0F1522] border border-amber-500/40 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-slate-100">Pending Friend Requests</span>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                  {incomingRequests.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {incomingRequests.map((req) => (
                  <div
                    key={req.requestId}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-100">
                        {req.fromTrainerName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {req.fromFriendCode || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onDeclineRequest(req.requestId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => onAcceptRequest(req)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer shadow-md shadow-emerald-500/20"
                      >
                        <Check className="w-3 h-3" />
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Users className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-bold text-slate-100">Your Friends</span>
              <span className="ml-auto text-xs font-mono text-slate-400">
                {myFriends.length} {myFriends.length === 1 ? 'trainer' : 'trainers'}
              </span>
            </div>

            {myFriends.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No friends yet. Share your friend code to get started.
              </div>
            ) : friendsLoading && Object.keys(friendProfiles).length === 0 ? (
              <div className="py-8 flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading friend profiles...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myFriends.map((uid) => {
                  const profile = friendProfiles[uid];
                  const name = profile?.trainerName || 'Trainer';
                  const caught = profile?.caughtIds?.length || 0;
                  const living = profile?.livingIds?.length || 0;
                  const shiny = profile?.shinyIds?.length || 0;

                  return (
                    <div
                      key={uid}
                      className="group rounded-2xl border border-slate-800/80 hover:border-sky-500/50 bg-[#0B0F17] p-4 flex flex-col gap-3 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-100 truncate">
                            {name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 truncate">
                            {uid.slice(0, 8)}…
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveFriend(uid)}
                          title="Remove friend"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {profile ? (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> Caught
                              </span>
                              <span className="text-slate-200 font-bold">
                                {caught}/{totalPokemon}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 origin-left transition-transform duration-150"
                                style={{ transform: `scaleX(${caught / totalPokemon})` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-mono mt-1">
                              <span className="text-sky-400 flex items-center gap-1">
                                <Box className="w-2.5 h-2.5" /> Living
                              </span>
                              <span className="text-slate-200 font-bold">{living}</span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-amber-400 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> Shiny
                              </span>
                              <span className="text-slate-200 font-bold">{shiny}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onOpenFriendProfile(uid)}
                            className="inline-flex items-center justify-between gap-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                          >
                            <span>View Progress</span>
                            <ChevronRight className="w-3.5 h-3.5 text-sky-400" />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Loading…</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};