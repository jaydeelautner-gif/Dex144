# HomeDex — Living Dex & Pokémon HOME Tracker

Track a Living Pokédex and Pokémon HOME collection: register specimens with unique
12-digit POKEIDs, record origin game/level/form/shiny/Pokérus status, place them in
Living Dex boxes, follow per-game milestone and gym-badge progress, and share a public
Living Dex showcase or Trainer Card.

Built with React + TypeScript + Vite and a Firebase (Firestore + Auth) backend.

## Requirements

- Node.js 20+ and npm
- A Firebase project for cloud sign-in and sync (see `firebase-applet-config.json`)

## Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies (uses `package-lock.json`; `npm ci` also works) |
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production build into `dist/` and regenerate the offline manifest |
| `npm run preview` | Serve the production build |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm run generate:sprites` | Re-download all sprites into `public/sprites` |

Tests (Playwright-based browser tests need `npm i -D @playwright/test` and
`npx playwright install chromium`):

- `npm run test:evolution`, `test:catchability`, `test:starter-lock`, `test:pokeball`,
  `test:game-progress-sync`, `test:home-customization`, `test:settings-save`,
  `test:register-controls`, `test:sync`
- `npm run test:offline`, `test:offline-patch`, `test:sprites`, `test:auth-gateway`

## Offline support

The app ships all sprites locally under `public/sprites` and installs a verified,
hash-checked offline package of the whole site (see `OFFLINE.md`). The service worker
precaches the app shell; Settings → Storage installs the full package for offline use.

## Notes

- `firestore.rules` in this repo must be deployed to the Firebase project for signed-in
  features (cloud sync, atomic evolution, profile fields) to be permitted.
- Guides: `ENCOUNTERS.md`, `OFFLINE.md`, `HOME_CUSTOMIZATION.md`, `POKEPET_EVOLUTION.md`.
