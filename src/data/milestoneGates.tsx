/**
 * ─────────────────────────────────────────────────────────────────────────
 * MILESTONE GATES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Maps a national dex number to the milestone(s) that must be completed
 * before that Pokémon becomes catchable.
 *
 * RULES:
 *   • A Pokémon NOT listed here is treated as available from the start.
 *   • If a Pokémon has gates from multiple games (e.g. `['bdsp-badge-3',
 *     'swsh-badge-5']`), each gate is only enforced when its game is being
 *     tracked. See `getLockedDexNumbers()` — it filters by game prefix.
 *   • Gates reflect when a Pokémon becomes *practically* catchable, not
 *     just when its location technically appears on the map.
 *   • DLC-gated Pokémon use the appropriate DLC milestone, not a badge.
 *
 * GAMES + PREFIXES:
 *   sv    → Scarlet & Violet       sv-gym-*, sv-titan-*, sv-star-*, sv-champion, sv-dlc-teal, sv-dlc-indigo
 *   swsh  → Sword & Shield         swsh-badge-*, swsh-champion, swsh-ioa, swsh-ct
 *   pla   → Legends: Arceus        pla-rank-*, pla-noble-*
 *   bdsp  → BDSP                   bdsp-badge-*, bdsp-champion
 *   lgpe  → Let's Go               lgpe-badge-*, lgpe-champion
 *
 * HOW TO EXPAND:
 *   1. Look up the Pokémon's earliest encounter location on Bulbapedia.
 *   2. Find which gym/trial/story beat unlocks travel to that location.
 *   3. Add `dexNumber: ['gamePrefix-milestoneId']` below.
 *   4. If a Pokémon appears in multiple games, list every relevant gate.
 *
 * COVERAGE:
 *   Gen 1 (#0001–#0151) — fully covered below.
 *   Gen 2–9 — add incrementally following the same pattern.
 *
 * VERIFICATION NOTES:
 *   • BDSP Grand Underground spawns unlock at badge 2 (Eterna) but individual
 *     species can shift by biome. Gates below use badge 2 as the "Underground
 *     is open" floor, with badge 6+ for the rarest spawns.
 *   • PLA Space-Time Distortions unlock at Rank 6; distortion-only species
 *     (starters, fossils, Porygon, Lapras) are gated at rank 6.
 *   • SV DLC distribution is still settling — spot-check the Blueberry
 *     Academy dex for Indigo Disk Kanto returns.
 *   • LGPE badge floors follow classic Kanto progression; some areas can be
 *     reached early since HMs don't exist, but badges remain the practical
 *     progression marker.
 */
export const MILESTONE_GATES: Record<number, string[]> = {
  // ═══════════════════════════════════════════════════════════════════════
  // GEN 1 — KANTO (#0001–#0151)
  // ═══════════════════════════════════════════════════════════════════════

  // ── #0001–0009 — Starter lines (DLC / distortion locked in modern games) ──
  1:  ['swsh-ioa', 'pla-rank-6', 'sv-dlc-indigo'],   // Bulbasaur
  2:  ['swsh-ioa', 'pla-rank-6', 'sv-dlc-indigo'],   // Ivysaur
  3:  ['swsh-ioa', 'pla-rank-6', 'sv-dlc-indigo'],   // Venusaur
  4:  ['swsh-ioa', 'pla-rank-6', 'sv-dlc-indigo'],   // Charmander
  5:  ['swsh-ioa', 'pla-rank-6', 'sv-dlc-indigo'],   // Charmeleon
  6:  ['swsh-ioa', 'pla-rank-6', 'sv-dlc-indigo'],   // Charizard
  7:  ['swsh-ioa', 'pla-rank-6', 'sv-dlc-indigo'],   // Squirtle
  8:  ['swsh-ioa', 'pla-rank-6', 'sv-dlc-indigo'],   // Wartortle
  9:  ['swsh-ioa', 'pla-rank-6', 'sv-dlc-indigo'],   // Blastoise

  // ── #0010–0024 — Early bugs, birds, Rattata, Spearow ──
  // Ungated (badge 0 in every game that has them). Only notable exceptions:
  19: ['swsh-ioa'],                                  // Rattata (Kanto form via IoA)
  20: ['swsh-ioa'],                                  // Raticate
  23: ['lgpe-badge-3'],                              // Ekans (LGPE Eevee) Route 4+
  24: ['lgpe-badge-3'],                              // Arbok

  // ── #0025–0036 — Pikachu / Sandshrew / Nidorans / Clefairy ──
  27: ['lgpe-badge-3', 'bdsp-badge-2', 'swsh-ioa'],  // Sandshrew (Pikachu / Underground / IoA)
  28: ['lgpe-badge-3', 'bdsp-badge-2', 'swsh-ioa'],  // Sandslash
  35: ['swsh-badge-4'],                              // Clefairy (SwSh Wild Area mid-game)
  36: ['swsh-badge-4'],                              // Clefable

  // ── #0037–0040 — Vulpix / Jigglypuff ──
  37: ['lgpe-badge-3', 'bdsp-badge-3', 'swsh-ioa', 'sv-dlc-indigo'], // Vulpix
  38: ['lgpe-badge-3', 'bdsp-badge-3', 'swsh-ioa', 'sv-dlc-indigo'], // Ninetales

  // ── #0041–0045 — Zubat / Oddish ──
  43: ['lgpe-badge-2', 'swsh-badge-3'],              // Oddish
  44: ['lgpe-badge-2', 'swsh-badge-3'],              // Gloom
  45: ['lgpe-badge-2', 'swsh-badge-3'],              // Vileplume

  // ── #0046–0053 — Paras / Venonat / Diglett / Meowth ──
  46: ['lgpe-badge-2', 'bdsp-badge-2'],              // Paras
  47: ['lgpe-badge-2', 'bdsp-badge-2'],              // Parasect
  48: ['lgpe-badge-3', 'swsh-ioa'],                  // Venonat
  49: ['lgpe-badge-3', 'swsh-ioa'],                  // Venomoth
  50: ['lgpe-badge-3'],                              // Diglett (Diglett's Cave after Surge)
  51: ['lgpe-badge-3'],                              // Dugtrio
  52: ['lgpe-badge-3', 'swsh-badge-1', 'sv-dlc-indigo'], // Meowth
  53: ['lgpe-badge-3', 'swsh-badge-1', 'sv-dlc-indigo'], // Persian

  // ── #0054–0062 — Psyduck / Mankey / Growlithe / Poliwag ──
  54: ['lgpe-badge-2', 'swsh-badge-2', 'sv-gym-2'],  // Psyduck
  55: ['lgpe-badge-2', 'swsh-badge-2', 'sv-gym-2'],  // Golduck
  56: ['lgpe-badge-1', 'sv-gym-1'],                  // Mankey
  57: ['lgpe-badge-1', 'sv-gym-1'],                  // Primeape
  58: ['lgpe-badge-3', 'bdsp-badge-3', 'swsh-badge-2', 'sv-dlc-indigo'], // Growlithe
  59: ['lgpe-badge-3', 'bdsp-badge-3', 'swsh-badge-2', 'sv-dlc-indigo'], // Arcanine
  60: ['lgpe-badge-2', 'swsh-badge-2', 'sv-dlc-indigo'], // Poliwag
  61: ['lgpe-badge-2', 'swsh-badge-2', 'sv-dlc-indigo'], // Poliwhirl
  62: ['lgpe-badge-2', 'swsh-badge-2', 'sv-dlc-indigo'], // Poliwrath

  // ── #0063–0071 — Abra / Machop / Bellsprout ──
  63: ['lgpe-badge-2', 'swsh-badge-1', 'sv-gym-1'],  // Abra
  64: ['lgpe-badge-2', 'swsh-badge-1', 'sv-gym-1'],  // Kadabra
  65: ['lgpe-badge-2', 'swsh-badge-1', 'sv-gym-1'],  // Alakazam
  66: ['lgpe-badge-2', 'swsh-badge-2', 'sv-gym-2'],  // Machop
  67: ['lgpe-badge-2', 'swsh-badge-2', 'sv-gym-2'],  // Machoke
  68: ['lgpe-badge-2', 'swsh-badge-2', 'sv-gym-2'],  // Machamp
  69: ['lgpe-badge-2'],                              // Bellsprout (LGPE only)
  70: ['lgpe-badge-2'],                              // Weepinbell
  71: ['lgpe-badge-2'],                              // Victreebel

  // ── #0072–0082 — Tentacool / Geodude / Ponyta / Slowpoke / Magnemite ──
  72: ['lgpe-badge-4', 'swsh-badge-2', 'sv-gym-3'],  // Tentacool
  73: ['lgpe-badge-4', 'swsh-badge-2', 'sv-gym-3'],  // Tentacruel
  74: ['lgpe-badge-1', 'bdsp-badge-1', 'pla-rank-1'], // Geodude
  75: ['lgpe-badge-1', 'bdsp-badge-1', 'pla-rank-1'], // Graveler
  76: ['lgpe-badge-1', 'bdsp-badge-1', 'pla-rank-1'], // Golem
  77: ['lgpe-badge-2', 'swsh-badge-1', 'pla-rank-3'], // Ponyta
  78: ['lgpe-badge-2', 'swsh-badge-1', 'pla-rank-3'], // Rapidash
  79: ['lgpe-badge-4', 'swsh-ioa', 'sv-dlc-indigo'], // Slowpoke (Kanto form)
  80: ['lgpe-badge-4', 'swsh-ioa', 'sv-dlc-indigo'], // Slowbro
  81: ['lgpe-badge-3', 'swsh-badge-2', 'sv-gym-2', 'pla-rank-2'], // Magnemite
  82: ['lgpe-badge-3', 'swsh-badge-2', 'sv-gym-2', 'pla-rank-2'], // Magneton

  // ── #0083–0091 — Farfetch'd / Doduo / Seel / Grimer / Shellder ──
  83: ['lgpe-badge-2', 'swsh-badge-3', 'sv-dlc-indigo'], // Farfetch'd
  84: ['lgpe-badge-2', 'swsh-ioa'],                  // Doduo
  85: ['lgpe-badge-2', 'swsh-ioa'],                  // Dodrio
  86: ['lgpe-badge-6', 'swsh-ioa'],                  // Seel
  87: ['lgpe-badge-6', 'swsh-ioa'],                  // Dewgong
  88: ['lgpe-badge-7', 'swsh-ioa', 'pla-rank-4'],    // Grimer
  89: ['lgpe-badge-7', 'swsh-ioa', 'pla-rank-4'],    // Muk
  90: ['lgpe-badge-6', 'swsh-badge-3', 'sv-dlc-indigo'], // Shellder
  91: ['lgpe-badge-6', 'swsh-badge-3', 'sv-dlc-indigo'], // Cloyster

  // ── #0092–0101 — Gastly / Onix / Drowzee / Krabby / Voltorb ──
  92: ['lgpe-badge-2', 'swsh-badge-3', 'sv-gym-3'],  // Gastly
  93: ['lgpe-badge-2', 'swsh-badge-3', 'sv-gym-3'],  // Haunter
  94: ['lgpe-badge-2', 'swsh-badge-3', 'sv-gym-3'],  // Gengar
  95: ['lgpe-badge-2', 'bdsp-badge-1', 'swsh-badge-1'], // Onix
  96: ['lgpe-badge-2', 'swsh-ioa'],                  // Drowzee
  97: ['lgpe-badge-2', 'swsh-ioa'],                  // Hypno
  98: ['lgpe-badge-4', 'swsh-badge-3', 'sv-dlc-indigo'], // Krabby
  99: ['lgpe-badge-4', 'swsh-badge-3', 'sv-dlc-indigo'], // Kingler
  100: ['lgpe-badge-3', 'swsh-ioa', 'sv-gym-2', 'pla-rank-4'], // Voltorb
  101: ['lgpe-badge-3', 'swsh-ioa', 'sv-gym-2', 'pla-rank-4'], // Electrode

  // ── #0102–0111 — Exeggcute / Cubone / Hitmons / Lickitung / Koffing / Rhyhorn ──
  102: ['lgpe-badge-5', 'swsh-ioa', 'sv-gym-4'],     // Exeggcute (Safari Zone)
  103: ['lgpe-badge-5', 'swsh-ioa', 'sv-gym-4'],     // Exeggutor
  104: ['lgpe-badge-2', 'swsh-ioa', 'sv-dlc-indigo'], // Cubone
  105: ['lgpe-badge-2', 'swsh-ioa', 'sv-dlc-indigo'], // Marowak
  106: ['lgpe-badge-4', 'swsh-badge-3', 'sv-dlc-indigo'], // Hitmonlee
  107: ['lgpe-badge-4', 'swsh-badge-3', 'sv-dlc-indigo'], // Hitmonchan
  108: ['lgpe-badge-4', 'swsh-badge-3', 'sv-dlc-indigo'], // Lickitung
  109: ['lgpe-badge-5', 'swsh-badge-3', 'sv-dlc-indigo'], // Koffing
  110: ['lgpe-badge-5', 'swsh-badge-3', 'sv-dlc-indigo'], // Weezing
  111: ['lgpe-badge-5', 'swsh-badge-4', 'sv-gym-4', 'pla-rank-3'], // Rhyhorn

  // ── #0112–0124 — Rhydon / Chansey / Tangela / Kangaskhan / Horsea / Goldeen / Staryu / Mr. Mime / Scyther / Jynx ──
  112: ['lgpe-badge-5', 'swsh-badge-4', 'sv-gym-4', 'pla-rank-3'], // Rhydon
  113: ['lgpe-badge-5', 'swsh-badge-4', 'sv-dlc-indigo'], // Chansey
  114: ['lgpe-badge-5', 'swsh-ioa', 'sv-dlc-indigo'], // Tangela
  115: ['lgpe-badge-5', 'swsh-ioa', 'sv-dlc-indigo'], // Kangaskhan
  116: ['lgpe-badge-4', 'swsh-badge-3', 'sv-dlc-indigo'], // Horsea
  117: ['lgpe-badge-4', 'swsh-badge-3', 'sv-dlc-indigo'], // Seadra
  118: ['lgpe-badge-4', 'swsh-badge-3', 'sv-gym-3', 'pla-rank-2'], // Goldeen
  119: ['lgpe-badge-4', 'swsh-badge-3', 'sv-gym-3', 'pla-rank-2'], // Seaking
  120: ['lgpe-badge-6', 'swsh-badge-4', 'sv-dlc-indigo', 'pla-rank-3'], // Staryu
  121: ['lgpe-badge-6', 'swsh-badge-4', 'sv-dlc-indigo', 'pla-rank-3'], // Starmie
  122: ['lgpe-badge-3', 'swsh-badge-3', 'sv-dlc-indigo', 'pla-rank-3'], // Mr. Mime
  123: ['lgpe-badge-5', 'swsh-badge-3', 'sv-dlc-indigo', 'pla-rank-2'], // Scyther
  124: ['lgpe-badge-7', 'swsh-badge-4', 'sv-dlc-indigo'], // Jynx

  // ── #0125–0136 — Electabuzz / Magmar / Pinsir / Tauros / Magikarp / Lapras / Ditto / Eevee line ──
  125: ['lgpe-badge-8', 'swsh-badge-3', 'sv-dlc-indigo', 'pla-rank-4'], // Electabuzz
  126: ['lgpe-badge-8', 'swsh-badge-3', 'sv-dlc-indigo', 'pla-rank-4'], // Magmar
  127: ['lgpe-badge-5', 'swsh-ioa', 'sv-dlc-indigo'], // Pinsir
  128: ['lgpe-badge-5', 'swsh-ioa', 'sv-gym-2', 'pla-rank-2'], // Tauros
  129: ['lgpe-badge-2', 'swsh-badge-1', 'sv-gym-1', 'pla-rank-1'], // Magikarp
  130: ['lgpe-badge-2', 'swsh-badge-1', 'sv-gym-1', 'pla-rank-1'], // Gyarados
  131: ['lgpe-badge-7', 'swsh-badge-6', 'sv-gym-6', 'pla-rank-6'], // Lapras
  132: ['lgpe-badge-7', 'swsh-badge-4', 'sv-gym-4', 'pla-rank-3'], // Ditto
  133: ['lgpe-badge-3', 'swsh-badge-1', 'sv-gym-1', 'pla-rank-1'], // Eevee
  134: ['lgpe-badge-3', 'swsh-badge-1', 'sv-gym-1', 'pla-rank-1'], // Vaporeon
  135: ['lgpe-badge-3', 'swsh-badge-1', 'sv-gym-1', 'pla-rank-1'], // Jolteon
  136: ['lgpe-badge-3', 'swsh-badge-1', 'sv-gym-1', 'pla-rank-1'], // Flareon

  // ── #0137–0143 — Porygon / Fossils / Aerodactyl / Snorlax ──
  137: ['lgpe-badge-3', 'swsh-ioa', 'sv-dlc-indigo', 'pla-rank-6'], // Porygon
  138: ['lgpe-badge-7', 'swsh-ct', 'sv-dlc-indigo', 'pla-rank-6'], // Omanyte
  139: ['lgpe-badge-7', 'swsh-ct', 'sv-dlc-indigo', 'pla-rank-6'], // Omastar
  140: ['lgpe-badge-7', 'swsh-ct', 'sv-dlc-indigo', 'pla-rank-6'], // Kabuto
  141: ['lgpe-badge-7', 'swsh-ct', 'sv-dlc-indigo', 'pla-rank-6'], // Kabutops
  142: ['lgpe-badge-7', 'swsh-ct', 'sv-dlc-indigo', 'pla-rank-6'], // Aerodactyl
  143: ['lgpe-badge-5', 'swsh-badge-4', 'sv-gym-3', 'pla-rank-2'], // Snorlax

  // ── #0144–0151 — Legendary birds / Dratini line / Mewtwo / Mew ──
  144: ['lgpe-badge-7', 'bdsp-champion', 'swsh-ct', 'sv-dlc-indigo'], // Articuno
  145: ['lgpe-champion', 'bdsp-champion', 'swsh-ct', 'sv-dlc-indigo'], // Zapdos
  146: ['lgpe-badge-8', 'bdsp-champion', 'swsh-ct', 'sv-dlc-indigo'], // Moltres
  147: ['lgpe-badge-5', 'swsh-ioa', 'sv-dlc-indigo', 'pla-rank-6'], // Dratini
  148: ['lgpe-badge-5', 'swsh-ioa', 'sv-dlc-indigo', 'pla-rank-6'], // Dragonair
  149: ['lgpe-badge-5', 'swsh-ioa', 'sv-dlc-indigo', 'pla-rank-6'], // Dragonite
  150: ['lgpe-champion', 'bdsp-champion', 'swsh-ct', 'sv-dlc-indigo'], // Mewtwo
  151: ['lgpe-champion', 'bdsp-champion', 'swsh-champion', 'sv-champion', 'pla-champion'], // Mew (event-only)

  // ═══════════════════════════════════════════════════════════════════════
  // GEN 2+ — Add incrementally following the same pattern.
  //
  // The entries below are the Pokémon currently appearing in HomeDex's
  // Dex Suggestions list, kept here so nothing regresses as you expand.
  // ═══════════════════════════════════════════════════════════════════════

  // ── Scarlet & Violet (non-Kanto suggestions) ──
  672: ['sv-gym-1'],                 // Skiddo — South Province (Area Two)
  969: ['sv-titan-3'],               // Glimmet — Glaseado Mountain
  975: ['sv-gym-7'],                 // Cetitan — Glaseado Mountain
  607: ['sv-gym-3'],                 // Litwick — West Province (Area One)
  984: ['sv-titan-4', 'sv-gym-6'],   // Great Tusk — Area Zero

  // ── Sword & Shield (non-Kanto suggestions) ──
  530: ['swsh-badge-5'],             // Excadrill — Giant's Mirror / Dusty Bowl
  538: ['swsh-badge-6'],             // Throh — Route 9 Circhester Bay
  884: ['swsh-badge-7'],             // Duraludon — Giant's Mirror / Dusty Bowl

  // ── Legends: Arceus (non-Kanto suggestions) ──
  // (Electrode #101 already gated above with a broader gate list)
};

// ═══════════════════════════════════════════════════════════════════════
// DERIVED LOOKUPS
// ═══════════════════════════════════════════════════════════════════════

/** Reverse index: milestoneId -> sorted list of dex numbers unlocked at that milestone. */
export const MILESTONE_TO_SPECIES: Map<string, number[]> = (() => {
  const map = new Map<string, number[]>();
  for (const [dexStr, milestoneIds] of Object.entries(MILESTONE_GATES)) {
    const dexNum = Number(dexStr);
    for (const mId of milestoneIds) {
      const list = map.get(mId) ?? [];
      list.push(dexNum);
      map.set(mId, list);
    }
  }
  map.forEach((list) => list.sort((a, b) => a - b));
  return map;
})();

/** Reverse index: gameId -> Map<milestoneId, number[]> for that game only. */
export const GAME_MILESTONE_TO_SPECIES: Map<string, Map<string, number[]>> = (() => {
  const byGame = new Map<string, Map<string, number[]>>();
  for (const [mId, dexNums] of MILESTONE_TO_SPECIES) {
    const gameId = mId.split('-')[0];
    if (!byGame.has(gameId)) byGame.set(gameId, new Map());
    byGame.get(gameId)!.set(mId, dexNums);
  }
  return byGame;
})();

// ═══════════════════════════════════════════════════════════════════════
// QUERY HELPERS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Given a completed milestone set and a specific game, return the set of
 * dex numbers that are currently locked for that game.
 *
 * A Pokémon is locked for `gameId` if:
 *   1. It has at least one gate belonging to that game, AND
 *   2. Not all of that game's gates for it are satisfied.
 *
 * Gates from other games are ignored — so a Pokémon reachable in SV won't
 * be marked locked just because it's behind a badge in SwSh.
 */
export function getLockedDexNumbers(
  completedMilestones: Set<string>,
  gameId: string
): Set<number> {
  const locked = new Set<number>();
  const gamePrefix = `${gameId}-`;

  for (const [dexStr, requiredIds] of Object.entries(MILESTONE_GATES)) {
    const dexNum = Number(dexStr);
    const relevant = requiredIds.filter((id) => id.startsWith(gamePrefix));
    if (relevant.length === 0) continue;

    const allMet = relevant.every((id) => completedMilestones.has(id));
    if (!allMet) locked.add(dexNum);
  }
  return locked;
}

/**
 * Given a game and the completed-milestone sets before and after a change,
 * return dex numbers that just became unlocked. Useful for "you just
 * unlocked X new catches!" toasts.
 */
export function getNewlyUnlockedSpecies(
  gameId: string,
  previousCompleted: Set<string>,
  nextCompleted: Set<string>
): number[] {
  const previouslyLocked = getLockedDexNumbers(previousCompleted, gameId);
  const currentlyLocked = getLockedDexNumbers(nextCompleted, gameId);
  const newlyUnlocked: number[] = [];
  previouslyLocked.forEach((dexNum) => {
    if (!currentlyLocked.has(dexNum)) newlyUnlocked.push(dexNum);
  });
  return newlyUnlocked.sort((a, b) => a - b);
}

/**
 * Total number of species gated behind each game. Useful for a Settings
 * stat like "SV has 47 species gated by story progress."
 */
export const GATED_SPECIES_COUNT_BY_GAME: Record<string, number> = (() => {
  const counts: Record<string, number> = {};
  for (const requiredIds of Object.values(MILESTONE_GATES)) {
    const gamesTouched = new Set(requiredIds.map((id) => id.split('-')[0]));
    gamesTouched.forEach((g) => {
      counts[g] = (counts[g] ?? 0) + 1;
    });
  }
  return counts;
})();