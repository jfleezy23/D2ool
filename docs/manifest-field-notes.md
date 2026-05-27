# Manifest Field Notes

These notes record current interpretation of Bungie manifest fields used by the local index builder. They should be updated after inspecting fresh manifest JSON.

## Verified By Script Shape

- `DestinyInventoryItemDefinition.itemType === 3` is treated as the primary weapon inclusion signal.
- `displayProperties.name`, `displayProperties.description`, and `displayProperties.icon` are used only when present and non-empty.
- `redacted: true` items are excluded.
- `sockets.socketEntries` is inspected by Node scripts only, never directly by React components.
- Socket entry plug sources are resolved from:
  - `reusablePlugItems`
  - `randomizedPlugSetHash`
  - `reusablePlugSetHash`
- Plug item hashes resolve back through `DestinyInventoryItemDefinition`.
- `stats.stats["4284893193"].value` is extracted as `Weapon.rpm` when present. The display stat is also kept in the regular `stats` map under its localized stat name.
- Roll columns intentionally exclude cosmetic shader sockets, memento sockets, crafting-only sockets, tracker sockets, and lower masterwork tier plugs. Those fields can be revisited later if the UI grows a cosmetics or crafting inspection mode.

## Low-Confidence Interpretations

- Craftable detection currently checks for a manifest `crafting` object on the weapon item. This needs validation against live weapon samples.
- Enhanceable detection currently looks for enhanced perk names among resolved plugs. This is a proxy and needs better manifest-backed confirmation.
- Source labeling uses collectible `sourceString` first and collectible display description second when available.
- Archetype/frame labeling uses intrinsic-looking socket labels and resolved plug names when available.

## Socket Labeling

Socket labels are inferred from plug category identifiers and resolved plug metadata. Ambiguous sockets keep their raw socket index, socket category hash, and plug set hash in generated/debug data instead of being guessed with high confidence.

The workbench filter keys are generated after socket resolution:

- `col1` and `col2` are the first two non-trait roll sockets, usually barrel/sight/blade and magazine/battery/guard.
- `trait3` and `trait4` are the first two trait-like sockets.
- Plug `itemTypeDisplayName` containing `Trait`, `plugCategoryIdentifier === "frames"`, and randomized perk categories are treated as trait-like. This was verified against real generated samples such as `1000 Yard Stare`, where trait plugs use `plugCategoryIdentifier: "frames"`.
- Intrinsic, origin, masterwork, and weapon mod sockets do not receive workbench keys.

## TODO

- Confirm exact craftable/enhanceable fields against live manifest samples.
- Continue spot-checking old weapon sight/guard/blade sockets so low-confidence `Socket N` labels can be improved without hiding raw socket indices.
- Add perk stat effect extraction after identifying reliable fields.
- Expand source labeling from collectible and activity metadata.
