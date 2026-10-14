import React, { useState, useMemo } from 'react';
import {
  ListPlus,
  Check,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Layers,
  Trash2,
} from 'lucide-react';
import type { PokemonEntry, GameId } from '../data/pokemonData';
import { GAMES } from '../data/pokemonData';
import { GameLogoBadge } from './GameLogoBadge';

interface BatchInputCardProps {
  dex: PokemonEntry[];
  caughtSet: Set<number>;
  livingSet: Set<number>;
  ownedGames: GameId[];
  isGuest: boolean;
  onRequestAuth: (prompt: string) => void;
  onBatchMarkCaught: (pokemonIds: number[], targetGame: GameId) => void;
  onNavigateToRegister: (pokemonId?: number) => void;
}

export const BatchInputCard: React.FC<BatchInputCardProps> = ({
  dex,
  caughtSet,
  livingSet,
  ownedGames,
  isGuest,
  onRequestAuth,
  onBatchMarkCaught,
  onNavigateToRegister,
}) => {
  const [inputText, setInputText] = useState('');
  const [targetGame, setTargetGame] = useState<GameId>(() => {
    return ownedGames.length > 0 ? ownedGames[0] : 'sv';
  });
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Fast map by lowercase name & id
  const speciesByNameOrId = useMemo(() => {
    const map = new Map<string, PokemonEntry>();
    for (const p of dex) {
      map.set(String(p.id), p);
      map.set(p.name.toLowerCase(), p);
      // Also clean names like "Nidoran (Female)" -> "nidoran"
      const simple = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      map.set(simple, p);
    }
    return map;
  }, [dex]);

  // Parse input tokens
  const parsedResults = useMemo(() => {
    if (!inputText.trim()) {
      return { matches: [] as PokemonEntry[], unrecognized: [] as string[] };
    }

    // Split by commas, semicolons, newlines, or tabs
    const rawTokens = inputText
      .split(/[\n,;\t]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const seenIds = new Set<number>();
    const matches: PokemonEntry[] = [];
    const unrecognized: string[] = [];

    for (const raw of rawTokens) {
      // Check for range notation, e.g. "1-10" or "001-009"
      const rangeMatch = raw.match(/^#?(\d+)\s*-\s*#?(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        if (min >= 1 && max <= 1025 && max - min <= 50) {
          for (let i = min; i <= max; i++) {
            const p = dex.find((entry) => entry.id === i);
            if (p && !seenIds.has(p.id)) {
              seenIds.add(p.id);
              matches.push(p);
            }
          }
          continue;
        }
      }

      // Check single token: clean leading # or zeros
      const cleanToken = raw.replace(/^#+/, '').trim().toLowerCase();
      const numVal = parseInt(cleanToken, 10);
      let match: PokemonEntry | undefined;

      if (!isNaN(numVal) && numVal >= 1 && numVal <= 1025) {
        match = speciesByNameOrId.get(String(numVal));
      } else {
        match = speciesByNameOrId.get(cleanToken) || speciesByNameOrId.get(cleanToken.replace(/[^a-z0-9]/g, ''));
      }

      if (match) {
        if (!seenIds.has(match.id)) {
          seenIds.add(match.id);
          matches.push(match);
        }
      } else {
        if (!unrecognized.includes(raw)) {
          unrecognized.push(raw);
        }
      }
    }

    return { matches, unrecognized };
  }, [inputText, dex, speciesByNameOrId]);

  const handleApplyBatchCaught = () => {
    if (isGuest) {
      onRequestAuth('Guests must create a free Trainer Account to log Pokémon catches.');
      return;
    }

    if (parsedResults.matches.length === 0) {
      setFeedback({
        message: 'No valid Pokémon found in the batch input. Please enter numbers (e.g. 1, 4, 7) or species names.',
        type: 'error',
      });
      return;
    }

    const idsToMark = parsedResults.matches.map((p) => p.id);
    onBatchMarkCaught(idsToMark, targetGame);

    const gameTitle = GAMES.find((g) => g.id === targetGame)?.shortTitle || targetGame.toUpperCase();
    setFeedback({
      message: `Successfully logged ${idsToMark.length} Pokémon catches in ${gameTitle}!`,
      type: 'success',
    });
    setInputText('');
  };

  const handleInsertSample = () => {
    setInputText('001, 004, 007, 025, 133, 143, 150, 249, 384, 448');
    setFeedback(null);
  };

  return (
    <section className="bg-[#0F1522] border border-slate-800/80 hover:border-amber-500/40 transition-colors rounded-2xl p-6 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <ListPlus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
              FAST CATCH LOGGER
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              Batch Pokémon Input
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleInsertSample}
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
          >
            Load Sample List
          </button>
          {inputText && (
            <button
              type="button"
              onClick={() => {
                setInputText('');
                setFeedback(null);
              }}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        Quickly validate and log multiple species at once. Paste numbers, names, or ranges (e.g. <code className="text-amber-300 font-mono">1, 4, 7, Pikachu, 133</code> or <code className="text-amber-300 font-mono">1-10</code>) separated by commas or lines.
      </p>

      {/* Input area & Controls */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setFeedback(null);
            }}
            rows={3}
            placeholder="Paste Pokémon Dex numbers or names (e.g. 001, 004, 007, 25, Gengar, 133, 1-6)..."
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 resize-y"
          />
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Target Game Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Target Game:</span>
            <div className="relative">
              <select
                value={targetGame}
                onChange={(e) => setTargetGame(e.target.value as GameId)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {ownedGames.length > 0 ? (
                  ownedGames.map((gId) => {
                    const g = GAMES.find((item) => item.id === gId);
                    return (
                      <option key={gId} value={gId}>
                        {g?.shortTitle || gId.toUpperCase()}
                      </option>
                    );
                  })
                ) : (
                  GAMES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.shortTitle}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {targetGame && <GameLogoBadge gameId={targetGame} size="xs" />}
          </div>

          {/* Submit Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyBatchCaught}
              disabled={parsedResults.matches.length === 0}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-md shadow-amber-500/20 flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                Batch Log {parsedResults.matches.length > 0 ? `(${parsedResults.matches.length})` : ''}
              </span>
            </button>
          </div>
        </div>

        {/* Feedback notification */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : feedback.type === 'error'
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                : 'bg-sky-500/15 border border-sky-500/30 text-sky-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Live Parsed Preview Chips */}
        {parsedResults.matches.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>
                Recognized Species ({parsedResults.matches.length}):
              </span>
              <span>
                {parsedResults.matches.filter((p) => caughtSet.has(p.id)).length} already caught
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              {parsedResults.matches.map((p) => {
                const isCaught = caughtSet.has(p.id);
                const isLiving = livingSet.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onNavigateToRegister(p.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                      isLiving
                        ? 'bg-sky-950/40 border-sky-500/40 text-sky-300'
                        : isCaught
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-400'
                    }`}
                    title={`Click to open full register form for ${p.name}`}
                  >
                    <span className="text-[10px] text-slate-400">#{String(p.id).padStart(4, '0')}</span>
                    <span className="font-semibold">{p.name}</span>
                    {isLiving ? (
                      <span className="text-[9px] text-sky-400">Boxed</span>
                    ) : isCaught ? (
                      <span className="text-[9px] text-emerald-400">Caught</span>
                    ) : (
                      <span className="text-[9px] text-amber-400">New</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {parsedResults.unrecognized.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-400/90 font-mono">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Unrecognized tokens: {parsedResults.unrecognized.join(', ')}</span>
          </div>
        )}
      </div>
    </section>
  );
};
