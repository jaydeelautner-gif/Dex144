import React from 'react';

interface BoxSlotMiniMapProps {
  boxNumber: number; // 1 to 35
  boxSlot: number; // 1 to 30
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Renders an authentic 6x5 PC Box slot diagram illustrating the exact position
 * of a Pokémon within its PC Box:
 * Row 1: Slots 1-6
 * Row 2: Slots 7-12
 * Row 3: Slots 13-18
 * Row 4: Slots 19-24
 * Row 5: Slots 25-30
 */
export const BoxSlotMiniMap: React.FC<BoxSlotMiniMapProps> = ({
  boxNumber,
  boxSlot,
  className = '',
  size = 'md',
}) => {
  const row = Math.ceil(boxSlot / 6);
  const col = ((boxSlot - 1) % 6) + 1;

  const cellSizes = {
    sm: 'w-2 h-2 rounded-[2px]',
    md: 'w-3 h-3 rounded-[3px]',
    lg: 'w-4 h-4 rounded-sm',
  };

  return (
    <div
      className={`inline-flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800 ${className}`}
      title={`PC Box ${boxNumber} — Slot ${boxSlot} (Row ${row}, Col ${col})`}
    >
      <div className="flex items-center justify-between w-full px-0.5 text-[10px] font-mono-tabular text-slate-400">
        <span className="font-bold text-sky-300">Box {boxNumber}</span>
        <span className="text-amber-300">Slot {boxSlot} / 30</span>
      </div>

      {/* 6 columns x 5 rows grid */}
      <div className="grid grid-cols-6 gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800/80 shadow-inner">
        {Array.from({ length: 30 }).map((_, idx) => {
          const slotNum = idx + 1;
          const isTarget = slotNum === boxSlot;
          return (
            <div
              key={slotNum}
              className={`${cellSizes[size]} transition-all flex items-center justify-center ${
                isTarget
                  ? 'bg-amber-400 border border-amber-300 ring-2 ring-amber-400/40 shadow-sm shadow-amber-400 scale-110 z-10'
                  : 'bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/60'
              }`}
              title={`Slot ${slotNum}${isTarget ? ' (Selected)' : ''}`}
            >
              {isTarget && <div className="w-1 h-1 rounded-full bg-slate-950" />}
            </div>
          );
        })}
      </div>

      <div className="text-[9px] font-mono-tabular text-slate-400 flex items-center justify-between w-full px-0.5">
        <span>Row {row}</span>
        <span className="text-amber-400 font-semibold">Column {col}</span>
      </div>
    </div>
  );
};
