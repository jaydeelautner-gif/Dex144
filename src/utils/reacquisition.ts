import type { EncounterDataset } from '../data/encountersData';
import type { GameId, PokemonEntry } from '../data/pokemonData';
import type { PokemonInstance } from '../data/pokemonInventoryData';
import { evolvedAwaySpecies } from './pokepetEvolution';
import { prettifyAreaName, prettyEncounterMethod, prettyEncounterWantedSpecies } from '../data/encountersData';
const NON_WILD = new Set(['gift', 'gift-egg', 'trade', 'npc-trade', 'colosseum-bonus-disc-jpn', 'colosseum-bonus-disc-us', 'pokemon-channel-pal']);
export function hasRecordedWildEncounter(dataset: EncounterDataset | null, id: number, game: GameId): boolean {
  return Object.values(dataset?.[id]?.[game] ?? {}).some(rows => rows.some(r => !NON_WILD.has(r.m)));
}
export function reacquisitionHint(dataset: EncounterDataset | null, id: number, game: GameId): string {
  if (!dataset) return 'Uncaught after evolution. Loading recorded acquisition methods…';
  const areas = dataset[id]?.[game];
  const wild = Object.entries(areas ?? {}).filter(([, rows]) => rows.some(r => !NON_WILD.has(r.m)));
  if (wild.length) return `Uncaught after evolution — wild reacquisition recorded: ${wild.slice(0,3).map(([area, rows]) => `${prettifyAreaName(area)} (${[...new Set(rows.filter(r => !NON_WILD.has(r.m)).map(r => prettyEncounterMethod(r.m)))].join(', ')})`).join('; ')}. Check levels/conditions below.`;
  // In-game NPC trades: name what the NPC asks for, so the trainer knows what
  // to bring. (Player-to-player trades are only mentioned generically.)
  const wants = new Set<string>();
  for (const rows of Object.values(areas ?? {})) {
    for (const row of rows) {
      if (row.m !== 'npc-trade') continue;
      for (const cond of row.cd ?? []) {
        if (!cond.startsWith('trade-')) continue;
        if (cond === 'trade-any-pokemon') wants.add('any Pokémon');
        else wants.add(prettyEncounterWantedSpecies(cond.slice('trade-'.length)));
      }
    }
  }
  const tradeHint = wants.size
    ? `an in-game NPC trade is recorded (NPC wants: ${[...wants].join(' or ')})`
    : Object.values(areas ?? {}).some(rows => rows.some(r => r.m === 'trade'))
      ? 'a trade is recorded'
      : '';
  return `Uncaught after evolution — no wild reacquisition is recorded in this game${tradeHint ? `; ${tradeHint}` : ''}. Trade with another trainer, or use breeding/evolution if supported for this species in this game. A used one-off starter gift cannot be claimed again; check any other gift/event requirements. Missing encounter coverage is not proof that no other route exists.`;
}

/** Collection-specific overlay, never changes the immutable source dataset.
 * A consumed single-use gift is not presented as a fresh wild catch again. */
export function applyEvolutionAcquisitionHints(dex: PokemonEntry[], inventory: PokemonInstance[], dataset: EncounterDataset | null): PokemonEntry[] {
  const games = new Set(inventory.flatMap(p => (p.evolutionHistory ?? []).flatMap(e => [e.gameId, ...(e.previousGameId ? [e.previousGameId] : [])])));
  if (!games.size) return dex;
  const covered = new Set(Object.values(dataset ?? {}).flatMap(g => Object.keys(g)));
  const updates = new Map<number, Map<GameId, string>>();
  for (const game of games) for (const id of evolvedAwaySpecies(inventory, game)) {
    if (!updates.has(id)) updates.set(id, new Map());
    updates.get(id)!.set(game, reacquisitionHint(dataset, id, game));
  }
  return dex.map(p => {
    const hints = updates.get(p.id); if (!hints) return p;
    const availability = { ...p.availability };
    for (const [game, note] of hints) {
      if (!availability[game]) continue;
      const mode = !dataset || !covered.has(game) ? 'unverified' : hasRecordedWildEncounter(dataset, p.id, game) ? 'wild' : 'trade_or_other';
      availability[game] = { ...availability[game], whereToFind: note, acquisitionMethod: note, pokedexCompletionGuide: note, reacquisitionMode: mode };
    }
    return { ...p, availability };
  });
}
