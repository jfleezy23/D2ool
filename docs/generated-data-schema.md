# Generated Data Schema

Generated files live under `public/data/`. These files are app-facing, compact, and intentionally hide raw Bungie manifest layout from React components.

## `weapons.json`

```ts
type Weapon = {
  hash: number;
  name: string;
  description?: string;
  flavorText?: string;
  iconPath?: string;
  screenshotPath?: string;
  rarity?: string;
  weaponType?: string;
  ammoType?: string;
  damageType?: string;
  archetype?: string;
  rpm?: number;
  source?: string;
  craftable?: boolean;
  enhanceable?: boolean;
  adept?: boolean;
  stats: Record<string, number>;
  perkColumns: PerkColumn[];
  raw?: {
    itemCategoryHashes?: number[];
    collectibleHash?: number;
    socketCategoryHashes?: number[];
  };
};
```

## `perks.json`

```ts
type Perk = {
  hash: number;
  name: string;
  description?: string;
  iconPath?: string;
  plugCategoryIdentifier?: string;
  itemTypeDisplayName?: string;
};
```

## Socket Columns

```ts
type FoundryColumnKey = "col1" | "col2" | "trait3" | "trait4";

type PerkColumn = {
  socketIndex: number;
  label: string;
  labelConfidence: "high" | "medium" | "low";
  foundryColumnKey?: FoundryColumnKey;
  perks: Perk[];
};
```

`foundryColumnKey` is a generated convenience key for the D2Foundry-like workbench filters. It is intentionally absent for intrinsic, origin trait, masterwork, weapon mod, and unresolved/non-roll sockets.

## `weaponPerkIndex.json`

Maps each weapon hash to socket-aware perk hashes.

```ts
type WeaponPerkIndex = Record<
  string,
  {
    weaponHash: number;
    columns: {
      socketIndex: number;
      label: string;
      foundryColumnKey?: FoundryColumnKey;
      perkHashes: number[];
    }[];
    allPerkHashes: number[];
  }
>;
```

## `filterOptions.json`

Sorted filter values derived from generated weapon records.

```ts
type FilterOptions = {
  weaponTypes: string[];
  ammoTypes: string[];
  damageTypes: string[];
  rarities: string[];
  sources: string[];
  rpmOptionsByWeaponType: Record<string, number[]>;
  perkNamesByFoundryColumn: Record<FoundryColumnKey, string[]>;
  perkNames: string[];
};
```

## `searchIndex.json`

Compact text index for client-side filtering.

```ts
type SearchIndexEntry = {
  hash: number;
  text: string;
  weaponType?: string;
  ammoType?: string;
  damageType?: string;
  rarity?: string;
  source?: string;
  rpm?: number;
  perkNames: string[];
};
```

## `manifestMeta.json`

Manifest provenance and extraction metrics.

```ts
type ManifestMeta = {
  manifestVersion?: string;
  builtAt: string;
  locale: string;
  counts: {
    inventoryItems: number;
    weaponItems: number;
    perks: number;
    weaponsWithZeroSockets: number;
    weaponsWithZeroResolvedPerkColumns: number;
    weaponsWithRandomizedPlugSets: number;
    weaponsWithUnresolvedPlugHashes: number;
    missingIcons: number;
    missingLocalAssets: number;
  };
};
```

## `dataHealth.json`

Debug-only generated details for `/debug/data-health`.

```ts
type DataHealth = ManifestMeta & {
  topUnresolvedHashes: { hash: number; count: number }[];
  topUnknownSocketCategories: { socketCategoryHash: number; count: number }[];
  sampleWeapons: Weapon[];
  sampleMappings: unknown[];
};
```
