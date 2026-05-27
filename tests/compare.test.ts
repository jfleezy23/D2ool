import { describe, expect, it } from "vitest";
import { buildGeneratedData } from "../scripts/lib/buildData";
import {
  buildCompareStatRows,
  createCompareRoll,
  savedRollToCompareRoll
} from "../src/lib/compare";
import { sampleDefinitions } from "./fixtures/sampleManifest";

describe("roll compare helpers", () => {
  const bundle = buildGeneratedData(sampleDefinitions());
  const weapon = bundle.weapons.find((record) => record.hash === 100)!;

  it("creates compare rolls from selected perks and base stats", () => {
    const perk = weapon.perkColumns[3].perks[0];
    const roll = createCompareRoll(weapon, { 3: perk }, "test roll");

    expect(roll.weaponHash).toBe(100);
    expect(roll.selectedPerks).toEqual([
      { socketIndex: 3, perkHash: perk.hash, perkName: perk.name }
    ]);
    expect(roll.stats).toEqual(weapon.stats);
    expect(roll.notes).toBe("test roll");
  });

  it("builds stat rows with deltas against the first compared roll", () => {
    const first = savedRollToCompareRoll(
      {
        id: "first",
        weaponHash: 100,
        weaponName: "Midnight Test",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        selectedPerks: []
      },
      weapon
    );
    const second = {
      ...first,
      id: "second",
      stats: { ...first.stats, Impact: 80 }
    };

    const rows = buildCompareStatRows([first, second]);

    expect(rows.find((row) => row.name === "Impact")).toEqual({
      name: "Impact",
      values: [72, 80],
      deltas: [0, 8]
    });
  });
});
