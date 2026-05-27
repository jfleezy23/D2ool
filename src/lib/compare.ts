import type { Perk, SavedRoll, Weapon } from "../types";

export type CompareRoll = SavedRoll & {
  stats: Record<string, number>;
};

export type CompareStatRow = {
  name: string;
  values: number[];
  deltas: number[];
};

export function createCompareRoll(
  weapon: Weapon,
  selectedRollPerks: Record<number, Perk>,
  notes?: string
): CompareRoll {
  const now = new Date().toISOString();

  return {
    id: `${weapon.hash}-${now}-${Math.random().toString(36).slice(2)}`,
    weaponHash: weapon.hash,
    weaponName: weapon.name,
    createdAt: now,
    updatedAt: now,
    selectedPerks: Object.entries(selectedRollPerks).map(([socketIndex, perk]) => ({
      socketIndex: Number(socketIndex),
      perkHash: perk.hash,
      perkName: perk.name
    })),
    notes: notes?.trim() || undefined,
    stats: weapon.stats
  };
}

export function savedRollToCompareRoll(
  roll: SavedRoll,
  weapon: Weapon | undefined
): CompareRoll {
  return {
    ...roll,
    stats: weapon?.stats ?? {}
  };
}

export function buildCompareStatRows(rolls: CompareRoll[]): CompareStatRow[] {
  const statNames = Array.from(
    new Set(rolls.flatMap((roll) => Object.keys(roll.stats)))
  ).sort();

  return statNames.map((name) => {
    const values = rolls.map((roll) => roll.stats[name] ?? 0);
    const baseline = values[0] ?? 0;

    return {
      name,
      values,
      deltas: values.map((value) => value - baseline)
    };
  });
}
