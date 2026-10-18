# Town Map

Open **Maps** in the desktop menu or phone navigation. Every one of the app's 40 canonical game versions has a region guide. Johto adventures include Kanto, and FireRed/LeafGreen include the Sevii Islands. Owned Sword/Shield and Scarlet/Violet expansions add their own region tabs; unowned expansion maps and encounters are hidden, even in All games mode.

## Interaction

- **Full screen:** the map expands to the whole viewport; Escape or the toggle returns to the page layout.
- **Routes and cities are both clickable pins:** cities/landmarks use squares (facilities) or circles, and every recorded route appears as a labelled diamond pin with a unique short name (Route 3, Route 3b…). Both open location details, by pointer/touch or keyboard Tab/Enter/Space.
- **Colourful schematic terrain:** deterministic biome blobs plus the region silhouette and hub roads, so regions read as distinct landscapes rather than flat outlines.
- **Local encounter maps:** opening a route, area or city draws a little themed map. Each recorded Pokémon is plotted as a sprite pin inside the zone its method and terrain belong to — Grass & fields, Water, Cave/interior, or Gift/trade & special. A level range sits under each sprite and hovering shows weather/time conditions. Pins are keyboard selectable and open the species detail view.
- Labeled SVG pins open location details. Pins support pointer/touch and keyboard Tab/Enter/Space.
- Zoom controls and a scrollable map viewport allow panning without overflowing the page.
- Location shortcut buttons offer an alternative to selecting SVG pins.
- The searchable encounter-area directory includes every recorded area for the selected version/region, including routes, caves/floors and other areas without plotted coordinates.
- City/location details include curated major buildings, landmark notes, recorded building subareas and selectable encounter subareas.
- Encounter rows show species links, methods, level ranges, recorded percentages, weather/time/other conditions and progression notes. Unknown percentages are labeled, never presented as impossible spawns. Catch caps warn without removing higher-level rows.
- Pokémon links open the existing detail drawer. The map/location stays selected behind it.
- Maps and landmark data are bundled SVG/TypeScript, with no external map service or image downloads. Encounters use the existing local dataset, so the page works with the offline package installed.

## Accuracy and scope

These are **schematic region guides**, not tile-accurate overworld maps, building floor plans or turn-by-turn walking routes. Shapes and pin coordinates are approximate, and route-pin positions are spread along the region's hub path (or a ring when no path is plotted) — no dataset records true walking coordinates. On a local encounter map, encounters are grouped into the zone their method and terrain belong to; this shows *which zone and sub-area* a Pokémon is found in, not a pixel-accurate tile. Building lists cover major known landmarks rather than every NPC house; roles and access can vary between versions. Unova sequel-only hubs and Johto-era Cinnabar changes are treated separately.

`src/utils/mapEncounters.ts` indexes only `dataset[species][selectedGame]`: it never unions the sibling version's exclusives or rates. DLC ownership uses the shared `isAreaOwned` rules. Each title's actual data is authoritative, not copied from its prequel/remake.

The current encounter bundle has rows for 32 of 40 versions. Colosseum, XD, GO, BD, SP, PLA, Scarlet and Violet currently have **no encounter rows** in that bundle. Their region guides/landmarks are still available, with a visible coverage warning. Empty data does not claim that an area has no Pokémon. No sample encounters, fabricated rates, or unverified remake copies are used to hide gaps. Extending encounter coverage is a separate data-generation task; new rows appear automatically in the map directory.

Colosseum/XD explain Shadow Pokémon snagging; XD's Poké Spots are included as locations. GO has an explicitly labeled activity guide, **not a live real-world GPS map**, and does not claim to track current event pools.

## Files and tests

- `src/data/gameMaps.ts`: regions, labeled hubs, building notes, game/DLC routing.
- `src/components/RegionTerrain.tsx`: decorative local SVG silhouettes.
- `src/utils/mapEncounters.ts`: version-exact indexing, DLC filtering, area-to-region/place matching.
- `src/components/MapsView.tsx`: interactive page and detail panels.
- `npm run test:maps`: rule/data tests, browser interaction against the real encounter bundle, retry after an HTTP failure, all 40 game selections, DLC visibility, and real app desktop/mobile navigation.

The registration form's layout and scale are unchanged.
