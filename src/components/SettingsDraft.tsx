import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { SettingsViewProps } from './SettingsView';
import { DEFAULT_HOME_PANELS } from '../data/homePanels';
import { DEFAULT_HOME_DESIGN, useHomeDesign } from '../hooks/useHomeDesign';
import { areSoundEffectsEnabled, setSoundEffectsEnabled, SOUND_PREF_EVENT } from '../utils/gameboySound';

export interface AdditionalSettingsDraft { dirty:boolean; save:()=>Promise<boolean>; discard:()=>void }

/** Preferences are staged here, never sent to App/cloud until Save is pressed. */
export function SettingsDraft({render,...props}:SettingsViewProps & {render:(props:SettingsViewProps)=>ReactNode}){
  const {design,update}=useHomeDesign();
  const [appliedSound,setAppliedSound]=useState(areSoundEffectsEnabled);
  useEffect(()=>{const sync=()=>setAppliedSound(areSoundEffectsEnabled());window.addEventListener(SOUND_PREF_EVENT,sync);return()=>window.removeEventListener(SOUND_PREF_EVENT,sync);},[]);
  const incoming=useMemo(()=>({homePanels:props.homePanels,homeDesign:design,ownedGames:props.ownedGames,ownedDlcs:props.ownedDlcs,tallyGames:props.tallyGames,isPublic:props.isPublic,includeGo:props.includePokemonGoInSuggestions,sound:appliedSound}),[props.homePanels,design,props.ownedGames,props.ownedDlcs,props.tallyGames,props.isPublic,props.includePokemonGoInSuggestions,appliedSound]);
  const [baseline,setBaseline]=useState(incoming);
  const [draft,setDraft]=useState(incoming);
  const [status,setStatus]=useState('');
  const [saving,setSaving]=useState(false);
  const additional=useRef<AdditionalSettingsDraft|null>(null);
  const [additionalDirty,setAdditionalDirty]=useState(false);
  const onAdditionalDraftChange=useCallback((next:AdditionalSettingsDraft|null)=>{additional.current=next;setAdditionalDirty(next?.dirty ?? false);},[]);
  const prefsDirty=JSON.stringify(draft)!==JSON.stringify(baseline);
  const dirty=prefsDirty || additionalDirty;
  useEffect(()=>{if(dirty)setStatus('');},[dirty]);
  // A remote snapshot may update applied values, but never replaces active edits.
  useEffect(()=>{if(!prefsDirty){setBaseline(incoming);setDraft(incoming);}},[incoming,prefsDirty]);
  useLayoutEffect(()=>{props.onUnsavedChangesChange?.(dirty);});
  useEffect(()=>()=>props.onUnsavedChangesChange?.(false),[props.onUnsavedChangesChange]);
  useEffect(()=>{
    if(!dirty)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);
  const save=async()=>{
    if(saving)return;
    setSaving(true);
    try {
      if(additional.current?.dirty && !(await additional.current.save())) {
        setStatus('PIN was not saved. Check the PIN fields in Storage & Sync, then try again.');
        return;
      }
      setAdditionalDirty(false);
      const accountChanges = JSON.stringify([draft.homePanels,draft.homeDesign,draft.ownedGames,draft.ownedDlcs,draft.isPublic]) !== JSON.stringify([props.homePanels,design,props.ownedGames,props.ownedDlcs,props.isPublic]);
      if(accountChanges)props.onPreferencesApplied?.();
      for(const id of Object.keys(draft.homePanels) as (keyof typeof draft.homePanels)[]) if(draft.homePanels[id]!==props.homePanels[id])props.onToggleHomePanel(id);
      if(JSON.stringify(draft.ownedGames)!==JSON.stringify(props.ownedGames))props.onSetAllOwnedGames(draft.ownedGames);
      if(JSON.stringify(draft.ownedDlcs)!==JSON.stringify(props.ownedDlcs))props.onSetAllOwnedDlcs(draft.ownedDlcs);
      if(JSON.stringify(draft.tallyGames)!==JSON.stringify(props.tallyGames))props.onSetAllTallyGames(draft.tallyGames);
      if(draft.isPublic!==props.isPublic)props.onTogglePublic(draft.isPublic);
      if(draft.includeGo!==props.includePokemonGoInSuggestions)props.onToggleIncludePokemonGoInSuggestions();
      if(JSON.stringify(draft.homeDesign)!==JSON.stringify(design))update(draft.homeDesign);
      if(draft.sound!==appliedSound)setSoundEffectsEnabled(draft.sound);
      setBaseline(draft);
      setStatus('Settings saved on this device. Account-backed preferences upload when cloud sign-in and connection allow it.');
    } catch {
      setStatus('Could not finish saving settings. Your draft is still here; please try again.');
    } finally { setSaving(false); }
  };
  const toggle=<T,>(items:T[],id:T)=>items.includes(id)?items.filter(item=>item!==id):[...items,id];
  const toolbar=(sticky:boolean)=><div className={`${sticky?'sticky top-0 z-20 ':''}flex flex-wrap justify-between gap-3 items-center p-3 bg-slate-950/95 border border-slate-700 rounded-xl`}>
    <div className="text-xs text-slate-300"><strong className={dirty?'text-amber-300':'text-emerald-300'}>{dirty?'Unsaved settings':'No unsaved changes'}</strong><p>Save applies preferences from all Settings sections.</p></div>
    <div className="flex flex-wrap gap-2"><button type="button" disabled={!dirty || saving} onClick={()=>{additional.current?.discard();setAdditionalDirty(false);setDraft(incoming);setBaseline(incoming);setStatus('Unsaved changes discarded.');}} className="px-3 py-2 rounded-lg border border-slate-600 text-slate-200 text-xs disabled:opacity-40">Discard changes</button><button type="button" disabled={!dirty || saving} onClick={()=>void save()} className="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-40">{saving?'Saving settings…':'Save settings'}</button></div>
  </div>;
  return <div className="flex flex-col gap-4">
    {toolbar(true)}
    {status && <p role="status" className="text-sm text-sky-200">{status}</p>}
    {render({...props,
      onAdditionalDraftChange,
      homePanels:draft.homePanels,ownedGames:draft.ownedGames,ownedDlcs:draft.ownedDlcs,tallyGames:draft.tallyGames,isPublic:draft.isPublic,includePokemonGoInSuggestions:draft.includeGo,
      draftHomeDesign:draft.homeDesign,onDraftHomeDesignChange:next=>setDraft(d=>({...d,homeDesign:next})),
      draftSoundEffects:draft.sound,onDraftSoundEffectsChange:sound=>setDraft(d=>({...d,sound})),
      onToggleHomePanel:id=>setDraft(d=>({...d,homePanels:{...d.homePanels,[id]:!d.homePanels[id]}})),
      onResetHomePanels:()=>setDraft(d=>({...d,homePanels:{...DEFAULT_HOME_PANELS},homeDesign:DEFAULT_HOME_DESIGN})),
      onToggleOwnedGame:id=>setDraft(d=>({...d,ownedGames:toggle(d.ownedGames,id)})),onSetAllOwnedGames:ownedGames=>setDraft(d=>({...d,ownedGames})),
      onToggleOwnedDlc:id=>setDraft(d=>({...d,ownedDlcs:toggle(d.ownedDlcs,id)})),onSetAllOwnedDlcs:ownedDlcs=>setDraft(d=>({...d,ownedDlcs})),
      onToggleTallyGame:id=>setDraft(d=>({...d,tallyGames:toggle(d.tallyGames,id)})),onSetAllTallyGames:tallyGames=>setDraft(d=>({...d,tallyGames})),
      onTogglePublic:isPublic=>setDraft(d=>({...d,isPublic})),
      onToggleIncludePokemonGoInSuggestions:()=>setDraft(d=>({...d,includeGo:!d.includeGo})),
    })}
    {toolbar(false)}
  </div>;
}
