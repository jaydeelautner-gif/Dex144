import { useMemo, useState } from 'react';
import { Backpack, Search } from 'lucide-react';
import { ITEMS, ITEM_TYPES, TM_HM } from '../data/items.generated';
import { ALL_CANONICAL_GAME_IDS, GAMES, normalizeToCanonicalGames, type DlcId, type GameId } from '../data/pokemonData';
import { humanItemName, SEREBII_GAME_IDS, UNTRACKED_ITEM_GAMES, versionGroupFor, VERSION_GROUP_LABEL } from '../data/gameVersionGroups';
import { ITEM_LOCATIONS } from '../data/itemLocations.generated';
import { curatedLocationsForItem, POKEMON_ITEMS_DATABASE } from '../data/pokemonItemsData';
import { DisplayLimitSelect, PageControls, useDisplayLimit } from './DisplayControls';
import { ItemSprite } from './ItemSprite';
import { hasItemSprite } from '../utils/spriteArchive';

const CATEGORY_LABELS: Record<string, string> = {
  standardballs: 'Poké Balls', specialballs: 'Special Poké Balls', medicine: 'Medicine', berries: 'Berries',
  'in-a-pinch': 'Battle items', 'picky-healing': 'Healing berries', healing: 'Healing', pokeballs: 'Poké Balls',
  vitamins: 'Vitamins', 'effort-training': 'Effort items', 'held-items': 'Held items', 'choice': 'Choice items',
  'type-enhancement': 'Type boosters', evolution: 'Evolution', 'evolution-items': 'Evolution items',
  'spelunking': 'Underground finds', 'all-mail': 'Mail', 'flutes': 'Flutes', 'apricorn-balls': 'Apricorn Balls',
  'apricorn-box': 'Apricorn box', 'collectibles': 'Collectibles', 'jewels': 'Jewels', 'mulch': 'Mulch',
  'dex-completion': 'Dex completion', 'plates': 'Plates', 'species-specific': 'Species items', 'scarves': 'Scarves',
  'mega-stones': 'Mega Stones', 'memories': 'Memories', 'z-crystals': 'Z-Crystals', 'baking-only': 'Baking',
  'dynamax-crystals': 'Dynamax crystals', 'curry-ingredients': 'Curry ingredients', 'picnic': 'Picnic',
  'tera-shard': 'Tera Shards', 'tm-materials': 'TM Materials', 'material': 'Materials', 'quest': 'Quest items',
  'gameplay': 'Gameplay', 'unused': 'Unused', 'other': 'Other', 'unknown': 'Other',
};
const gamesGroup=(gameId:string)=>versionGroupFor(gameId as GameId);
const entryGenerations=(generations:number[])=>generations;
const label = (id: string) => CATEGORY_LABELS[id] ?? id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
export const GENERATION_LABELS = ['—', 'Gen I', 'Gen II', 'Gen III', 'Gen IV', 'Gen V', 'Gen VI', 'Gen VII', 'Gen VIII', 'Gen IX'];

/** Item locations we have curated (evolution/key items); shown on the map too. */
export function curatedLocationsForPlace(placeName: string): { name: string; note: string }[] {
  // Match on the town/landmark name itself, without the "City/Town" suffix
  // ("Celadon City" should match "Celadon Dept. Store").
  const needle = placeName
    .replace(/\b(city|town|village|island|park|mountain|route)\b/gi, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (needle.length < 4) return [];
  const out: { name: string; note: string }[] = [];
  for (const item of POKEMON_ITEMS_DATABASE) {
    for (const entry of item.locationsByGame) {
      const haystack = (entry.location + ' ' + entry.gameShortTitle).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (haystack.includes(needle)) out.push({ name: item.name, note: entry.location });
    }
  }
  return out.slice(0, 40);
}

/** Searchable item catalogue with TM/HM lists per game. */
export function ItemsView({ownedGames,ownedDlcs}:{ownedGames:GameId[];ownedDlcs:DlcId[]}){
  const [mode,setMode]=useState<'items'|'machines'>('items');
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('all');
  const [generation,setGeneration]=useState('all');
  const [gameFilter,setGameFilter]=useState('all');
  const [openItem,setOpenItem]=useState<string|null>(null);
  const [limit,setLimit]=useDisplayLimit('homedex_items_count',30);
  const [page,setPage]=useState(1);
  const owned=normalizeToCanonicalGames(ownedGames);
  const [allGames,setAllGames]=useState(false);
  const machineGames=GAMES.filter(game=>{const group=versionGroupFor(game.id);return group && TM_HM[group];}).filter(game=>{
    if(allGames||!owned.length)return true;
    const packed=GAMES.find(entry=>entry.id===game.id)?.groupId;
    return owned.includes(game.id)||(packed?owned.includes(packed as GameId):false)||normalizeToCanonicalGames([game.id]).some(id=>owned.includes(id));
  });
  const [machineGame,setMachineGame]=useState<GameId>(owned[0]??'red');
  const game=machineGames.find(entry=>entry.id===machineGame)??machineGames[0];
  const group=game?versionGroupFor(game.id):null;
  const machines=group?TM_HM[group]??[]:[];
  const categories=useMemo(()=>[...new Set(Object.values(ITEMS).map(item=>item.category))].sort(),[]);
  const items=useMemo(()=>{
    const needle=query.trim().toLowerCase();
    return Object.entries(ITEMS).filter(([,item])=>{
      if(category!=='all'&&item.category!==category)return false;
      if(generation!=='all'&&!item.generations.includes(Number(generation)))return false;
      if(gameFilter!=='all'){
        const curated=curatedLocationsForItem(item.name);
        const group=versionGroupFor(gameFilter as GameId);
        const matchesCurated=Boolean(curated?.locationsByGame.some(entry=>!entry.notPickup && [gameFilter,group].includes(entry.gameId)));
        const matchesGeneration=entryGenerations(item.generations).includes(Number(GAMES.find(game=>game.id===gameFilter)?.generation ?? 0));
        if(!matchesCurated && !matchesGeneration) return false;
      }
      if(!needle)return true;
      const readable=humanItemName(item.name,item.category);
      return readable.toLowerCase().includes(needle)||item.name.toLowerCase().includes(needle)||item.effect.toLowerCase().includes(needle)||item.category.includes(needle);
    }).sort((a,b)=>humanItemName(a[1].name,a[1].category).localeCompare(humanItemName(b[1].name,b[1].category)));
  },[query,category,generation,gameFilter]);
  const machineRows=useMemo(()=>{
    const needle=query.trim().toLowerCase();
    return machines.filter(entry=>!needle||entry.move.toLowerCase().includes(needle)||entry.item.toLowerCase().includes(needle)||String(entry.n)===needle);
  },[machines,query]);
  const rows=mode==='items'?items:[] ;
  const pages=limit==='all'?1:Math.max(1,Math.ceil(rows.length/limit));
  const current=Math.min(page,pages);
  const shown=mode==='items'?(limit==='all'?rows:rows.slice((current-1)*limit,current*limit)):[];
  const resetFilters=()=>{setQuery('');setPage(1);setOpenItem(null);};
  return <div className="flex flex-col gap-4 min-w-0" data-testid="items-page">
    <header className="p-4 rounded-2xl border border-slate-800 bg-[#0F1522] flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-black text-slate-100 flex items-center gap-2"><Backpack className="text-amber-300" />Items & Machines</h1><p className="text-xs text-slate-400">{Object.keys(ITEMS).length} items and the TM/HM list for each game. Data ships with the app.</p></div>
      <div className="flex gap-2">
        <button type="button" aria-pressed={mode==='items'} onClick={()=>{setMode('items');resetFilters();}} className={`px-3 py-2 rounded-xl border text-xs font-bold ${mode==='items'?'bg-amber-400 text-slate-950 border-amber-300':'bg-slate-900 text-slate-300 border-slate-700'}`}>Items</button>
        <button type="button" aria-pressed={mode==='machines'} onClick={()=>{setMode('machines');resetFilters();}} className={`px-3 py-2 rounded-xl border text-xs font-bold ${mode==='machines'?'bg-amber-400 text-slate-950 border-amber-300':'bg-slate-900 text-slate-300 border-slate-700'}`}>TMs & HMs</button>
      </div>
    </header>
    <label className="relative flex items-center gap-2 text-xs text-slate-300"><Search className="w-4 h-4" /><input aria-label="Search items" value={query} onChange={event=>{setQuery(event.target.value);setPage(1);}} placeholder={mode==='items'?'Item name or effect':'Move, TM number or item'} className="min-w-0 flex-1 rounded-xl bg-slate-900 border border-slate-700 p-3 text-sm text-slate-100" /></label>
    {mode==='items'?<>
      <div className="flex flex-wrap gap-2">
        <label className="text-xs text-slate-300">Category<select aria-label="Item category" value={category} onChange={event=>{setCategory(event.target.value);setPage(1);}} className="ml-2 rounded bg-slate-900 p-2 border border-slate-700"><option value="all">All categories</option>{categories.map(value=><option key={value} value={value}>{label(value)}</option>)}</select></label>
        <label className="text-xs text-slate-300">Generation<select aria-label="Item generation" value={generation} onChange={event=>{setGeneration(event.target.value);setPage(1);}} className="ml-2 rounded bg-slate-900 p-2 border border-slate-700"><option value="all">All generations</option>{GENERATION_LABELS.slice(1).map((text,index)=><option key={text} value={index+1}>{text}</option>)}</select></label>
        <label className="text-xs text-slate-300">Game<select aria-label="Item game" value={gameFilter} onChange={event=>{setGameFilter(event.target.value);setPage(1);}} className="ml-2 rounded bg-slate-900 p-2 border border-slate-700 text-slate-100"><option value="all">All games</option>{GAMES.filter(entry=>(ALL_CANONICAL_GAME_IDS as GameId[]).includes(entry.id)).map(entry=><option key={entry.id} value={entry.id}>{entry.title}</option>)}</select></label>
        <DisplayLimitSelect label="Items per page" value={limit} onChange={value=>{setLimit(value);setPage(1);}} />
      </div>
      <PageControls page={current} pages={pages} total={rows.length} onChange={setPage} />
      {rows.length===0?<p role="status" className="text-sm text-slate-400">No items match that search.</p>:
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">{shown.map(([id,item])=>{
        const readable=humanItemName(item.name,item.category);
        const curated=curatedLocationsForItem(item.name);
        const scraped=ITEM_LOCATIONS[item.slug]??{};
        // Scraped entries are per Serebii game label; map to canonical ids.
        const scrapedEntries=Object.entries(scraped)
          .map(([label,where])=>({label,where,ids:SEREBII_GAME_IDS[label]??[]}))
          .filter(entry=>gameFilter==='all'||entry.ids.includes(gameFilter));
        const entries=curated?curated.locationsByGame.filter(entry=>gameFilter==='all'||[gameFilter,gamesGroup(gameFilter)].includes(entry.gameId)):[];
        const pickups=entries.filter(entry=>!entry.notPickup);
        const ownedPickups=pickups.filter(entry=>owned.includes(entry.gameId));
        const ownedScraped=scrapedEntries.filter(entry=>entry.ids.some(id=>owned.includes(id as GameId)));
        const expanded=openItem===id;
        return <article key={id} className="rounded-xl border border-slate-800 bg-[#0F1522]">
          <button type="button" aria-expanded={expanded} onClick={()=>setOpenItem(expanded?null:id)} className="w-full text-left p-3 flex items-start gap-3 cursor-pointer hover:bg-slate-900/60 rounded-xl">
            <ItemSprite slug={item.slug} name={readable} size={34} />
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-2"><span className="font-bold text-slate-100 text-sm">{readable}</span><span className="text-[10px] font-mono text-amber-300 shrink-0">{label(item.category)}</span></span>
              {item.effect&&!expanded&&<span className="block text-xs text-slate-300 line-clamp-2">{item.effect}</span>}
              <span className="block text-[10px] text-slate-500 mt-0.5">
                {scrapedEntries.length+pickups.length>0?`${scrapedEntries.length+pickups.length} known location${scrapedEntries.length+pickups.length===1?'':'s'}`:'No recorded pickup spot'}
                {hasItemSprite(item.slug)?' · artwork bundled':''}
              </span>
            </span>
          </button>
          {expanded&&<div className="px-3 pb-3 flex flex-col gap-2 border-t border-slate-800 pt-2">
            {item.effect&&<p className="text-xs text-slate-300">{item.effect}</p>}
            <p className="text-[10px] text-slate-500">{item.generations.length?'Available: '+item.generations.map(gen=>GENERATION_LABELS[gen]??`Gen ${gen}`).join(', '):'Availability not recorded'}{item.flingPower?` · Fling power ${item.flingPower}`:''}{item.cost?` · ${item.cost} coins`:''}</p>
            {scrapedEntries.length>0&&<>
              {gameFilter==='all'&&ownedScraped.length>0&&<div>
                <h3 className="text-[11px] font-bold text-emerald-300 mb-1">How to get it in games you own ({ownedScraped.length})</h3>
                <ul className="flex flex-col gap-1 max-h-44 overflow-auto">{ownedScraped.map((entry,index)=><li key={index} className="text-[11px] text-slate-300 border-t border-slate-800 pt-1"><span className="text-slate-400">{entry.label}:</span> {entry.where}</li>)}</ul>
              </div>}
              <div>
                <h3 className="text-[11px] font-bold text-sky-200 mb-1">How to get it ({scrapedEntries.length} game{scrapedEntries.length===1?'':'s'})</h3>
                <ul className="flex flex-col gap-1 max-h-52 overflow-auto">{scrapedEntries.map((entry,index)=><li key={index} className="text-[11px] text-slate-300 border-t border-slate-800 pt-1">
                  <span className="text-slate-400">{entry.label}{UNTRACKED_ITEM_GAMES.has(entry.label)?' (not tracked)':''}:</span> {entry.where}
                </li>)}</ul>
              </div>
            </>}
            {curated?<>
              {gameFilter==='all'&&ownedPickups.length>0&&<div>
                <h3 className="text-[11px] font-bold text-emerald-300 mb-1">In games you own ({ownedPickups.length})</h3>
                <ul className="flex flex-col gap-1 max-h-44 overflow-auto">{ownedPickups.map((entry,index)=><li key={index} className="text-[11px] text-slate-300 border-t border-slate-800 pt-1"><span className="text-slate-400">{entry.gameShortTitle}:</span> {entry.location}</li>)}</ul>
              </div>}
              <div>
                <h3 className="text-[11px] font-bold text-sky-200 mb-1">All recorded locations ({pickups.length})</h3>
                {pickups.length===0?<p className="text-[11px] text-slate-400">No pickup spots recorded for {gameFilter==='all'?'any game':GAMES.find(entry=>entry.id===gameFilter)?.title}.</p>:
                <ul className="flex flex-col gap-1 max-h-44 overflow-auto">{entries.map((entry,index)=><li key={index} className="text-[11px] text-slate-300 border-t border-slate-800 pt-1"><span className="text-slate-400">{entry.gameShortTitle}:</span> {entry.location}{entry.notPickup&&<span className="text-amber-300"> · not a pickup</span>}</li>)}</ul>}
              </div>
            </>:scrapedEntries.length===0&&<p className="text-[11px] text-slate-400">No per-game acquisition data is recorded for this item. Its sprite and effect still ship with the app.</p>}
          </div>}
        </article>;
      })}</div>}
    </>:<>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-slate-300">Game<select aria-label="Machine game" value={game?.id??''} onChange={event=>setMachineGame(event.target.value as GameId)} className="ml-2 rounded bg-slate-900 p-2 border border-slate-700 text-slate-100">{machineGames.map(entry=><option key={entry.id} value={entry.id}>{entry.title}</option>)}</select></label>
        {owned.length>0&&<button type="button" onClick={()=>setAllGames(value=>!value)} className="text-xs text-amber-300 underline">{allGames?'Owned games only':'All games'}</button>}
      </div>
      {!game?<p role="status" className="text-sm text-slate-400">Select a game to list its TMs and HMs.</p>:
        machines.length===0?<p role="status" className="text-sm text-slate-400">{VERSION_GROUP_LABEL[group!]??game.title} has no recorded TM/HM machines in this data. Legends: Arceus and Pokémon GO use other move systems.</p>:
        <>
          <p className="text-xs text-slate-400">{VERSION_GROUP_LABEL[group!]??game.title} · {machineRows.length} of {machines.length} machines shown.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">{machineRows.map(entry=>{const isHm=entry.item.startsWith('HM');return <article key={`${entry.item}-${entry.n}`} className="p-3 rounded-xl border border-slate-800 bg-[#0F1522] flex items-center gap-3">
            <span className={`w-12 text-center rounded-lg py-1 text-[11px] font-black ${isHm?'bg-rose-500/20 text-rose-200 border border-rose-500/40':'bg-sky-500/20 text-sky-200 border border-sky-500/40'}`}>{entry.item}</span>
            <span className="min-w-0"><span className="block font-bold text-sm text-slate-100 truncate">{entry.move}</span><span className="block text-[10px] text-slate-400">{ITEM_TYPES[entry.type]??'—'} type{isHm?' · Hidden Machine':' · Technical Machine'}</span></span>
          </article>;})}</div>
          {machineRows.length===0&&<p role="status" className="text-sm text-slate-400">No machine matches that search for this game.</p>}
        </>}
    </>}
    <p className="text-[10px] text-slate-500">Item names, categories, effects and TM/HM machine tables come from PokéAPI. Per-area pickup lists are not part of that dataset, so exact find spots are shown in the map location panels where we have curated them.</p>
  </div>;
}
