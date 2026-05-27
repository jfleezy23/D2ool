import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

export const repoRoot = resolve(currentDir, "../..");
export const rawDataDir = resolve(repoRoot, "data/raw");
export const publicDataDir = resolve(repoRoot, "public/data");
export const destinyAssetDir = resolve(repoRoot, "public/assets/destiny");
export const docsDir = resolve(repoRoot, "docs");
export const latestManifestPath = resolve(rawDataDir, "latest-manifest.json");
export const assetMapPath = resolve(publicDataDir, "asset-map.json");

