import { STARTER_TRIOS, GROUP_MEMBER_GAMES, GAME_ID_TO_TRACKABLE } from '../data/milestones';
import { getEvolutionFamilyForPokemon } from '../data/pokemonEvolutionData';
import { prettyEncounterMethod, type EncounterDataset } from '../data/encountersData';
import type { GameId, DlcId } from '../data/pokemonData';

/**
 * Starter-alternate acquisition logic.
 *
 * When a trainer chooses one of a game group's starters, the other starters
 * (and their evolution lines) can no longer be obtained from the game's own
 * starter gift. Unless that game offers another in-game way to get them
 * (max-raid dens, overworld spawns, island scans, in-game trades, DLC
 * returns…), they are only receivable by trading with a player who chose
 * (or has) a different starter.
 */

/** Encounter methods that represent the game's own starter gift — NOT an
 *  alternate way to get a starter you didn't pick. */
const STARTER_GIFT_METHODS = new Set(['gift', 'gift-egg']);

/** Known in-game ways to get unchosen starters that the PokéAPI encounter
 *  bundle doesn't record (or no longer records). Keyed by trackable group. */
const CURATED_IN_GAME_WAYS: Record<string, Record<number, { how: string; dlcId?: DlcId }>> = {
  // Isle of Armor raid dens offer all three Galar starter lines.
  swsh: {
    810: { how: 'Max Raid Dens on the Isle of Armor', dlcId: 'swsh-isle-of-armor' },
    813: { how: 'Max Raid Dens on the Isle of Armor', dlcId: 'swsh-isle-of-armor' },
    816: { how: 'Max Raid Dens on the Isle of Armor', dlcId: 'swsh-isle-of-armor' },
  },
};

/** Standard evolution chains for every starter line, keyed by the base
 *  starter. The curated evolution-family data only covers Gen 1 in depth, so
 *  starter-line logic uses this table for later generations. */
const STARTER_LINE_CHAINS: Record<number, number[]> = {
  1: [1, 2, 3], 4: [4, 5, 6], 7: [7, 8, 9],
  152: [152, 153, 154], 155: [155, 156, 157], 158: [158, 159, 160],
  252: [252, 253, 254], 255: [255, 256, 257], 258: [258, 259, 260],
  387: [387, 388, 389], 390: [390, 391, 392], 393: [393, 394, 395],
  495: [495, 496, 497], 498: [498, 499, 500], 501: [501, 502, 503],
  650: [650, 651, 652], 653: [653, 654, 655], 656: [656, 657, 658],
  722: [722, 723, 724], 725: [725, 726, 727], 728: [728, 729, 730],
  810: [810, 811, 812], 813: [813, 814, 815], 816: [816, 817, 818],
  906: [906, 907, 908], 909: [909, 910, 911], 912: [912, 913, 914],
};

/** All species ids of a starter's evolution line containing the given
 *  species (any stage); null when the species isn't in a known chain. */
function starterLineOf(starterId: number): number[] | null {
  for (const chain of Object.values(STARTER_LINE_CHAINS)) {
    if (chain.includes(starterId)) return chain;
  }
  return null;
}

/**
 * Map a saved starter choice onto the trio member whose line contains it.
 * Older save data may store a mid-evolution id (e.g. 907 instead of the
 * real starter 906); normalizing keeps line logic and display correct.
 * Returns undefined when there's no trio or no matching member.
 */
export function normalizeStarterChoiceId(
  group: string | undefined,
  chosenId: number | undefined
): number | undefined {
  if (!group || chosenId == null) return undefined;
  const trio = STARTER_TRIOS[group] ?? [];
  if (trio.includes(chosenId)) return chosenId;
  for (const member of trio) {
    if (starterLineOf(member)?.includes(chosenId)) return member;
  }
  return undefined;
}

/** The base form of a species' evolution line, preferring starter chains. */
function lineBaseId(pokemonId: number): number {
  for (const chain of Object.values(STARTER_LINE_CHAINS)) {
    const idx = chain.indexOf(pokemonId);
    if (idx > 0) return chain[0];
  }
  const family = getEvolutionFamilyForPokemon(pokemonId);
  return family.stages[0]?.pokemonId ?? pokemonId;
}

/**
 * Species ids in the full evolution lines (base + all stages) of the
 * unchosen starters of a group. Empty when the group has no starter trio
 * or no starter has been chosen yet.
 */
export function getUnchosenStarterLineIds(
  group: string | undefined,
  chosenStarterId: number | undefined
): number[] {
  if (!group || chosenStarterId == null) return [];
  const trio = STARTER_TRIOS[group] ?? [];
  const ids: number[] = [];
  for (const starterId of trio) {
    if (starterId === chosenStarterId) continue;
    const chain = starterLineOf(starterId);
    if (chain) {
      ids.push(...chain);
      continue;
    }
    const family = getEvolutionFamilyForPokemon(starterId);
    for (const stage of family.stages) ids.push(stage.pokemonId);
  }
  return ids;
}

/** A direct non-gift way recorded in the encounter bundle for this species. */
function findEncounterAlternate(
  pokemonId: number,
  members: GameId[],
  encounters: EncounterDataset | null
): string | null {
  if (!encounters) return null;
  for (const game of members) {
    const byArea = encounters[String(pokemonId)]?.[game];
    if (!byArea) continue;
    const methods = new Set<string>();
    for (const rows of Object.values(byArea)) {
      for (const row of rows) methods.add(row.m);
    }
    for (const method of methods) {
      if (!STARTER_GIFT_METHODS.has(method)) {
        return `Obtainable in-game via ${prettyEncounterMethod(method)}`;
      }
    }
  }
  return null;
}

/** DLC-based availability in the group's games (e.g. the Indigo Disk's
 *  Terarium returns Kanto starters in SV). 'base' availability is the
 *  starter gift itself — deliberately NOT an alternate. */
function findAvailabilityAlternate(
  availability: StarterAvailability,
  members: GameId[],
  ownedDlcs: DlcId[]
): string | null {
  for (const game of members) {
    const av = availability[game];
    if (!av || av.status === 'transfer_only' || av.status === 'unavailable') continue;
    if (av.status === 'dlc') {
      const base = `Catchable via ${av.dlcName ?? 'the game\u2019s DLC expansion'} (${av.whereToFind})`;
      return av.dlcId && ownedDlcs.includes(av.dlcId) ? base : `${base} — DLC not owned`;
    }
  }
  return null;
}

/** Curated known ways not present in the encounter bundle. */
function findCuratedAlternate(
  group: string,
  pokemonId: number,
  ownedDlcs: DlcId[]
): string | null {
  const entry = CURATED_IN_GAME_WAYS[group]?.[pokemonId];
  if (!entry) return null;
  if (entry.dlcId && !ownedDlcs.includes(entry.dlcId)) {
    return `${entry.how} (requires the DLC)`;
  }
  return entry.how;
}

type StarterAvailability = Record<GameId, { status: string; requiresDlc?: boolean; dlcId?: DlcId; dlcName?: string; whereToFind: string }>;

/**
 * For a species in an unchosen starter line, find an alternate way the game
 * itself offers to obtain it. Checks, in order:
 *   1. the species' own encounter rows (non-gift methods),
 *   2. curated known ways for the group,
 *   3. DLC availability in the group's games,
 *   4. its line's base form (if the base is obtainable in-game, evolving it
 *      is a way to get this stage).
 * Returns a display label, or null when the only way is trading with
 * another player.
 *
 * `getAvailability` supplies the per-game availability record for any species
 * id (pass a dex lookup); required for the line-base fallback.
 */
export function findAlternateAcquisitionLabel(
  pokemonId: number,
  group: string,
  encounters: EncounterDataset | null,
  ownedDlcs: DlcId[],
  getAvailability?: (id: number) => StarterAvailability | undefined
): string | null {
  const members = (GROUP_MEMBER_GAMES[group] ?? []) as GameId[];

  const self = findEncounterAlternate(pokemonId, members, encounters)
    ?? findCuratedAlternate(group, pokemonId, ownedDlcs)
    ?? (getAvailability
      ? findAvailabilityAlternate(getAvailability(pokemonId) as StarterAvailability, members, ownedDlcs)
      : null);
  if (self) return self;

  // Evolutions: if the line's base form is obtainable in this game, the
  // species is obtainable by evolving it.
  const baseId = lineBaseId(pokemonId);
  if (baseId && baseId !== pokemonId) {
    const baseWay =
      findEncounterAlternate(baseId, members, encounters) ??
      findCuratedAlternate(group, baseId, ownedDlcs) ??
      (getAvailability
        ? findAvailabilityAlternate(getAvailability(baseId) as StarterAvailability, members, ownedDlcs)
        : null);
    if (baseWay) return `${baseWay} — then evolve`;
  }

  return null;
}

/**
 * Species that must NOT be presented as an obtainable wild/start encounter for
 * a game: the unchosen starter lines when that game offers no other way to get
 * them.
 *
 * Picking one starter consumes the game's only starter gift. In every main
 * series group except the ones below, the other two starters are therefore
 * unlockable only by trading with another player:
 *   • LGPE  — all three Kanto starters appear as overworld spawns.
 *   • PLA   — the others have recorded Space-Time Distortion encounters.
 *   • SwSh  — the Galar starters return in Isle of Armor Max Raid dens (DLC).
 * Those are detected from the encounter bundle and the curated table rather than
 * hard-coded here, so the rule stays correct if the data gains a new source.
 */
export function getLockedStarterLineIds(
  gameId: GameId,
  chosenStarterId: number | undefined,
  encounters: EncounterDataset | null,
  ownedDlcs: DlcId[],
  getAvailability?: (id: number) => StarterAvailability | undefined
): number[] {
  const group = GAME_ID_TO_TRACKABLE[gameId];
  if (!group || chosenStarterId == null) return [];
  const unchosen = getUnchosenStarterLineIds(
    group,
    normalizeStarterChoiceId(group, chosenStarterId)
  );
  return unchosen.filter(
    (id) => {
      const how = findAlternateAcquisitionLabel(id, group, encounters, ownedDlcs, getAvailability);
      if (!how) return true; // no other way at all → trade-only
      // A way that only exists through an expansion the player does not own is
      // not available to them yet, so the starter still counts as locked.
      return /requires the DLC|DLC not owned/.test(how);
    }
  );
}
