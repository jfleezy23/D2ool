import type { Weapon } from "../types";

export type ColumnPerkFilter = {
  socketIndex: number;
  perkName: string;
};

export type WeaponFilters = {
  query?: string;
  weaponType?: string;
  ammoType?: string;
  damageType?: string;
  rarity?: string;
  source?: string;
  craftable?: boolean;
  enhanceable?: boolean;
  adept?: boolean;
  selectedPerkNames?: string[];
  columnPerkFilters?: ColumnPerkFilter[];
};

export type WeaponSort =
  | "name"
  | "weaponType"
  | "rarity"
  | "damageType"
  | "ammoType"
  | "source";

function normalize(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase() ?? "";
}

function weaponContainsQuery(weapon: Weapon, query: string): boolean {
  if (!query) {
    return true;
  }

  const perkNames = weapon.perkColumns
    .flatMap((column) => column.perks.map((perk) => perk.name))
    .join(" ");
  const haystack = [
    weapon.name,
    weapon.description,
    weapon.flavorText,
    weapon.weaponType,
    weapon.ammoType,
    weapon.damageType,
    weapon.rarity,
    weapon.source,
    perkNames
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();

  return haystack.includes(query);
}

export function weaponHasAllSelectedPerksAnywhere(
  weapon: Weapon,
  selectedPerkNames: string[]
): boolean {
  const wanted = selectedPerkNames.map(normalize).filter(Boolean);
  if (wanted.length === 0) {
    return true;
  }

  const available = new Set(
    weapon.perkColumns.flatMap((column) =>
      column.perks.map((perk) => normalize(perk.name))
    )
  );

  return wanted.every((perkName) => available.has(perkName));
}

export function weaponHasSelectedPerkInSpecificColumn(
  weapon: Weapon,
  columnFilter: ColumnPerkFilter
): boolean {
  const wanted = normalize(columnFilter.perkName);
  if (!wanted) {
    return true;
  }

  return weapon.perkColumns.some((column) => {
    return (
      column.socketIndex === columnFilter.socketIndex &&
      column.perks.some((perk) => normalize(perk.name) === wanted)
    );
  });
}

export function filterWeapons(weapons: Weapon[], filters: WeaponFilters): Weapon[] {
  const query = normalize(filters.query);
  const selectedPerkNames = filters.selectedPerkNames ?? [];
  const columnPerkFilters = filters.columnPerkFilters ?? [];

  return weapons.filter((weapon) => {
    if (!weaponContainsQuery(weapon, query)) {
      return false;
    }

    if (filters.weaponType && weapon.weaponType !== filters.weaponType) {
      return false;
    }

    if (filters.ammoType && weapon.ammoType !== filters.ammoType) {
      return false;
    }

    if (filters.damageType && weapon.damageType !== filters.damageType) {
      return false;
    }

    if (filters.rarity && weapon.rarity !== filters.rarity) {
      return false;
    }

    if (filters.source && weapon.source !== filters.source) {
      return false;
    }

    if (filters.craftable !== undefined && weapon.craftable !== filters.craftable) {
      return false;
    }

    if (filters.enhanceable !== undefined && weapon.enhanceable !== filters.enhanceable) {
      return false;
    }

    if (filters.adept !== undefined && weapon.adept !== filters.adept) {
      return false;
    }

    if (!weaponHasAllSelectedPerksAnywhere(weapon, selectedPerkNames)) {
      return false;
    }

    return columnPerkFilters.every((columnFilter) =>
      weaponHasSelectedPerkInSpecificColumn(weapon, columnFilter)
    );
  });
}

export function sortWeapons(weapons: Weapon[], sort: WeaponSort): Weapon[] {
  const field = sort;
  return [...weapons].sort((a, b) => {
    const left = normalize(String(a[field] ?? ""));
    const right = normalize(String(b[field] ?? ""));

    if (left === right) {
      return normalize(a.name).localeCompare(normalize(b.name));
    }

    return left.localeCompare(right);
  });
}

