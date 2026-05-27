import type { Perk, PerkColumn, SavedRoll, Weapon } from "../types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPerk(value: unknown): value is Perk {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.hash === "number" && typeof value.name === "string";
}

export function isPerkColumn(value: unknown): value is PerkColumn {
  if (!isRecord(value) || !Array.isArray(value.perks)) {
    return false;
  }

  return (
    typeof value.socketIndex === "number" &&
    typeof value.label === "string" &&
    (value.labelConfidence === "high" ||
      value.labelConfidence === "medium" ||
      value.labelConfidence === "low") &&
    value.perks.every(isPerk)
  );
}

export function isWeapon(value: unknown): value is Weapon {
  if (!isRecord(value) || !Array.isArray(value.perkColumns)) {
    return false;
  }

  return (
    typeof value.hash === "number" &&
    typeof value.name === "string" &&
    isRecord(value.stats) &&
    value.perkColumns.every(isPerkColumn)
  );
}

export function isSavedRoll(value: unknown): value is SavedRoll {
  if (!isRecord(value) || !Array.isArray(value.selectedPerks)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.weaponHash === "number" &&
    typeof value.weaponName === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    value.selectedPerks.every((perk) => {
      return (
        isRecord(perk) &&
        typeof perk.socketIndex === "number" &&
        typeof perk.perkHash === "number" &&
        typeof perk.perkName === "string"
      );
    })
  );
}

export function validateWeaponRecords(records: unknown): Weapon[] {
  if (!Array.isArray(records) || !records.every(isWeapon)) {
    throw new Error("Generated weapon records do not match the app schema.");
  }

  return records;
}

export function validateSavedRolls(records: unknown): SavedRoll[] {
  if (!Array.isArray(records) || !records.every(isSavedRoll)) {
    throw new Error("Saved roll JSON does not match the expected schema.");
  }

  return records;
}

