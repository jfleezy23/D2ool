import type { SavedRoll } from "../types";
import { validateSavedRolls } from "./schema";

const STORAGE_KEY = "destiny-2-weapons-tool:saved-rolls";

export function createSavedRollId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `roll-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function loadSavedRolls(storage: Storage = window.localStorage): SavedRoll[] {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  return validateSavedRolls(JSON.parse(raw));
}

export function saveSavedRolls(
  rolls: SavedRoll[],
  storage: Storage = window.localStorage
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(rolls, null, 2));
}

export function exportSavedRolls(rolls: SavedRoll[]): string {
  validateSavedRolls(rolls);
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: "destiny-2-weapons-tool",
      savedRolls: rolls
    },
    null,
    2
  );
}

export function importSavedRolls(json: string): SavedRoll[] {
  const parsed = JSON.parse(json) as unknown;

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "savedRolls" in parsed &&
    Array.isArray((parsed as { savedRolls: unknown }).savedRolls)
  ) {
    return validateSavedRolls((parsed as { savedRolls: unknown }).savedRolls);
  }

  return validateSavedRolls(parsed);
}

export function upsertSavedRoll(rolls: SavedRoll[], nextRoll: SavedRoll): SavedRoll[] {
  const index = rolls.findIndex((roll) => roll.id === nextRoll.id);
  if (index === -1) {
    return [nextRoll, ...rolls];
  }

  return rolls.map((roll, rollIndex) => (rollIndex === index ? nextRoll : roll));
}

