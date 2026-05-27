# Implementation Plan

1. Create the project skeleton, scripts, docs, tests, and Vite app shell.
2. Implement `scripts/fetchManifest.ts` to download selected English JSON definitions from the Bungie manifest.
3. Implement raw manifest loading and app-facing index generation in `scripts/buildIndex.ts`.
4. Implement plug/perk resolution from reusable plug items, reusable plug sets, and randomized plug sets.
5. Generate compact JSON files under `public/data/` and summarize data quality.
6. Add targeted unit tests for loader safety, weapon extraction, plug resolution, filters, saved roll import/export, and generated schema validation.
7. Build the offline React UI only against generated app data.
8. Add saved roll localStorage support and JSON import/export.
9. Add `/debug/data-health` to inspect generated data quality.
10. Refine UI styling after the manifest pipeline is working.

