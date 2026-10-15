export function spriteSources(id: number, shiny = false, imageUrl?: string): string[] {
  const root = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
  const folder = shiny ? 'shiny/' : '';
  const custom = imageUrl && (shiny && imageUrl.includes('/sprites/dex/') ? imageUrl.replace('/sprites/dex/', '/sprites/dex-shiny/') : !shiny ? imageUrl : undefined);
  return [...new Set([custom, `${root}/other/official-artwork/${folder}${id}.png`, `${root}/other/home/${folder}${id}.png`, `${root}/${folder}${id}.png`].filter(Boolean) as string[])];
}
