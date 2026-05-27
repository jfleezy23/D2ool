import { describe, expect, it } from "vitest";
import { buildGeneratedData } from "../scripts/lib/buildData";
import {
  filterWeapons,
  weaponHasAllSelectedPerksAnywhere,
  weaponHasSelectedPerkInSpecificColumn
} from "../src/lib/filters";
import { sampleDefinitions } from "./fixtures/sampleManifest";

describe("weapon filters", () => {
  const bundle = buildGeneratedData(sampleDefinitions());
  const weapon = bundle.weapons.find((record) => record.hash === 100);

  it("matches weapons that have all selected perks anywhere", () => {
    expect(weapon).toBeDefined();
    expect(weaponHasAllSelectedPerksAnywhere(weapon!, ["Rampage", "Kill Clip"])).toBe(true);
    expect(weaponHasAllSelectedPerksAnywhere(weapon!, ["Rampage", "Explosive Payload"])).toBe(false);
  });

  it("matches selected perk in a specific column", () => {
    expect(weaponHasSelectedPerkInSpecificColumn(weapon!, {
      socketIndex: 3,
      perkName: "Kill Clip"
    })).toBe(true);
    expect(weaponHasSelectedPerkInSpecificColumn(weapon!, {
      socketIndex: 4,
      perkName: "Kill Clip"
    })).toBe(false);
  });

  it("combines search, type, and perk filters", () => {
    const results = filterWeapons(bundle.weapons, {
      query: "midnight",
      weaponType: "hand cannon",
      selectedPerkNames: ["Rampage", "Kill Clip"],
      columnPerkFilters: [{ socketIndex: 4, perkName: "Opening Shot" }]
    });

    expect(results.map((result) => result.hash)).toEqual([100]);
  });
});

