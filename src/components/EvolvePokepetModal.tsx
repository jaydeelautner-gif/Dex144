import React, { useState } from 'react';
import type { PokemonEntry, GameId } from '../data/pokemonData';
import { GAMES } from '../data/pokemonData';
import type { PokemonInstance } from '../data/pokemonInventoryData';
import { getPokepetEvolutionChoices, type EvolutionRequest } from '../utils/pokepetEvolution';
import { PokemonSprite } from './PokemonSprite';

export function EvolvePokepetModal({ pet, dex, ownedGames, inventory, onClose, onConfirm }: {
  pet: PokemonInstance; dex: PokemonEntry[]; ownedGames: GameId[]; inventory: PokemonInstance[];
  onClose: () => void; onConfirm: (request: EvolutionRequest) => Promise<void>;
}) {
  const [gameId, setGameId] = useState<GameId | ''>(pet.currentGameId ?? pet.gameId ?? '');
  const choices = getPokepetEvolutionChoices(pet, dex, gameId || undefined);
  const [targetId, setTargetId] = useState(choices.length === 1 ? choices[0].target.id : 0);
  const [level, setLevel] = useState('');
  const [usedItem, setUsedItem] = useState<'' | 'yes' | 'no'>('');
  const [itemName, setItemName] = useState('');
  const [homeMove, setHomeMove] = useState(false);
  const [returnedHome, setReturnedHome] = useState(false);
  const [placement, setPlacement] = useState<'' | 'inventory' | 'slot'>('');
  const [requirementsConfirmed, setRequirementsConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const choice = choices.find(c => c.target.id === targetId);
  const currentName = dex.find(p => p.id === pet.pokemonId)?.name ?? pet.pokemonId;
  const occupied = inventory.some(p => p.pokeId !== pet.pokeId && p.pokemonId === targetId && p.storedInHome && p.isInLivingBox);
  const compatibleGames = ownedGames.filter(id => (id !== 'pogo' || (!pet.storedInHome && (pet.currentGameId ?? pet.gameId) === 'pogo')) && choice?.target.availability[id]?.status && choice.target.availability[id].status !== 'unavailable');
  const valid = choice && compatibleGames.includes(gameId as GameId) && /^\d{1,3}$/.test(level) && +level >= 1 && +level <= 100 && usedItem && (usedItem === 'no' || itemName.trim()) && (!pet.storedInHome || homeMove) && (!pet.isInLivingBox || placement) && requirementsConfirmed;
  async function submit() {
    if (!valid || !gameId) return;
    setBusy(true); setError('');
    try { await onConfirm({ pokeId: pet.pokeId, expectedSpeciesId: pet.pokemonId, targetId, level: +level, usedItem: usedItem === 'yes', itemName, gameId, homeMoveConfirmed: homeMove, returnedToHome: returnedHome, placement: pet.isInLivingBox ? placement : 'inventory' }); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Evolution could not be saved.'); }
    finally { setBusy(false); }
  }
  const button = 'px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 disabled:opacity-40';
  return <div role="dialog" aria-modal="true" aria-labelledby="evolve-title" className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4">
    <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0F1522] border border-teal-500/50 p-5 flex flex-col gap-4">
      <div className="flex justify-between"><h2 id="evolve-title" className="font-bold text-xl text-teal-300">Evolve {currentName}</h2><button disabled={busy} onClick={onClose} className={button}>Cancel</button></div>
      <p className="text-xs text-slate-300">POKEID <strong>{pet.pokeId}</strong> stays the same. Gender, shiny status, nickname and origin stay unchanged. This replaces the old species record; it does not create a second PokéPet.</p>
      {!choices.length ? <p className="text-amber-300">No compatible next evolution is available in the verified graph for this species, form and gender. Unsupported forms are blocked rather than silently changed.</p> : <>
        <fieldset><legend className="text-sm text-slate-300">Choose the next species</legend><div className="flex flex-wrap gap-2 mt-2">{choices.map(c => <button key={c.target.id} aria-pressed={targetId === c.target.id} onClick={() => { setTargetId(c.target.id); setRequirementsConfirmed(false); }} className={`${button} ${targetId === c.target.id ? 'border-teal-400' : ''}`}><PokemonSprite id={c.target.id} name={c.target.name} size="sm" />{c.target.name}</button>)}</div></fieldset>
        {choice && <p className="text-xs text-slate-400">Form: {choice.variantName}. Reference requirement: {choice.requirement}. Methods can vary by game. You may record any level 1–100.</p>}
        <label className="text-sm text-slate-300">Game used for evolution<select aria-label="Evolution game" className={`${button} block w-full mt-1`} value={gameId} onChange={e => setGameId(e.target.value as GameId)}><option value="">Choose a compatible owned game</option>{compatibleGames.map(id => <option key={id} value={id}>{GAMES.find(g => g.id === id)?.shortTitle ?? id}</option>)}</select></label>
        {pet.storedInHome && <label className="text-sm text-amber-200"><input type="checkbox" checked={homeMove} onChange={e => setHomeMove(e.target.checked)} /> I moved this PokéPet out of HOME into the selected game to evolve it.</label>}
        <label className="text-sm text-slate-300"><input type="checkbox" checked={returnedHome} onChange={e => { setReturnedHome(e.target.checked); setPlacement(''); }} /> I returned it to HOME after evolution (otherwise it remains in the selected game).</label>
        <fieldset className="text-slate-200"><legend>New level (1–100) · current level: {pet.level}</legend><input aria-label="New evolution level" inputMode="numeric" value={level} onChange={e => setLevel(e.target.value.replace(/\D/g, '').slice(0,3))} className={`${button} w-full text-center text-xl mb-2`} />
          <div className="grid grid-cols-3 gap-2">{['1','2','3','4','5','6','7','8','9','Clear','0','⌫'].map(d => <button type="button" aria-label={d === '⌫' ? 'Backspace level' : d} key={d} className={button} onClick={() => setLevel(v => d === 'Clear' ? '' : d === '⌫' ? v.slice(0,-1) : (v === '0' ? d : v + d).slice(0,3))}>{d}</button>)}</div>
        </fieldset>
        <fieldset className="text-slate-300"><legend>Was an item used for this evolution?</legend><div className="flex gap-2 mt-1">{(['yes','no'] as const).map(v => <button key={v} aria-pressed={usedItem === v} className={`${button} ${usedItem === v ? 'border-teal-400' : ''}`} onClick={() => setUsedItem(v)}>{v === 'yes' ? 'Yes' : 'No'}</button>)}</div>{usedItem === 'yes' && <input aria-label="Evolution item name" maxLength={100} placeholder="Item name (required)" className={`${button} w-full mt-2`} value={itemName} onChange={e => setItemName(e.target.value)} />}</fieldset>
        {pet.isInLivingBox && <fieldset className="text-sm text-amber-200"><legend>What should happen to its Living Dex placement?</legend><p className="text-xs mb-2">The old slot will be freed if no other specimen occupies it. {occupied ? 'The evolved species slot is already occupied; that PokéPet will not be replaced.' : ''}</p><label className="block"><input type="radio" name="evolution-placement" checked={placement === 'inventory'} onChange={() => setPlacement('inventory')} /> Keep evolved PokéPet in inventory (not a Living Dex slot)</label><label className="block"><input type="radio" name="evolution-placement" disabled={occupied || !returnedHome} checked={placement === 'slot'} onChange={() => setPlacement('slot')} /> Move to its new species slot (requires return to HOME and an empty slot)</label></fieldset>}
        <label className="text-xs text-slate-300"><input type="checkbox" checked={requirementsConfirmed} onChange={e => setRequirementsConfirmed(e.target.checked)} /> I confirm this evolution and form are possible in the selected game and I met its requirements. Item use and the new level will be logged on this PokéPet.</label>
        <p className="text-xs text-slate-400">If it was your last specimen of the old species, that species becomes uncaught. Hints will show wild reacquisition where recorded, otherwise trade/other acquisition guidance.</p>
        {error && <p role="alert" className="text-rose-300">{error}</p>}
        <button disabled={!valid || busy} className={`${button} bg-teal-800 font-bold`} onClick={submit}>{busy ? 'Saving evolution…' : 'Confirm evolution — keep POKEID'}</button>
      </>}
    </div>
  </div>;
}
