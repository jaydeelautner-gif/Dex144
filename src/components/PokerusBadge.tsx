/** Small purple Pokérus-style status symbol for dense box and dex slots. */
export function PokerusBadge() {
  return <span title="Pokérus" aria-label="Pokérus" role="img" className="inline-flex shrink-0 text-fuchsia-400">
    <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="10" cy="10" r="5.5" fill="#4a044e" />
      <path d="M5 5 3 3M15 5l2-2M5 15l-2 2M15 15l2 2M7 11.5q3 3 6 0" />
      <path d="M8 8.5h.1M12 8.5h.1" strokeWidth="2.5" />
    </svg>
  </span>;
}
