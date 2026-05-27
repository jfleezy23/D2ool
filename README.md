# D2ool

A local-first Destiny 2 weapon roll explorer for personal use. It fetches the public Bungie manifest, compiles compact app-facing weapon/perk JSON, caches Bungie images locally, and then runs offline from generated data.

The app UI should say **Destiny 2**, not Destiny II.

## Build And Run

1. Create a Bungie API key at the Bungie developer portal.
2. Create `.env`:

   ```bash
   BUNGIE_API_KEY=your_key_here
   ```

   Do not commit `.env` or paste the key into issues, docs, commits, or chat logs.

3. Install, refresh data, build, and run:

   ```bash
   npm install
   npm run refresh:data
   npm run build
   npm run dev
   ```

4. Open the local app:

   ```text
   http://127.0.0.1:5173/
   ```

## Common Commands

- `npm run dev` starts the Vite dev server.
- `npm run build` type-checks and builds the UI.
- `npm run preview` previews the production build.
- `npm run fetch:manifest` downloads the English Bungie manifest definitions.
- `npm run build:index` converts raw definitions into compact app-facing data.
- `npm run cache:assets` downloads required weapon/perk images and rewrites generated paths to local assets.
- `npm run refresh:data` runs manifest fetch, index build, asset caching, and a final index rebuild.
- `npm run test` runs unit tests.

## Fresh Clone Checklist

1. Clone the repo.
2. Copy `.env.example` to `.env`.
3. Add a Bungie API key to `.env`.
4. Run `npm install`.
5. Run `npm run refresh:data`.
6. Run `npm run test`.
7. Run `npm run build`.
8. Run `npm run dev`.

## Offline Model

Normal app usage reads only generated files under `public/data/` and cached assets under `public/assets/destiny/`. After `npm run refresh:data` succeeds, the React app should not need network access for browsing, filtering, viewing rolls, saving rolls, or importing/exporting saved rolls.

Network access is only expected for:

- `npm run fetch:manifest`
- `npm run cache:assets`
- dependency installation

## Data Locations

- Raw Bungie manifest files: `data/raw/{manifestVersion}/`
- Latest raw manifest metadata: `data/raw/latest-manifest.json`
- Generated app data: `public/data/`
- Cached local Bungie assets: `public/assets/destiny/`

Generated app data is intentionally shaped for the UI. React components must not parse raw Bungie manifest structures directly.

## Saved Rolls

Saved rolls are stored in `localStorage` for the MVP. The UI supports exporting saved rolls as JSON and importing that JSON later. Imported rolls are validated against the saved roll shape before they are accepted.

## Current Limitations

- No Bungie OAuth, player login, vault sync, DIM integration, or hosted backend.
- Craftable and enhanceable flags are best-effort until the relevant manifest fields are verified against live data.
- Weapon source labels depend on collectible data when present.
- Perk stat effects are not fully modeled yet.
- Generated JSON is the initial storage format; IndexedDB or SQLite/DuckDB can be considered later if needed.

## Agent Handoff

Read `AGENTS.md` first, then `docs/agent-handoff.md`. The most important rule: keep raw Bungie manifest parsing inside Node scripts under `scripts/`; React must consume only generated app data under `public/data/`.

## References

- [Official Bungie.Net API docs](https://bungie-net.github.io/)
- [Bungie manifest wiki](https://github.com/Bungie-net/api/wiki/Obtaining-Destiny-Definitions-%22The-Manifest%22)
- [D2 Arsenal](https://github.com/D2Arsenal/d2arsenal.com), MIT licensed inspiration
