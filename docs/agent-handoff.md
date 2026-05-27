# D2ool Agent Handoff

## Current State

D2ool is a local/offline-first Destiny 2 weapon roll explorer.

Implemented:

- React + TypeScript + Vite app.
- Node TypeScript manifest fetch, index build, and asset cache scripts.
- Generated clean app-facing JSON data.
- Local asset cache rewriting.
- Search/filter UI, weapon detail view, roll builder, saved rolls, import/export.
- `/debug/data-health`.
- Unit tests for extraction, plug-set resolution, filters, saved rolls, and schema validation.

## Build And Run

```bash
npm install
npm run refresh:data
npm run test
npm run build
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

Debug route:

```text
http://127.0.0.1:5173/debug/data-health
```

## Secrets

The Bungie API key belongs only in local `.env`:

```bash
BUNGIE_API_KEY=your_key_here
```

Never commit or publish the key. Do not add generated `.env` examples with real values.

## Architecture

- `scripts/fetchManifest.ts`: downloads selected English Bungie manifest definitions.
- `scripts/buildIndex.ts`: converts raw manifest definitions into app-facing JSON.
- `scripts/cacheAssets.ts`: downloads Bungie image assets locally and rewrites generated paths.
- `scripts/lib/buildData.ts`: core extraction logic.
- `src/lib/data.ts`: loads generated JSON for the UI.
- `src/lib/filters.ts`: client-side filtering helpers.
- `src/lib/savedRolls.ts`: localStorage and JSON import/export.
- `src/App.tsx`: explorer, detail, saved roll, and debug UI.

React components must not parse raw Bungie structures like `DestinyInventoryItemDefinition`, socket entries, or plug-set hashes. Keep that logic in `scripts/`.

## Generated Data

Generated data and assets are intentionally ignored by Git:

- `data/raw/`
- `public/data/*`
- `public/assets/destiny/*`
- `dist/`

Fresh clones must run `npm run refresh:data` after adding `.env`.

Latest local generation observed:

- Inventory items: 33,355
- Weapons: 1,837
- Roll-relevant perks: 2,267
- Asset map entries: 4,982
- Failed assets: 26 screenshot 404s mapped to placeholders

## Known Data Notes

- Cosmetic shader, memento, crafting-only, tracker, and lower masterwork tier sockets are excluded from roll columns.
- Some unresolved plug hashes remain and are visible in `/debug/data-health`.
- `weapons.json` is still fairly large. Future work should split generated data by weapon hash or add a smaller list/detail data split.
- Craftable/enhanceable detection is still best-effort.

## Validation Before Handoff

Run:

```bash
npm run test
npm run build
npm audit
```

For UI work, also run the dev server and inspect desktop and mobile layout with real generated data.

## Good Next Tasks

- Split generated weapon data into list records and detail records for faster initial load.
- Improve socket label inference for ambiguous columns.
- Investigate top unresolved plug hashes shown in `/debug/data-health`.
- Add virtualization to the weapon list.
- Improve source/craftable/enhanceable detection from observed manifest fields.
- Add perk stat effect display.

