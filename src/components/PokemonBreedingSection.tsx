import { useState } from 'react';
import { Egg } from 'lucide-react';
import { BREEDING_SPECIES } from '../data/breeding.generated';
import { ALL_CANONICAL_GAME_IDS, GAMES, normalizeToCanonicalGames, type GameId, type PokemonEntry } from '../data/pokemonData';
import { babyForSpecies, breedingGuide, eggGroupNames } from '../utils/breeding';

/** Offline species breeding guide with title-specific baby/incense mechanics. */
export function PokemonBreedingSection({pokemon,dex,ownedGames,onSelectPokemon}:{pokemon:PokemonEntry;dex:PokemonEntry[];ownedGames:GameId[];onSelectPokemon:(pokemon:PokemonEntry)=>void}){
  const [allGames,setAllGames]=useState(false);
  const owned=normalizeToCanonicalGames(ownedGames);
  const games=GAMES.filter(game=>(ALL_CANONICAL_GAME_IDS as GameId[]).includes(game.id) && (allGames || !owned.length || owned.includes(game.id)));
  const [choice,setChoice]=useState<GameId|null>(null);
  const compatible=(game:typeof games[number])=>Boolean(pokemon.availability[game.id] && pokemon.availability[game.id].status!=='unavailable');
  const selected=games.find(game=>game.id===choice)??games.find(game=>compatible(game) && breedingGuide(pokemon.id,game.id).method)??games.find(compatible)??games[0];
  const data=BREEDING_SPECIES[pokemon.id];
  if(!data || !selected)return null;
  const guide=breedingGuide(pokemon.id,selected.id);
  const compatibility=pokemon.availability[selected.id];
  const unavailable=!compatibility || compatibility.status==='unavailable';
  const babyId=babyForSpecies(pokemon.id);
  const monLink=(id:number)=>{
    const mon=dex.find(p=>p.id===id);
    return mon?<button key={id} type="button" onClick={()=>onSelectPokemon(mon)} className="text-amber-200 underline underline-offset-2">{mon.name}</button>:<span key={id}>#{id}</span>;
  };
  const list=(ids:number[])=>ids.map((id,i)=><span key={id}>{i>0?' / ':''}{monLink(id)}</span>);
  const babyExists=babyId && BREEDING_SPECIES[babyId]?.generation<=guide.generation;
  const adultIds=guide.adultIds.filter(id=>{const entry=dex.find(p=>p.id===id)?.availability[selected.id];return entry && entry.status!=='unavailable';});
  const cycles=guide.eggIds.length===1?BREEDING_SPECIES[guide.eggIds[0]]?.hatchCycles:undefined;
  return <section aria-label="Baby Pokémon and breeding" className="rounded-2xl border border-slate-800 bg-[#0F1522] p-4 flex flex-col gap-3">
    <h3 className="flex gap-2 items-center font-bold text-slate-100"><Egg className="w-4 h-4 text-amber-300" />Eggs & Baby Pokémon</h3>
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200">{data.baby?'Baby Pokémon':'Adult / standard species'}</span>
      {eggGroupNames(pokemon.id).map(group=><span key={group} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sky-200">{group}</span>)}
    </div>
    {babyId && !data.baby && <p className="text-xs text-slate-300">Baby in this family: {monLink(babyId)}</p>}
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs text-slate-300">Breeding game <select aria-label="Breeding game" value={selected.id} onChange={event=>setChoice(event.target.value as GameId)} className="ml-2 max-w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-100">{games.map(game=><option key={game.id} value={game.id}>{game.title}</option>)}</select></label>
      {owned.length>0 && <button type="button" onClick={()=>setAllGames(v=>!v)} className="text-[11px] text-amber-200 underline">{allGames?'Owned games only':'All games'}</button>}
    </div>
    {!guide.method ? <p role="status" className="text-xs text-slate-400">{guide.reason}</p>
      : unavailable ? <p role="status" className="text-xs text-slate-400">{pokemon.name} is not supported in {selected.title}. Choose a compatible title.</p>
      : <div className="flex flex-col gap-2 text-xs text-slate-300">
        <p className="font-semibold text-sky-200">{guide.location}</p>
        <p>{guide.reason}</p>
        {data.baby && adultIds.length>0 && <p>Adult parents: {list(adultIds)}</p>}
        {guide.eggIds.length>0 && <p>{data.baby?'Baby Egg':'Egg offspring'}: {list(guide.eggIds)}</p>}
        {guide.incense && <div className="rounded-lg bg-amber-950/30 border border-amber-500/30 p-2 text-amber-100">
          <p>{guide.incense.item} is required to hatch {monLink(guide.incense.babyId)}. Without incense, the Egg hatches {monLink(guide.incense.without)}.</p>
        </div>}
        {babyExists && !guide.incense && guide.generation===9 && guide.eggIds.length>0 && <p>Scarlet / Violet: no incense needed. Breeding a compatible adult in this family produces the baby naturally.</p>}
        {guide.eggIds.length>0 && <p>Hatches at Lv. {guide.hatchLevel}{cycles!==undefined?` · ${cycles} base Egg cycles`:''}. Step counts and hatch boosts vary by game.</p>}
        {guide.eggIds.length>1 && <p>Either species can hatch from this pairing.</p>}
        {guide.canBreed && pokemon.id!==132 && guide.generation>=6 && <p>Everstone passes the holder’s nature; Destiny Knot passes five IVs from the parents.</p>}
        {guide.canBreed && (guide.generation>=4 || selected.id==='emerald') && <p>Flame Body in your party helps Eggs hatch faster.</p>}
        {guide.method==='Picnic' && (guide.canBreed || data.baby) && <p>Have compatible parents in your party, start a picnic, then check the basket. Egg Power helps Eggs appear. Eggs hatch while travelling with them in your party, not during the picnic.</p>}
        <p className="text-[10px] text-slate-500">Species guide. Regional forms may hatch differently; check the parent’s form and Everstone rules. Egg Groups and base cycles: PokéAPI; game rules: Bulbapedia.</p>
      </div>}
  </section>;
}
