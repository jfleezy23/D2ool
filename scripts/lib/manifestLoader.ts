import { join } from "node:path";
import { latestManifestPath } from "./paths";
import { readJson } from "./fs";

export const requiredDefinitionNames = [
  "DestinyInventoryItemDefinition",
  "DestinyPlugSetDefinition",
  "DestinyItemCategoryDefinition",
  "DestinyStatDefinition",
  "DestinyStatGroupDefinition",
  "DestinyCollectibleDefinition",
  "DestinyDamageTypeDefinition"
] as const;

export type RequiredDefinitionName = (typeof requiredDefinitionNames)[number];

export type DefinitionRecord = Record<string, Record<string, unknown>>;

export type LatestManifestMetadata = {
  manifestVersion: string;
  downloadedAt: string;
  locale: string;
  manifestUrl: string;
  definitionPaths: Record<string, string>;
  sourceUrls: Record<string, string>;
  rawDirectory: string;
};

export type RawDefinitions = {
  latest: LatestManifestMetadata;
  inventoryItems: DefinitionRecord;
  plugSets: DefinitionRecord;
  itemCategories: DefinitionRecord;
  stats: DefinitionRecord;
  statGroups: DefinitionRecord;
  collectibles: DefinitionRecord;
  damageTypes: DefinitionRecord;
};

async function readDefinition(
  latest: LatestManifestMetadata,
  name: RequiredDefinitionName
): Promise<DefinitionRecord> {
  return readJson<DefinitionRecord>(join(latest.rawDirectory, `${name}.json`));
}

export async function loadLatestManifestMetadata(): Promise<LatestManifestMetadata> {
  return readJson<LatestManifestMetadata>(latestManifestPath);
}

export async function loadRawDefinitions(): Promise<RawDefinitions> {
  const latest = await loadLatestManifestMetadata();

  return {
    latest,
    inventoryItems: await readDefinition(latest, "DestinyInventoryItemDefinition"),
    plugSets: await readDefinition(latest, "DestinyPlugSetDefinition"),
    itemCategories: await readDefinition(latest, "DestinyItemCategoryDefinition"),
    stats: await readDefinition(latest, "DestinyStatDefinition"),
    statGroups: await readDefinition(latest, "DestinyStatGroupDefinition"),
    collectibles: await readDefinition(latest, "DestinyCollectibleDefinition"),
    damageTypes: await readDefinition(latest, "DestinyDamageTypeDefinition")
  };
}

