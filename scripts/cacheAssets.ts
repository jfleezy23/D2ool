import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Perk, Weapon } from "../src/types";
import {
  isBungieAssetPath,
  normalizeBungieAssetPath,
  sourceToLocalAssetPath,
  type AssetMap,
  type AssetMapEntry
} from "./lib/assets";
import { readJson, writeJson, writeText } from "./lib/fs";
import { assetMapPath, destinyAssetDir, publicDataDir, repoRoot } from "./lib/paths";

const bungieBaseUrl = "https://www.bungie.net";
const placeholderPath = "/assets/destiny/placeholder.svg";

async function ensurePlaceholder(): Promise<void> {
  await writeText(
    join(destinyAssetDir, "placeholder.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Missing Destiny 2 asset">
  <rect width="96" height="96" fill="#161922"/>
  <path d="M48 14 82 48 48 82 14 48z" fill="none" stroke="#5f6f8f" stroke-width="4"/>
  <circle cx="48" cy="48" r="10" fill="#d7e2ff"/>
</svg>
`
  );
}

function collectAssetPaths(weapons: Weapon[], perks: Perk[]): string[] {
  const paths = new Set<string>();
  for (const weapon of weapons) {
    for (const path of [weapon.iconPath, weapon.screenshotPath]) {
      const normalized = normalizeBungieAssetPath(path);
      if (isBungieAssetPath(normalized)) {
        paths.add(normalized);
      }
    }
  }

  for (const perk of perks) {
    const normalized = normalizeBungieAssetPath(perk.iconPath);
    if (isBungieAssetPath(normalized)) {
      paths.add(normalized);
    }
  }

  return Array.from(paths).sort();
}

async function downloadAsset(sourcePath: string): Promise<AssetMapEntry> {
  const localPath = sourceToLocalAssetPath(sourcePath);
  const outputPath = join(repoRoot, "public", localPath);

  if (existsSync(outputPath)) {
    return { sourcePath, localPath, status: "cached" };
  }

  try {
    const response = await fetch(`${bungieBaseUrl}${sourcePath}`);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, bytes);
    return { sourcePath, localPath, status: "cached" };
  } catch (error) {
    return {
      sourcePath,
      localPath: placeholderPath,
      status: "failed",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function rewriteWeaponAssets(weapon: Weapon, assetMap: AssetMap): Weapon {
  return {
    ...weapon,
    iconPath: rewritePath(weapon.iconPath, assetMap),
    screenshotPath: rewritePath(weapon.screenshotPath, assetMap),
    perkColumns: weapon.perkColumns.map((column) => ({
      ...column,
      perks: column.perks.map((perk) => ({
        ...perk,
        iconPath: rewritePath(perk.iconPath, assetMap)
      }))
    }))
  };
}

function rewritePerkAssets(perk: Perk, assetMap: AssetMap): Perk {
  return {
    ...perk,
    iconPath: rewritePath(perk.iconPath, assetMap)
  };
}

function rewritePath(path: string | undefined, assetMap: AssetMap): string | undefined {
  const normalized = normalizeBungieAssetPath(path);
  if (!normalized) {
    return undefined;
  }

  return assetMap[normalized]?.localPath ?? normalized;
}

async function main(): Promise<void> {
  await ensurePlaceholder();

  const weaponsPath = join(publicDataDir, "weapons.json");
  const perksPath = join(publicDataDir, "perks.json");
  const weapons = await readJson<Weapon[]>(weaponsPath);
  const perks = await readJson<Perk[]>(perksPath);
  const existingAssetMap = existsSync(assetMapPath)
    ? await readJson<AssetMap>(assetMapPath)
    : {};

  const assetPaths = collectAssetPaths(weapons, perks);
  const nextAssetMap: AssetMap = { ...existingAssetMap };

  for (const sourcePath of assetPaths) {
    if (nextAssetMap[sourcePath]?.status === "cached") {
      continue;
    }

    const result = await downloadAsset(sourcePath);
    nextAssetMap[sourcePath] = result;
    if (result.status === "failed") {
      console.warn(`Failed to cache ${sourcePath}: ${result.error}`);
    }
  }

  await writeJson(assetMapPath, nextAssetMap);
  await writeJson(
    weaponsPath,
    weapons.map((weapon) => rewriteWeaponAssets(weapon, nextAssetMap))
  );
  await writeJson(
    perksPath,
    perks.map((perk) => rewritePerkAssets(perk, nextAssetMap))
  );

  console.log(`Cached or mapped ${assetPaths.length} Destiny 2 assets.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

