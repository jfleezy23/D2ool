import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildGeneratedData } from "./lib/buildData";
import { readJson, writeJson, writeText } from "./lib/fs";
import { loadRawDefinitions } from "./lib/manifestLoader";
import { assetMapPath, docsDir, publicDataDir } from "./lib/paths";
import type { AssetMap } from "./lib/assets";

async function loadAssetMap(): Promise<AssetMap> {
  if (!existsSync(assetMapPath)) {
    return {};
  }

  return readJson<AssetMap>(assetMapPath);
}

function dataQualityReport(bundle: ReturnType<typeof buildGeneratedData>): string {
  const counts = bundle.manifestMeta.counts;
  const unresolved = bundle.dataHealth.topUnresolvedHashes
    .map((entry) => `- ${entry.hash}: ${entry.count}`)
    .join("\n");
  const unknownCategories = bundle.dataHealth.topUnknownSocketCategories
    .map((entry) => `- ${entry.socketCategoryHash}: ${entry.count}`)
    .join("\n");

  return `# Data Quality Report

Generated at: ${bundle.manifestMeta.builtAt}

Manifest version: ${bundle.manifestMeta.manifestVersion ?? "unknown"}
Locale: ${bundle.manifestMeta.locale}

## Counts

- Total inventory items loaded: ${counts.inventoryItems}
- Total weapon items extracted: ${counts.weaponItems}
- Total perks extracted: ${counts.perks}
- Weapons with zero sockets: ${counts.weaponsWithZeroSockets}
- Weapons with zero resolved perk columns: ${counts.weaponsWithZeroResolvedPerkColumns}
- Weapons with randomized plug sets: ${counts.weaponsWithRandomizedPlugSets}
- Weapons with unresolved plug hashes: ${counts.weaponsWithUnresolvedPlugHashes}
- Missing icons: ${counts.missingIcons}
- Missing local assets: ${counts.missingLocalAssets}

## Top Unresolved Plug Hashes

${unresolved || "None recorded."}

## Top Unknown Socket Categories

${unknownCategories || "None recorded."}

## Known Manifest Assumptions

- Weapon inclusion starts with \`itemType === 3\`.
- Plug options are resolved from reusable plug items, randomized plug sets, and reusable plug sets.
- Socket column labels are inferred from plug category identifiers and plug display metadata.
- Ambiguous socket categories are preserved for debug review instead of receiving high-confidence labels.

## Extraction Limitations

- Craftable and enhanceable flags are best-effort and need live manifest spot checks.
- Perk stat effects are not modeled yet.
- Source labeling depends on collectible fields when available.
- Some resolved plugs may be non-trait sockets such as mods or masterworks.

## Suspicious Records

Review \`public/data/dataHealth.json\` for sample weapons, sample raw-to-generated mappings, unresolved hashes, and unknown socket categories.
`;
}

async function main(): Promise<void> {
  const rawDefinitions = await loadRawDefinitions();
  const assetMap = await loadAssetMap();
  const bundle = buildGeneratedData({ ...rawDefinitions, assetMap });

  await writeJson(join(publicDataDir, "weapons.json"), bundle.weapons);
  await writeJson(join(publicDataDir, "perks.json"), bundle.perks);
  await writeJson(join(publicDataDir, "weaponPerkIndex.json"), bundle.weaponPerkIndex);
  await writeJson(join(publicDataDir, "filterOptions.json"), bundle.filterOptions);
  await writeJson(join(publicDataDir, "searchIndex.json"), bundle.searchIndex);
  await writeJson(join(publicDataDir, "manifestMeta.json"), bundle.manifestMeta);
  await writeJson(join(publicDataDir, "dataHealth.json"), bundle.dataHealth);
  await writeText(join(docsDir, "data-quality-report.md"), dataQualityReport(bundle));

  console.log(
    `Generated ${bundle.weapons.length} weapons and ${bundle.perks.length} perks.`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

