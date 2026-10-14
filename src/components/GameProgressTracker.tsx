import { useState } from 'react';
import type { GameId } from '../data/pokemonData';
import {
  GAME_META,
  TRACKABLE_GAMES,
  milestonesFor,
} from '../data/milestones';
import type { ProgressState } from '../hooks/useGameProgress';

interface Props {
  progress: ProgressState;
  trackedGames: Set<GameId>;
  ownedGames: GameId[];
  onToggle: (gameId: GameId, milestoneId: string) => void;
  onToggleTracking: (gameId: GameId) => void;
  onReset: (gameId: GameId) => void;
  onCompleteAll: (gameId: GameId, milestoneIds: string[]) => void;
}

export function GameProgressTracker({
  progress,
  trackedGames,
  ownedGames,
  onToggle,
  onToggleTracking,
  onReset,
  onCompleteAll,
}: Props) {
  const availableGames = TRACKABLE_GAMES.filter((g) => ownedGames.includes(g));
  const [activeGame, setActiveGame] = useState<GameId>(
    availableGames[0] ?? 'sv'
  );

  const milestones = milestonesFor(activeGame);
  const completed = new Set(progress[activeGame] ?? []);
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
          actually catchable right now.
        </p>
      </header>

      {/* Game tabs */}
      <nav className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        {availableGames.map((id) => {
          const gameMeta = GAME_META[id];
          const total = milestonesFor(id).length;
          const done = (progress[id] ?? []).length;
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
            <li key={m.id}>
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
      </div>
    </section>
  );
}