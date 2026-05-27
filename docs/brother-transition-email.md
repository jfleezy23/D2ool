# Draft Email: Brother / Claude Handoff

To: jflow23@gmail.com

Subject: D2ool handoff prompt for Claude

Body:

```text
Here is the copy/paste prompt for Claude to get you set up with D2ool.

You are helping continue development on D2ool, a local/offline-first Destiny 2 weapon roll explorer inspired by D2Gunsmith and D2Foundry. The repo is public here:

https://github.com/jfleezy23/D2ool

Important: do not commit or publish any Bungie API key. The key belongs only in a local .env file.

Setup steps:

1. Clone the repo:

   git clone https://github.com/jfleezy23/D2ool.git
   cd D2ool

2. Create the local environment file:

   cp .env.example .env

3. Open .env and add the Bungie API key I send you separately:

   BUNGIE_API_KEY=your_key_here

4. Install dependencies:

   npm install

5. Download/cache the Destiny 2 manifest and local assets:

   npm run refresh:data

6. Run tests and build:

   npm run test
   npm run build

7. Start the local app:

   npm run dev

8. Open:

   http://127.0.0.1:5173/

Normal app usage is offline after refresh:data succeeds. The app reads generated JSON from public/data/ and cached local images from public/assets/destiny/. The API key is only needed when refreshing the Bungie manifest/assets.

What is already working:

- Local Bungie manifest refresh and generated weapon/perk index.
- Local cached weapon/perk images.
- Search and filters for archetype, ammo, element, rarity, source, craftable, enhanceable, and adept.
- D2Foundry-style workbench filters for archetype-scoped RPM/frame plus Column 1, Column 2, Trait 3, and Trait 4 perk filters.
- Invalid perk/archetype warnings and useful empty states.
- Weapon details with stats, roll columns, perk descriptions, and cached imagery.
- Roll builder, saved rolls in localStorage, delete/export/import saved rolls.
- Basic compare tray for current/saved rolls using base display stats.
- Debug page at /debug/data-health.

Before coding, read these files:

- AGENTS.md
- CLAUDE.md
- README.md
- docs/agent-handoff.md
- docs/generated-data-schema.md
- docs/manifest-field-notes.md
- docs/data-quality-report.md

Rules for Claude:

- Keep the UI text as "Destiny 2", not "Destiny II".
- Do not add Bungie OAuth, player login, vault sync, DIM integration, or a server backend for the MVP.
- React components must consume clean generated app data only.
- React components must not parse raw Bungie manifest structures.
- Keep raw Bungie manifest interpretation inside scripts/.
- Preserve local/offline-first behavior.
- Do not commit .env, data/raw/, public/data/, public/assets/destiny/, dist/, node_modules/, or API keys.
- Run npm run test and npm run build before handing work back.

Good next development areas:

- Keep improving the D2Foundry-like workbench filters: archetype, RPM/frame, element, ammo, perk columns, and trait columns.
- Improve column label confidence and unresolved plug handling.
- Add better roll comparison and perk stat effect modeling.
- Improve source, craftable, and enhanceable detection.
- Keep the debug page useful for data-health checks.

If something fails, paste the exact command and error into Claude instead of guessing. The project is intentionally local-first, so there is no hosted deployment step required for normal development. "Deploy" for now means build it locally and run the Vite dev server.
```
