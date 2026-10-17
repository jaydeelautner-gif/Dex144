import React from 'react';
import type { GameId } from '../data/pokemonData';
import { GAMES } from '../data/pokemonData';
import { TrainerAvatar, type TrainerAvatarConfig } from './TrainerAvatar';
import { GymBadgeStrip, gameBadgeSprites } from './GymBadgeStrip';
import { GameLogoBadge } from './GameLogoBadge';
import { MILESTONE_INDEX } from '../data/milestones';

/**
 * Trainer Card — the classic in-game trainer card, HomeDex edition.
 * Shows the trainer's avatar, owned games and earned gym badges in a
 * Pokéball-styled card. Rendered at the top of the profile page.
 */
/** Trainer-card look, fully user-selectable and stored on the device. */
export const CARD_FRAMES = [
  { id: 'classic', label: 'Classic Red', from: '#B91C1C', via: '#DC2626', to: '#7F1D1D', ring: '#FBBF24' },
  { id: 'cobalt', label: 'Cobalt', from: '#1E3A8A', via: '#2563EB', to: '#172554', ring: '#93C5FD' },
  { id: 'forest', label: 'Forest', from: '#14532D', via: '#16A34A', to: '#052E16', ring: '#86EFAC' },
  { id: 'violet', label: 'Violet', from: '#4C1D95', via: '#7C3AED', to: '#2E1065', ring: '#C4B5FD' },
  { id: 'gold', label: 'Champion Gold', from: '#92400E', via: '#D97706', to: '#451A03', ring: '#FDE68A' },
  { id: 'steel', label: 'Steel', from: '#0F172A', via: '#334155', to: '#020617', ring: '#CBD5E1' },
  { id: 'rose', label: 'Rose', from: '#831843', via: '#E11D48', to: '#4C0519', ring: '#F9A8D4' },
  { id: 'emerald', label: 'Emerald', from: '#064E3B', via: '#059669', to: '#022C22', ring: '#6EE7B7' },
] as const;
export type CardFrameId = (typeof CARD_FRAMES)[number]['id'];

export const CARD_TITLES = ['Trainer Card', 'Dex Holder', 'PokéPet Keeper', 'Living Dex Master', 'Badge Collector'] as const;

export interface TrainerCardPrefs {
  frame: CardFrameId;
  title: string;
  showPokeball: boolean;
}
export const CARD_PREFS_KEY = 'homedex_trainer_card_v1';
export const DEFAULT_CARD_PREFS: TrainerCardPrefs = { frame: 'classic', title: 'Trainer Card', showPokeball: true };

export function normalizeCardPrefs(raw: unknown): TrainerCardPrefs {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Partial<TrainerCardPrefs>;
  return {
    frame: CARD_FRAMES.some((f) => f.id === data.frame) ? (data.frame as CardFrameId) : DEFAULT_CARD_PREFS.frame,
    title: CARD_TITLES.includes(data.title as (typeof CARD_TITLES)[number]) ? String(data.title) : DEFAULT_CARD_PREFS.title,
    showPokeball: data.showPokeball !== false,
  };
}
export function loadCardPrefs(): TrainerCardPrefs {
  try { return normalizeCardPrefs(JSON.parse(localStorage.getItem(CARD_PREFS_KEY) ?? 'null')); }
  catch { return DEFAULT_CARD_PREFS; }
}

export const ProfileCard: React.FC<{
  trainerName: string;
  avatar?: TrainerAvatarConfig | null;
  ownedGames: GameId[];
  gameProgress: Record<string, string[]>;
  isPublic?: boolean;
  compact?: boolean;
  prefs?: TrainerCardPrefs;
  worstCaseTitle?: string;
}> = ({ trainerName, avatar, ownedGames, gameProgress, isPublic = false, compact = false, prefs }) => {
  const cardPrefs = prefs ? normalizeCardPrefs(prefs) : loadCardPrefs();
  const frame = CARD_FRAMES.find((f) => f.id === cardPrefs.frame) ?? CARD_FRAMES[0];
  const owned = React.useMemo(
    () => GAMES.filter((g) => ownedGames.includes(g.id)),
    [ownedGames]
  );

  // Count earned badges per owned group (badge-type milestones only).
  const badgeRows = React.useMemo(() => {
    const rows: { gameId: GameId; prefix: string; earned: number; total: number }[] = [];
    for (const game of owned) {
      const mapping = gameBadgeSprites(game.id);
      if (!mapping || rows.some((r) => r.prefix === mapping.prefix)) continue;
      const completed = new Set(gameProgress[mapping.prefix] ?? []);
      const total = (mapping.sprites.length);
      const earned = [...completed].filter((id) => {
        const m = MILESTONE_INDEX.get(id);
        return m?.type === 'badge' && id.startsWith(mapping.prefix);
      }).length;
      rows.push({ gameId: game.id, prefix: mapping.prefix, earned, total });
    }
    return rows;
  }, [owned, gameProgress]);
  const totalBadges = badgeRows.reduce((n, r) => n + r.earned, 0);
  const gameChips = owned.slice(0, 8);
  const extraGames = Math.max(0, owned.length - gameChips.length);

  return (
    <section
      aria-label="Trainer card"
      className={`relative min-w-0 overflow-hidden rounded-3xl border-2 shadow-[0_18px_45px_rgba(0,0,0,0.55)] p-5 flex flex-col gap-5 ${compact ? '' : 'sm:p-6 sm:flex-row'}`}
      style={{ borderColor: frame.ring, backgroundImage: `linear-gradient(135deg, ${frame.from}, ${frame.via}, ${frame.to})` }}
    >
      {/* Big translucent Pokéball watermark */}
      <svg viewBox="0 0 100 100" className={`absolute -right-8 -bottom-10 w-52 h-52 opacity-15 pointer-events-none ${cardPrefs.showPokeball ? '' : 'hidden'}`} aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeWidth="6" />
        <path d="M4 50 H96" stroke="#fff" strokeWidth="6" />
        <path d="M4 50 A46 46 0 0 1 96 50 Z" fill="#fff" />
        <circle cx="50" cy="50" r="15" fill="#fff" stroke="#fff" strokeWidth="6" />
      </svg>

      {/* Avatar + identity */}
      <div className={`relative z-10 flex items-center gap-4 shrink-0 ${compact ? 'flex-wrap' : ''}`}>
        <div className="rounded-2xl shadow-[0_0_18px_rgba(0,0,0,0.45)] bg-[#0B0F17]">
          <TrainerAvatar config={avatar} size={104} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="px-2 py-0.5 w-fit rounded-full text-slate-950 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: frame.ring }}>
            {cardPrefs.title}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] break-all">
            {trainerName || 'Guest'}
          </h2>
          <span className="text-[11px] font-mono text-red-100/80 uppercase tracking-wider">
            {isPublic ? 'Public Showcase' : 'HomeDex Trainer'} · DevRaccoon ID
          </span>
        </div>
      </div>

      {/* Stats + badges */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-200">
            Games Owned: {owned.length}
          </span>
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-200">
            Badges Earned: {totalBadges}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {gameChips.map((g) => (
            <span
              key={g.id}
              className="px-2 py-0.5 rounded-lg bg-black/35 border border-white/25 text-[10px] font-bold text-white/90"
              title={g.title}
            >
              {g.shortTitle}
            </span>
          ))}
          {extraGames > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-black/35 border border-white/25 text-[10px] font-bold text-white/70">
              +{extraGames} more
            </span>
          )}
          {owned.length === 0 && (
            <span className="text-[11px] text-red-100/70 font-mono">No games marked as owned yet.</span>
          )}
        </div>

        {/* Badge case — one mini-card per badge game, like the trainer's case pages */}
        <div className="rounded-xl bg-black/30 border border-white/20 p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-200/90">
              Badge Case
            </span>
            <span className="text-[10px] font-mono text-white/60">
              {totalBadges} badges earned
            </span>
          </div>
          {badgeRows.length === 0 ? (
            <span className="text-[11px] text-red-100/70 font-mono">No badge games owned yet.</span>
          ) : (
            <div className={`grid grid-cols-1 gap-2 pr-1 ${compact ? 'max-h-72 overflow-y-auto' : 'sm:grid-cols-2 max-h-64 overflow-y-auto'}`}>
              {badgeRows.map((row) => {
                const game = owned.find((g) => gameBadgeSprites(g.id)?.prefix === row.prefix)!;
                const isJohto = row.prefix === 'gs' || row.prefix === 'hgss';
                return (
                  <div key={row.prefix} className="bg-[#0B0F17] border border-slate-700/70 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <GameLogoBadge gameId={game.id} size="xs" />
                      <span className="text-xs font-bold text-slate-100 truncate">{game.shortTitle}</span>
                      <span className="ml-auto text-[10px] font-mono text-amber-300 shrink-0">
                        {row.earned}/{row.total}
                      </span>
                    </div>
                    <GymBadgeStrip
                      gameId={game.id}
                      completedIds={gameProgress[row.prefix] ?? []}
                      size={compact ? 24 : 30}
                      extra={isJohto
                        ? { sprite: 9, earned: (gameProgress[row.prefix] ?? []).includes(`${row.prefix}-kanto`), label: 'Kanto badges (all 8)' }
                        : null}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
