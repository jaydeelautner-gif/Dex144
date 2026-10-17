# Offline downloads and updates

## What is stored, and how

Offline support uses two complementary caches so nothing is downloaded twice:

**1. The service worker precache (automatic).** On install the service worker caches the
app shell (HTML/JS/CSS), icons, self-hosted fonts and **every sprite** (all species, shiny,
form and gender variants). This happens without any user action and makes the app shell and
all artwork available offline.

**2. The offline data package (Settings → Storage).** This explicit, verified download adds
only the files the precache cannot hold — the large encounter bundle
(`/data/encounters.json`, ~6.6 MB) plus a few non-precached types (`.json`, `.webmanifest`,
`.txt`). It is deliberately small (a handful of files), because re-downloading the ~2,800
precached files into a second cache duplicated ~14 MB of storage and made the download slow
and flaky on phones and iPads.

The split is defined in `scripts/buildOfflineManifest.mjs` and must stay in step with the
PWA `globPatterns`/`globIgnores`/`maximumFileSizeToCacheInBytes` in `vite.config.ts`.

Downloads are stored in CacheStorage under `homedex-package-<version>` with a pointer in
`homedex-offline-control-v2` that only becomes the active package once every required file
is verified.

The download runs with bounded parallelism (6 workers) and per-file retries, resolving each
file cheapest-first: the package being built (resume) → the previous package (patch reuse) →
any existing cache → the network (SHA-256 verified, retried with backoff). A version bump
therefore only fetches the files that actually changed.

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
