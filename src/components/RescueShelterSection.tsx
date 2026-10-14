import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Heart,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import type { PokemonEntry } from '../data/pokemonData';
import { GAMES } from '../data/pokemonData';
import {
  formatOriginSourceLabel,
  formatRescueTimeRemaining,
  type RescueBinItem,
} from '../data/pokemonInventoryData';
import { PokemonSprite } from './PokemonSprite';
import { GameLogoBadge } from './GameLogoBadge';

interface RescueShelterSectionProps {
  rescueBin: RescueBinItem[];
  dex: PokemonEntry[];
  onRescuePokepet: (rescueId: string) => void;
  onRescueAll: () => void;
}

export const RescueShelterSection: React.FC<RescueShelterSectionProps> = ({
  rescueBin,
  dex,
  onRescuePokepet,
  onRescueAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rescuedSuccessMsg, setRescuedSuccessMsg] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rescueBin.filter((item) => {
      const mon = dex.find((p) => p.id === item.instance.pokemonId);
      const name = mon?.name || '';
      const nickname = item.instance.nickname || '';
      const pokeId = item.instance.pokeId || '';
      return (
        !q ||
        name.toLowerCase().includes(q) ||
        nickname.toLowerCase().includes(q) ||
        pokeId.toLowerCase().includes(q) ||
        String(item.instance.pokemonId).includes(q)
      );
    });
  }, [rescueBin, dex, searchQuery]);

  const handleRescueSingle = (item: RescueBinItem) => {
    const mon = dex.find((p) => p.id === item.instance.pokemonId);
    const displayName = item.instance.nickname || mon?.name || `Pokémon #${item.instance.pokemonId}`;
    onRescuePokepet(item.rescueId);
    setRescuedSuccessMsg(`Rescued ${displayName} (${item.instance.pokeId}) back to your active inventory!`);
    setTimeout(() => setRescuedSuccessMsg(null), 4000);
  };

  const handleRescueAllItems = () => {
    if (rescueBin.length === 0) return;
    onRescueAll();
    setRescuedSuccessMsg(`Rescued all ${rescueBin.length} Pokémon back to your active inventory!`);
    setTimeout(() => setRescuedSuccessMsg(null), 4000);
  };

  return (
    <section className="bg-[#0F1522] border border-amber-500/40 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 relative z-10">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </span>
            <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
              Safeguarded 30-Day Recovery Bin
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono font-bold">
              {rescueBin.length} {rescueBin.length === 1 ? 'Pokémon' : 'Pokémon'} in Shelter
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            Rescue Pokémon Shelter
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            All PokéPets you choose to delete are safeguarded here for 30 days along with their permanent 12-digit POKEID, original battle stats, nickname, and origin data. Rescuing a Pokémon restores it immediately to your account and protects it so it is no longer eligible to be automatically deleted.
          </p>
        </div>

        {rescueBin.length > 0 && (
          <button
            type="button"
            onClick={handleRescueAllItems}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer shrink-0 shadow-lg shadow-emerald-500/20"
          >
            <Heart className="w-4 h-4 fill-slate-950" />
            <span>Rescue All Pokémon ({rescueBin.length})</span>
          </button>
        )}
      </div>

      {/* Rescued feedback banner */}
      {rescuedSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center gap-3 text-emerald-200 text-xs font-medium animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{rescuedSuccessMsg}</span>
        </div>
      )}

      {/* Search and stats bar when bin has items */}
      {rescueBin.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by species, nickname, or POKEID..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700/80 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Automated 30-day lifecycle countdown running</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {rescueBin.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">The Rescue Shelter is Clear</h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            All your registered PokéPets and unique POKEIDs are safe in your active inventory and Living Dex boxes. If you ever choose to delete a PokéPet from your inventory, it will be protected here for 30 days before permanent removal.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
          No Pokémon in the shelter match your search &ldquo;{searchQuery}&rdquo;.
        </div>
      ) : (
        /* Rescue Items Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const mon = dex.find((p) => p.id === item.instance.pokemonId);
            const timeInfo = formatRescueTimeRemaining(item.expiresAt);
            const gameInfo = item.instance.gameId
              ? GAMES.find((g) => g.id === item.instance.gameId)
              : undefined;
            const originLabel = formatOriginSourceLabel(
              item.instance,
              gameInfo?.shortTitle
            );

            return (
              <div
                key={item.rescueId}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-xl p-4 flex flex-col gap-3 transition-all relative overflow-hidden shadow-lg group"
              >
                {/* Header with species & POKEID */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 shrink-0 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center relative">
                      <PokemonSprite
                        id={item.instance.pokemonId}
                        name={item.instance.variantName}
                        shiny={item.instance.isShiny}
                        size="md"
                      />
                      {item.instance.isShiny && (
                        <div className="absolute -top-1 -right-1 p-0.5 rounded bg-amber-500/20 border border-amber-500/40">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-slate-100">
                          {item.instance.nickname || mon?.name || `Pokémon #${item.instance.pokemonId}`}
                        </span>
                        {item.instance.nickname && (
                          <span className="text-[10px] text-slate-400">({mon?.name})</span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-amber-400 font-semibold">
                        Lv.{item.instance.level} • {item.instance.gender === 'female' ? '♀ Female' : item.instance.gender === 'male' ? '♂ Male' : '⚲'} • {item.instance.variantName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Origin: <span className="text-slate-300 font-medium">{originLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* POKEID badge */}
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700/80 text-[10px] font-mono font-bold text-amber-300 shrink-0">
                    {item.instance.pokeId}
                  </span>
                </div>

                {/* Status and 30-Day Countdown Info */}
                <div className="bg-slate-950/70 rounded-lg p-2.5 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Deleted {new Date(item.deletedAt).toLocaleDateString()}</span>
                  </div>

                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      timeInfo.isExpiringSoon
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                        : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{timeInfo.label}</span>
                  </div>
                </div>

                {/* Rescue Action */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Tagged owner: {item.originalTrainerName || 'Trainer'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRescueSingle(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    <Heart className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Rescue Pokémon</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
