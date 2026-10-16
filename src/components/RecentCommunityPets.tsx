import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRecentRegisteredPokepets, type RecentCommunityPet } from '../firebase';
import { getVariationsForPokemon } from '../data/regionalVariantsData';
import type { PokemonEntry } from '../data/pokemonData';
import { PokemonSprite } from './PokemonSprite';
export function RecentCommunityPets({dex,onLookup}:{dex:PokemonEntry[];onLookup?:(id:string)=>unknown}) {
  const [pets,setPets]=useState<RecentCommunityPet[]>([]);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const request=useRef(0);
  const load=useCallback(async()=>{
    const current=++request.current;
    setLoading(true);setError('');
    try { const result=await fetchRecentRegisteredPokepets(); if(current===request.current)setPets(result); }
    catch { if(current===request.current)setError(navigator.onLine ? 'Community registrations could not be loaded. Try again when the server is available.' : 'Offline — reconnect to load recent community registrations.'); }
    finally {if(current===request.current)setLoading(false);}
  },[]);
  useEffect(()=>{void load();const reconnect=()=>{void load();};window.addEventListener('online',reconnect);return()=>{request.current++;window.removeEventListener('online',reconnect);};},[load]);
  return <section aria-label="Recently registered community PokéPets" className="bg-[#0F1522] border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 min-w-0">
    <div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-bold text-slate-100">Recently Registered · Community</h2><p className="text-xs text-slate-400">The latest 12 registrations from trainers across the site’s public PokéPet registry.</p></div><button type="button" disabled={loading} onClick={()=>void load()} className="text-xs text-amber-300 disabled:opacity-40">Refresh</button></div>
    {loading && <p role="status" className="text-sm text-slate-400">Loading recent registrations…</p>}
    {error && <p role="status" className="text-sm text-amber-200">{error}</p>}
    {!loading && !error && !pets.length && <p className="text-sm text-slate-400">No community registrations yet.</p>}
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">{pets.map(pet=>{
      const mon=dex.find(p=>p.id===pet.pokemonId);
      const variant=mon?getVariationsForPokemon(mon).find(v=>v.variantId===pet.variantId):undefined;
      return <button key={pet.pokeId} type="button" onClick={()=>onLookup?.(pet.pokeId)} className="text-left min-w-0 rounded-xl p-3 border border-slate-800 bg-slate-900 hover:border-amber-400">
      <PokemonSprite id={variant?.spriteId ?? pet.pokemonId} imageUrl={variant?.imageUrl} name={mon?.name || 'Pokémon'} shiny={pet.isShiny} className="w-16 h-16 mx-auto" />
      <span className="block truncate text-sm font-bold text-slate-100">{pet.nickname || dex.find(p=>p.id===pet.pokemonId)?.name || `#${pet.pokemonId}`}</span>
      <span className="block truncate text-xs text-amber-200">Lv. {pet.level} · {pet.trainerName}</span>
      {pet.createdAt>0 && <time className="text-[10px] text-slate-400" dateTime={new Date(pet.createdAt).toISOString()}>{new Date(pet.createdAt).toLocaleString()}</time>}
    </button>;})}</div>
  </section>;
}
