import {
  SPRITE_FILES,
  FORM_SPRITE_FILES,
  FORM_ID_SPRITE_FILES,
  COLOR_SPRITE_FILES,
  FEMALE_SPRITE_FILES,
  type SpriteSlice,
} from '../data/spriteFiles.generated';

/**
 * Sprite candidates for a species, in order of preference. Every candidate is a
 * slice of the bundled `/sprites.bin`, so no artwork is ever fetched from an
 * external host. Candidates are tried until one renders.
 */
export function spriteSources(id: number, shiny = false, imageUrl?: string): SpriteSlice[] {
  const out: SpriteSlice[] = [];
  if (imageUrl) {
    const cleanUrl = imageUrl.replace(/^https?:\/\/[^/]+/, '');
    const mapped = FORM_SPRITE_FILES[imageUrl] ?? FORM_SPRITE_FILES[cleanUrl];
    if (mapped) out.push(mapped);
    if (imageUrl.includes('/female/') || imageUrl.endsWith('-female.png')) {
      const match = imageUrl.match(/\/(\d+)(?:-female)?\.png$/);
      const femaleId = match ? Number(match[1]) : id;
      if (FEMALE_SPRITE_FILES[femaleId]) {
        out.push(FEMALE_SPRITE_FILES[femaleId]);
      } else if (FEMALE_SPRITE_FILES[id]) {
        out.push(FEMALE_SPRITE_FILES[id]);
      }
    }
  }
  // Cosmetic colour/coat forms are keyed by their own sprite id, so look there
  // first; the numeric form map does not contain them.
  const form = COLOR_SPRITE_FILES[id] ?? FORM_ID_SPRITE_FILES[id];
  const base = SPRITE_FILES[id];
  const ordered = shiny
    ? [form?.shiny, base?.shiny, form?.normal, base?.normal]
    : [form?.normal, base?.normal, form?.shiny, base?.shiny];
  for (const candidate of ordered) if (candidate) out.push(candidate);
  const seen = new Set<string>();
  return out.filter((slice) => {
    const key = `${slice.o}:${slice.l}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
