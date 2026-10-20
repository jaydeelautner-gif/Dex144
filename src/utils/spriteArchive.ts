import {
  COLOR_SPRITE_FILES,
  FEMALE_SPRITE_FILES,
  FORM_ID_SPRITE_FILES,
  FORM_SPRITE_FILES,
  ITEM_SPRITE_SLICES,
  SPRITE_BLOB,
  SPRITE_FILES,
  type SpriteSlice,
} from '../data/spriteFiles.generated';

/**
 * All sprites ship as one binary file (`/sprites.bin`) with a byte-offset index
 * baked into the bundle. Individual sprites become object URLs on demand, which
 * keeps the repository to a single sprite asset (hosts with a file-count limit
 * reject thousands of loose files) while still working offline.
 */

/** Every index map the app can have; later ones may be absent in older bundles. */
const SLICE_MAPS: Record<string, unknown>[] = [
  SPRITE_FILES as unknown as Record<string, SpriteSlice>,
  ITEM_SPRITE_SLICES,
  COLOR_SPRITE_FILES,
  FEMALE_SPRITE_FILES,
  FORM_ID_SPRITE_FILES,
  FORM_SPRITE_FILES,
];

/** Flattens a map's values into slices (maps may be flat or nested one level). */
function* eachSlice(map: Record<string, unknown>): Generator<SpriteSlice> {
  for (const value of Object.values(map)) {
    if (value && typeof value === 'object' && 'o' in value) yield value as SpriteSlice;
    else if (value && typeof value === 'object') for (const slice of Object.values(value)) if (slice && typeof slice === 'object' && 'o' in slice) yield slice as SpriteSlice;
  }
}

/** The size every slice needs the archive to be, and how many there are. */
const REQUIRED_ARCHIVE_BYTES = (() => {
  let max = 0;
  for (const map of SLICE_MAPS) for (const slice of eachSlice(map)) max = Math.max(max, slice.o + slice.l);
  return max;
})();

const ARCHIVE_VERSION = (() => {
  let sliceCount = 0;
  let sliceSum = 0;
  for (const map of SLICE_MAPS) for (const slice of eachSlice(map)) { sliceCount += 1; sliceSum = (sliceSum + slice.o + slice.l) >>> 0; }
  return `v${REQUIRED_ARCHIVE_BYTES}-${sliceCount}-${sliceSum}`;
})();

/** The earliest slice in the archive — it must start with the PNG signature. */
const FIRST_SLICE = (() => {
  let first: SpriteSlice | null = null;
  for (const map of SLICE_MAPS) for (const slice of eachSlice(map)) if (!first || slice.o < first.o) first = slice;
  return first;
})();

// The build version rides along so the service worker can tell whether a
// device-pinned offline package belongs to the running build. Old package
// bytes + new slice offsets would render wrong/no sprites, so a mismatched
// package must never satisfy an archive request.
declare const __OFFLINE_BUILD_VERSION__: string;
const RUNNING_BUILD_VERSION: string = typeof __OFFLINE_BUILD_VERSION__ === 'undefined'
  ? 'development'
  : __OFFLINE_BUILD_VERSION__;
const ARCHIVE_URL = `${SPRITE_BLOB}?${ARCHIVE_VERSION}&b=${encodeURIComponent(RUNNING_BUILD_VERSION)}`;

/** The archive is a plain concatenation of PNGs, so it must start with the PNG signature. */
function startsWithPngSignature(buffer: ArrayBuffer): boolean {
  if (!FIRST_SLICE) return false;
  const head = new Uint8Array(buffer, FIRST_SLICE.o, 4);
  return head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
}

let archiveRequest: Promise<ArrayBuffer | null> | null = null;

function loadArchive(): Promise<ArrayBuffer | null> {
  if (!archiveRequest) {
    archiveRequest = (async () => {
      // The archive is large, so retry before giving up: a single transient
      // failure must not blank out every sprite for the whole session.
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await fetch(ARCHIVE_URL, { cache: attempt === 1 ? 'force-cache' : 'reload' });
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            // Every indexed slice must fit in the archive. A short response is
            // a truncated or stale deploy (the layout changed under the same
            // URL before, which silently corrupted sprites), so both cases are
            // retried rather than trusted.
            const fits = buffer.byteLength >= REQUIRED_ARCHIVE_BYTES && startsWithPngSignature(buffer);
            if (fits) return buffer;
            console.warn(
              `Sprite archive is ${buffer.byteLength} bytes, expected at least ${REQUIRED_ARCHIVE_BYTES} ` +
                '(with PNG data). Retrying with a fresh download.',
            );
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

/** Object URL for an item sprite by its PokeAPI identifier, or null when unbundled. */
export function itemSpriteUrl(slug: string): Promise<string | null> {
  return spriteUrl(ITEM_SPRITE_SLICES[slug]);
}
