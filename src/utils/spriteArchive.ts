import {
  ITEM_SPRITE_SLICES,
  SPRITE_BLOB,
  SPRITE_FILES,
  FORM_ID_SPRITE_FILES,
  COLOR_SPRITE_FILES,
  FORM_SPRITE_FILES,
  FEMALE_SPRITE_FILES,
  type SpriteSlice,
} from '../data/spriteFiles.generated';

/**
 * All sprites ship as one binary file (`/sprites.bin`) with a byte-offset index
 * baked into the bundle. Individual sprites become object URLs on demand, which
 * keeps the repository to a single sprite asset (hosts with a file-count limit
 * reject thousands of loose files) while still working offline.
 */
let archiveRequest: Promise<ArrayBuffer | null> | null = null;

/**
 * Highest indexed byte in the bundle. A served archive shorter than this is a
 * stale or truncated deployment, so it is retried instead of trusted.
 */
const REQUIRED_ARCHIVE_BYTES = (() => {
  let max = 0;
  const consider = (slice: SpriteSlice | null | undefined) => {
    if (slice && slice.o + slice.l > max) max = slice.o + slice.l;
  };
  for (const entry of Object.values(ITEM_SPRITE_SLICES)) consider(entry);
  for (const entry of Object.values(SPRITE_FILES)) { consider(entry.normal); consider(entry.shiny); }
  for (const entry of Object.values(FORM_ID_SPRITE_FILES)) { consider(entry.normal); consider(entry.shiny); }
  for (const entry of Object.values(COLOR_SPRITE_FILES)) { consider(entry.normal); consider(entry.shiny); }
  for (const entry of Object.values(FORM_SPRITE_FILES)) consider(entry);
  for (const entry of Object.values(FEMALE_SPRITE_FILES)) consider(entry);
  return max;
})();

function loadArchive(): Promise<ArrayBuffer | null> {
  if (!archiveRequest) {
    archiveRequest = (async () => {
      // The archive is large, so retry before giving up: a single transient
      // failure must not blank out every sprite for the whole session.
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await fetch(SPRITE_BLOB, { cache: attempt === 1 ? 'force-cache' : 'reload' });
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            // A partial or truncated deploy would silently blank out the later
            // sprites (their slices fall past the end), so validate the size.
            if (buffer.byteLength >= REQUIRED_ARCHIVE_BYTES) return buffer;
            console.warn(`Sprite archive is ${buffer.byteLength} bytes but ${REQUIRED_ARCHIVE_BYTES} are indexed. Retrying with a fresh download.`);
          }
        } catch { /* retry */ }
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
      // Allow a later call (a new sprite render) to try again.
      archiveRequest = null;
      return null;
    })();
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
  // Only remember successes; a failure must be retried on the next render.
  if (url) urlCache.set(key, url);
  return url;
}

/** Resolves a list of candidate slices in order; callers try them until one loads. */
export async function spriteUrls(slices: readonly (SpriteSlice | null | undefined)[]): Promise<(string | null)[]> {
  return Promise.all(slices.map(spriteUrl));
}

/**
 * Frees every object URL created so far. Object URLs pin their blob in memory,
 * so this is available for cache resets; the archive itself is kept, because
 * re-reading the big binary is far more expensive than rebuilding a slice.
 */
export function clearSpriteUrlCache(): void {
  for (const url of urlCache.values()) if (url) URL.revokeObjectURL(url);
  urlCache.clear();
}

/** Starts the archive download early; safe to call repeatedly. */
export function prefetchSpriteArchive(): void {
  void loadArchive();
}

/** True when the archive contains a sprite for this item identifier. */
export function hasItemSprite(slug: string): boolean {
  return Boolean(ITEM_SPRITE_SLICES[slug]);
}

export function itemSpriteUrl(slug: string): Promise<string | null> {
  return spriteUrl(ITEM_SPRITE_SLICES[slug]);
}
