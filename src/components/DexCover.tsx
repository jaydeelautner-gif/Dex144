import React from 'react';
import { Sparkles, Power } from 'lucide-react';
import { playPokedexOpenSound, primeGameboyAudio } from '../utils/gameboySound';

/**
 * Backdrop for the closed dex. Drop the artwork at `public/backdrop.jpg` (or
 * .png/.webp) and it is used automatically; otherwise a lightning-storm
 * gradient stands in, so the screen is never blank. No build step is required —
 * files in /public are served as-is.
 */
const BACKDROP_CANDIDATES = ['/backdrop.jpg', '/backdrop.png', '/backdrop.webp'];

const StormBackdrop: React.FC = () => {
  const [source, setSource] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      for (const candidate of BACKDROP_CANDIDATES) {
        try {
          const res = await fetch(candidate, { method: 'HEAD' });
          if (res.ok && !cancelled) { setSource(candidate); return; }
        } catch { /* try the next candidate */ }
      }
    };
    void probe();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {source ? (
        <img src={source} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-[radial-gradient(120%_90%_at_50%_15%,#f97316_0%,#b91c1c_32%,#1e1b4b_62%,#080b18_100%)]" />
      )}
      {/* Readability scrim plus an electric shimmer over the artwork. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/70" />
      <div className="absolute inset-0 opacity-25 bg-[linear-gradient(115deg,transparent_35%,rgba(125,211,252,0.35)_48%,transparent_60%)] animate-pulse" />
      {/* Silhouette ridge, echoing the rocky ledge in the artwork. */}
      <svg viewBox="0 0 100 22" preserveAspectRatio="none" className="absolute bottom-0 inset-x-0 h-40 w-full opacity-80">
        <path d="M0 22 L0 12 L10 7 L22 14 L34 8 L46 15 L58 9 L72 16 L86 10 L100 15 L100 22 Z" fill="#05070f" />
      </svg>
    </div>
  );
};

/**
 * The closed Pokédex screen: what a returning guest/device sees when the app
 * opens or after logging out. Deliberately frame-less — the device is shut,
 * so no screen bezel or interior is shown. Clicking it re-opens the dex,
 * which plays the opening animation before the terminal reappears.
 */
export const ClosedDexCover: React.FC<{ onOpen: () => void }> = ({ onOpen }) => (
  <div className="min-h-screen flex items-center justify-center p-4 select-none relative isolate overflow-hidden bg-[#070A10]">
    <StormBackdrop />
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={primeGameboyAudio}
      className="group relative w-full max-w-sm rounded-[2rem] sm:rounded-[2.8rem] bg-gradient-to-b from-[#DC2626] via-[#B91C1C] to-[#881337] border-2 sm:border-4 border-[#7F1D1D] shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_50px_rgba(220,38,38,0.3)] backdrop-blur-[2px] p-5 sm:p-7 flex flex-col gap-4 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
      title="Open the Pokédex"
    >
      {/* Top sensor strip: lens + LEDs (the closed face) */}
      <div className="flex items-center justify-between border-b-2 border-[#7F1D1D]/70 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-1 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 border-2 border-slate-600 shadow-xl flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 via-sky-600 to-blue-900 shadow-[inset_0_0_16px_rgba(6,182,212,0.9)] flex items-center justify-center animate-pulse">
              <div className="w-5 h-5 rounded-full bg-cyan-300/70 blur-[1px] shadow-[0_0_15px_#22d3ee]" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-rose-500 border border-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse" />
            <span className="w-4 h-4 rounded-full bg-amber-400 border border-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
            <span className="w-4 h-4 rounded-full bg-emerald-400 border border-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          </div>
        </div>
        <span className="text-right hidden sm:block">
          <span className="text-[10px] font-mono tracking-widest text-red-200/90 font-black block">MODEL: HANDY909</span>
          <span className="text-[9px] font-mono tracking-wider text-red-300/70 block">SILPH CO. • KANTO ED.</span>
        </span>
      </div>

      {/* Closed-cover label + open prompt */}
      <div className="flex flex-col items-center gap-2 py-5">
        <span className="text-3xl font-black tracking-widest text-slate-100 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          POKÉDEX
        </span>
        <span className="text-[10px] font-mono tracking-[0.3em] text-red-200/80 uppercase">
          Living Dex Terminal — Closed
        </span>
        <span className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/80 border border-amber-400/50 text-amber-300 text-xs font-black uppercase tracking-wider group-hover:bg-slate-900 group-hover:border-amber-300 transition-colors">
          <Power className="w-3.5 h-3.5" />
          <span>Open Dex &amp; Sign In</span>
        </span>
      </div>

      {/* Bottom hardware hint strip */}
      <div className="flex items-center justify-between border-t-2 border-[#7F1D1D]/70 pt-3 text-[9px] font-mono text-red-200/60 tracking-widest uppercase">
        <span>Silph Co. Hardware</span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" /> Tap to open
        </span>
      </div>
    </button>
  </div>
);

/**
 * Closing animation: the cover swings shut over the screen when the trainer
 * logs out, then hands control back (typically to the closed cover).
 */
export const PokedexClosingAnimation: React.FC<{ onClosed: () => void }> = ({ onClosed }) => {
  const [closing, setClosing] = React.useState(false);
  React.useEffect(() => {
    primeGameboyAudio();
    const swing = setTimeout(() => { setClosing(true); playPokedexOpenSound(); }, 250);
    const done = setTimeout(onClosed, 1700);
    return () => { clearTimeout(swing); clearTimeout(done); };
  }, [onClosed]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#070A10]/95 backdrop-blur-md overflow-hidden p-4" style={{ perspective: '2200px' }}>
      <div
        className={`relative w-full max-w-sm h-72 rounded-[2rem] bg-gradient-to-b from-[#DC2626] via-[#B91C1C] to-[#881337] border-2 sm:border-4 border-[#7F1D1D] shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_50px_rgba(220,38,38,0.3)] transition-all duration-[1200ms] ease-[cubic-bezier(0.2,0.9,0.3,1)] flex flex-col items-center justify-center gap-3`}
        style={{
          transformOrigin: 'left center',
          transform: closing ? 'rotateY(0deg) scale(0.97)' : 'rotateY(-115deg) scale(0.97)',
          backfaceVisibility: 'hidden',
        }}
      >
        <div className="relative w-14 h-14 rounded-full p-1 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 border-2 border-slate-600 shadow-xl flex items-center justify-center">
          <div className={`w-full h-full rounded-full bg-gradient-to-br from-cyan-400 via-sky-600 to-blue-900 flex items-center justify-center transition-opacity duration-700 ${closing ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-5 h-5 rounded-full bg-cyan-300/70 blur-[1px]" />
          </div>
        </div>
        <span className="text-[10px] font-mono tracking-widest text-red-200 uppercase font-black">
          {closing ? 'DEX SEALED — LOGGED OUT' : 'CLOSING LIVING DEX TERMINAL...'}
        </span>
      </div>
    </div>
  );
};
