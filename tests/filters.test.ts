import { describe, expect, it } from "vitest";
import { buildGeneratedData } from "../scripts/lib/buildData";
import {
  collectWorkbenchOptions,
  filterWeapons,
  weaponHasAllSelectedPerksAnywhere,
  weaponHasSelectedPerkInFoundryColumn,
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

  it("matches selected perk in a generated Foundry column", () => {
    expect(weaponHasSelectedPerkInFoundryColumn(weapon!, "trait3", "Kill Clip")).toBe(true);
    expect(weaponHasSelectedPerkInFoundryColumn(weapon!, "trait4", "Kill Clip")).toBe(false);
  });

  it("combines search, type, and perk filters", () => {
    const results = filterWeapons(bundle.weapons, {
      query: "midnight",
      weaponType: "hand cannon",
      rpm: 140,
      selectedPerkNames: ["Rampage", "Kill Clip"],
      columnPerkFilters: [{ socketIndex: 4, perkName: "Opening Shot" }],
      foundryColumnFilters: {
        col1: "Smallbore",
        trait4: "Opening Shot"
      }
    });

    expect(results.map((result) => result.hash)).toEqual([100]);
  });

  it("filters out invalid foundry-column combinations", () => {
    const results = filterWeapons(bundle.weapons, {
      weaponType: "hand cannon",
      foundryColumnFilters: {
        trait3: "Opening Shot"
      }
    });

    expect(results).toEqual([]);
  });

  it("collects workbench options scoped by weapon type", () => {
    expect(collectWorkbenchOptions(bundle.weapons, "hand cannon")).toEqual({
      rpmOptions: [140],
      columnOptions: {
        col1: ["Arrowhead Brake", "Smallbore"],
        col2: ["Ricochet Rounds"],
        trait3: ["Kill Clip", "Rampage"],
        trait4: ["Enhanced Rampage", "Opening Shot"]
      }
    });

    expect(collectWorkbenchOptions(bundle.weapons, "pulse rifle").rpmOptions).toEqual([]);
  });
});
