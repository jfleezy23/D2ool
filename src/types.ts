export type LabelConfidence = "high" | "medium" | "low";

export type Perk = {
  hash: number;
  name: string;
  description?: string;
  iconPath?: string;
  plugCategoryIdentifier?: string;
  itemTypeDisplayName?: string;
};

export type PerkColumn = {
  socketIndex: number;
  label: string;
  labelConfidence: LabelConfidence;
  perks: Perk[];
};

export type Weapon = {
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
    socketColumns?: {
      socketIndex: number;
      socketCategoryHash?: number;
      plugSetHashes?: number[];
    }[];
  };
};

export type SavedRoll = {
  id: string;
  weaponHash: number;
  weaponName: string;
  createdAt: string;
  updatedAt: string;
  selectedPerks: {
    socketIndex: number;
    perkHash: number;
    perkName: string;
  }[];
  notes?: string;
};

export type WeaponPerkIndex = Record<
  string,
  {
    weaponHash: number;
    columns: {
      socketIndex: number;
      label: string;
      perkHashes: number[];
    }[];
    allPerkHashes: number[];
  }
>;

export type FilterOptions = {
  weaponTypes: string[];
  ammoTypes: string[];
  damageTypes: string[];
  rarities: string[];
  sources: string[];
  perkNames: string[];
};

export type SearchIndexEntry = {
  hash: number;
  text: string;
  weaponType?: string;
  ammoType?: string;
  damageType?: string;
  rarity?: string;
  source?: string;
  perkNames: string[];
};

export type ManifestMeta = {
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

export type DataHealth = ManifestMeta & {
  topUnresolvedHashes: { hash: number; count: number }[];
  topUnknownSocketCategories: { socketCategoryHash: number; count: number }[];
  sampleWeapons: Weapon[];
  sampleMappings: {
    weaponHash: number;
    weaponName: string;
    socketColumns: {
      socketIndex: number;
      label: string;
      labelConfidence: LabelConfidence;
      sourcePlugSetHashes: number[];
      samplePerkHashes: number[];
    }[];
  }[];
};

export type GeneratedDataBundle = {
  weapons: Weapon[];
  perks: Perk[];
  weaponPerkIndex: WeaponPerkIndex;
  filterOptions: FilterOptions;
  searchIndex: SearchIndexEntry[];
  manifestMeta: ManifestMeta;
  dataHealth: DataHealth;
};

