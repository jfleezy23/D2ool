# Claude Handoff

Read these files before changing code:

1. `AGENTS.md`
2. `docs/agent-handoff.md`
3. `docs/generated-data-schema.md`
4. `docs/manifest-field-notes.md`

Do not commit `.env`, Bungie API keys, `data/raw/`, `public/data/`, `public/assets/destiny/`, `dist/`, or `node_modules/`.

The UI must say `Destiny 2`, not `Destiny II`.

## Setup

```bash
git clone https://github.com/jfleezy23/D2ool.git
cd D2ool
cp .env.example .env
```

Add the Bungie API key to `.env`:

```bash
BUNGIE_API_KEY=your_key_here
```

Then run:

```bash
npm install
npm run refresh:data
npm run test
npm run build
npm run dev
```

Open `http://127.0.0.1:5173/`.

The app is local/offline-first. After `npm run refresh:data`, normal browsing, filtering, roll building, saved rolls, and import/export should use only generated local JSON and cached local assets.

## Development Guardrails

- Keep Bungie manifest parsing in `scripts/`.
- Keep React on generated app-facing data under `public/data/`.
- Do not add OAuth, player login, vault sync, DIM integration, a hosted backend, or hosted deployment for the MVP.
- Keep D2Foundry-like improvements data-driven: archetype/weapon type, RPM or frame, ammo, element, perk columns, trait columns, roll comparison, and debug visibility should not require live Bungie calls during normal use.
