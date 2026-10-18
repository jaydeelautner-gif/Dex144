import { useEffect, useState } from 'react';
import { itemSpriteUrl, prefetchSpriteArchive } from '../utils/spriteArchive';

/** Bundled item artwork, resolved from the local sprite archive (no network). */
export function ItemSprite({ slug, name, size = 32, className = '' }: { slug: string; name: string; size?: number; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    prefetchSpriteArchive();
    let active = true;
    setUrl(null);
    void itemSpriteUrl(slug).then((resolved) => { if (active) setUrl(resolved); });
    return () => { active = false; };
  }, [slug]);
  if (!url) {
    return <span aria-hidden="true" style={{ width: size, height: size }} className={`inline-block rounded bg-slate-800/80 border border-slate-700 shrink-0 ${className}`} />;
  }
  return <img src={url} alt={`${name} sprite`} width={size} height={size} loading="lazy" className={`shrink-0 [image-rendering:pixelated] ${className}`} />;
}
