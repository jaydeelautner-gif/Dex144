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

/** Games that can be tracked with milestones — every mainline + side group. */
export const TRACKABLE_GAMES: GameId[] = [
  'rb', 'frlg', 'gs', 'hgss', 'rse', 'oras', 'dppt', 'bdsp', 'colo', 'xd',
  'bw', 'b2w2', 'xy', 'sm', 'usum', 'lgpe', 'swsh', 'pla', 'sv',
];

/**
 * Map any owned-game id (canonical version ids like 'scarlet'/'shield' or
 * legacy grouped ids) to its trackable group. Expansion-style tracking is
 * per game pair: Scarlet+Violet, Sword+Shield, BD+SP, LGP+LGE.
 */
export const GAME_ID_TO_TRACKABLE: Partial<Record<GameId, string>> = {
  // Gen 1
  red: 'rb', blue: 'rb', yellow: 'rb', rb: 'rb',
  firered: 'frlg', leafgreen: 'frlg', frlg: 'frlg',
  // Gen 2
  gold: 'gs', silver: 'gs', crystal: 'gs', gs: 'gs',
  heartgold: 'hgss', soulsilver: 'hgss', hgss: 'hgss',
  // Gen 3
  ruby: 'rse', sapphire: 'rse', emerald: 'rse', rse: 'rse',
  omegaruby: 'oras', alphasapphire: 'oras', oras: 'oras',
  // Gen 4
  diamond: 'dppt', pearl: 'dppt', platinum: 'dppt', dppt: 'dppt',
  bd: 'bdsp', sp: 'bdsp', bdsp: 'bdsp',
  // GameCube side games
  colo: 'colo', xd: 'xd',
  // Gen 5
  black: 'bw', white: 'bw', bw: 'bw',
  black2: 'b2w2', white2: 'b2w2', b2w2: 'b2w2',
  // Gen 6
  x: 'xy', y: 'xy', xy: 'xy',
  // Gen 7
  sun: 'sm', moon: 'sm', sm: 'sm',
  ultrasun: 'usum', ultramoon: 'usum', usum: 'usum',
  // Switch era
  lgp: 'lgpe', lge: 'lgpe', lgpe: 'lgpe',
  sword: 'swsh', shield: 'swsh', swsh: 'swsh',
  pla: 'pla',
  scarlet: 'sv', violet: 'sv', sv: 'sv',
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
  rb:   { name: 'Red / Blue / Yellow',           short: 'RBY',    accent: '#e0463f' },
  frlg: { name: 'FireRed / LeafGreen',          short: 'FRLG',   accent: '#e0783f' },
  gs:   { name: 'Gold / Silver / Crystal',      short: 'GSC',    accent: '#e0b23f' },
  hgss: { name: 'HeartGold / SoulSilver',       short: 'HGSS',   accent: '#c9a227' },
  rse:  { name: 'Ruby / Sapphire / Emerald',    short: 'RSE',    accent: '#3fbf6f' },
  oras: { name: 'Omega Ruby / Alpha Sapphire',  short: 'ORAS',   accent: '#e05050' },
  dppt: { name: 'Diamond / Pearl / Platinum',   short: 'DPPt',   accent: '#6bb8e0' },
  bdsp: { name: 'Brilliant Diamond / Sh. Pearl',short: 'BDSP',   accent: '#8f6bd8' },
  colo: { name: 'Pokémon Colosseum',            short: 'Colo',   accent: '#a073c9' },
  xd:   { name: 'Pokémon XD: Gale of Darkness', short: 'XD',     accent: '#7a6bd8' },
  bw:   { name: 'Black / White',                short: 'BW',     accent: '#555555' },
  b2w2: { name: 'Black 2 / White 2',            short: 'B2W2',   accent: '#888888' },
  xy:   { name: 'X / Y',                        short: 'XY',     accent: '#3f6ee0' },
  sm:   { name: 'Sun / Moon',                   short: 'SM',     accent: '#e08f3f' },
  usum: { name: 'Ultra Sun / Ultra Moon',       short: 'USUM',   accent: '#e0a53f' },
  lgpe: { name: "Let's Go Pikachu / Eevee",     short: 'LGPE',   accent: '#e0b23f' },
  swsh: { name: 'Sword & Shield',               short: 'SwSh',   accent: '#3f8ee0' },
  pla:  { name: 'Legends: Arceus',              short: 'PLA',    accent: '#6b8f4e' },
  sv:   { name: 'Scarlet & Violet',             short: 'SV',     accent: '#e0463f' },
};

export const MILESTONES: Record<string, Milestone[]> = {
  rb: [
    { id: 'rb-badge-1', label: 'Badge 1 — Pewter (Rock · Brock)',        short: 'Badge 1', type: 'badge', order: 1 },
    { id: 'rb-badge-2', label: 'Badge 2 — Cerulean (Water · Misty)',     short: 'Badge 2', type: 'badge', order: 2 },
    { id: 'rb-badge-3', label: 'Badge 3 — Vermilion (Electric · Surge)', short: 'Badge 3', type: 'badge', order: 3 },
    { id: 'rb-badge-4', label: 'Badge 4 — Celadon (Grass · Erika)',      short: 'Badge 4', type: 'badge', order: 4 },
    { id: 'rb-badge-5', label: 'Badge 5 — Fuchsia (Poison · Koga)',      short: 'Badge 5', type: 'badge', order: 5 },
    { id: 'rb-badge-6', label: 'Badge 6 — Saffron (Psychic · Sabrina)',  short: 'Badge 6', type: 'badge', order: 6 },
    { id: 'rb-badge-7', label: 'Badge 7 — Cinnabar (Fire · Blaine)',     short: 'Badge 7', type: 'badge', order: 7 },
    { id: 'rb-badge-8', label: 'Badge 8 — Viridian (Ground · Giovanni)', short: 'Badge 8', type: 'badge', order: 8 },
    { id: 'rb-champion', label: 'Elite Four & Champion · Indigo Plateau Cleared', short: 'Elite 4', type: 'story', order: 9 },
  ],
  frlg: [
    { id: 'frlg-badge-1', label: 'Badge 1 — Pewter (Rock · Brock)',        short: 'Badge 1', type: 'badge', order: 1 },
    { id: 'frlg-badge-2', label: 'Badge 2 — Cerulean (Water · Misty)',     short: 'Badge 2', type: 'badge', order: 2 },
    { id: 'frlg-badge-3', label: 'Badge 3 — Vermilion (Electric · Surge)', short: 'Badge 3', type: 'badge', order: 3 },
    { id: 'frlg-badge-4', label: 'Badge 4 — Celadon (Grass · Erika)',      short: 'Badge 4', type: 'badge', order: 4 },
    { id: 'frlg-badge-5', label: 'Badge 5 — Fuchsia (Poison · Koga)',      short: 'Badge 5', type: 'badge', order: 5 },
    { id: 'frlg-badge-6', label: 'Badge 6 — Saffron (Psychic · Sabrina)',  short: 'Badge 6', type: 'badge', order: 6 },
    { id: 'frlg-badge-7', label: 'Badge 7 — Cinnabar (Fire · Blaine)',     short: 'Badge 7', type: 'badge', order: 7 },
    { id: 'frlg-badge-8', label: 'Badge 8 — Viridian (Ground · Giovanni)', short: 'Badge 8', type: 'badge', order: 8 },
    { id: 'frlg-champion', label: 'Elite Four & Champion · Indigo Plateau Cleared', short: 'Elite 4', type: 'story', order: 9 },
  ],
  gs: [
    { id: 'gs-badge-1', label: 'Badge 1 — Violet (Flying · Falkner)',      short: 'Badge 1', type: 'badge', order: 1 },
    { id: 'gs-badge-2', label: 'Badge 2 — Azalea (Bug · Bugsy)',           short: 'Badge 2', type: 'badge', order: 2 },
    { id: 'gs-badge-3', label: 'Badge 3 — Goldenrod (Normal · Whitney)',   short: 'Badge 3', type: 'badge', order: 3 },
    { id: 'gs-badge-4', label: 'Badge 4 — Ecruteak (Ghost · Morty)',       short: 'Badge 4', type: 'badge', order: 4 },
    { id: 'gs-badge-5', label: 'Badge 5 — Cianwood (Fighting · Chuck)',   short: 'Badge 5', type: 'badge', order: 5 },
    { id: 'gs-badge-6', label: 'Badge 6 — Olivine (Steel · Jasmine)',      short: 'Badge 6', type: 'badge', order: 6 },
    { id: 'gs-badge-7', label: 'Badge 7 — Mahogany (Ice · Pryce)',         short: 'Badge 7', type: 'badge', order: 7 },
    { id: 'gs-badge-8', label: 'Badge 8 — Blackthorn (Dragon · Clair)',    short: 'Badge 8', type: 'badge', order: 8 },
    { id: 'gs-champion', label: 'Elite Four & Champion · Johto League Cleared', short: 'Elite 4', type: 'story', order: 9 },
    { id: 'gs-kanto',    label: 'Kanto Badges — All 8 Kanto Gyms Beaten',  short: 'Kanto 8', type: 'badge', order: 10 },
    { id: 'gs-red',      label: 'Champion — Red Defeated on Mt. Silver',   short: 'Red',     type: 'story', order: 11 },
  ],
  hgss: [
    { id: 'hgss-badge-1', label: 'Badge 1 — Violet (Flying · Falkner)',      short: 'Badge 1', type: 'badge', order: 1 },
    { id: 'hgss-badge-2', label: 'Badge 2 — Azalea (Bug · Bugsy)',           short: 'Badge 2', type: 'badge', order: 2 },
    { id: 'hgss-badge-3', label: 'Badge 3 — Goldenrod (Normal · Whitney)',   short: 'Badge 3', type: 'badge', order: 3 },
    { id: 'hgss-badge-4', label: 'Badge 4 — Ecruteak (Ghost · Morty)',       short: 'Badge 4', type: 'badge', order: 4 },
    { id: 'hgss-badge-5', label: 'Badge 5 — Cianwood (Fighting · Chuck)',   short: 'Badge 5', type: 'badge', order: 5 },
    { id: 'hgss-badge-6', label: 'Badge 6 — Olivine (Steel · Jasmine)',      short: 'Badge 6', type: 'badge', order: 6 },
    { id: 'hgss-badge-7', label: 'Badge 7 — Mahogany (Ice · Pryce)',         short: 'Badge 7', type: 'badge', order: 7 },
    { id: 'hgss-badge-8', label: 'Badge 8 — Blackthorn (Dragon · Clair)',    short: 'Badge 8', type: 'badge', order: 8 },
    { id: 'hgss-champion', label: 'Elite Four & Champion · Johto League Cleared', short: 'Elite 4', type: 'story', order: 9 },
    { id: 'hgss-kanto',    label: 'Kanto Badges — All 8 Kanto Gyms Beaten',  short: 'Kanto 8', type: 'badge', order: 10 },
    { id: 'hgss-red',      label: 'Champion — Red Defeated on Mt. Silver',   short: 'Red',     type: 'story', order: 11 },
  ],
  rse: [
    { id: 'rse-badge-1', label: 'Badge 1 — Rustboro (Rock · Roxanne)',        short: 'Badge 1', type: 'badge', order: 1 },
    { id: 'rse-badge-2', label: 'Badge 2 — Dewford (Fighting · Brawly)',      short: 'Badge 2', type: 'badge', order: 2 },
    { id: 'rse-badge-3', label: 'Badge 3 — Mauville (Electric · Wattson)',    short: 'Badge 3', type: 'badge', order: 3 },
    { id: 'rse-badge-4', label: 'Badge 4 — Lavaridge (Fire · Flannery)',      short: 'Badge 4', type: 'badge', order: 4 },
    { id: 'rse-badge-5', label: 'Badge 5 — Petalburg (Normal · Norman)',      short: 'Badge 5', type: 'badge', order: 5 },
    { id: 'rse-badge-6', label: 'Badge 6 — Fortree (Flying · Winona)',        short: 'Badge 6', type: 'badge', order: 6 },
    { id: 'rse-badge-7', label: 'Badge 7 — Mossdeep (Psychic · Tate & Liza)', short: 'Badge 7', type: 'badge', order: 7 },
    { id: 'rse-badge-8', label: 'Badge 8 — Sootopolis (Water · Wallace/Juan)',short: 'Badge 8', type: 'badge', order: 8 },
    { id: 'rse-champion', label: 'Elite Four & Champion · Ever Grande Cleared', short: 'Elite 4', type: 'story', order: 9 },
  ],
  oras: [
    { id: 'oras-badge-1', label: 'Badge 1 — Rustboro (Rock · Roxanne)',        short: 'Badge 1', type: 'badge', order: 1 },
    { id: 'oras-badge-2', label: 'Badge 2 — Dewford (Fighting · Brawly)',      short: 'Badge 2', type: 'badge', order: 2 },
    { id: 'oras-badge-3', label: 'Badge 3 — Mauville (Electric · Wattson)',    short: 'Badge 3', type: 'badge', order: 3 },
    { id: 'oras-badge-4', label: 'Badge 4 — Lavaridge (Fire · Flannery)',      short: 'Badge 4', type: 'badge', order: 4 },
    { id: 'oras-badge-5', label: 'Badge 5 — Petalburg (Normal · Norman)',      short: 'Badge 5', type: 'badge', order: 5 },
    { id: 'oras-badge-6', label: 'Badge 6 — Fortree (Flying · Winona)',        short: 'Badge 6', type: 'badge', order: 6 },
    { id: 'oras-badge-7', label: 'Badge 7 — Mossdeep (Psychic · Tate & Liza)', short: 'Badge 7', type: 'badge', order: 7 },
    { id: 'oras-badge-8', label: 'Badge 8 — Sootopolis (Water · Wallace)',     short: 'Badge 8', type: 'badge', order: 8 },
    { id: 'oras-champion', label: 'Elite Four & Champion · Ever Grande Cleared', short: 'Elite 4', type: 'story', order: 9 },
  ],
  dppt: [
    { id: 'dppt-badge-1', label: 'Badge 1 — Oreburgh (Rock · Roark)',          short: 'Badge 1', type: 'badge', order: 1 },
    { id: 'dppt-badge-2', label: 'Badge 2 — Eterna (Grass · Gardenia)',        short: 'Badge 2', type: 'badge', order: 2 },
    { id: 'dppt-badge-3', label: 'Badge 3 — Veilstone (Fighting · Maylene)',   short: 'Badge 3', type: 'badge', order: 3 },
    { id: 'dppt-badge-4', label: 'Badge 4 — Pastoria (Water · Crasher Wake)',  short: 'Badge 4', type: 'badge', order: 4 },
    { id: 'dppt-badge-5', label: 'Badge 5 — Hearthome (Ghost · Fantina)',      short: 'Badge 5', type: 'badge', order: 5 },
    { id: 'dppt-badge-6', label: 'Badge 6 — Canalave (Steel · Byron)',         short: 'Badge 6', type: 'badge', order: 6 },
    { id: 'dppt-badge-7', label: 'Badge 7 — Snowpoint (Ice · Candice)',        short: 'Badge 7', type: 'badge', order: 7 },
    { id: 'dppt-badge-8', label: 'Badge 8 — Sunyshore (Electric · Volkner)',   short: 'Badge 8', type: 'badge', order: 8 },
    { id: 'dppt-champion', label: 'Elite Four & Champion · Sinnoh League Cleared', short: 'Elite 4', type: 'story', order: 9 },
  ],
  colo: [
    { id: 'colo-story-1', label: 'Story — Snag Machine Obtained',             short: 'Snag Machine', type: 'story', order: 1 },
    { id: 'colo-story-2', label: 'Story — Realgam Tower Cipher Raid Cleared', short: 'Realgam Tower', type: 'story', order: 2 },
    { id: 'colo-story-3', label: 'Story — Cipher Key Lair Cleared',           short: 'Key Lair', type: 'story', order: 3 },
    { id: 'colo-champion', label: 'Champion — Orre Colosseum Conquered',      short: 'Champion', type: 'story', order: 4 },
  ],
  xd: [
    { id: 'xd-story-1', label: 'Story — Snag Machine Recovered (Phenac)',     short: 'Snag Machine', type: 'story', order: 1 },
    { id: 'xd-story-2', label: 'Story — Cipher Key Lair Raid Cleared',        short: 'Key Lair', type: 'story', order: 2 },
    { id: 'xd-story-3', label: 'Story — Citadark Island Infiltrated',         short: 'Citadark', type: 'story', order: 3 },
    { id: 'xd-champion', label: 'Champion — Greevil & Lugia Battle Won',      short: 'Greevil', type: 'story', order: 4 },
  ],
  bw: [
    { id: 'bw-badge-1', label: 'Badge 1 — Striaton (Trio · Cilan/Cress/Chili)', short: 'Badge 1', type: 'badge', order: 1 },
    { id: 'bw-badge-2', label: 'Badge 2 — Nacrene (Normal · Lenora)',          short: 'Badge 2', type: 'badge', order: 2 },
    { id: 'bw-badge-3', label: 'Badge 3 — Castelia (Bug · Burgh)',             short: 'Badge 3', type: 'badge', order: 3 },
    { id: 'bw-badge-4', label: 'Badge 4 — Nimbasa (Electric · Elesa)',         short: 'Badge 4', type: 'badge', order: 4 },
    { id: 'bw-badge-5', label: 'Badge 5 — Driftveil (Ground · Clay)',          short: 'Badge 5', type: 'badge', order: 5 },
    { id: 'bw-badge-6', label: 'Badge 6 — Mistralton (Flying · Skyla)',        short: 'Badge 6', type: 'badge', order: 6 },
    { id: 'bw-badge-7', label: 'Badge 7 — Icirrus (Ice · Brycen)',             short: 'Badge 7', type: 'badge', order: 7 },
    { id: 'bw-badge-8', label: 'Badge 8 — Opelucid (Dragon · Drayden/Iris)',   short: 'Badge 8', type: 'badge', order: 8 },
    { id: 'bw-champion', label: 'Elite Four & Champion — N Final Battle Won',  short: 'Elite 4', type: 'story', order: 9 },
  ],
  b2w2: [
    { id: 'b2w2-badge-1', label: 'Badge 1 — Aspertia (Normal · Cheren)',       short: 'Badge 1', type: 'badge', order: 1 },
    { id: 'b2w2-badge-2', label: 'Badge 2 — Virbank (Poison · Roxie)',         short: 'Badge 2', type: 'badge', order: 2 },
    { id: 'b2w2-badge-3', label: 'Badge 3 — Castelia (Bug · Burgh)',           short: 'Badge 3', type: 'badge', order: 3 },
    { id: 'b2w2-badge-4', label: 'Badge 4 — Nimbasa (Electric · Elesa)',       short: 'Badge 4', type: 'badge', order: 4 },
    { id: 'b2w2-badge-5', label: 'Badge 5 — Driftveil (Ground · Clay)',        short: 'Badge 5', type: 'badge', order: 5 },
    { id: 'b2w2-badge-6', label: 'Badge 6 — Mistralton (Flying · Skyla)',      short: 'Badge 6', type: 'badge', order: 6 },
    { id: 'b2w2-badge-7', label: 'Badge 7 — Humilau (Water · Marlon)',         short: 'Badge 7', type: 'badge', order: 7 },
    { id: 'b2w2-badge-8', label: 'Badge 8 — Opelucid (Dragon · Drayden)',      short: 'Badge 8', type: 'badge', order: 8 },
    { id: 'b2w2-champion', label: 'Elite Four & Champion · Unova League Cleared', short: 'Elite 4', type: 'story', order: 9 },
  ],
  xy: [
    { id: 'xy-badge-1', label: 'Badge 1 — Santalune (Bug · Viola)',         short: 'Badge 1', type: 'badge', order: 1 },
    { id: 'xy-badge-2', label: 'Badge 2 — Cyllage (Rock · Grant)',          short: 'Badge 2', type: 'badge', order: 2 },
    { id: 'xy-badge-3', label: 'Badge 3 — Shalour (Fighting · Korrina)',    short: 'Badge 3', type: 'badge', order: 3 },
    { id: 'xy-badge-4', label: 'Badge 4 — Coumarine (Grass · Ramos)',       short: 'Badge 4', type: 'badge', order: 4 },
    { id: 'xy-badge-5', label: 'Badge 5 — Lumiose (Electric · Clemont)',    short: 'Badge 5', type: 'badge', order: 5 },
    { id: 'xy-badge-6', label: 'Badge 6 — Laverre (Fairy · Valerie)',       short: 'Badge 6', type: 'badge', order: 6 },
    { id: 'xy-badge-7', label: 'Badge 7 — Anistar (Psychic · Olympia)',     short: 'Badge 7', type: 'badge', order: 7 },
    { id: 'xy-badge-8', label: 'Badge 8 — Snowbelle (Ice · Wulfric)',       short: 'Badge 8', type: 'badge', order: 8 },
    { id: 'xy-champion', label: 'Elite Four & Champion · Kalos League Cleared', short: 'Elite 4', type: 'story', order: 9 },
  ],
  sm: [
    { id: 'sm-grand-1', label: 'Grand Trial 1 — Melemele (Normal · Hala)',     short: 'Grand 1', type: 'story', order: 1 },
    { id: 'sm-grand-2', label: 'Grand Trial 2 — Akala (Water · Lana/Fire · Kiawe)', short: 'Grand 2', type: 'story', order: 2 },
    { id: 'sm-grand-3', label: 'Grand Trial 3 — Ula\u2019ula (Ghost · Nanu/Electric · Sophocles)', short: 'Grand 3', type: 'story', order: 3 },
    { id: 'sm-grand-4', label: 'Grand Trial 4 — Poni (Fairy · Mina/Dragon · Kommo-o)', short: 'Grand 4', type: 'story', order: 4 },
    { id: 'sm-champion', label: 'Elite Four & Champion — Alola League Cleared (First Run)', short: 'Elite 4', type: 'story', order: 5 },
  ],
  usum: [
    { id: 'usum-grand-1', label: 'Grand Trial 1 — Melemele (Normal · Hala)',      short: 'Grand 1', type: 'story', order: 1 },
    { id: 'usum-grand-2', label: 'Grand Trial 2 — Akala (Water · Lana/Fire · Kiawe)', short: 'Grand 2', type: 'story', order: 2 },
    { id: 'usum-grand-3', label: 'Grand Trial 3 — Ula\u2019ula (Dark · Nanu)',     short: 'Grand 3', type: 'story', order: 3 },
    { id: 'usum-grand-4', label: 'Grand Trial 4 — Poni (Dragon · Kommo-o)',       short: 'Grand 4', type: 'story', order: 4 },
    { id: 'usum-champion', label: 'Elite Four & Champion — Alola League Cleared', short: 'Elite 4', type: 'story', order: 5 },
  ],
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