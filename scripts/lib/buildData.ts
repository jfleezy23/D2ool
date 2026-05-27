import type {
  DataHealth,
  FilterOptions,
  FoundryColumnKey,
  GeneratedDataBundle,
  LabelConfidence,
  ManifestMeta,
  Perk,
  PerkColumn,
  SearchIndexEntry,
  Weapon,
  WeaponPerkIndex
} from "../../src/types";
import type { AssetMap } from "./assets";
import { localizeAssetPath, normalizeBungieAssetPath } from "./assets";
import type { DefinitionRecord, LatestManifestMetadata } from "./manifestLoader";

const weaponItemType = 3;
const rpmStatHash = "4284893193";
const foundryColumnKeys: FoundryColumnKey[] = ["col1", "col2", "trait3", "trait4"];

const weaponTypeNames = new Map(
  [
    "hand cannon",
    "pulse rifle",
    "auto rifle",
    "scout rifle",
    "sidearm",
    "submachine gun",
    "bow",
    "combat bow",
    "shotgun",
    "sniper rifle",
    "fusion rifle",
    "linear fusion rifle",
    "rocket launcher",
    "grenade launcher",
    "machine gun",
    "sword",
    "glaive",
    "trace rifle"
  ].map((name) => [normalizeText(name), name === "combat bow" ? "bow" : name])
);

const ammoTypes = new Map<number, string>([
  [1, "Primary"],
  [2, "Special"],
  [3, "Heavy"]
]);

type BuildGeneratedDataInput = {
  latest?: LatestManifestMetadata;
  inventoryItems: DefinitionRecord;
  plugSets: DefinitionRecord;
  itemCategories: DefinitionRecord;
  stats: DefinitionRecord;
  statGroups: DefinitionRecord;
  collectibles: DefinitionRecord;
  damageTypes: DefinitionRecord;
  assetMap?: AssetMap;
};

type ExtractionStats = {
  weaponItemsSeen: number;
  weaponsWithZeroSockets: number;
  weaponsWithZeroResolvedPerkColumns: number;
  weaponsWithRandomizedPlugSets: Set<number>;
  weaponsWithUnresolvedPlugHashes: Set<number>;
  unresolvedPlugHashes: Map<number, number>;
  unknownSocketCategories: Map<number, number>;
  missingIcons: number;
  missingLocalAssets: number;
};

type SocketResolution = {
  column: PerkColumn | null;
  randomized: boolean;
  unresolvedPlugHashes: number[];
  sourcePlugSetHashes: number[];
  unknownSocketCategoryHash?: number;
};

function normalizeText(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase() ?? "";
}

function compact<T>(values: (T | undefined | null | false)[]): T[] {
  return values.filter(Boolean) as T[];
}

function getString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function getArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(getRecord(item)))
    : [];
}

function getDisplay(record: Record<string, unknown>): Record<string, unknown> {
  return getRecord(record.displayProperties) ?? {};
}

function getDisplayName(record: Record<string, unknown> | undefined): string | undefined {
  return record ? getString(getDisplay(record), "name") : undefined;
}

function isRedacted(record: Record<string, unknown>): boolean {
  return record.redacted === true;
}

function hasUsefulDisplay(record: Record<string, unknown>): boolean {
  const display = getDisplay(record);
  const name = getString(display, "name");
  if (!name || name === "Classified" || name === "Dummy" || name.startsWith("Deprecated")) {
    return false;
  }

  return true;
}

function getHash(record: Record<string, unknown>, fallback: string): number | undefined {
  const directHash = getNumber(record, "hash");
  if (directHash !== undefined) {
    return directHash;
  }

  const parsed = Number(fallback);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === "number" && Number.isFinite(item))
    : [];
}

function resolveWeaponType(
  item: Record<string, unknown>,
  itemCategories: DefinitionRecord
): string {
  const direct = weaponTypeNames.get(normalizeText(getString(item, "itemTypeDisplayName")));
  if (direct) {
    return direct;
  }

  for (const categoryHash of getNumberArray(item.itemCategoryHashes)) {
    const category = itemCategories[String(categoryHash)];
    const categoryName = weaponTypeNames.get(normalizeText(getDisplayName(category)));
    if (categoryName) {
      return categoryName;
    }
  }

  return "other";
}

function resolveDamageType(
  item: Record<string, unknown>,
  damageTypes: DefinitionRecord
): string | undefined {
  const damageTypeHash = getNumber(item, "defaultDamageTypeHash");
  if (damageTypeHash !== undefined) {
    const damageType = damageTypes[String(damageTypeHash)];
    const damageTypeName = getDisplayName(damageType);
    if (damageTypeName) {
      return damageTypeName;
    }
  }

  return undefined;
}

function resolveStats(
  item: Record<string, unknown>,
  statDefinitions: DefinitionRecord
): Record<string, number> {
  const stats: Record<string, number> = {};
  const statsBlock = getRecord(getRecord(item.stats)?.stats);
  if (!statsBlock) {
    return stats;
  }

  for (const [statHash, rawStat] of Object.entries(statsBlock)) {
    const stat = getRecord(rawStat);
    if (!stat) {
      continue;
    }

    const value = getNumber(stat, "value");
    if (value === undefined) {
      continue;
    }

    const statName = getDisplayName(statDefinitions[statHash]) ?? `stat:${statHash}`;
    stats[statName] = value;
  }

  return stats;
}

function resolveStatValueByHash(
  item: Record<string, unknown>,
  statHash: string
): number | undefined {
  const stat = getRecord(getRecord(getRecord(item.stats)?.stats)?.[statHash]);
  return stat ? getNumber(stat, "value") : undefined;
}

function recordCount(map: Map<number, number>, key: number): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function collectPlugHashesFromPlugSet(
  plugSet: Record<string, unknown> | undefined
): number[] {
  if (!plugSet) {
    return [];
  }

  const plugItems = [
    ...getArray(plugSet.reusablePlugItems),
    ...getArray(plugSet.randomizedPlugItems)
  ];

  return plugItems
    .map((plug) => getNumber(plug, "plugItemHash"))
    .filter((hash): hash is number => hash !== undefined);
}

function collectDirectReusablePlugHashes(socketEntry: Record<string, unknown>): number[] {
  return getArray(socketEntry.reusablePlugItems)
    .map((plug) => getNumber(plug, "plugItemHash"))
    .filter((hash): hash is number => hash !== undefined);
}

function inferColumnLabel(
  socketIndex: number,
  socketEntry: Record<string, unknown>,
  perks: Perk[],
  traitOrdinal: number
): { label: string; confidence: LabelConfidence; traitLike: boolean } {
  const socketCategoryHash = getNumber(socketEntry, "socketCategoryHash");
  const categories = perks.map((perk) => normalizeText(perk.plugCategoryIdentifier));
  const itemTypes = perks.map((perk) => normalizeText(perk.itemTypeDisplayName));
  const signal = [
    ...perks.map((perk) => perk.plugCategoryIdentifier),
    ...perks.map((perk) => perk.itemTypeDisplayName),
    ...perks.map((perk) => perk.name)
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();

  if (
    itemTypes.some((itemType) => itemType.includes("trait")) ||
    categories.some(
      (category) =>
        category === "frames" ||
        category.includes("random_perks") ||
        category.includes("randomized")
    )
  ) {
    return {
      label: traitOrdinal <= 2 ? `Trait column ${traitOrdinal}` : `Trait column ${traitOrdinal}`,
      confidence: "medium",
      traitLike: true
    };
  }

  if (
    categories.some((category) => category.includes("intrinsics")) ||
    itemTypes.some((itemType) => itemType === "intrinsic") ||
    signal.includes("intrinsic") ||
    signal.includes("frame")
  ) {
    return { label: "Intrinsic/frame", confidence: "medium", traitLike: false };
  }

  if (signal.includes("origin")) {
    return { label: "Origin trait", confidence: "high", traitLike: false };
  }

  if (signal.includes("masterwork")) {
    return { label: "Masterwork", confidence: "high", traitLike: false };
  }

  if (signal.includes("weapon mod") || signal.includes("weapon.mod") || signal.includes("mods.weapons")) {
    return { label: "Weapon mod", confidence: "medium", traitLike: false };
  }

  if (signal.includes("barrel")) {
    return { label: "Barrel", confidence: "high", traitLike: false };
  }

  if (signal.includes("magazine") || signal.includes("battery")) {
    return { label: "Magazine/battery", confidence: "high", traitLike: false };
  }

  return {
    label: socketCategoryHash
      ? `Socket ${socketIndex} (${socketCategoryHash})`
      : `Socket ${socketIndex}`,
    confidence: "low",
    traitLike: false
  };
}

function resolvePerk(
  plugHash: number,
  inventoryItems: DefinitionRecord,
  assetMap: AssetMap
): Perk | undefined {
  const plugItem = inventoryItems[String(plugHash)];
  if (!plugItem || isRedacted(plugItem) || !hasUsefulDisplay(plugItem)) {
    return undefined;
  }

  const display = getDisplay(plugItem);
  const plug = getRecord(plugItem.plug);

  return {
    hash: plugHash,
    name: getString(display, "name") ?? `Unknown plug ${plugHash}`,
    description: getString(display, "description"),
    iconPath: localizeAssetPath(
      normalizeBungieAssetPath(getString(display, "icon")),
      assetMap
    ),
    plugCategoryIdentifier: getString(plug ?? {}, "plugCategoryIdentifier"),
    itemTypeDisplayName: getString(plugItem, "itemTypeDisplayName")
  };
}

function isRollRelevantPerk(perk: Perk): boolean {
  const category = normalizeText(perk.plugCategoryIdentifier);
  const itemType = normalizeText(perk.itemTypeDisplayName);

  if (
    category === "shader" ||
    category === "mementos" ||
    category.startsWith("crafting.") ||
    category.includes("trackers") ||
    itemType === "shader"
  ) {
    return false;
  }

  if (
    category.includes("masterworks.stat") &&
    normalizeText(perk.name).startsWith("tier ")
  ) {
    return false;
  }

  return true;
}

function dedupePerksByDisplay(perks: Perk[]): Perk[] {
  const seen = new Set<string>();
  const deduped: Perk[] = [];

  for (const perk of perks) {
    const key = [
      normalizeText(perk.name),
      normalizeText(perk.description),
      normalizeText(perk.plugCategoryIdentifier),
      normalizeText(perk.itemTypeDisplayName)
    ].join("|");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(perk);
  }

  return deduped;
}

function isTraitColumn(column: PerkColumn): boolean {
  const label = normalizeText(column.label);
  const categories = column.perks.map((perk) => normalizeText(perk.plugCategoryIdentifier));
  const itemTypes = column.perks.map((perk) => normalizeText(perk.itemTypeDisplayName));
  const signal = [
    label,
    ...column.perks.map((perk) => perk.plugCategoryIdentifier),
    ...column.perks.map((perk) => perk.itemTypeDisplayName)
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();

  return (
    label.startsWith("trait column") ||
    itemTypes.some((itemType) => itemType.includes("trait")) ||
    categories.some((category) => category === "frames") ||
    signal.includes("random_perks") ||
    signal.includes("trait")
  );
}

function isFoundryRollColumn(column: PerkColumn): boolean {
  const label = normalizeText(column.label);
  if (isTraitColumn(column)) {
    return true;
  }

  if (
    label === "intrinsic/frame" ||
    label === "origin trait" ||
    label === "masterwork" ||
    label === "weapon mod"
  ) {
    return false;
  }

  const signal = [
    ...column.perks.map((perk) => perk.plugCategoryIdentifier),
    ...column.perks.map((perk) => perk.itemTypeDisplayName)
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();

  return !(
    signal.includes("intrinsics") ||
    signal.includes("origin") ||
    signal.includes("masterwork") ||
    signal.includes("mods.weapons")
  );
}

function applyFoundryColumnKeys(perkColumns: PerkColumn[]): PerkColumn[] {
  let rollOrdinal = 0;
  let traitOrdinal = 0;

  return perkColumns.map((column) => {
    if (!isFoundryRollColumn(column)) {
      return column;
    }

    const key: FoundryColumnKey | undefined = isTraitColumn(column)
      ? (["trait3", "trait4"] as FoundryColumnKey[])[traitOrdinal++]
      : (["col1", "col2"] as FoundryColumnKey[])[rollOrdinal++];

    return key ? { ...column, foundryColumnKey: key } : column;
  });
}

function resolveSocketColumn(
  weaponHash: number,
  socketIndex: number,
  socketEntry: Record<string, unknown>,
  input: BuildGeneratedDataInput,
  traitOrdinal: number
): SocketResolution {
  const plugSetHashes = compact([
    getNumber(socketEntry, "randomizedPlugSetHash"),
    getNumber(socketEntry, "reusablePlugSetHash")
  ]);
  const randomized = getNumber(socketEntry, "randomizedPlugSetHash") !== undefined;
  const directPlugHashes = collectDirectReusablePlugHashes(socketEntry);
  const plugSetPlugHashes = plugSetHashes.flatMap((plugSetHash) =>
    collectPlugHashesFromPlugSet(input.plugSets[String(plugSetHash)])
  );
  const allPlugHashes = Array.from(new Set([...directPlugHashes, ...plugSetPlugHashes]));
  const unresolvedPlugHashes: number[] = [];
  const perks = dedupePerksByDisplay(
    allPlugHashes
      .map((plugHash) => {
        const perk = resolvePerk(plugHash, input.inventoryItems, input.assetMap ?? {});
        if (!perk) {
          unresolvedPlugHashes.push(plugHash);
        }
        return perk;
      })
      .filter((perk): perk is Perk => perk !== undefined)
      .filter(isRollRelevantPerk)
  );

  if (perks.length === 0) {
    return {
      column: null,
      randomized,
      unresolvedPlugHashes,
      sourcePlugSetHashes: plugSetHashes,
      unknownSocketCategoryHash: getNumber(socketEntry, "socketCategoryHash")
    };
  }

  const label = inferColumnLabel(socketIndex, socketEntry, perks, traitOrdinal);

  return {
    column: {
      socketIndex,
      label: label.label,
      labelConfidence: label.confidence,
      perks
    },
    randomized,
    unresolvedPlugHashes,
    sourcePlugSetHashes: plugSetHashes,
    unknownSocketCategoryHash:
      label.confidence === "low" ? getNumber(socketEntry, "socketCategoryHash") : undefined
  };
}

function resolveSource(
  item: Record<string, unknown>,
  collectibles: DefinitionRecord
): string | undefined {
  const collectibleHash = getNumber(item, "collectibleHash");
  if (collectibleHash === undefined) {
    return undefined;
  }

  const collectible = collectibles[String(collectibleHash)];
  if (!collectible) {
    return undefined;
  }

  const sourceString = getString(collectible, "sourceString");
  const description = getString(getDisplay(collectible), "description");
  return sourceString || description;
}

function countMissingLocalAsset(path: string | undefined): boolean {
  if (!path) {
    return false;
  }

  return path.startsWith("/common/") || path.startsWith("https://www.bungie.net/common/");
}

function topCounts<T extends string>(
  counts: Map<number, number>,
  keyName: T
): Array<Record<T, number> & { count: number }> {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([hash, count]) => ({ [keyName]: hash, count }) as Record<T, number> & {
      count: number;
    });
}

function collectFilterOptions(weapons: Weapon[], perks: Perk[]): FilterOptions {
  const values = {
    weaponTypes: new Set<string>(),
    ammoTypes: new Set<string>(),
    damageTypes: new Set<string>(),
    rarities: new Set<string>(),
    sources: new Set<string>(),
    rpmOptionsByWeaponType: new Map<string, Set<number>>(),
    perkNamesByFoundryColumn: new Map<FoundryColumnKey, Set<string>>(
      foundryColumnKeys.map((key) => [key, new Set<string>()])
    ),
    perkNames: new Set<string>()
  };

  for (const weapon of weapons) {
    if (weapon.weaponType) values.weaponTypes.add(weapon.weaponType);
    if (weapon.ammoType) values.ammoTypes.add(weapon.ammoType);
    if (weapon.damageType) values.damageTypes.add(weapon.damageType);
    if (weapon.rarity) values.rarities.add(weapon.rarity);
    if (weapon.source) values.sources.add(weapon.source);
    if (weapon.weaponType && weapon.rpm !== undefined) {
      const rpmValues =
        values.rpmOptionsByWeaponType.get(weapon.weaponType) ?? new Set<number>();
      rpmValues.add(weapon.rpm);
      values.rpmOptionsByWeaponType.set(weapon.weaponType, rpmValues);
    }

    for (const column of weapon.perkColumns) {
      if (!column.foundryColumnKey) {
        continue;
      }

      const columnPerks = values.perkNamesByFoundryColumn.get(column.foundryColumnKey);
      for (const perk of column.perks) {
        columnPerks?.add(perk.name);
      }
    }
  }

  for (const perk of perks) {
    values.perkNames.add(perk.name);
  }

  return {
    weaponTypes: Array.from(values.weaponTypes).sort(),
    ammoTypes: Array.from(values.ammoTypes).sort(),
    damageTypes: Array.from(values.damageTypes).sort(),
    rarities: Array.from(values.rarities).sort(),
    sources: Array.from(values.sources).sort(),
    rpmOptionsByWeaponType: Object.fromEntries(
      Array.from(values.rpmOptionsByWeaponType.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([weaponType, rpmValues]) => [
          weaponType,
          Array.from(rpmValues).sort((left, right) => left - right)
        ])
    ),
    perkNamesByFoundryColumn: Object.fromEntries(
      foundryColumnKeys.map((key) => [
        key,
        Array.from(values.perkNamesByFoundryColumn.get(key) ?? []).sort()
      ])
    ) as Record<FoundryColumnKey, string[]>,
    perkNames: Array.from(values.perkNames).sort()
  };
}

function collectPerks(weapons: Weapon[]): Perk[] {
  const perksByHash = new Map<number, Perk>();
  for (const weapon of weapons) {
    for (const column of weapon.perkColumns) {
      for (const perk of column.perks) {
        perksByHash.set(perk.hash, perk);
      }
    }
  }

  return Array.from(perksByHash.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function buildWeaponPerkIndex(weapons: Weapon[]): WeaponPerkIndex {
  return Object.fromEntries(
    weapons.map((weapon) => {
      const columns = weapon.perkColumns.map((column) => ({
        socketIndex: column.socketIndex,
        label: column.label,
        foundryColumnKey: column.foundryColumnKey,
        perkHashes: column.perks.map((perk) => perk.hash)
      }));

      return [
        String(weapon.hash),
        {
          weaponHash: weapon.hash,
          columns,
          allPerkHashes: Array.from(
            new Set(columns.flatMap((column) => column.perkHashes))
          )
        }
      ];
    })
  );
}

function buildSearchIndex(weapons: Weapon[]): SearchIndexEntry[] {
  return weapons.map((weapon) => {
    const perkNames = Array.from(
      new Set(weapon.perkColumns.flatMap((column) => column.perks.map((perk) => perk.name)))
    ).sort();

    return {
      hash: weapon.hash,
      text: [
        weapon.name,
        weapon.description,
        weapon.flavorText,
        weapon.weaponType,
        weapon.ammoType,
        weapon.damageType,
        weapon.rarity,
        weapon.source,
        perkNames.join(" ")
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(),
      weaponType: weapon.weaponType,
      ammoType: weapon.ammoType,
      damageType: weapon.damageType,
      rarity: weapon.rarity,
      source: weapon.source,
      rpm: weapon.rpm,
      perkNames
    };
  });
}

function buildWeapon(
  hash: number,
  item: Record<string, unknown>,
  input: BuildGeneratedDataInput,
  stats: ExtractionStats
): Weapon | undefined {
  if (getNumber(item, "itemType") !== weaponItemType) {
    return undefined;
  }

  stats.weaponItemsSeen += 1;

  if (isRedacted(item) || !hasUsefulDisplay(item)) {
    return undefined;
  }

  const display = getDisplay(item);
  const sockets = getArray(getRecord(item.sockets)?.socketEntries);
  if (sockets.length === 0) {
    stats.weaponsWithZeroSockets += 1;
  }

  let traitOrdinal = 0;
  const sourceMappings: DataHealth["sampleMappings"][number]["socketColumns"] = [];
  const resolvedPerkColumns = sockets
    .map((socketEntry, socketIndex) => {
      const dryLabel = inferColumnLabel(socketIndex, socketEntry, [], traitOrdinal + 1);
      if (dryLabel.traitLike) {
        traitOrdinal += 1;
      }

      const resolution = resolveSocketColumn(
        hash,
        socketIndex,
        socketEntry,
        input,
        Math.max(traitOrdinal, 1)
      );

      if (resolution.randomized) {
        stats.weaponsWithRandomizedPlugSets.add(hash);
      }

      for (const unresolvedHash of resolution.unresolvedPlugHashes) {
        stats.weaponsWithUnresolvedPlugHashes.add(hash);
        recordCount(stats.unresolvedPlugHashes, unresolvedHash);
      }

      if (resolution.unknownSocketCategoryHash !== undefined) {
        recordCount(stats.unknownSocketCategories, resolution.unknownSocketCategoryHash);
      }

      if (resolution.column) {
        const labelData = inferColumnLabel(
          socketIndex,
          socketEntry,
          resolution.column.perks,
          traitOrdinal || 1
        );
        if (labelData.traitLike) {
          traitOrdinal += dryLabel.traitLike ? 0 : 1;
          resolution.column.label = `Trait column ${Math.max(1, traitOrdinal)}`;
        }

        sourceMappings.push({
          socketIndex,
          label: resolution.column.label,
          labelConfidence: resolution.column.labelConfidence,
          sourcePlugSetHashes: resolution.sourcePlugSetHashes,
          samplePerkHashes: resolution.column.perks.slice(0, 5).map((perk) => perk.hash)
        });
      }

      return resolution.column;
    })
    .filter((column): column is PerkColumn => column !== null);
  const perkColumns = applyFoundryColumnKeys(resolvedPerkColumns);

  if (perkColumns.length === 0) {
    stats.weaponsWithZeroResolvedPerkColumns += 1;
  }

  const iconPath = localizeAssetPath(
    normalizeBungieAssetPath(getString(display, "icon")),
    input.assetMap ?? {}
  );
  const screenshotPath = localizeAssetPath(
    normalizeBungieAssetPath(getString(item, "screenshot")),
    input.assetMap ?? {}
  );

  if (!iconPath) {
    stats.missingIcons += 1;
  }
  if (countMissingLocalAsset(iconPath) || countMissingLocalAsset(screenshotPath)) {
    stats.missingLocalAssets += 1;
  }

  const allPerks = perkColumns.flatMap((column) => column.perks);
  const intrinsic = perkColumns.find((column) => column.label === "Intrinsic/frame");
  const resolvedStats = resolveStats(item, input.stats);

  return {
    hash,
    name: getString(display, "name") ?? `Unknown weapon ${hash}`,
    description: getString(display, "description"),
    flavorText: getString(item, "flavorText"),
    iconPath,
    screenshotPath,
    rarity: getString(getRecord(item.inventory) ?? {}, "tierTypeName"),
    weaponType: resolveWeaponType(item, input.itemCategories),
    ammoType: ammoTypes.get(getNumber(getRecord(item.equippingBlock) ?? {}, "ammoType") ?? -1),
    damageType: resolveDamageType(item, input.damageTypes),
    archetype: intrinsic?.perks[0]?.name,
    rpm: resolveStatValueByHash(item, rpmStatHash),
    source: resolveSource(item, input.collectibles),
    craftable: getRecord(item.crafting) !== undefined || undefined,
    enhanceable:
      allPerks.some((perk) => normalizeText(perk.name).startsWith("enhanced ")) || undefined,
    adept: normalizeText(getString(display, "name")).includes("(adept)") || undefined,
    stats: resolvedStats,
    perkColumns,
    raw: {
      itemCategoryHashes: getNumberArray(item.itemCategoryHashes),
      collectibleHash: getNumber(item, "collectibleHash"),
      socketCategoryHashes: sockets
        .map((socket) => getNumber(socket, "socketCategoryHash"))
        .filter((socketCategoryHash): socketCategoryHash is number => socketCategoryHash !== undefined),
      socketColumns: sourceMappings.map((mapping) => ({
        socketIndex: mapping.socketIndex,
        socketCategoryHash: getNumber(sockets[mapping.socketIndex], "socketCategoryHash"),
        plugSetHashes: mapping.sourcePlugSetHashes
      }))
    }
  };
}

export function buildGeneratedData(input: BuildGeneratedDataInput): GeneratedDataBundle {
  const extractionStats: ExtractionStats = {
    weaponItemsSeen: 0,
    weaponsWithZeroSockets: 0,
    weaponsWithZeroResolvedPerkColumns: 0,
    weaponsWithRandomizedPlugSets: new Set<number>(),
    weaponsWithUnresolvedPlugHashes: new Set<number>(),
    unresolvedPlugHashes: new Map<number, number>(),
    unknownSocketCategories: new Map<number, number>(),
    missingIcons: 0,
    missingLocalAssets: 0
  };

  const weapons = Object.entries(input.inventoryItems)
    .map(([hashString, item]) => {
      const hash = getHash(item, hashString);
      return hash === undefined
        ? undefined
        : buildWeapon(hash, item, input, extractionStats);
    })
    .filter((weapon): weapon is Weapon => weapon !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));

  const perks = collectPerks(weapons);
  const weaponPerkIndex = buildWeaponPerkIndex(weapons);
  const filterOptions = collectFilterOptions(weapons, perks);
  const searchIndex = buildSearchIndex(weapons);
  const builtAt = new Date().toISOString();

  const manifestMeta: ManifestMeta = {
    manifestVersion: input.latest?.manifestVersion,
    builtAt,
    locale: input.latest?.locale ?? "en",
    counts: {
      inventoryItems: Object.keys(input.inventoryItems).length,
      weaponItems: weapons.length,
      perks: perks.length,
      weaponsWithZeroSockets: extractionStats.weaponsWithZeroSockets,
      weaponsWithZeroResolvedPerkColumns:
        extractionStats.weaponsWithZeroResolvedPerkColumns,
      weaponsWithRandomizedPlugSets: extractionStats.weaponsWithRandomizedPlugSets.size,
      weaponsWithUnresolvedPlugHashes:
        extractionStats.weaponsWithUnresolvedPlugHashes.size,
      missingIcons: extractionStats.missingIcons,
      missingLocalAssets: extractionStats.missingLocalAssets
    }
  };

  const dataHealth: DataHealth = {
    ...manifestMeta,
    topUnresolvedHashes: topCounts(extractionStats.unresolvedPlugHashes, "hash"),
    topUnknownSocketCategories: topCounts(
      extractionStats.unknownSocketCategories,
      "socketCategoryHash"
    ),
    sampleWeapons: weapons.slice(0, 10),
    sampleMappings: weapons.slice(0, 10).map((weapon) => ({
      weaponHash: weapon.hash,
      weaponName: weapon.name,
      socketColumns:
        weapon.raw?.socketColumns?.map((column) => ({
          socketIndex: column.socketIndex,
          label:
            weapon.perkColumns.find(
              (perkColumn) => perkColumn.socketIndex === column.socketIndex
            )?.label ?? `Socket ${column.socketIndex}`,
          labelConfidence:
            weapon.perkColumns.find(
              (perkColumn) => perkColumn.socketIndex === column.socketIndex
            )?.labelConfidence ?? "low",
          foundryColumnKey: weapon.perkColumns.find(
            (perkColumn) => perkColumn.socketIndex === column.socketIndex
          )?.foundryColumnKey,
          sourcePlugSetHashes: column.plugSetHashes ?? [],
          samplePerkHashes:
            weapon.perkColumns
              .find((perkColumn) => perkColumn.socketIndex === column.socketIndex)
              ?.perks.slice(0, 5)
              .map((perk) => perk.hash) ?? []
        })) ?? []
    }))
  };

  return {
    weapons,
    perks,
    weaponPerkIndex,
    filterOptions,
    searchIndex,
    manifestMeta,
    dataHealth
  };
}
