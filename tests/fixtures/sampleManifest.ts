import type { DefinitionRecord } from "../../scripts/lib/manifestLoader";

export function sampleDefinitions(): {
  inventoryItems: DefinitionRecord;
  plugSets: DefinitionRecord;
  itemCategories: DefinitionRecord;
  stats: DefinitionRecord;
  statGroups: DefinitionRecord;
  collectibles: DefinitionRecord;
  damageTypes: DefinitionRecord;
} {
  return {
    inventoryItems: {
      "100": {
        hash: 100,
        itemType: 3,
        itemTypeDisplayName: "Hand Cannon",
        displayProperties: {
          name: "Midnight Test",
          description: "A generated test weapon.",
          icon: "/common/destiny2_content/icons/midnight-test.jpg"
        },
        screenshot: "/common/destiny2_content/screenshots/midnight-test.jpg",
        flavorText: "The manifest is quieter at midnight.",
        itemCategoryHashes: [1, 2],
        collectibleHash: 500,
        inventory: {
          tierTypeName: "Legendary"
        },
        equippingBlock: {
          ammoType: 1
        },
        defaultDamageTypeHash: 10,
        stats: {
          stats: {
            "20": {
              statHash: 20,
              value: 72
            },
            "4284893193": {
              statHash: 4284893193,
              value: 140
            }
          }
        },
        sockets: {
          socketEntries: [
            {
              socketCategoryHash: 900,
              reusablePlugItems: [{ plugItemHash: 201 }]
            },
            {
              socketCategoryHash: 901,
              reusablePlugSetHash: 3001
            },
            {
              socketCategoryHash: 902,
              randomizedPlugSetHash: 3002
            },
            {
              socketCategoryHash: 903,
              reusablePlugItems: [{ plugItemHash: 205 }],
              reusablePlugSetHash: 3003
            },
            {
              socketCategoryHash: 904,
              randomizedPlugSetHash: 3004
            },
            {
              socketCategoryHash: 905,
              reusablePlugSetHash: 3005
            }
          ]
        },
        crafting: {
          outputItemHash: 100
        }
      },
      "101": {
        hash: 101,
        itemType: 2,
        displayProperties: {
          name: "Not A Weapon"
        }
      },
      "102": {
        hash: 102,
        itemType: 3,
        redacted: true,
        displayProperties: {
          name: "Redacted Weapon"
        }
      },
      "103": {
        hash: 103,
        itemType: 3,
        displayProperties: {
          name: ""
        }
      },
      "104": {
        hash: 104,
        itemType: 3,
        itemTypeDisplayName: "Pulse Rifle",
        displayProperties: {
          name: "Field Safe",
          description: "A sparse weapon record."
        }
      },
      "201": plugItem(201, "Adaptive Frame", "Intrinsic", "intrinsics"),
      "202": plugItem(202, "Arrowhead Brake", "Barrel", "barrels"),
      "203": plugItem(203, "Smallbore", "Barrel", "barrels"),
      "204": plugItem(204, "Ricochet Rounds", "Magazine", "magazines"),
      "205": plugItem(205, "Rampage", "Trait", "random_perks"),
      "206": plugItem(206, "Kill Clip", "Trait", "random_perks"),
      "207": plugItem(207, "Opening Shot", "Trait", "random_perks"),
      "208": plugItem(208, "Enhanced Rampage", "Trait", "random_perks"),
      "209": plugItem(209, "Test Shader", "Shader", "shader"),
      "210": plugItem(210, "Test Keepsake", "Memento", "mementos")
    },
    plugSets: {
      "3001": {
        hash: 3001,
        reusablePlugItems: [{ plugItemHash: 202 }, { plugItemHash: 203 }]
      },
      "3002": {
        hash: 3002,
        randomizedPlugItems: [{ plugItemHash: 204 }]
      },
      "3003": {
        hash: 3003,
        reusablePlugItems: [{ plugItemHash: 206 }]
      },
      "3004": {
        hash: 3004,
        randomizedPlugItems: [{ plugItemHash: 207 }, { plugItemHash: 208 }]
      },
      "3005": {
        hash: 3005,
        reusablePlugItems: [{ plugItemHash: 209 }, { plugItemHash: 210 }]
      }
    },
    itemCategories: {
      "1": {
        hash: 1,
        displayProperties: {
          name: "Weapons"
        }
      },
      "2": {
        hash: 2,
        displayProperties: {
          name: "Hand Cannon"
        }
      }
    },
    stats: {
      "20": {
        hash: 20,
        displayProperties: {
          name: "Impact"
        }
      },
      "4284893193": {
        hash: 4284893193,
        displayProperties: {
          name: "Rounds Per Minute"
        }
      }
    },
    statGroups: {},
    collectibles: {
      "500": {
        hash: 500,
        sourceString: "World drop",
        displayProperties: {
          description: "Found while testing."
        }
      }
    },
    damageTypes: {
      "10": {
        hash: 10,
        displayProperties: {
          name: "Solar"
        }
      }
    }
  };
}

function plugItem(
  hash: number,
  name: string,
  itemTypeDisplayName: string,
  plugCategoryIdentifier: string
): Record<string, unknown> {
  return {
    hash,
    itemType: 19,
    itemTypeDisplayName,
    displayProperties: {
      name,
      description: `${name} description.`,
      icon: `/common/destiny2_content/icons/${hash}.png`
    },
    plug: {
      plugCategoryIdentifier
    }
  };
}
