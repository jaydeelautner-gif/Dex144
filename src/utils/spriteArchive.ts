import { ITEM_SPRITE_SLICES, SPRITE_BLOB, type SpriteSlice } from '../data/spriteFiles.generated';

/**
 * All sprites ship as one binary file (`/sprites.bin`) with a byte-offset index
 * baked into the bundle. Individual sprites become object URLs on demand, which
 * keeps the repository to a single sprite asset (hosts with a file-count limit
 * reject thousands of loose files) while still working offline.
 */
let archiveRequest: Promise<ArrayBuffer | null> | null = null;

function loadArchive(): Promise<ArrayBuffer | null> {
  if (!archiveRequest) {
    archiveRequest = fetch(SPRITE_BLOB, { cache: 'force-cache' })
      .then((response) => (response.ok ? response.arrayBuffer() : null))
      .catch(() => null);
  }
  return archiveRequest;
}

const urlCache = new Map<string, string | null>();

/** Object URL for one sprite slice, or null when the archive is unavailable. */
export async function spriteUrl(slice: SpriteSlice | null | undefined): Promise<string | null> {
  if (!slice) return null;
  const key = `${slice.o}:${slice.l}`;
  if (urlCache.has(key)) return urlCache.get(key) ?? null;
  const buffer = await loadArchive();
  let url: string | null = null;
  if (buffer && slice.o >= 0 && slice.o + slice.l <= buffer.byteLength) {
    url = URL.createObjectURL(new Blob([buffer.slice(slice.o, slice.o + slice.l)], { type: 'image/png' }));
  }
  urlCache.set(key, url);
  return url;
}

/** Resolves a list of candidate slices in order; callers try them until one loads. */
export async function spriteUrls(slices: readonly (SpriteSlice | null | undefined)[]): Promise<(string | null)[]> {
  return Promise.all(slices.map(spriteUrl));
}

/** Frees every object URL created so far (used when the offline package changes). */
export function clearSpriteUrlCache(): void {
  for (const url of urlCache.values()) if (url) URL.revokeObjectURL(url);
  urlCache.clear();
  archiveRequest = null;
}

/** Object URL for an item sprite by its PokeAPI identifier, or null when unbundled. */
export function itemSpriteSlice(slug: string): SpriteSlice | null {
  return ITEM_SPRITE_SLICES[slug] ?? null;
}
export function hasItemSprite(slug: string): boolean {
  return Boolean(ITEM_SPRITE_SLICES[slug]);
}
export function itemSpriteUrl(slug: string): Promise<string | null> {
  return spriteUrl(ITEM_SPRITE_SLICES[slug]);
}
