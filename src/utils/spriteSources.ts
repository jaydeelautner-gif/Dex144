import {
  SPRITE_FILES,
  FORM_SPRITE_FILES,
  FORM_ID_SPRITE_FILES,
} from '../data/spriteFiles.generated';

/**
 * Returns sprite candidates that all live inside this app (`/sprites/...`).
 * Nothing is loaded from an external host, so artwork works offline and does
 * not depend on third-party availability. Candidates are tried in order until
 * one loads; the list is derived from sprites downloaded by
 * `scripts/downloadSprites.mjs`.
 */
export function spriteSources(id: number, shiny = false, imageUrl?: string): string[] {
  const out: string[] = [];
  if (imageUrl) {
    const mapped = FORM_SPRITE_FILES[imageUrl];
    if (mapped) out.push(mapped);
    else if (imageUrl.startsWith('/sprites/')) out.push(imageUrl);
  }
  const form = FORM_ID_SPRITE_FILES[id];
  const base = SPRITE_FILES[id];
  const ordered = shiny
    ? [form?.shiny, base?.shiny, form?.normal, base?.normal]
    : [form?.normal, base?.normal, form?.shiny, base?.shiny];
  for (const candidate of ordered) if (candidate) out.push(candidate);
  return [...new Set(out)];
}

/** True when a sprite path is served by this app rather than a remote host. */
export function isLocalSprite(src?: string | null): boolean {
  return Boolean(src && src.startsWith('/sprites/'));
}

/** Back-compat export: the local Pokemon Showdown dex folder. */
export const LOCAL_SPRITE_ROOT = '/sprites';
