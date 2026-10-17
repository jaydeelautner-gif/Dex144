import { HOME_PANELS, type HomePanelId } from '../data/homePanels';
import { useHomeDesign, DEFAULT_HOME_DESIGN, type HomeDesign } from '../hooks/useHomeDesign';
export function HomeDesignSettings({value,onChange}:{value?:HomeDesign;onChange?:(next:HomeDesign)=>void} = {}){
  const applied=useHomeDesign();
  const design=value ?? applied.design;
  const update=onChange ?? applied.update;
  const move=(id:HomePanelId,offset:number)=>{const order=[...design.order];const i=order.indexOf(id);const j=i+offset;if(j<0||j>=order.length)return;[order[i],order[j]]=[order[j],order[i]];update({...design,order});};
  const input='bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100';
  return <div className="flex flex-col gap-4 border border-slate-700 p-4 rounded-xl">
    <h3 className="font-bold text-amber-200">Home layout & ordering</h3>
    <div className="flex flex-wrap gap-3 text-xs text-slate-300">
      <label className="flex flex-col gap-1">Trainer sidebar<select aria-label="Home layout" className={input} value={design.layout} onChange={e=>update({...design,layout:e.target.value as typeof design.layout})}><option value="left">On the left</option><option value="right">On the right</option><option value="stacked">Stacked / full width</option></select></label>
      <label className="flex flex-col gap-1">Main panels<select aria-label="Home panel columns" className={input} value={design.columns} onChange={e=>update({...design,columns:Number(e.target.value) as 1|2})}><option value={1}>One column</option><option value={2}>Two columns on wide screens</option></select></label>
      <label className="flex flex-col gap-1">Spacing<select aria-label="Home spacing" className={input} value={design.spacing} onChange={e=>update({...design,spacing:e.target.value as typeof design.spacing})}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>
    </div>
    <p className="text-xs text-slate-400">Reorder panels with the arrows. Hidden panels keep their place.</p>
    <ol className="flex flex-col gap-1">{design.order.map((id,i)=><li key={id} className="flex items-center justify-between gap-2 text-xs text-slate-200 rounded-lg border border-slate-800 bg-slate-900 p-2"><span>{HOME_PANELS.find(p=>p.id===id)?.label}</span><span className="flex gap-1"><button type="button" aria-label={`Move ${id} up`} disabled={i===0} onClick={()=>move(id,-1)} className="p-2 border border-slate-700 rounded disabled:opacity-30">↑</button><button type="button" aria-label={`Move ${id} down`} disabled={i===design.order.length-1} onClick={()=>move(id,1)} className="p-2 border border-slate-700 rounded disabled:opacity-30">↓</button></span></li>)}</ol>
    <button type="button" onClick={()=>update(DEFAULT_HOME_DESIGN)} className="self-start text-amber-300 text-xs underline">Reset layout and ordering</button>
  </div>;
}
