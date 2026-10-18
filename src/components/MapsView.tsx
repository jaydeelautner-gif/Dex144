import { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapIcon, Search, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import { ALL_CANONICAL_GAME_IDS, GAMES, normalizeToCanonicalGames, type DlcId, type GameId, type PokemonEntry } from '../data/pokemonData';
import { mapRegionsForGame, REGION_LINKS, type MapPlace } from '../data/gameMaps';
import { loadEncounterDataset, prettifyAreaName, prettyEncounterCondition, prettyEncounterMethod, type EncounterDataset } from '../data/encountersData';
import { areaRegion, indexMapEncounters, placeMatchesArea, routePinsFor, type MapEncounter, type RoutePin } from '../utils/mapEncounters';
import { LocationMiniMap } from './LocationMiniMap';
import { AREA_UNLOCKS } from '../data/areaUnlocks.generated';
import { GAME_ID_TO_TRACKABLE, MILESTONE_INDEX, milestonesFor } from '../data/milestones';
import { catchLevelCap, countBadges } from '../utils/catchability';
import { DisplayLimitSelect, PageControls, useDisplayLimit } from './DisplayControls';
import { PokemonSprite } from './PokemonSprite';
import { RegionTerrain } from './RegionTerrain';

export function MapsView({dex,ownedGames,ownedDlcs,gameProgress,onSelectPokemon}:{dex:PokemonEntry[];ownedGames:GameId[];ownedDlcs:DlcId[];gameProgress:Record<string,string[]>;onSelectPokemon:(pokemon:PokemonEntry)=>void}){
  const owned=normalizeToCanonicalGames(ownedGames);
  const [allGames,setAllGames]=useState(false);
  const games=GAMES.filter(game=>(ALL_CANONICAL_GAME_IDS as GameId[]).includes(game.id) && (allGames || !owned.length || owned.includes(game.id)));
  const [gameChoice,setGameChoice]=useState<GameId>(owned[0]??'red');
  const game=games.find(g=>g.id===gameChoice)??games[0];
  const [regionChoice,setRegionChoice]=useState('');
  const regions=useMemo(()=>mapRegionsForGame(game.id,ownedDlcs),[game.id,ownedDlcs]);
  const region=regions.find(r=>r.id===regionChoice)??regions[0];
  const [dataset,setDataset]=useState<EncounterDataset|null>(null);
  const [loading,setLoading]=useState(true);
  const [retry,setRetry]=useState(0);
  useEffect(()=>{let active=true;setLoading(true);void loadEncounterDataset().then(data=>{if(active){setDataset(data);setLoading(false);}});return()=>{active=false;};},[retry]);
  const detailsRef=useRef<HTMLElement>(null);
  const showDetails=()=>requestAnimationFrame(()=>{if(window.innerWidth<1280)detailsRef.current?.scrollIntoView({behavior:'smooth',block:'start'});});
  const [placeChoice,setPlaceChoice]=useState<string|null>(null);
  const [areaChoice,setAreaChoice]=useState<string|null>(null);
  const [search,setSearch]=useState('');
  const [pokemonSearch,setPokemonSearch]=useState('');
  const [method,setMethod]=useState('all');
  const [zoom,setZoom]=useState(1);
  const [fullscreen,setFullscreen]=useState(false);
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setFullscreen(false);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[]);
  const [page,setPage]=useState(1);
  const [limit,setLimit]=useDisplayLimit('homedex_map_encounters_count',30);
  const index=useMemo(()=>indexMapEncounters(dataset,game.id,ownedDlcs),[dataset,game.id,ownedDlcs]);
  const areas=useMemo(()=>[...index.keys()].filter(area=>areaRegion(area,game.id,regions.map(r=>r.id))===region.id).sort(),[index,region.id,regions,game.id]);
  const johtoEra=['gold','silver','crystal','heartgold','soulsilver'].includes(game.id);
  const places=region.places.filter(place=>(!place.games || place.games.includes(game.id)) && !(region.id==='unova' && ['aspertia-city','virbank-city','humilau-city'].includes(place.id) && !['black2','white2'].includes(game.id)) && !(region.id==='kanto' && place.id==='pokemon-mansion' && johtoEra)).map(place=>place.id==='cinnabar-island' && johtoEra?{...place,buildings:['Pokémon Center'],notes:'The eruption changed Cinnabar. Its Gym moved to the Seafoam Islands.'}:place);
  const routePins=useMemo(()=>{
    // Areas already covered by a curated city/landmark pin are not repeated.
    const unconsumed=areas.filter(area=>!places.some(place=>placeMatchesArea(place,area)));
    return routePinsFor(region.id,unconsumed,REGION_LINKS[region.id]??[],places,[]);
  },[region.id,areas,places]);
  const place=places.find(p=>p.id===placeChoice)??null;
  const activeRoute=routePins.find(pin=>pin.id===placeChoice)??null;
  const subareas=place?areas.filter(area=>placeMatchesArea(place,area)):[];
  const activeArea=areaChoice && areas.includes(areaChoice)?areaChoice:null;
  const selectedAreas=activeArea?[activeArea]:subareas;
  const records=selectedAreas.flatMap(area=>index.get(area)??[]);
  const names=useMemo(()=>new Map(dex.map(p=>[p.id,p])),[dex]);
  const methods=[...new Set(records.map(row=>row.method))].sort();
  const rows=useMemo(()=>{
    const grouped=new Map<number,MapEncounter[]>();
    for(const row of records){
      const pokemon=names.get(row.pokemonId);
      if(method!=='all' && row.method!==method)continue;
      if(pokemonSearch && !`${pokemon?.name??''} ${row.pokemonId}`.toLowerCase().includes(pokemonSearch.toLowerCase()))continue;
      if(!grouped.has(row.pokemonId))grouped.set(row.pokemonId,[]);
      grouped.get(row.pokemonId)!.push(row);
    }
    return [...grouped.entries()].sort((a,b)=>a[0]-b[0]);
  },[records,method,pokemonSearch,names]);
  const pages=limit==='all'?1:Math.max(1,Math.ceil(rows.length/limit));
  const currentPage=Math.min(page,pages);
  const shown=limit==='all'?rows:rows.slice((currentPage-1)*limit,currentPage*limit);
  const group=GAME_ID_TO_TRACKABLE[game.id]??'';
  const completed=new Set(gameProgress[group]??[]);
  const unlocks=AREA_UNLOCKS[group]??{};
  const cap=catchLevelCap(group,countBadges(milestonesFor(group,ownedDlcs),completed));
  const progressLabel=(area:string)=>{
    if(!Object.prototype.hasOwnProperty.call(unlocks,area))return 'Progress not mapped';
    const id=unlocks[area];return id?(completed.has(id)?'Marked unlocked':`Not marked: ${MILESTONE_INDEX.get(id)?.label??id}`):'Start area';
  };
  const resetArea=()=>{setPlaceChoice(null);setAreaChoice(null);setMethod('all');setPokemonSearch('');setPage(1);};
  const openPlace=(next:MapPlace)=>{setPlaceChoice(next.id);setAreaChoice(null);setMethod('all');setPokemonSearch('');setPage(1);showDetails();};
  const openArea=(area:string)=>{setAreaChoice(area);setPlaceChoice(places.find(p=>placeMatchesArea(p,area))?.id??routePins.find(pin=>pin.area===area)?.id??null);setMethod('all');setPokemonSearch('');setPage(1);showDetails();};
  const filteredAreas=areas.filter(area=>prettifyAreaName(area).toLowerCase().includes(search.toLowerCase()));
  const buildingAreas=subareas.filter(area=>/gym|tower|mansion|lab|station|museum|factory|house|headquarters|prize-corner|dojo/.test(area));
  return <div className="flex flex-col gap-4 min-w-0" data-testid="maps-page">
    <header className="p-4 rounded-2xl border border-slate-800 bg-[#0F1522] flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-black text-slate-100 flex items-center gap-2"><MapIcon className="text-amber-300" />Town Map</h1><p className="text-xs text-slate-400">Select a pin or encounter area. Maps are schematic region guides, not exact overworld layouts.</p></div>
      <div className="flex flex-wrap items-center gap-2"><label className="text-xs text-slate-300">Game <select aria-label="Map game" value={game.id} onChange={e=>{setGameChoice(e.target.value as GameId);setRegionChoice('');resetArea();setSearch('');setZoom(1);}} className="max-w-full rounded-lg p-2 ml-1 bg-slate-900 border border-slate-700 text-slate-100">{games.map(g=><option key={g.id} value={g.id}>{g.title}</option>)}</select></label>
      {owned.length>0 && <button type="button" onClick={()=>{setAllGames(v=>!v);resetArea();}} className="text-xs text-amber-300 underline">{allGames?'Owned games only':'All games'}</button>}</div>
    </header>
    <nav aria-label="Map regions" className="flex flex-wrap gap-2">{regions.map(r=><button key={r.id} type="button" aria-pressed={region.id===r.id} onClick={()=>{setRegionChoice(r.id);resetArea();setZoom(1);}} className={`px-3 py-2 rounded-xl border text-xs font-bold ${region.id===r.id?'bg-amber-400 text-slate-950 border-amber-300':'bg-slate-900 text-slate-300 border-slate-700'}`}>{r.name}</button>)}</nav>
    {(game.id==='colo'||game.id==='xd') && <p role="status" className="text-xs text-sky-200">{game.id==='colo'?'Colosseum focuses on snagging and purifying Shadow Pokémon, not standard wild encounters.':'XD includes wild Pokémon at the Rock, Oasis and Cave Poké Spots; most other captures use Shadow Pokémon snagging.'}</p>}
    {game.id==='pogo' && <p role="status" className="text-sm text-sky-200">GO uses real-world locations. This is an activity guide, not a live GPS map; current event pools are not included.</p>}
    {loading && <p role="status" className="text-sm text-slate-400">Loading local encounter data…</p>}
    {!loading && !dataset && <div role="alert" className="text-xs text-amber-200">Encounter data is unavailable on this device. <button type="button" onClick={()=>setRetry(v=>v+1)} className="underline">Retry</button> or install the offline data package.</div>}
    {!loading && dataset && index.size===0 && <p role="status" className="text-xs text-amber-200">No encounter rows are recorded for {game.title} in the current bundle. Landmarks remain available; no species, rates or locations are invented to fill the gap.</p>}
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,1fr)] gap-4 items-start">
      <section aria-label="Interactive region map" className={`${fullscreen?'fixed inset-0 z-50 rounded-none':'min-w-0 rounded-2xl border border-slate-800'} p-3 bg-[#0F1522] flex flex-col gap-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold text-slate-100">{region.name} {fullscreen&&<span className="text-xs text-amber-300">Full screen</span>}</h2><div className="flex gap-2"><button type="button" aria-label={fullscreen?'Exit full screen map':'Full screen map'} onClick={()=>setFullscreen(v=>!v)} className="p-2 border border-slate-700 rounded text-slate-200">{fullscreen?<Minimize2 className="w-4 h-4" />:<Maximize2 className="w-4 h-4" />}</button><button type="button" aria-label="Zoom map out" disabled={zoom<=0.8} onClick={()=>setZoom(v=>Math.max(0.8,v-0.2))} className="p-2 border border-slate-700 rounded text-slate-200 disabled:opacity-30"><ZoomOut className="w-4 h-4" /></button><button type="button" aria-label="Zoom map in" disabled={zoom>=2} onClick={()=>setZoom(v=>Math.min(2,v+0.2))} className="p-2 border border-slate-700 rounded text-slate-200 disabled:opacity-30"><ZoomIn className="w-4 h-4" /></button><button type="button" onClick={()=>setZoom(1)} className="text-xs text-amber-200">Reset zoom</button></div></div>
        <div className="overflow-auto rounded-xl border border-slate-700 bg-sky-950/60" style={{maxHeight:fullscreen?'calc(100vh - 250px)':600}}>
          <svg viewBox="0 0 1000 660" width={1000*zoom} role="group" aria-label={`${region.name} schematic map`} className="block max-w-none">
            <rect width="1000" height="660" fill="#082f49" />
            <g stroke="#164e63" strokeWidth="1" opacity="0.6">{Array.from({length:20},(_,i)=><path key={i} d={`M${i*55} 0V660M0 ${i*55}H1000`} />)}</g>
            <RegionTerrain region={region} />
            <g fill="none" stroke={region.color} strokeWidth="5" strokeOpacity="0.45" strokeLinejoin="round">{(REGION_LINKS[region.id]??[]).map((link,i)=><polyline key={i} points={link.flatMap(id=>{const pin=places.find(p=>p.id===id);return pin?[`${pin.x},${pin.y}`]:[];}).join(' ')} />)}</g>

            {routePins.map(pin=>{const active=pin.id===placeChoice;return <g key={pin.id} role="button" tabIndex={0} aria-label={`Explore ${pin.name}`} aria-pressed={active} onClick={()=>openArea(pin.area)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openArea(pin.area);}}} className="cursor-pointer focus:outline-none">
              <circle cx={pin.x} cy={pin.y} r="18" fill="transparent" />
              <polygon points={`${pin.x},${pin.y-8} ${pin.x+8},${pin.y} ${pin.x},${pin.y+8} ${pin.x-8},${pin.y}`} fill={active?'#fbbf24':'#0f172a'} stroke={active?'#fef3c7':region.color} strokeWidth="2.5" />
              <text x={pin.x} y={pin.y+22} textAnchor="middle" fill={active?'#fef3c7':'#cbd5e1'} stroke="#082f49" strokeWidth="4" paintOrder="stroke" fontSize="11">{pin.name}</text>
            </g>;})}
            {places.map(pin=>{const active=pin.id===placeChoice;return <g key={pin.id} role="button" tabIndex={0} aria-label={`Explore ${pin.name}`} aria-pressed={active} onClick={()=>openPlace(pin)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openPlace(pin);}}} className="cursor-pointer focus:outline-none focus:brightness-150">
              <circle cx={pin.x} cy={pin.y} r="22" fill="transparent" />
              {pin.buildings.length?<rect x={pin.x-10} y={pin.y-10} width="20" height="20" rx="4" fill={active?'#fbbf24':'#0f172a'} stroke={active?'#fef3c7':region.color} strokeWidth="3" />:<circle cx={pin.x} cy={pin.y} r={active?14:10} fill={active?'#fbbf24':'#0f172a'} stroke={active?'#fef3c7':region.color} strokeWidth="3" />}
              <text x={pin.x} y={pin.y+30} textAnchor="middle" fill={active?'#fef3c7':'#e2e8f0'} stroke="#082f49" strokeWidth="4" paintOrder="stroke" fontSize="13" fontWeight="700">{pin.name}</text>
            </g>;})}
          </svg>
        </div>
        <p className="text-[11px] text-slate-400">Schematic · Squares: facilities · Circles: landmarks · Swipe / scroll to pan · + / − to zoom.</p>
        <div className="flex flex-wrap gap-1.5" aria-label="Map location shortcuts">{places.map(pin=><button key={pin.id} type="button" onClick={()=>openPlace(pin)} className={`px-2 py-1.5 text-[11px] rounded-lg border ${pin.id===placeChoice?'text-amber-200 border-amber-400':'text-slate-300 border-slate-700'}`}>{pin.name}</button>)}</div>
        <label className="relative text-xs text-slate-300 flex items-center gap-2"><Search className="w-4 h-4" />Find an encounter area<input aria-label="Find encounter area" value={search} onChange={e=>setSearch(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-100" /></label>
        <p className="text-[11px] text-slate-400">{filteredAreas.length} recorded areas · The directory includes subareas and routes without a plotted pin.</p>
        <div aria-label="Encounter area directory" className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-72 overflow-auto">{filteredAreas.map(area=><button key={area} type="button" onClick={()=>openArea(area)} className={`text-left p-2 rounded-lg text-xs border ${area===activeArea?'border-amber-400 text-amber-200':'border-slate-800 text-slate-300 hover:border-slate-500'}`}>{prettifyAreaName(area)}</button>)}</div>
      </section>
      <section ref={detailsRef} aria-label="Map location details" className="min-w-0 p-4 rounded-2xl border border-slate-800 bg-[#0F1522] flex flex-col gap-3">
        <div><button type="button" onClick={resetArea} className="text-xs text-amber-300 underline">{region.name} overview</button><h2 className="text-lg font-bold text-slate-100 mt-1">{activeArea?prettifyAreaName(activeArea):place?.name??'Choose a location'}</h2></div>
        {activeRoute && !activeArea && <p className="text-xs text-slate-400">This is a recorded route area. Open it to see its encounters grouped on a local map.</p>}
        {place?.notes && <p className="text-sm text-slate-300">{place.notes}</p>}
        {place && <div><h3 className="text-xs font-bold text-sky-200 mb-2">Buildings & landmarks</h3>{place.buildings.length>0?<ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">{place.buildings.map(building=><li key={building}>{building}</li>)}</ul>:<p className="text-xs text-slate-400">No additional building notes recorded for this location.</p>}</div>}
        {buildingAreas.length>0 && <div className="flex flex-wrap gap-1.5">{buildingAreas.map(area=><button key={area} type="button" onClick={()=>openArea(area)} className="p-2 rounded border border-slate-700 text-xs text-sky-200">{prettifyAreaName(area)}</button>)}</div>}
        {place && subareas.length>0 && <label className="text-xs text-slate-300">Encounter subarea<select aria-label="Map encounter subarea" value={activeArea??'all'} onChange={e=>{setAreaChoice(e.target.value==='all'?null:e.target.value);setMethod('all');setPokemonSearch('');setPage(1);}} className="block mt-1 w-full rounded-lg p-2 bg-slate-900 border border-slate-700 text-slate-100"><option value="all">All recorded subareas</option>{subareas.map(area=><option key={area} value={area}>{prettifyAreaName(area)}</option>)}</select></label>}
        {(place || activeArea) && <>
          <h3 className="font-bold text-sm text-amber-200">Recorded encounters · {rows.length} Pokémon</h3>
          {activeArea && <p className="text-xs text-slate-400">{progressLabel(activeArea)}</p>}
          {Number.isFinite(cap) && <p className="text-[11px] text-slate-400">Marked badge progress: catch cap Lv. {cap}. Higher-level rows remain visible.</p>}
          {!loading && records.length===0 && <p role="status" className="text-xs text-slate-400">No encounter records for this location in {game.title}. This does not prove that no Pokémon can be obtained here.</p>}
          {records.length>0 && <LocationMiniMap area={activeArea??subareas[0]??place?.name??''} encounters={records} names={names} onSelectPokemon={onSelectPokemon} />}
          {records.length>0 && <>
            <input aria-label="Find map Pokémon" value={pokemonSearch} onChange={e=>{setPokemonSearch(e.target.value);setPage(1);}} placeholder="Pokémon name or dex #" className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-xs text-slate-100" />
            <label className="text-xs text-slate-300">Method<select aria-label="Map encounter method" value={method} onChange={e=>{setMethod(e.target.value);setPage(1);}} className="ml-2 rounded bg-slate-900 p-2 border border-slate-700"><option value="all">All methods</option>{methods.map(value=><option key={value} value={value}>{prettyEncounterMethod(value)}</option>)}</select></label>
            <DisplayLimitSelect label="Map Pokémon per page" value={limit} onChange={value=>{setLimit(value);setPage(1);}} />
            <PageControls page={currentPage} pages={pages} total={rows.length} onChange={setPage} />
            <div className="flex flex-col gap-2">{shown.map(([id,encounters])=>{const mon=names.get(id);return <article key={id} className="p-3 border border-slate-800 rounded-xl bg-slate-900/70">
              <button type="button" onClick={()=>mon && onSelectPokemon(mon)} className="flex gap-2 items-center text-sm text-amber-100 font-bold text-left"><PokemonSprite id={id} name={mon?.name??`#${id}`} size="sm" />#{id} {mon?.name??'Pokémon'}</button>
              <ul className="text-[11px] text-slate-300 flex flex-col gap-1 mt-1">{encounters.map((row,i)=><li key={i} className="border-t border-slate-800 pt-1">
                <span className="block text-sky-200">{prettifyAreaName(row.area)}</span>
                {prettyEncounterMethod(row.method)} · Lv. {row.minLevel}{row.maxLevel!==row.minLevel?`–${row.maxLevel}`:''} · {row.chance>0?`${row.chance}%`:'Rate not recorded'}
                {row.minLevel>cap && <span className="ml-1 text-amber-200">Above catch cap</span>}
                {row.conditions.length>0 && <span className="block text-fuchsia-200">{row.conditions.map((condition:string)=>prettyEncounterCondition(condition)??prettifyAreaName(condition)).join(' · ')}</span>}
                <span className="block text-slate-500">{progressLabel(row.area)}</span>
              </li>)}</ul>
            </article>;})}</div>
          </>}
        </>}
        {!place && !activeArea && <p className="text-sm text-slate-400">Tap a labeled map pin or choose any recorded encounter area from the directory. Version-specific records stay separate; gifts and NPC trades appear where the data records them.</p>}
      </section>
    </div>
  </div>;
}
