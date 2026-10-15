import type { EvolutionRecord } from '../data/pokemonInventoryData';
import { ALL_CANONICAL_GAME_IDS } from '../data/pokemonData';
export function sanitizeEvolutionHistory(raw: unknown): EvolutionRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(r => {
    if (!r || typeof r !== 'object') return [];
    const validInt = (v: unknown, max: number) => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= max;
    if (!validInt(r.fromSpeciesId,1025) || !validInt(r.toSpeciesId,1025) || !validInt(r.fromLevel,100) || !validInt(r.toLevel,100) || !(ALL_CANONICAL_GAME_IDS as string[]).includes(r.gameId) || !Number.isFinite(r.evolvedAt)) return [];
    return [{ ...((ALL_CANONICAL_GAME_IDS as string[]).includes(r.previousGameId) ? { previousGameId: r.previousGameId } : {}), fromSpeciesId: r.fromSpeciesId, toSpeciesId: r.toSpeciesId, fromLevel: r.fromLevel, toLevel: r.toLevel, fromVariantId: String(r.fromVariantId).slice(0,32), toVariantId: String(r.toVariantId).slice(0,32), gameId: r.gameId, usedItem: Boolean(r.usedItem), itemName: String(r.itemName ?? '').slice(0,100), evolvedAt: r.evolvedAt }];
  });
}
