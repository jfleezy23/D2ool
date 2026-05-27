import type {
  DataHealth,
  FilterOptions,
  ManifestMeta,
  Perk,
  SearchIndexEntry,
  Weapon,
  WeaponPerkIndex
} from "../types";
import { validateWeaponRecords } from "./schema";

export type AppData = {
  weapons: Weapon[];
  perks: Perk[];
  weaponPerkIndex: WeaponPerkIndex;
  filterOptions: FilterOptions;
  searchIndex: SearchIndexEntry[];
  manifestMeta: ManifestMeta;
  dataHealth: DataHealth;
};

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  return response.json() as Promise<T>;
}

export async function loadGeneratedData(): Promise<AppData> {
  const [
    weapons,
    perks,
    weaponPerkIndex,
    filterOptions,
    searchIndex,
    manifestMeta,
    dataHealth
  ] = await Promise.all([
    fetchJson<unknown>("/data/weapons.json"),
    fetchJson<Perk[]>("/data/perks.json"),
    fetchJson<WeaponPerkIndex>("/data/weaponPerkIndex.json"),
    fetchJson<FilterOptions>("/data/filterOptions.json"),
    fetchJson<SearchIndexEntry[]>("/data/searchIndex.json"),
    fetchJson<ManifestMeta>("/data/manifestMeta.json"),
    fetchJson<DataHealth>("/data/dataHealth.json")
  ]);

  return {
    weapons: validateWeaponRecords(weapons),
    perks,
    weaponPerkIndex,
    filterOptions,
    searchIndex,
    manifestMeta,
    dataHealth
  };
}

