# Offline downloads and updates

## What the tool downloads

**Settings → (Offline) Storage** installs a *verified offline package*:

- **App shell**: the built HTML, JavaScript, CSS and icons, so the app reopens offline.
- **All bundled datasets**: `dist/offline-manifest.json` lists every file emitted by the
  production build — the whole national dex, games/regions, encounter bundle
  (`/data/encounters.json`, ~15 MB), evolution edges, items, forms/variants, gifts and
  species names.
- **All sprites**: every species, shiny, form and gender sprite is bundled in the app
  (`/sprites/...`) and is part of the site data, so no separate artwork download runs and
  no sprite is ever fetched from a third-party host at runtime.
- **Fonts**: self-hosted woff/ttf files (`/fonts/site-fonts.css`) plus their OFL licences,
  so typography and the QR code work with no network.
The QR code is now generated **locally** (`qrcode.react`) instead of calling
`api.qrserver.com`, which was the last runtime network dependency.

Downloads are stored in CacheStorage under `homedex-package-<version>` with a pointer in
`homedex-offline-control-v2` that only becomes the active package once every required file
is verified.

The download runs with bounded parallelism (6 workers) and per-file retries, and resolves
each file cheapest-first: the package being built (resume) → the previous package (patch
reuse) → **any existing cache, including the service worker precache, which already holds
this deployment's sprites** → the network (verified SHA-256, retried with backoff). Because
sprites are precached by the service worker, a first install on a phone or iPad fetches only
a handful of files (the large `data/` bundle and a few uncached assets) instead of thousands
of separate sprite requests, which is what previously caused partial downloads on mobile.

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

- **“Update required”** — the deployed release differs from the installed package (or a
  download was interrupted / files were evicted). Clicking it opens the offline settings
  tab, where one click downloads it.

The **header reload/refresh control** only asks the server for its release version. It
never reloads the page, clears device storage or re-downloads the package; it reports
"update required" or "already up to date" and leaves everything else untouched.

Applying an update **patches rather than replaces**: every file is still hash-verified,
but a byte-identical copy already on the device (previous package or legacy sprite cache)
is promoted into the new package instead of being fetched again, so a release bump only
transfers the files that actually changed.
- **“Update downloaded — reload”** — a complete newer package is already installed, or the
  service worker has a waiting update. Clicking it asks for confirmation and then reloads.

The app deliberately does **not** auto-reload (`registerType: 'prompt'`), so an in-progress
registration or edit is not interrupted. Checks run on load, on reconnect, on tab focus and
every five minutes; offline it shows the last known status.

## Known limits

- Bundle size is a few hundred MB of CacheStorage (all app pages, datasets and bundled
  sprites); a storage-quota guard refuses to start when the core files cannot fit and points
  to the storage figures.
- Account sign-in, cloud lookup/sync, friend data and signed-in atomic evolution still need
  internet by design; the app data needed for offline reading and local editing is local.
- Sprites ship with the app, so there is no third-party artwork source; a test verifies the
  app makes no external sprite request at runtime.
- Updating the **service worker** itself (and any bug fix in it) requires one online reload
  for the new `sw.js` to take control; the download tool cannot replace its own controller.
- Tests: `npm run test:offline` (real production SW + CacheStorage in headless Chromium,
  network to providers stubbed) and `npm run test:evolution`.
