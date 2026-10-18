import { useMemo } from 'react';
import { prettyEncounterCondition, prettyEncounterMethod, prettifyAreaName } from '../data/encountersData';
import { PokemonSprite } from './PokemonSprite';
import type { MapEncounter } from '../utils/mapEncounters';
import type { PokemonEntry } from '../data/pokemonData';

const WATER=/sea|bay|island|lake|river|beach|ocean|harbor|coast|surf|water|pond|pool|marsh|wetland|cove|deep|falls|spring|well|canal/i;
const CAVE=/cave|tunnel|cavern|mine|mountain|mt-|volcano|tower|mansion|ruins|temple|shrine|canyon|gorge|ice-path|interior|chamber|lair/i;
const SPECIAL=/gift|trade|egg|starter|legendary|event|grotto|den|raid/i;
/** Zone a method/area belongs to on the little map: land, water, cave/interior or special. */
export function encounterZone(method:string, area:string):'land'|'water'|'cave'|'special'{
  if(SPECIAL.test(method))return 'special';
  if(WATER.test(area)||/surf|fish|rod|dive|waterfall/i.test(method))return 'water';
  if(CAVE.test(area)||/cave|hidden|overworld-special|max-raid|island-scan/i.test(method))return 'cave';
  return 'land';
}
const ZONE_STYLE={
  land:{label:'Grass & fields',fill:'#166534',accent:'#86efac'},
  water:{label:'Water',fill:'#0c4a6e',accent:'#7dd3fc'},
  cave:{label:'Cave / interior',fill:'#3f3f46',accent:'#e4e4e7'},
  special:{label:'Gift, trade & special',fill:'#7c2d12',accent:'#fdba74'},
} as const;
const ZONE_ORDER=['land','water','cave','special'] as const;

/**
 * Little local map for one route/area/city: each recorded encounter is pinned in
 * the zone matching its method and terrain. Positions are a schematic layout
 * grouped by method — no dataset records real tile coordinates — so this shows
 * *where* (which zone and sub-area) a Pokémon is found, not a pixel-accurate spot.
 */
export function LocationMiniMap({area,encounters,names,onSelectPokemon}:{area:string;encounters:MapEncounter[];names:Map<number,PokemonEntry>;onSelectPokemon:(pokemon:PokemonEntry)=>void}){
  const zones=useMemo(()=>{
    const map=new Map<string,MapEncounter[]>();
    for(const encounter of encounters){
      const key=`${encounterZone(encounter.method,encounter.area)}|${encounter.area}`;
      if(!map.has(key))map.set(key,[]);
      map.get(key)!.push(encounter);
    }
    return [...map.entries()].map(([key,rows])=>({zone:key.split('|')[0] as typeof ZONE_ORDER[number],area:key.slice(key.indexOf('|')+1),rows})).sort((a,b)=>ZONE_ORDER.indexOf(a.zone)-ZONE_ORDER.indexOf(b.zone)||a.area.localeCompare(b.area));
  },[encounters]);
  if(!encounters.length)return <p role="status" className="text-xs text-slate-400">No recorded encounters to plot for {prettifyAreaName(area)}.</p>;
  return <section aria-label={`Encounter map for ${prettifyAreaName(area)}`} className="flex flex-col gap-2">
    <div className="rounded-xl border border-slate-700 overflow-auto bg-[#0B0F17]" style={{maxHeight:420}}>
      <svg viewBox="0 0 640 420" width={640} role="group" aria-label={`Little map of ${prettifyAreaName(area)}`} className="block max-w-full h-auto">
        <defs><linearGradient id="mini-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f172a" /><stop offset="100%" stopColor="#020617" /></linearGradient></defs>
        <rect width="640" height="420" fill="url(#mini-sky)" />
        {zones.map((group,index)=>{
          const style=ZONE_STYLE[group.zone];
          const column=index%2,row=Math.floor(index/2);
          const x=16+column*310,y=16+row*200,width=298,height=188;
          return <g key={`${group.zone}-${group.area}`}>
            <rect x={x} y={y} width={width} height={height} rx="14" fill={style.fill} opacity="0.55" stroke={style.accent} strokeOpacity="0.5" />
            <text x={x+10} y={y+20} fill={style.accent} fontSize="11" fontWeight="700">{style.label}</text>
            <text x={x+10} y={y+34} fill="#cbd5e1" fontSize="10">{prettifyAreaName(group.area)}</text>
            {group.rows.map((encounter,i)=>{
              const pokemon=names.get(encounter.pokemonId);
              const cols=6,px=x+24+((i%cols)*(width-40))/cols,py=y+62+(Math.floor(i/cols)*38);
              return <g key={`${encounter.pokemonId}-${i}`} role="button" tabIndex={0} aria-label={`${pokemon?.name??`#${encounter.pokemonId}`} — ${prettyEncounterMethod(encounter.method)} Lv. ${encounter.minLevel}${encounter.maxLevel!==encounter.minLevel?`–${encounter.maxLevel}`:''}${encounter.chance>0?`, ${encounter.chance}%`:''}`} onClick={()=>pokemon&&onSelectPokemon(pokemon)} onKeyDown={event=>{if((event.key==='Enter'||event.key===' ')&&pokemon){event.preventDefault();onSelectPokemon(pokemon);}}} className="cursor-pointer">
                  {py<y+height-10 && <>
                    <circle cx={px+1} cy={py+1} r="17" fill="#020617" opacity="0.7" />
                    <foreignObject x={px-16} y={py-16} width="34" height="34"><PokemonSprite id={encounter.pokemonId} name={pokemon?.name??`#${encounter.pokemonId}`} size="sm" className="!w-8 !h-8 [&>img]:drop-shadow" /></foreignObject>
                    <text x={px+1} y={py+22} textAnchor="middle" fill="#e2e8f0" stroke="#020617" strokeWidth="3" paintOrder="stroke" fontSize="9">{encounter.minLevel}{encounter.maxLevel!==encounter.minLevel?`-${encounter.maxLevel}`:''}</text>
                  </>}
                  {encounter.conditions.length>0 && py<y+height-10 && <title>{encounter.conditions.map(condition=>prettyEncounterCondition(condition)??prettifyAreaName(condition)).join(' · ')}</title>}
                </g>;
            })}
            {group.rows.length>12 && <text x={x+10} y={y+height-8} fill="#94a3b8" fontSize="10">+{group.rows.length-12} more in the list below</text>}
          </g>;
        })}
      </svg>
    </div>
    <p className="text-[10px] text-slate-500">Schematic local map: encounters are grouped by the zone their method and terrain belong to. Level ranges are shown under each sprite; hover a sprite for weather, time and other conditions.</p>
  </section>;
}
