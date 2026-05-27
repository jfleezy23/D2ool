import { describe, expect, it } from "vitest";
import { buildGeneratedData } from "../scripts/lib/buildData";
import { validateWeaponRecords } from "../src/lib/schema";
import { sampleDefinitions } from "./fixtures/sampleManifest";

describe("buildGeneratedData", () => {
  it("handles missing optional manifest fields safely", () => {
    const definitions = sampleDefinitions();
    const bundle = buildGeneratedData(definitions);
    const sparseWeapon = bundle.weapons.find((weapon) => weapon.hash === 104);

    expect(sparseWeapon?.name).toBe("Field Safe");
    expect(sparseWeapon?.perkColumns).toEqual([]);
    expect(sparseWeapon?.stats).toEqual({});
  });

  it("includes itemType 3 weapons and excludes non-weapons, redacted, and dummy records", () => {
    const bundle = buildGeneratedData(sampleDefinitions());
    const hashes = bundle.weapons.map((weapon) => weapon.hash);

    expect(hashes).toContain(100);
    expect(hashes).toContain(104);
    expect(hashes).not.toContain(101);
    expect(hashes).not.toContain(102);
    expect(hashes).not.toContain(103);
  });

  it("resolves randomizedPlugSetHash plug options", () => {
    const bundle = buildGeneratedData(sampleDefinitions());
    const weapon = bundle.weapons.find((record) => record.hash === 100);
    const randomizedColumn = weapon?.perkColumns.find((column) =>
      column.perks.some((perk) => perk.name === "Opening Shot")
    );

    expect(randomizedColumn?.perks.map((perk) => perk.name)).toContain("Opening Shot");
    expect(bundle.manifestMeta.counts.weaponsWithRandomizedPlugSets).toBe(1);
  });

  it("resolves reusablePlugSetHash plug options", () => {
    const bundle = buildGeneratedData(sampleDefinitions());
    const weapon = bundle.weapons.find((record) => record.hash === 100);
    const barrelColumn = weapon?.perkColumns.find((column) => column.label === "Barrel");

    expect(barrelColumn?.perks.map((perk) => perk.name)).toEqual([
      "Arrowhead Brake",
      "Smallbore"
    ]);
  });

  it("includes direct reusablePlugItems", () => {
    const bundle = buildGeneratedData(sampleDefinitions());
    const weapon = bundle.weapons.find((record) => record.hash === 100);

    expect(
      weapon?.perkColumns.some((column) =>
        column.perks.some((perk) => perk.name === "Adaptive Frame")
      )
    ).toBe(true);
    expect(
      weapon?.perkColumns.some((column) =>
        column.perks.some((perk) => perk.name === "Rampage")
      )
    ).toBe(true);
  });

  it("preserves grouped socket columns", () => {
    const bundle = buildGeneratedData(sampleDefinitions());
    const weapon = bundle.weapons.find((record) => record.hash === 100);

    expect(weapon?.perkColumns.map((column) => column.socketIndex)).toEqual([
      0, 1, 2, 3, 4
    ]);
    expect(weapon?.perkColumns.find((column) => column.socketIndex === 3)?.perks).toHaveLength(2);
  });

  it("excludes cosmetic shader and memento sockets from roll columns", () => {
    const bundle = buildGeneratedData(sampleDefinitions());
    const weapon = bundle.weapons.find((record) => record.hash === 100);
    const perkNames = weapon?.perkColumns.flatMap((column) =>
      column.perks.map((perk) => perk.name)
    );

    expect(weapon?.perkColumns.map((column) => column.socketIndex)).not.toContain(5);
    expect(perkNames).not.toContain("Test Shader");
    expect(perkNames).not.toContain("Test Keepsake");
  });

  it("passes generated data schema validation on sample records", () => {
    const bundle = buildGeneratedData(sampleDefinitions());

    expect(validateWeaponRecords(bundle.weapons)).toHaveLength(2);
  });
});
