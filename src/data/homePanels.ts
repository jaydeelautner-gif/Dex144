export const HOME_PANELS = [
  {id:'recentCommunity',label:'Recently registered community PokéPets',description:'Latest public registrations from trainers across the site. Requires internet.',group:'Home panels'},
  {id:'trainerCard',label:'Trainer card',description:'Your avatar, owned games and earned badge case in the Home sidebar.',group:'Trainer sidebar'},
  {id:'profileBoxes',label:'Boxes shortcut',description:'Open your living boxes from the Home sidebar.',group:'Trainer sidebar'},
  {id:'profileInventory',label:'Inventory shortcut',description:'Open your registered PokéPets from the Home sidebar.',group:'Trainer sidebar'},
  {id:'profileFriends',label:'Friends shortcut',description:'Open your friends from the Home sidebar.',group:'Trainer sidebar'},
  {id:'profileAvatar',label:'Avatar Builder shortcut',description:'Customize your trainer from the Home sidebar.',group:'Trainer sidebar'},
  {id:'regionProgress',label:'Caught by region',description:'Caught and Living Dex counts for each region in the Home sidebar.',group:'Trainer sidebar'},
  {id:'nationalDex',label:'National Pokédex summary',description:'Caught count and completion percentage.',group:'Overview'},
  {id:'livingDex',label:'Living Dex summary',description:'HOME storage count and registered specimens.',group:'Overview'},
  {id:'runningTotal',label:'Owned games running total',description:'Catch totals for your selected owned games and DLC.',group:'Overview'},
  {id:'welcome',label:'Welcome banner',description:'Welcome message and quick registration buttons.',group:'Home panels'},
  {id:'pokeIdLookup',label:'POKEID finder',description:'Look up a PokéPet by POKEID.',group:'Home panels'},
  {id:'catchHub',label:'Catch Hub',description:'Per-owned-game tabs. Hiding this also hides both sections below.',group:'Catch Hub'},
  {id:'trainerHints',label:'Trainer Hints',description:'Wild catches, starter choices, evolutions and condition filters inside the Catch Hub.',group:'Catch Hub'},
  {id:'goReplacements',label:'GO replacements',description:'Console replacements for GO-held Living Dex specimens.',group:'Catch Hub'},
  {id:'quickLinks',label:'Quick navigation cards',description:'Shortcuts to registration, inventory, boxes and Pokédex.',group:'Home panels'},
  {id:'bankWatchlist',label:'Poké Bank watchlist',description:'Collection warnings and transfer risks.',group:'Home panels'},
  {id:'ownedLibrary',label:'Owned games snapshot',description:'Your game library and per-game catch counts.',group:'Home panels'},
] as const;
export type HomePanelId = (typeof HOME_PANELS)[number]['id'];
export type HomePanelVisibility = Record<HomePanelId,boolean>;
export const DEFAULT_HOME_PANELS = Object.fromEntries(HOME_PANELS.map(p=>[p.id,true])) as HomePanelVisibility;
export const HOME_PANEL_STORAGE_KEY = 'homedex_home_panels_v1';
export function normalizeHomePanels(raw: unknown): HomePanelVisibility {
  const prefs = {...DEFAULT_HOME_PANELS};
  if (!raw || typeof raw!=='object' || Array.isArray(raw)) return prefs;
  for (const panel of HOME_PANELS) {
    const value=(raw as Record<string,unknown>)[panel.id];
    if(typeof value==='boolean') prefs[panel.id]=value;
  }
  return prefs;
}
