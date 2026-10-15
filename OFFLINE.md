# Offline downloads and updates

## What the tool downloads

**Settings → (Offline) Storage** installs a *verified offline package*:

- **App shell**: the built HTML, JavaScript, CSS and icons, so the app reopens offline.
- **All bundled datasets**: `dist/offline-manifest.json` lists every file emitted by the
  production build — the whole national dex, games/regions, encounter bundle
  (`/data/encounters.json`, ~20 MB), evolution edges, items, forms/variants, gifts,
  species names and the artwork catalog.
- **Fonts**: self-hosted woff/ttf files (`/fonts/site-fonts.css`) plus their OFL licences,
  so typography and the QR code work with no network.
- **Artwork**: **2,594 normal / shiny / form / gender image groups** covering all 1,025
  species. For each group the tool caches the primary source and keeps ordered fallbacks
  (custom Showdown images → official artwork → HOME artwork → pixel sprites), so an
  earlier fallback can be used if a source is unavailable.

The QR code is now generated **locally** (`qrcode.react`) instead of calling
`api.qrserver.com`, which was the last runtime network dependency.

Downloads are stored in CacheStorage under `homedex-package-<version>` with a pointer in
`homedex-offline-control-v2` that only becomes the active package once every required file
and artwork group is verified.

## Integrity and failure handling

- Every required site file is hash-verified (SHA-256 + byte length). If a deployment
  changes mid-download, the mismatching file is rejected and the download fails with a
  retry message instead of silently mixing releases.
- Artwork is only counted as saved when a real image of non-zero size is stored. Failed
  groups are reported — they are **never** counted as successes, and the completion message
  lists how many need a retry. The previous complete package stays active.
- Artwork retries reuse files already stored in the package, the previous package, or the
  legacy sprite cache, so a retry resumes instead of re-fetching everything.
- `/offline-manifest.json` and the `?offline-download=` requests use **NetworkOnly** in the
  service worker, so update checks can never read a stale cached manifest.
- A healthy previous package (and one generation behind it) is kept so an interrupted or
  failed update does not break an already working offline install.
- Clearing the package removes only offline-package caches. Registrations, settings, the
  sync queue and other localStorage data are left untouched (covered by a test).

## Update indicator

Under the cloud sync status in the header (for both signed-in and guest users) a small
label appears when an update is required:

- **“Update needed”** — the deployed release differs from the installed package (or a
  download was interrupted / files were evicted). Clicking it opens the offline settings
  tab, where one click re-downloads the package.
- **“Update downloaded — reload”** — a complete newer package is already installed, or the
  service worker has a waiting update. Clicking it asks for confirmation and then reloads.

The app deliberately does **not** auto-reload (`registerType: 'prompt'`), so an in-progress
registration or edit is not interrupted. Checks run on load, on reconnect, on tab focus and
every five minutes; offline it shows the last known status.

## Known limits

- Bundle size is several hundred MB of CacheStorage once artwork is included; a storage-quota
  guard refuses to start when the core files cannot fit and points to the storage figures.
- Account sign-in, cloud lookup/sync, friend data and signed-in atomic evolution still need
  internet by design; the app data needed for offline reading and local editing is local.
- Artwork comes from third-party hosts and a fixture-based test verifies *routing,
  completeness and failure handling* — not that every source is permanently online.
- Updating the **service worker** itself (and any bug fix in it) requires one online reload
  for the new `sw.js` to take control; the download tool cannot replace its own controller.
- Tests: `npm run test:offline` (real production SW + CacheStorage in headless Chromium,
  network to providers stubbed) and `npm run test:evolution`.
