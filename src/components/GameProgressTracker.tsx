import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Lock, MapPin, Loader2 } from 'lucide-react';
import type { GameId, PokemonEntry, DlcId } from '../data/pokemonData';
import {
  GAME_META,
  GAME_ID_TO_TRACKABLE,
  getOwnedTrackableGames,
  milestonesFor,
  applicableCompletedMilestones,
} from '../data/milestones';
import type { ProgressState } from '../hooks/useGameProgress';
import { useGameAreas, getAreaSpecies } from '../utils/gameAreas';
import { prettifyAreaName } from '../data/encountersData';
import { PokemonSprite } from './PokemonSprite';

interface Props {
  progress: ProgressState;
  trackedGames: Set<GameId>;
  ownedGames: GameId[];
  ownedDlcs: DlcId[];
  onToggle: (gameId: GameId, milestoneId: string) => void;
  onToggleTracking: (gameId: GameId) => void;
  onReset: (gameId: GameId) => void;
  /** Restart the game: clears milestones + starter choice, keeps all PokéPets. */
  onRestartGame: (gameId: GameId) => void;
  onCompleteAll: (gameId: GameId, milestoneIds: string[]) => void;
  dex: PokemonEntry[];
  caughtSet: Set<number>;
  onSelectPokemon: (pokemon: PokemonEntry) => void;
}

export function GameProgressTracker({
  progress,
  trackedGames,
  ownedGames,
  ownedDlcs,
  onToggle,
  onToggleTracking,
  onReset,
  onRestartGame,
  onCompleteAll,
  dex,
  caughtSet,
  onSelectPokemon,
}: Props) {
  const availableGames = getOwnedTrackableGames(ownedGames);
  const [activeGame, setActiveGame] = useState<GameId>(
    availableGames[0] ?? 'sv'
  );

  const milestones = milestonesFor(activeGame, ownedDlcs);
  const completed = useMemo(
    () => new Set(applicableCompletedMilestones(activeGame, progress[activeGame] ?? [], ownedDlcs)),
    [progress, activeGame, ownedDlcs]
  );

  // Locations unlocked by the badges/milestones marked complete for this game.
  const { areas, dataset: encounterDataset, loading: areasLoading } = useGameAreas(
    activeGame,
    completed,
    ownedDlcs
  );
  const [openArea, setOpenArea] = useState<string | null>(null);
  const [showLockedAreas, setShowLockedAreas] = useState(false);
  const visibleAreas = showLockedAreas ? areas : areas.filter((a) => a.unlocked);
  const unlockedCount = areas.filter((a) => a.unlocked).length;
  const dexById = useMemo(() => new Map(dex.map((p) => [p.id, p])), [dex]);
  const areaSpecies = useMemo(
    () => (openArea ? getAreaSpecies(encounterDataset, activeGame, openArea, ownedDlcs) : []),
    [openArea, encounterDataset, activeGame, ownedDlcs]
  );
  const pct = milestones.length
    ? Math.round((completed.size / milestones.length) * 100)
    : 0;
  const meta = GAME_META[activeGame];

  if (availableGames.length === 0) {
    return (
      <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-8 text-center">
        <p className="text-sm text-slate-300">
          You don't own any trackable games yet. Add one in{' '}
          <span className="text-amber-300 font-semibold">Settings → Owned Games</span>.
        </p>
      </div>
    );
  }

  return (
    <section className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-5 shadow-xl">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-slate-100">Game Progress</h2>
        <p className="text-xs text-slate-400">
          Check off milestones to filter your encounter suggestions to what's
          actually catchable right now. DLC milestones and expansion areas only count when the expansion is marked as owned in Settings.
        </p>
      </header>

      {/* Game tabs */}
      <nav className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        {availableGames.map((id) => {
          const gameMeta = GAME_META[id];
          const total = milestonesFor(id, ownedDlcs).length;
          const done = applicableCompletedMilestones(id, progress[id] ?? [], ownedDlcs).length;
          const active = id === activeGame;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveGame(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-slate-800 text-slate-100 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={active ? { color: gameMeta.accent } : undefined}
            >
              {gameMeta.short}
              <span className="ml-1.5 font-mono text-[10px] text-slate-500">
                {done}/{total}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
          <div
            className="h-full transition-transform duration-200 origin-left"
            style={{
              width: '100%',
              transform: `scaleX(${pct / 100})`,
              background: meta.accent,
            }}
          />
        </div>
        <span className="text-xs font-mono-tabular text-slate-300 w-10 text-right">
          {pct}%
        </span>
      </div>

      {/* Tracking toggle */}
      <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
        <input
          type="checkbox"
          checked={trackedGames.has(activeGame)}
          onChange={() => onToggleTracking(activeGame)}
          className="accent-amber-400"
        />
        <span className="text-xs text-slate-300">
          Filter my encounter suggestions by{' '}
          <span className="font-semibold text-amber-300">{meta.short}</span> progress
        </span>
      </label>

      {/* Milestone checklist */}
      <ul className="flex flex-col gap-1 max-h-[420px] overflow-y-auto pr-1">
        {milestones.map((m) => {
          const isDone = completed.has(m.id);
          return (
            <li key={m.id} className="shrink-0">
              <label
                className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => onToggle(activeGame, m.id)}
                  className="accent-amber-400"
                />
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold border ${
                    m.type === 'badge'
                      ? 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                      : m.type === 'titan'
                      ? 'bg-rose-400/10 text-rose-300 border-rose-400/30'
                      : m.type === 'star'
                      ? 'bg-purple-400/10 text-purple-300 border-purple-400/30'
                      : m.type === 'dlc'
                      ? 'bg-sky-400/10 text-sky-300 border-sky-400/30'
                      : 'bg-slate-700/40 text-slate-300 border-slate-600/40'
                  }`}
                >
                  {m.type}
                </span>
                <span
                  className={`text-xs flex-1 ${
                    isDone ? 'text-emerald-200 line-through' : 'text-slate-200'
                  }`}
                >
                  {m.label}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {/* Unlocked areas — click a route to see its encounters */}
      <section className="flex flex-col gap-3 pt-3 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400" />
              Areas Unlocked by {meta.short} Progress
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {unlockedCount} of {areas.length} recorded locations unlocked. Tick badges above to reveal more.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowLockedAreas((v) => !v)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 cursor-pointer"
          >
            {showLockedAreas ? 'Show unlocked only' : 'Show locked too'}
          </button>
        </div>

        {areasLoading ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            Loading verified locations…
          </div>
        ) : visibleAreas.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
            {areas.length === 0
              ? 'No recorded wild locations for this game yet.'
              : 'No areas unlocked yet — tick a badge above, or choose “Show locked too”.'}
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1">
            {visibleAreas.map((area) => {
              const isOpen = openArea === area.area;
              return (
                <li key={area.area} className="shrink-0 rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenArea(isOpen ? null : area.area)}
                    title={area.unlockLabel}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer hover:bg-slate-900/80"
                  >
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    {area.unlocked ? (
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    {/* min-w-0 lets the name truncate instead of pushing the chip out of the row. */}
                    <span className={`text-xs flex-1 min-w-0 truncate ${area.unlocked ? 'text-slate-100' : 'text-slate-500'}`}>
                      {prettifyAreaName(area.area)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${
                        area.unlocked
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {area.unlockShort}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 border-t border-slate-800/70 pt-2.5">
                      {!area.unlocked && (
                        <p className="text-[11px] text-rose-300 mb-2">
                          Locked — reach {area.unlockLabel} to catch here. Preview only.
                        </p>
                      )}
                      {areaSpecies.length === 0 ? (
                        <p className="text-[11px] text-slate-400">No species records for this location.</p>
                      ) : (
                        <>
                          <p className="text-[11px] text-slate-400 mb-2">
                            {areaSpecies.length} catchable species · click one for full details
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {areaSpecies.map((row) => {
                              const mon = dexById.get(row.pokemonId);
                              if (!mon) return null;
                              const caught = caughtSet.has(row.pokemonId);
                              return (
                                <button
                                  key={row.pokemonId}
                                  type="button"
                                  onClick={() => onSelectPokemon(mon)}
                                  title={`${mon.name} — ${row.methods.join(', ')} · Lv ${row.minLevel}-${row.maxLevel}${row.maxChance > 0 ? ` · up to ${row.maxChance}%` : ''}`}
                                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                                    caught
                                      ? 'bg-emerald-500/5 border-emerald-500/25 hover:border-emerald-400/60'
                                      : 'bg-slate-950/60 border-slate-800 hover:border-amber-400/60'
                                  }`}
                                >
                                  <PokemonSprite id={row.pokemonId} name={mon.name} size="sm" />
                                  <span className="text-[10px] text-slate-300 truncate w-full text-center">
                                    {mon.name}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-500">
                                    Lv {row.minLevel}-{row.maxLevel}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => onReset(activeGame)}
          disabled={completed.size === 0}
          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 disabled:opacity-40 cursor-pointer"
        >
          Reset {meta.short}
        </button>
        <button
          type="button"
          onClick={() => onCompleteAll(activeGame, milestones.map((m) => m.id))}
          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
        >
          Mark all complete
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Restart ${meta.short}? Badges and the starter choice are cleared so you can pick again. All registered PokéPets are kept.`)) {
              onRestartGame(activeGame);
            }
          }}
          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 border border-slate-800 text-xs text-slate-300 hover:text-rose-300 cursor-pointer ml-auto"
          title="Restart this game's progress"
        >
          Restart Game
        </button>
      </div>
    </section>
  );
}