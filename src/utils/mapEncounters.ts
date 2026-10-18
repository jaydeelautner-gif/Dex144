import type { EncounterDataset } from '../data/encountersData';
import type { DlcId, GameId } from '../data/pokemonData';
import type { MapPlace } from '../data/gameMaps';
import { dlcForArea, isAreaOwned } from '../data/dlcOwnership';

export interface MapEncounter { pokemonId:number; area:string; method:string; chance:number; minLevel:number; maxLevel:number; versions:string[]; conditions:string[] }
/** One index per selected version; never unions a sibling game's exclusive rows. */
export function indexMapEncounters(dataset:EncounterDataset|null,gameId:GameId,ownedDlcs:readonly DlcId[]=[]):Map<string,MapEncounter[]> {
  const index=new Map<string,MapEncounter[]>();
  if(!dataset)return index;
  for(const [id,byGame] of Object.entries(dataset))for(const [area,details] of Object.entries(byGame?.[gameId]??{})){
    const pokemonId=Number(id);
    if(!Number.isInteger(pokemonId)||pokemonId<1||pokemonId>1025||!Array.isArray(details)||!isAreaOwned(gameId,area,ownedDlcs))continue;
    for(const detail of details){
      if(!detail||typeof detail.m!=='string'||!Array.isArray(detail.l)||detail.l.length<2||!detail.l.every(Number.isFinite))continue;
      const record:MapEncounter={pokemonId,area,method:detail.m,chance:Number.isFinite(detail.c)?detail.c:0,minLevel:detail.l[0],maxLevel:detail.l[1],versions:Array.isArray(detail.v)?detail.v:[],conditions:Array.isArray(detail.cd)?detail.cd:[]};
      if(!index.has(area))index.set(area,[]);
      index.get(area)!.push(record);
    }
  }
  return index;
}
const stripRegion=(name:string)=>name.replace(/^(kanto|johto|hoenn|sinnoh|unova|kalos|alola|galar|hisui|paldea)-/,'');
export function placeMatchesArea(place:MapPlace,area:string):boolean {
  const value=stripRegion(area);
  return place.aliases.some(alias=>{const key=stripRegion(alias);return value===key||value.startsWith(key+'-');});
}
const KANTO=/^(kanto-|pallet-|viridian-|pewter-|cerulean-|vermilion-|celadon-|fuchsia-|saffron-|lavender-|cinnabar-|seafoam-|digletts-|rock-tunnel|mt-moon|pokemon-mansion|power-plant|indigo-plateau|tohjo-|victory-road|route-2[0-8](?:-|$))/;
const SEVII=/^(one-island|two-island|three-island|four-island|five-island|six-island|seven-island|sevii-|mt-ember|kindle-road|treasure-beach|cape-brink|bond-bridge|berry-forest|icefall-cave|five-isle-meadow|memorial-pillar|water-labyrinth|resort-gorgeous|water-path|ruin-valley|pattern-bush|green-path|outcast-island|altering-cave|dotted-hole|lost-cave|trainer-tower|canyon-entrance|sevault-canyon|tanoby-|birth-island|navel-rock)/;
/** Classifies encounter subareas only; no invented geographic coordinates. */
export function areaRegion(area:string,gameId:GameId,regionIds:readonly string[]):string {
  const pack=dlcForArea(gameId,area);
  const dlcRegions:Record<string,string>={'swsh-isle-of-armor':'isle-armor','swsh-crown-tundra':'crown-tundra','sv-teal-mask':'kitakami','sv-indigo-disk':'blueberry'};
  if(pack && dlcRegions[pack])return dlcRegions[pack];
  if(regionIds.includes('sevii') && SEVII.test(area))return 'sevii';
  if(regionIds.includes('johto'))return KANTO.test(area)?'kanto':'johto';
  return regionIds[0]??'';
}
