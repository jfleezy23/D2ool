# Data Quality Report

Generated at: 2026-05-27T16:38:17.246Z

Manifest version: 243523.26.04.28.2000-3-bnet.64859
Locale: en

## Counts

- Total inventory items loaded: 33355
- Total weapon items extracted: 1837
- Total perks extracted: 2267
- Weapons with zero sockets: 0
- Weapons with zero resolved perk columns: 0
- Weapons with randomized plug sets: 1248
- Weapons with unresolved plug hashes: 1643
- Missing icons: 0
- Missing local assets: 0

## Top Unresolved Plug Hashes

- 1746378837: 1639
- 2926662833: 1639
- 2926662834: 1639
- 2926662836: 1639
- 2926662837: 1639
- 2926662839: 1639
- 2926662840: 1639
- 1298682515: 1639
- 1298682514: 1639
- 1489178155: 1639
- 1489178156: 1639
- 3921006354: 1639
- 3921006357: 1639
- 1051938197: 1639
- 1051938194: 1639
- 2657932158: 1639
- 2657932153: 1639
- 3403116795: 1639
- 3403116796: 1639
- 604581312: 167
- 2483028033: 60
- 2483028032: 60
- 2483028035: 60
- 726894353: 1
- 2113691818: 1

## Top Unknown Socket Categories

None recorded.

## Known Manifest Assumptions

- Weapon inclusion starts with `itemType === 3`.
- Plug options are resolved from reusable plug items, randomized plug sets, and reusable plug sets.
- Socket column labels are inferred from plug category identifiers and plug display metadata.
- Ambiguous socket categories are preserved for debug review instead of receiving high-confidence labels.
- Foundry-style workbench keys are generated from resolved socket columns: `col1`, `col2`, `trait3`, and `trait4`.
- RPM is extracted from stat hash `4284893193` when present.

## Extraction Limitations

- Craftable and enhanceable flags are best-effort and need live manifest spot checks.
- Perk stat effects are not modeled yet.
- Source labeling depends on collectible fields when available.
- Some resolved plugs may be non-trait sockets such as mods or masterworks.
- Old weapons may still show low-confidence labels like `Socket 1` for sight-like columns. These still receive a workbench key when they are part of the roll column sequence.
- Compare mode currently shows base display stats side by side. Perk stat effects are not modeled yet.

## Suspicious Records

Review `public/data/dataHealth.json` for sample weapons, sample raw-to-generated mappings, unresolved hashes, and unknown socket categories.
