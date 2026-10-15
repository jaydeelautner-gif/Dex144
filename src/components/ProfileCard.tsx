import React from 'react';
import type { GameId } from '../data/pokemonData';
import { GAMES } from '../data/pokemonData';
import { MILESTONE_INDEX } from '../data/milestones';
import { TrainerAvatar, type TrainerAvatarConfig } from './TrainerAvatar';
import { GROUP_BADGE_SPRITES, badgeSpriteUrl, gameBadgeSprites } from './GymBadgeStrip';

/**
 * Trainer Card — the classic in-game trainer card, HomeDex edition.
 * Shows the trainer's avatar, owned games and earned gym badges in a
 * Pokéball-styled card. Rendered at the top of the profile page.
 */
export const ProfileCard: React.FC<{
  trainerName: string;
  avatar?: TrainerAvatarConfig | null;
  ownedGames: GameId[];
  gameProgress: Record<string, string[]>;
  isPublic?: boolean;
}> = ({ trainerName, avatar, ownedGames, gameProgress, isPublic = false }) => {
  const owned = React.useMemo(
    () => GAMES.filter((g) => ownedGames.includes(g.id)),
    [ownedGames]
  );

  // Earned badge sprites per owned group, in milestone order.
  const badgeRows = React.useMemo(() => {
    const rows: { group: string; sprites: { url: string; earned: boolean }[]; earned: number }[] = [];
    for (const game of owned) {
      const mapping = gameBadgeSprites(game.id);
      if (!mapping || rows.some((r) => r.group === mapping.prefix)) continue;
      const completed = new Set(gameProgress[mapping.prefix] ?? []);
      const sprites = GROUP_BADGE_SPRITES[mapping.prefix].map((n, i) => {
        const milestoneId = `${mapping.prefix}-badge-${i + 1}`;
        const earned = completed.has(milestoneId) || (MILESTONE_INDEX.get(milestoneId)?.type === 'badge' && completed.has(milestoneId));
        return { url: badgeSpriteUrl(n), earned };
      });
      // SV uses sv-gym-N ids instead of sv-badge-N.
      const svEarned = mapping.prefix === 'sv'
        ? GROUP_BADGE_SPRITES.sv.map((n, i) => ({ url: badgeSpriteUrl(n), earned: completed.has(`sv-gym-${i + 1}`) }))
        : sprites;
      const earnedCount = svEarned.filter((b) => b.earned).length;
      rows.push({ group: mapping.prefix, sprites: svEarned, earned: earnedCount });
    }
    return rows;
  }, [owned, gameProgress]);

  const totalBadges = badgeRows.reduce((n, r) => n + r.earned, 0);
  const gameChips = owned.slice(0, 8);
  const extraGames = Math.max(0, owned.length - gameChips.length);

  return (
    <section
      aria-label="Trainer card"
      className="relative overflow-hidden rounded-3xl border-2 border-amber-400/60 shadow-[0_18px_45px_rgba(0,0,0,0.55)] bg-gradient-to-br from-[#B91C1C] via-[#DC2626] to-[#7F1D1D] p-5 sm:p-6 flex flex-col sm:flex-row gap-5"
    >
      {/* Big translucent Pokéball watermark */}
      <svg viewBox="0 0 100 100" className="absolute -right-8 -bottom-10 w-52 h-52 opacity-15 pointer-events-none" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeWidth="6" />
        <path d="M4 50 H96" stroke="#fff" strokeWidth="6" />
        <path d="M4 50 A46 46 0 0 1 96 50 Z" fill="#fff" />
        <circle cx="50" cy="50" r="15" fill="#fff" stroke="#fff" strokeWidth="6" />
      </svg>

      {/* Avatar + identity */}
      <div className="relative z-10 flex items-center gap-4 shrink-0">
        <div className="rounded-full border-4 border-amber-300/90 shadow-[0_0_18px_rgba(251,191,36,0.4)] bg-[#0B0F17]">
          <TrainerAvatar config={avatar} size={96} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="px-2 py-0.5 w-fit rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest">
            Trainer Card
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] break-all">
            {trainerName || 'Guest'}
          </h2>
          <span className="text-[11px] font-mono text-red-100/80 uppercase tracking-wider">
            {isPublic ? 'Public Showcase' : 'HomeDex Trainer'} · Silph Co. ID
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

        {/* Badge case */}
        <div className="rounded-xl bg-black/30 border border-white/20 p-2.5 flex flex-col gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-200/90">
            Badge Case
          </span>
          {badgeRows.length === 0 ? (
            <span className="text-[11px] text-red-100/70 font-mono">No badge games owned yet.</span>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
              {badgeRows.map((row) => (
                <div key={row.group} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-white/60 w-12 shrink-0 uppercase">
                    {row.earned}/{row.sprites.length}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {row.sprites.map((b, i) => (
                      <img
                        key={i}
                        src={b.url}
                        alt={b.earned ? 'Earned badge' : 'Locked badge'}
                        width={22}
                        height={22}
                        loading="lazy"
                        className={`rounded-full ${b.earned ? 'drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]' : 'opacity-25 grayscale'}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
