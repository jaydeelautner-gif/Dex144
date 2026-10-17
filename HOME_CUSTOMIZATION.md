# Home and display preferences

Settings → Home Screen provides panel visibility, ordering (up/down buttons), left/right/stacked trainer sidebar, one/two main-panel columns on wide screens, and comfortable/compact spacing. Preferences now use an editable draft across all Settings sections: press **Save settings** to apply them, or **Discard changes** to revert the draft. Leaving Settings, logging out, or reloading with unsaved edits prompts a warning. PIN edits also participate in the shared draft and can be applied by Save settings from any section (the PIN form's own Save button remains available). Invalid or mismatched PINs block Save with an explanation. Storage downloads, imports and destructive actions retain their own explicit action buttons and confirmations. Panels retain their order when hidden. Catch Hub's two child panels stay within Catch Hub. Sidebar shortcuts stay together, but can be reordered and moved above/below the trainer card.

Home layout is stored in `homedex_home_design_v1` and the optional `homeDesign` profile field. A newer timestamped cloud layout can be adopted without overwriting newer offline edits. Panel visibility continues to use `homePanels`. Deploy the updated `firestore.rules` before cloud writes include the new field.

Inventory, Pokédex, Living Dex, private boxes and public boxes have device-local display-count selectors. “Show all” removes pagination limits; rendering all 1,025 box slots may take longer on older devices. Ordinary finite inventory/Living Dex pages expose Previous/Next controls rather than hiding later results. Box count chooses how many consecutive boxes to show, starting at the selected box; “Show all” includes every box, regardless of that starting point.

## Recent community registrations

Home's Recently Registered panel can be hidden in Home Screen settings and reordered like other main panels. It queries the public `registeredPokepets` registry, ordered by server `createdAt` descending, limited to 12 records. It is not restricted to the current user. It exposes species, nickname, level, trainer display name, form, shiny status and registration time; no email, account UID, notes or private inventory data is shown. Clicking a card uses the existing public POKEID lookup.

The panel loads on mount, refresh, and reconnect. It does not fabricate sample records or silently replace server failures with device inventory. Offline and server errors are shown explicitly. A timeout bounds the loading state. No new Firestore composite index is required for this single-field ordering.

## Verification

- `npm run test:home-customization`: normalization/migration unit tests, real app Home settings/layout tests, component-fixture pagination/all-results tests, and community feed fixture rendering/refresh/lookup.
- `npm run test:home-layout`: existing responsive sidebar/shortcut/visibility regression.
- `npm run test:settings-save`: draft state, cross-section Save, applied Home/layout/sound preferences, cancel/discard navigation, reload warning and Save availability on every Settings section.

The browser fixtures are disposable contexts and make no writes to the production database. Live Firebase availability and deployed rules must be checked separately after deployment.
