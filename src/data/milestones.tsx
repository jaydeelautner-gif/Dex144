import type { GameId } from './pokemonData';

export type MilestoneType =
  | 'badge'
  | 'titan'
  | 'star'
  | 'noble'
  | 'rank'
  | 'story'
  | 'dlc';

export interface Milestone {
  id: string;
  label: string;
  short: string;
  type: MilestoneType;
  order: number;
}

/** Games that can be tracked with milestones. 'pogo' is excluded (no badges). */
export const TRACKABLE_GAMES: GameId[] = ['sv', 'swsh', 'pla', 'bdsp', 'lgpe'];

/**
 * Map any owned-game id (canonical version ids like 'scarlet'/'shield' or
 * legacy grouped ids) to its trackable group. Expansion-style tracking is
 * per game pair: Scarlet+Violet, Sword+Shield, BD+SP, LGP+LGE.
 */
export const GAME_ID_TO_TRACKABLE: Partial<Record<GameId, string>> = {
  scarlet: 'sv', violet: 'sv', sv: 'sv',
  sword: 'swsh', shield: 'swsh', swsh: 'swsh',
  bd: 'bdsp', sp: 'bdsp', bdsp: 'bdsp',
  lgp: 'lgpe', lge: 'lgpe', lgpe: 'lgpe',
  pla: 'pla',
};

/** Trackable groups the user can actually track, derived from owned games. */
export function getOwnedTrackableGames(ownedGames: GameId[]): GameId[] {
  const owned = new Set<string>();
  for (const id of ownedGames) {
    const group = GAME_ID_TO_TRACKABLE[id];
    if (group) owned.add(group);
  }
  return TRACKABLE_GAMES.filter((g) => owned.has(g));
}

export const GAME_META: Record<string, { name: string; short: string; accent: string }> = {
  sv:   { name: 'Scarlet & Violet', short: 'SV',   accent: '#e0463f' },
  swsh: { name: 'Sword & Shield',   short: 'SwSh', accent: '#3f8ee0' },
  pla:  { name: 'Legends: Arceus',  short: 'PLA',  accent: '#6b8f4e' },
  bdsp: { name: 'BDSP',             short: 'BDSP', accent: '#8f6bd8' },
  lgpe: { name: "Let's Go",         short: 'LGPE', accent: '#e0b23f' },
};

export const MILESTONES: Record<string, Milestone[]> = {
  sv: [
    { id: 'sv-gym-1', label: 'Gym 1 — Cortondo (Bug · Katy)',          short: 'Badge 1', type: 'badge', order: 1 },
    { id: 'sv-gym-2', label: 'Gym 2 — Artazon (Grass · Brassius)',     short: 'Badge 2', type: 'badge', order: 2 },
    { id: 'sv-gym-3', label: 'Gym 3 — Levincia (Electric · Iono)',     short: 'Badge 3', type: 'badge', order: 3 },
    { id: 'sv-gym-4', label: 'Gym 4 — Cascarrafa (Water · Kofu)',      short: 'Badge 4', type: 'badge', order: 4 },
    { id: 'sv-gym-5', label: 'Gym 5 — Medali (Normal · Larry)',        short: 'Badge 5', type: 'badge', order: 5 },
    { id: 'sv-gym-6', label: 'Gym 6 — Montenevera (Ghost · Ryme)',     short: 'Badge 6', type: 'badge', order: 6 },
    { id: 'sv-gym-7', label: 'Gym 7 — Alfornada (Psychic · Tulip)',    short: 'Badge 7', type: 'badge', order: 7 },
    { id: 'sv-gym-8', label: 'Gym 8 — Glaseado (Ice · Grusha)',        short: 'Badge 8', type: 'badge', order: 8 },
    { id: 'sv-titan-1', label: 'Titan 1 — Klawf (Rock)',               short: 'Titan 1', type: 'titan', order: 9  },
    { id: 'sv-titan-2', label: 'Titan 2 — Bombirdier (Flying)',        short: 'Titan 2', type: 'titan', order: 10 },
    { id: 'sv-titan-3', label: 'Titan 3 — Orthworm (Steel)',           short: 'Titan 3', type: 'titan', order: 11 },
    { id: 'sv-titan-4', label: 'Titan 4 — Great Tusk / Iron Treads',   short: 'Titan 4', type: 'titan', order: 12 },
    { id: 'sv-titan-5', label: 'Titan 5 — Dondozo / Tatsugiri',        short: 'Titan 5', type: 'titan', order: 13 },
    { id: 'sv-star-1',  label: 'Star 1 — Segin Squad (Dark)',          short: 'Star 1',  type: 'star',  order: 14 },
    { id: 'sv-star-2',  label: 'Star 2 — Schedar Squad (Fire)',        short: 'Star 2',  type: 'star',  order: 15 },
    { id: 'sv-star-3',  label: 'Star 3 — Navi Squad (Poison)',         short: 'Star 3',  type: 'star',  order: 16 },
    { id: 'sv-star-4',  label: 'Star 4 — Ruchbah Squad (Fairy)',       short: 'Star 4',  type: 'star',  order: 17 },
    { id: 'sv-star-5',  label: 'Star 5 — Caph Squad (Fighting)',       short: 'Star 5',  type: 'star',  order: 18 },
    { id: 'sv-champion',   label: 'Champion · Area Zero Cleared',      short: 'Champion',    type: 'story', order: 19 },
    { id: 'sv-dlc-teal',   label: 'DLC — Teal Mask Complete',          short: 'Teal Mask',   type: 'dlc',   order: 20 },
    { id: 'sv-dlc-indigo', label: 'DLC — Indigo Disk Complete',        short: 'Indigo Disk', type: 'dlc',   order: 21 },
  ],
  swsh: [
    { id: 'swsh-badge-1', label: 'Gym 1 — Turffield (Grass · Milo)',      short: 'Badge 1', type: 'badge', order: 1 },
    { id: 'swsh-badge-2', label: 'Gym 2 — Hulbury (Water · Nessa)',       short: 'Badge 2', type: 'badge', order: 2 },
    { id: 'swsh-badge-3', label: 'Gym 3 — Motostoke (Fire · Kabu)',       short: 'Badge 3', type: 'badge', order: 3 },
    { id: 'swsh-badge-4', label: 'Gym 4 — Stow-on-Side (Bea / Allister)', short: 'Badge 4', type: 'badge', order: 4 },
    { id: 'swsh-badge-5', label: 'Gym 5 — Ballonlea (Fairy · Opal)',      short: 'Badge 5', type: 'badge', order: 5 },
    { id: 'swsh-badge-6', label: 'Gym 6 — Circhester (Gordie / Melony)',  short: 'Badge 6', type: 'badge', order: 6 },
    { id: 'swsh-badge-7', label: 'Gym 7 — Spikemuth (Dark · Piers)',      short: 'Badge 7', type: 'badge', order: 7 },
    { id: 'swsh-badge-8', label: 'Gym 8 — Hammerlocke (Dragon · Raihan)', short: 'Badge 8', type: 'badge', order: 8 },
    { id: 'swsh-champion', label: 'Champion · Rose Tower Cleared',        short: 'Champion', type: 'story', order: 9 },
    { id: 'swsh-ioa',      label: 'DLC — Isle of Armor Started',          short: 'Isle of Armor',  type: 'dlc', order: 10 },
    { id: 'swsh-ct',       label: 'DLC — Crown Tundra Started',           short: 'Crown Tundra',   type: 'dlc', order: 11 },
  ],
  pla: [
    { id: 'pla-rank-1',  label: 'Star Rank 1 — Obsidian Fieldlands',   short: 'Rank 1',  type: 'rank',  order: 1  },
    { id: 'pla-noble-1', label: 'Noble — Kleavor',                     short: 'Kleavor', type: 'noble', order: 2 },
    { id: 'pla-rank-2',  label: 'Star Rank 2 — Crimson Mirelands',     short: 'Rank 2',  type: 'rank',  order: 3  },
    { id: 'pla-noble-2', label: 'Noble — Lilligant',                   short: 'Lilligant', type: 'noble', order: 4 },
    { id: 'pla-rank-3',  label: 'Star Rank 3 — Cobalt Coastlands',     short: 'Rank 3',  type: 'rank',  order: 5  },
    { id: 'pla-noble-3', label: 'Noble — Arcanine',                    short: 'Arcanine', type: 'noble', order: 6 },
    { id: 'pla-rank-4',  label: 'Star Rank 4 — Coronet Highlands',     short: 'Rank 4',  type: 'rank',  order: 7  },
    { id: 'pla-noble-4', label: 'Noble — Electrode',                   short: 'Electrode', type: 'noble', order: 8 },
    { id: 'pla-rank-5',  label: 'Star Rank 5 — Alabaster Icelands',    short: 'Rank 5',  type: 'rank',  order: 9  },
    { id: 'pla-noble-5', label: 'Noble — Avalugg',                     short: 'Avalugg', type: 'noble', order: 10 },
    { id: 'pla-rank-6',  label: 'Star Rank 6 — Space-Time Distortions', short: 'Rank 6', type: 'rank',  order: 11 },
    { id: 'pla-rank-7',  label: 'Star Rank 7 — Post-Game',             short: 'Rank 7',  type: 'rank',  order: 12 },
  ],
  bdsp: [
    { id: 'bdsp-badge-1', label: 'Gym 1 — Oreburgh (Rock · Roark)',        short: 'Badge 1', type: 'badge', order: 1 },
    { id: 'bdsp-badge-2', label: 'Gym 2 — Eterna (Grass · Gardenia)',      short: 'Badge 2', type: 'badge', order: 2 },
    { id: 'bdsp-badge-3', label: 'Gym 3 — Veilstone (Fighting · Maylene)', short: 'Badge 3', type: 'badge', order: 3 },
    { id: 'bdsp-badge-4', label: 'Gym 4 — Pastoria (Water · Crasher Wake)', short: 'Badge 4', type: 'badge', order: 4 },
    { id: 'bdsp-badge-5', label: 'Gym 5 — Hearthome (Ghost · Fantina)',    short: 'Badge 5', type: 'badge', order: 5 },
    { id: 'bdsp-badge-6', label: 'Gym 6 — Canalave (Steel · Byron)',       short: 'Badge 6', type: 'badge', order: 6 },
    { id: 'bdsp-badge-7', label: 'Gym 7 — Snowpoint (Ice · Candice)',      short: 'Badge 7', type: 'badge', order: 7 },
    { id: 'bdsp-badge-8', label: 'Gym 8 — Sunyshore (Electric · Volkner)', short: 'Badge 8', type: 'badge', order: 8 },
    { id: 'bdsp-champion', label: 'Champion · Sinnoh League Cleared',      short: 'Champion', type: 'story', order: 9 },
  ],
  lgpe: [
    { id: 'lgpe-badge-1', label: 'Gym 1 — Pewter (Rock · Brock)',        short: 'Badge 1', type: 'badge', order: 1 },
    { id: 'lgpe-badge-2', label: 'Gym 2 — Cerulean (Water · Misty)',     short: 'Badge 2', type: 'badge', order: 2 },
    { id: 'lgpe-badge-3', label: 'Gym 3 — Vermilion (Electric · Surge)', short: 'Badge 3', type: 'badge', order: 3 },
    { id: 'lgpe-badge-4', label: 'Gym 4 — Celadon (Grass · Erika)',      short: 'Badge 4', type: 'badge', order: 4 },
    { id: 'lgpe-badge-5', label: 'Gym 5 — Fuchsia (Poison · Koga)',      short: 'Badge 5', type: 'badge', order: 5 },
    { id: 'lgpe-badge-6', label: 'Gym 6 — Saffron (Psychic · Sabrina)',  short: 'Badge 6', type: 'badge', order: 6 },
    { id: 'lgpe-badge-7', label: 'Gym 7 — Cinnabar (Fire · Blaine)',     short: 'Badge 7', type: 'badge', order: 7 },
    { id: 'lgpe-badge-8', label: 'Gym 8 — Viridian (Ground · Giovanni)', short: 'Badge 8', type: 'badge', order: 8 },
    { id: 'lgpe-champion', label: 'Champion · Indigo Plateau Cleared',   short: 'Champion', type: 'story', order: 9 },
  ],
};

export function milestonesFor(gameId: string): Milestone[] {
  return [...(MILESTONES[gameId] ?? [])].sort((a, b) => a.order - b.order);
}

/** Fast lookup: milestoneId -> Milestone */
export const MILESTONE_INDEX: Map<string, Milestone> = new Map(
  Object.values(MILESTONES).flat().map((m) => [m.id, m])
);