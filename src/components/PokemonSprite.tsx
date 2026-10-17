import { spriteSources } from '../utils/spriteSources';
import React, { useState, useEffect } from 'react';

interface PokemonSpriteProps {
  id: number;
  name: string;
  shiny?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  imageUrl?: string;
}

/** Sprites are bundled with the app, so this only ever loads local files. */
export const PokemonSprite: React.FC<PokemonSpriteProps> = ({
  id,
  name,
  shiny = false,
  size = 'md',
  className = '',
  imageUrl,
}) => {
  const [errorStage, setErrorStage] = useState(0);

  const sources = spriteSources(id, shiny, imageUrl);
  const currentSrc = sources[errorStage] ?? null;

  useEffect(() => { setErrorStage(0); }, [id, shiny, imageUrl]);

  const sizeClasses: Record<string, string> = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  if (!currentSrc || errorStage >= sources.length) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} flex flex-col items-center justify-center rounded-lg bg-slate-900/90 border border-slate-800 text-slate-400 select-none`}
        title={name}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-1/2 h-1/2 text-slate-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <circle cx="12" cy="12" r="9" />
          <line x1="3" y1="12" x2="9" y2="12" />
          <line x1="15" y1="12" x2="21" y2="12" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span className="text-[10px] font-mono-tabular text-slate-500 mt-0.5">
          #{String(id > 10000 ? id % 1000 : id).padStart(4, '0')}
        </span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative flex items-center justify-center select-none`}>
      <img
        key={`${currentSrc}-${errorStage}`}
        src={currentSrc}
        alt={`${shiny ? 'Shiny ' : ''}${name} illustration`}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setErrorStage((prev) => prev + 1)}
        className="w-full h-full object-contain transition-transform duration-150"
      />
    </div>
  );
};
