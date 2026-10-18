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

export interface RoutePin { id:string; name:string; x:number; y:number; area:string }
/**
 * Marks every recorded route/area as a labelled clickable pin, exactly like the
 * curated city pins. Positions are schematic: routes are spread along the
 * region's hub path (or a ring when the region has no plotted path), because no
 * dataset records true walking coordinates. Nothing is invented except position.
 */
export function routePinsFor(regionId:string, areas:readonly string[], links:readonly string[][], hubs:readonly {id:string;x:number;y:number}[], curatedIds:readonly string[]):RoutePin[] {
  const picked=areas.filter(area=>!curatedIds.includes(area) && /(^|-)route-\d|route-\d+-/.test(area)).sort((a,b)=>{
    const na=Number(a.match(/route-(\d+)/)?.[1]??0),nb=Number(b.match(/route-(\d+)/)?.[1]??0);
    return na-nb || a.localeCompare(b);
  });
  if(!picked.length)return [];
  const hubOf=(id:string)=>hubs.find(hub=>hub.id===id);
  const path:string[]=[];
  for(const link of links)for(const id of link){if(!path.length || path[path.length-1]!==id)path.push(id);}
  const points=path.map(hubOf).filter((pin):pin is {id:string;x:number;y:number}=>Boolean(pin));
  const routeName=(area:string)=>{
    const number=area.match(/route-(\d+)/)?.[1];
    const region=area.split('-')[0];
    return number?`Route ${number}`:`${region.charAt(0).toUpperCase()+region.slice(1)} route`;
  };
  const seenLabels=new Map<string,number>();
  return picked.map((area,index)=>{
    const ratio=(index+1)/(picked.length+1);
    let x:number,y:number;
    if(points.length>=2){
      const segment=ratio*(points.length-1);
      const i=Math.min(points.length-2,Math.floor(segment));
      const t=segment-i;
      const a=points[i],b=points[i+1];
      x=a.x+(b.x-a.x)*t;y=a.y+(b.y-a.y)*t;
      const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
      const side=index%2===0?1:-1;
      x+=(-dy/len)*30*side;y+=(dx/len)*30*side;
    }else{
      const angle=(index/Math.max(1,picked.length))*Math.PI*2;
      x=500+Math.cos(angle)*300;y=330+Math.sin(angle)*230;
    }
    x=Math.max(40,Math.min(960,x));y=Math.max(40,Math.min(620,y));
    const base=routeName(area);
    const count=(seenLabels.get(base)??0)+1;
    seenLabels.set(base,count);
    // Keep short, unique labels: Route 3, Route 3b, Route 3c…
    const name=count===1?base:`${base}${String.fromCharCode(96+count)}`;
    return {id:`route-${regionId}-${index}`,name,x,y,area};
  });
}
