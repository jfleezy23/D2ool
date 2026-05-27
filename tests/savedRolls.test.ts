import { describe, expect, it } from "vitest";
import type { SavedRoll } from "../src/types";
import { exportSavedRolls, importSavedRolls, upsertSavedRoll } from "../src/lib/savedRolls";

describe("saved roll import/export", () => {
  const roll: SavedRoll = {
    id: "roll-1",
    weaponHash: 100,
    weaponName: "Midnight Test",
    createdAt: "2026-05-26T00:00:00.000Z",
    updatedAt: "2026-05-26T00:00:00.000Z",
    selectedPerks: [
      {
        socketIndex: 3,
        perkHash: 205,
        perkName: "Rampage"
      }
    ],
    notes: "Test roll"
  };

  it("round trips exported saved rolls", () => {
    const exported = exportSavedRolls([roll]);

    expect(importSavedRolls(exported)).toEqual([roll]);
  });

  it("upserts saved rolls by id", () => {
    const updated = {
      ...roll,
      updatedAt: "2026-05-27T00:00:00.000Z",
      notes: "Updated"
    };

    expect(upsertSavedRoll([roll], updated)).toEqual([updated]);
  });
});

