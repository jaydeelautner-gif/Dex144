import React, { useState, useEffect } from 'react';
import { FastForward, Sparkles } from 'lucide-react';
import { playPokedexOpenSound, primeGameboyAudio } from '../utils/gameboySound';

interface PokedexOpeningAnimationProps {
  onComplete: () => void;
}

export const PokedexOpeningAnimation: React.FC<PokedexOpeningAnimationProps> = ({ onComplete }) => {
  // Slower, dramatic 5-second early-style Pokédex opening sequence:
  // 'closed'     (0.0s - 1.3s): Closed red cover, pulsing giant blue lens, LEDs warming up
  // 'unlatching' (1.3s - 2.2s): Gold latch slides open, click & servo sound plays, LEDs flash
  // 'swinging'   (2.2s - 4.7s): Front cover slowly swings wide open around left knuckle hinges (2.5s smooth 3D swing!)
  // 'booting'    (4.7s - 5.2s): CRT screen boot flare & system ready chime
  // Complete at 5.2s
  const [stage, setStage] = useState<'closed' | 'unlatching' | 'swinging' | 'booting'>('closed');

  useEffect(() => {
    primeGameboyAudio();

    // 1.3s: Mechanical gold latch unlocks and slides
    const t1 = setTimeout(() => {
      setStage('unlatching');
      playPokedexOpenSound();
    }, 1300);

    // 2.2s: Front red cover begins slow, dramatic 3D swing around left hinges (2.5s transition)
    const t2 = setTimeout(() => {
      setStage('swinging');
    }, 2200);

    // 4.7s: Screen boots up with CRT scanlines and system terminal
    const t3 = setTimeout(() => {
      setStage('booting');
    }, 4700);

    // 5.2s: Animation completes, transitioning to the opened Pokédex screen
    const t4 = setTimeout(() => {
      onComplete();
    }, 5200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div
      onClick={primeGameboyAudio}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#070A10]/95 backdrop-blur-md overflow-hidden p-2 sm:p-4 select-none"
      style={{ perspective: '2200px' }}
    >
      {/* Skip Button in the corner */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-300 hover:text-white transition cursor-pointer shadow-2xl group"
      >
        <span>Skip Intro (5s)</span>
        <FastForward className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Center Pokédex Device (Early Gen 1 Dexter Model) */}
      <div
        className="relative w-full max-w-[94vw] sm:max-w-[600px] h-[600px] sm:h-[720px] max-h-[92vh] transition-all duration-1000 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform:
            stage === 'swinging' || stage === 'booting'
              ? 'scale(1.04) rotateY(-6deg)'
              : stage === 'unlatching'
              ? 'scale(1.02)'
              : 'scale(1)',
        }}
      >
        {/* ======================================================== */}
        {/* UNDER-SCREEN BASE (What is revealed as lid swings open)   */}
        {/* ======================================================== */}
        <div className="absolute inset-0 rounded-[2.5rem] sm:rounded-[3rem] bg-gradient-to-b from-[#DC2626] via-[#B91C1C] to-[#881337] border-4 sm:border-8 border-[#7F1D1D] shadow-[inset_0_0_50px_rgba(0,0,0,0.9),0_25px_60px_rgba(0,0,0,0.9)] p-5 sm:p-7 flex flex-col justify-between overflow-hidden">
          {/* Top bezel with camera/sensor dots & model info */}
          <div className="flex items-center justify-between border-b-2 border-red-950/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-600 animate-pulse border border-rose-300 shadow-[0_0_8px_#f43f5e]" />
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-200 shadow-[0_0_8px_#fbbf24]" />
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border border-emerald-200 shadow-[0_0_8px_#34d399]" />
            </div>
            <span className="text-[11px] font-mono font-bold text-red-200 tracking-widest uppercase animate-pulse">
              {stage === 'booting' ? 'HOMEDEX OS READY • EXPANDING SCREEN' : 'UNLATCHING LIVING DEX TERMINAL...'}
            </span>
          </div>

          {/* Recessed LCD Display Frame booting up */}
          <div className="my-auto h-[440px] rounded-2xl bg-[#0B0F19] border-4 border-[#1E293B] p-6 flex flex-col items-center justify-center gap-4 text-center relative overflow-hidden shadow-[inset_0_4px_25px_rgba(0,0,0,0.9)]">
            {/* 4 Corner Rivet Screws */}
            <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-[8px] text-slate-400 font-bold">+</div>
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-[8px] text-slate-400 font-bold">+</div>
            <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-[8px] text-slate-400 font-bold">+</div>
            <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-[8px] text-slate-400 font-bold">+</div>

            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
            
            <div className="w-24 h-24 rounded-full border-2 border-cyan-400/60 flex items-center justify-center bg-cyan-950/40 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
              <Sparkles className="w-12 h-12 text-cyan-300 animate-spin" style={{ animationDuration: '4s' }} />
            </div>

            <div className="flex flex-col gap-1.5 z-10">
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-black">
                DEVRACCOON HARDWARE INTERFACE
              </span>
              <h3 className="text-2xl font-black text-cyan-200 font-mono tracking-widest">
                HOMEDEX OS v4.2
              </h3>
              <p className="text-xs font-mono text-slate-400 max-w-xs">
                Opening National Living Dex Showcase & Login on Screen...
              </p>
            </div>

            {/* Loading progress bar */}
            <div className="w-56 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700 mt-2 z-10">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-[3000ms] ease-out"
                style={{ width: stage === 'swinging' || stage === 'booting' ? '100%' : '15%' }}
              />
            </div>
          </div>

          {/* Under-screen hardware controls (D-Pad, buttons, speaker slots) */}
          <div className="flex items-center justify-between border-t-2 border-red-950/80 pt-4">
            {/* Directional Pad */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute w-12 h-4 bg-slate-900 border border-slate-700 rounded-sm shadow-md" />
              <div className="absolute w-4 h-12 bg-slate-900 border border-slate-700 rounded-sm shadow-md" />
              <div className="relative w-3.5 h-3.5 rounded-full bg-slate-950" />
            </div>

            {/* Pill Action Buttons & Speaker Slits */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-3 rounded-full bg-sky-500 shadow-md border border-sky-300" />
                <div className="w-9 h-3 rounded-full bg-rose-500 shadow-md border border-rose-300" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="w-10 h-1 bg-black/40 rounded-full" />
                <div className="w-10 h-1 bg-black/40 rounded-full" />
                <div className="w-10 h-1 bg-black/40 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3D HINGED FRONT COVER (Slowly swings open over ~2.5s)    */}
        {/* ======================================================== */}
        <div
          className="absolute inset-0 rounded-[2.5rem] sm:rounded-[3rem] bg-gradient-to-b from-[#DC2626] via-[#B91C1C] to-[#881337] border-4 sm:border-8 border-[#7F1D1D] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_50px_rgba(220,38,38,0.35)] flex flex-col justify-between p-6 sm:p-8 overflow-hidden z-20 transition-all duration-[2500ms] ease-[cubic-bezier(0.2,0.9,0.3,1)]"
          style={{
            transformOrigin: 'left center',
            transform:
              stage === 'swinging' || stage === 'booting'
                ? 'rotateY(-115deg)'
                : stage === 'unlatching'
                ? 'rotateY(-6deg)'
                : 'rotateY(0deg)',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Beveled Casing Highlights */}
          <div className="absolute inset-x-0 top-0 h-2 bg-white/30 rounded-t-[2.5rem]" />
          <div className="absolute inset-y-0 left-0 w-3 bg-white/20" />
          <div className="absolute inset-y-0 right-0 w-3 bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 h-3 bg-black/50 rounded-b-[2.5rem]" />

          {/* Left Mechanical Knuckle Hinges */}
          <div className="absolute left-0 inset-y-12 w-4 flex flex-col justify-between py-6 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-full h-8 rounded-r-md bg-gradient-to-r from-[#500707] via-[#7F1D1D] to-[#991B1B] border-y border-r border-[#300] shadow-md"
              />
            ))}
          </div>

          {/* Top Section: Glowing Big Blue Lens & Three Signal LEDs */}
          <div className="relative z-10 flex items-center justify-between pb-6 border-b-2 border-[#7F1D1D]/70">
            {/* The Famous Blue Optical Sensor */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1.5 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 border-2 border-slate-600 shadow-2xl flex items-center justify-center">
                {/* Glowing Blue Dome */}
                <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 via-sky-600 to-blue-900 border-2 border-blue-950 shadow-[inset_0_0_20px_rgba(6,182,212,0.9)] relative overflow-hidden flex items-center justify-center animate-pulse">
                  <div className="absolute top-2 left-2.5 w-6 h-3 rounded-full bg-white/80 rotate-[-35deg] blur-[0.6px]" />
                  <div className="absolute bottom-3 right-3 w-3 h-1.5 rounded-full bg-cyan-300/40" />
                  <div className="w-6 h-6 rounded-full bg-cyan-300/70 blur-[1px] shadow-[0_0_15px_#22d3ee]" />
                </div>
              </div>

              {/* Red, Yellow, Green Status LEDs */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full p-0.5 bg-gradient-to-b from-slate-300 to-slate-500 border border-slate-600 shadow-md">
                  <div
                    className={`w-full h-full rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)] border border-rose-300 transition-opacity ${
                      stage === 'unlatching' ? 'opacity-100 animate-ping' : 'opacity-80 animate-pulse'
                    }`}
                  />
                </div>

                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full p-0.5 bg-gradient-to-b from-slate-300 to-slate-500 border border-slate-600 shadow-md">
                  <div
                    className={`w-full h-full rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] border border-amber-200 transition-opacity ${
                      stage === 'unlatching' ? 'opacity-100' : 'opacity-60'
                    }`}
                  />
                </div>

                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full p-0.5 bg-gradient-to-b from-slate-300 to-slate-500 border border-slate-600 shadow-md">
                  <div
                    className={`w-full h-full rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] border border-emerald-200 transition-opacity ${
                      stage === 'unlatching' ? 'opacity-100 animate-pulse' : 'opacity-70'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Model Tag */}
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-mono tracking-widest text-red-200/90 font-black block">
                MODEL: DevRaccoon
              </span>
              <span className="text-[9px] font-mono tracking-wider text-red-300/70 block">
                DEVRACCOON • KANTO ED.
              </span>
            </div>
          </div>

          {/* Center Poké Ball Medallion & Embossing */}
          <div className="my-auto py-8 flex flex-col items-center justify-center gap-6 relative">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-[#7F1D1D] bg-gradient-to-br from-[#991B1B] to-[#7F1D1D] shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] flex items-center justify-center p-3">
              <div className="w-full h-full rounded-full border-4 border-red-950/80 relative overflow-hidden flex flex-col justify-between shadow-inner">
                {/* Red Top Half */}
                <div className="h-1/2 bg-[#DC2626] border-b-4 border-slate-950 relative">
                  <div className="absolute top-2 left-4 w-12 h-6 bg-white/25 rounded-full rotate-[-20deg] blur-[1px]" />
                </div>
                {/* White Bottom Half */}
                <div className="h-1/2 bg-slate-200" />
                {/* Center Button */}
                <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-white border-4 border-slate-950 shadow-md flex items-center justify-center">
                  <div
                    className={`w-4 h-4 rounded-full border border-slate-400 transition-all ${
                      stage === 'unlatching'
                        ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee] scale-125'
                        : 'bg-slate-200'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-black tracking-widest text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans">
                POKÉDEX
              </h1>
              <p className="text-xs font-mono tracking-widest text-red-200/90 mt-1 uppercase">
                National Living Dex Terminal
              </p>
            </div>

            <div className="w-3/4 h-1 bg-[#7F1D1D] rounded-full shadow-inner opacity-80" />
          </div>

          {/* Bottom Bar: Speaker Slits & Mechanical Latch */}
          <div className="relative z-10 flex items-center justify-between pt-4 border-t-2 border-[#7F1D1D]/70">
            {/* Speaker Slits */}
            <div className="flex flex-col gap-1.5 w-24">
              <div className="h-1 bg-black/40 rounded-full shadow-inner" />
              <div className="h-1 bg-black/40 rounded-full shadow-inner" />
              <div className="h-1 bg-black/40 rounded-full shadow-inner" />
              <div className="h-1 bg-black/40 rounded-full shadow-inner" />
            </div>

            {/* Gold Triangle Mechanical Latch */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 border border-amber-300 shadow-xl text-slate-950 text-xs font-mono font-black tracking-wider uppercase transition-all duration-700 ${
                stage === 'unlatching' || stage === 'swinging'
                  ? 'translate-x-4 scale-110 shadow-amber-400/80 bg-amber-300'
                  : ''
              }`}
            >
              <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-6 border-l-slate-950" />
              <span>
                {stage === 'unlatching'
                  ? 'LATCH UNLOCKED'
                  : stage === 'swinging'
                  ? 'OPENING POKÉDEX...'
                  : 'READY TO OPEN'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
