import React from 'react';
import type { GameId } from '../data/pokemonData';
import { GAME_ID_TO_TRACKABLE } from '../data/milestones';

/**
 * Gym badge sprites, fetched from the PokeAPI/sprites repository
 * (public/badges/1.png … 77.png). Numbering follows that repository:
 *   1–8   Kanto   (RBY / FRLG / LGPE)
 *   9–16  Johto    (GS / HGSS)
 *   17–24 Hoenn    (RSE / ORAS)
 *   25–32 Sinnoh   (DPPt / BDSP)
 *   33–40 Unova    (BW / B2W2)
 *   43–50 Kalos    (XY)
 *   51–58 Galar    (SwSh)
 *   70–77 Paldea   (SV Victory Road gyms)
 */
export const BADGE_SPRITE_COUNT = 77;
export const badgeSpriteUrl = (n: number) => `/badges/${n}.png`;

/** Ordered badge sprite numbers per milestone group prefix. */
export const GROUP_BADGE_SPRITES: Record<string, number[]> = {
  rb: [1, 2, 3, 4, 5, 6, 7, 8],
  frlg: [1, 2, 3, 4, 5, 6, 7, 8],
  lgpe: [1, 2, 3, 4, 5, 6, 7, 8],
  gs: [9, 10, 11, 12, 13, 14, 15, 16],
  hgss: [9, 10, 11, 12, 13, 14, 15, 16],
  rse: [17, 18, 19, 20, 21, 22, 23, 24],
  oras: [17, 18, 19, 20, 21, 22, 23, 24],
  dppt: [25, 26, 27, 28, 29, 30, 31, 32],
  bdsp: [25, 26, 27, 28, 29, 30, 31, 32],
  bw: [33, 34, 35, 36, 37, 38, 39, 40],
  b2w2: [33, 34, 35, 36, 37, 38, 39, 40],
  xy: [43, 44, 45, 46, 47, 48, 49, 50],
  swsh: [51, 52, 53, 54, 55, 56, 57, 58],
  sv: [70, 71, 72, 73, 74, 75, 76, 77],
};

export function gameBadgeSprites(gameId: GameId): { sprites: number[]; prefix: string } | null {
  // Accept both canonical game ids (red, scarlet, shield…) and group ids
  // (rb, sv…) — GAME_ID_TO_TRACKABLE is total over the canonical set.
  const group = GAME_ID_TO_TRACKABLE[gameId as GameId] ?? (GROUP_BADGE_SPRITES[gameId] ? gameId : undefined);
  if (!group || !GROUP_BADGE_SPRITES[group]) return null;
  return { sprites: GROUP_BADGE_SPRITES[group], prefix: group };
}

/**
 * Renders a row of gym badge sprites. Earned badges are full-colour with a
 * glow; unearned ones are dimmed and desaturated.
 */
export const GymBadgeStrip: React.FC<{
  gameId: GameId;
  completedIds: readonly string[];
  size?: number;
  extra?: { sprite: number; earned: boolean; label: string } | null;
}> = ({ gameId, completedIds, size = 32, extra = null }) => {
  const mapping = gameBadgeSprites(gameId);
  if (!mapping && !extra) return null;
  const completed = new Set(completedIds);
  const badges = (mapping?.sprites ?? []).map((sprite, i) => ({
    sprite,
    id: mapping ? `${mapping.prefix}-badge-${i + 1}` : '',
  }));
  return (
    <div className="flex items-center gap-1 flex-wrap" title="Gym badges earned in this game">
      {badges.map((b, i) => {
        const earned = completed.has(b.id);
        return (
          <img
            key={i}
            src={badgeSpriteUrl(b.sprite)}
            alt={earned ? 'Badge earned' : 'Badge not earned'}
            width={size}
            height={size}
            loading="lazy"
            className={`rounded-full transition-all ${earned
              ? 'drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]'
              : 'opacity-30 grayscale'}`}
          />
        );
      })}
      {extra && (
        <img
          src={badgeSpriteUrl(extra.sprite)}
          alt={extra.label}
          width={size}
          height={size}
          loading="lazy"
          className={`rounded-full transition-all ${extra.earned
            ? 'drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]'
            : 'opacity-30 grayscale'}`}
          title={extra.label}
        />
      )}
    </div>
  );
};
