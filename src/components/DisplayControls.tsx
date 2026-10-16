import { useEffect, useState } from 'react';
export type DisplayLimit = number | 'all';
export function useDisplayLimit(key: string, initial: DisplayLimit) {
  const [limit, setLimit] = useState<DisplayLimit>(() => {
    try { const value = localStorage.getItem(key); if (value === 'all') return 'all'; if (value && Number.isInteger(Number(value)) && Number(value) > 0) return Number(value); } catch { /* unavailable storage */ }
    return initial;
  });
  useEffect(() => { try { localStorage.setItem(key, String(limit)); } catch { /* unavailable storage */ } }, [key, limit]);
  return [limit, setLimit] as const;
}
export function DisplayLimitSelect({label, value, onChange, boxes = false}: {label:string; value:DisplayLimit; onChange:(n:DisplayLimit)=>void; boxes?:boolean}) {
  return <label className="inline-flex flex-wrap items-center gap-2 text-xs text-slate-300 font-semibold">{label}
    <select aria-label={label} value={value} onChange={e=>onChange(e.target.value==='all'?'all':Number(e.target.value))} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100">
      {(boxes ? [1,2,4,8,16] : [12,24,30,60,120,180]).map(n=><option key={n} value={n}>{n}</option>)}
      <option value="all">Show all</option>
    </select>
  </label>;
}
export function PageControls({page,pages,onChange,total}:{page:number;pages:number;onChange:(p:number)=>void;total:number}) {
  return <nav aria-label="Results pages" className="flex flex-wrap gap-3 items-center text-xs text-slate-300">
    <button type="button" disabled={page<=1} onClick={()=>onChange(page-1)} className="px-3 py-2 rounded-lg border border-slate-700 disabled:opacity-40">Previous</button>
    <span>Page {page} of {pages} · {total} results</span>
    <button type="button" disabled={page>=pages} onClick={()=>onChange(page+1)} className="px-3 py-2 rounded-lg border border-slate-700 disabled:opacity-40">Next</button>
  </nav>;
}
