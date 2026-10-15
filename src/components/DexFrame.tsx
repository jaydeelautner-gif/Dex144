import React from 'react';

/**
 * Adaptive Pokédex chassis around the running app. The same markup serves every
 * device, but the border thickness, padding and detail level scale with the
 * viewport:
 *   • phone (<sm):    a very minimal shell — thin border, tiny padding, no
 *                     hinges, screws or hardware strips.
 *   • small tablet:   moderate bezel, a couple of details.
 *   • iPad (lg+):     the full detailed chassis — thick borders, bezel, rim
 *                     highlight and hardware strips.
 */
export const DexFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#070A10] p-1 sm:p-2.5 lg:p-4 flex items-stretch justify-center">
    <div className="w-full max-w-[1600px] rounded-xl sm:rounded-[2rem] lg:rounded-[3rem] bg-gradient-to-b from-[#DC2626] via-[#B91C1C] to-[#881337] border border-[#7F1D1D] sm:border-4 lg:border-8 border-[#7F1D1D] shadow-[0_25px_80px_rgba(0,0,0,0.95)] p-px sm:p-1.5 lg:p-2.5 flex flex-col overflow-hidden relative">
      {/* Rim highlight — tablet and larger only */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-white/25 rounded-t-[2rem] lg:rounded-t-[3rem] hidden sm:block pointer-events-none" />
      {/* Hinge collars — iPad only */}
      <div className="absolute left-0 inset-y-16 w-2.5 lg:w-3.5 flex-col justify-between py-6 pointer-events-none z-20 hidden md:flex">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="w-full h-10 rounded-r-md bg-gradient-to-r from-[#450A0A] via-[#7F1D1D] to-[#991B1B] border-y border-r border-[#300] shadow-md" />
        ))}
      </div>
      <div aria-label="Pokédex hardware" className="hidden md:flex items-center gap-3 px-5 py-3 border-b-2 border-red-950/70 mb-2">
        <div className="w-12 h-12 rounded-full border-4 border-slate-300 bg-gradient-to-br from-cyan-300 via-sky-600 to-blue-950 shadow-[inset_0_0_12px_#22d3ee,0_2px_8px_#450a0a]" />
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-400 border border-rose-200" />
          <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-200" />
          <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-200" />
        </div>
        <span className="ml-auto text-red-100 font-black tracking-widest text-sm">POKÉDEX <span className="text-xs text-red-200 font-mono">HANDY909</span></span>
      </div>
      {/* Screen bezel */}
      <div className="rounded-lg sm:rounded-3xl lg:rounded-[2.5rem] bg-[#0B0F17] border border-[#1E293B] sm:border-4 lg:border-8 border-[#1E293B] shadow-[inset_0_4px_35px_rgba(0,0,0,0.9)] flex flex-col min-h-[calc(100vh-0.5rem)] sm:min-h-[calc(100vh-1.25rem)] lg:min-h-[calc(100vh-2rem)] overflow-hidden relative">
        {children}
      </div>
    </div>
  </div>
);
