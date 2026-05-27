import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Check,
  Columns3,
  Database,
  Download,
  GitCompare,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X
} from "lucide-react";
import type { DataHealth, FoundryColumnKey, Perk, SavedRoll, Weapon } from "./types";
import { loadGeneratedData, type AppData } from "./lib/data";
import {
  buildCompareStatRows,
  createCompareRoll,
  savedRollToCompareRoll,
  type CompareRoll
} from "./lib/compare";
import {
  collectWorkbenchOptions,
  filterWeapons,
  foundryColumnLabels,
  sortWeapons,
  type ColumnPerkFilter,
  type WeaponSort
} from "./lib/filters";
import {
  createSavedRollId,
  exportSavedRolls,
  importSavedRolls,
  loadSavedRolls,
  saveSavedRolls,
  upsertSavedRoll
} from "./lib/savedRolls";

const sortOptions: { value: WeaponSort; label: string }[] = [
  { value: "name", label: "Weapon name" },
  { value: "weaponType", label: "Weapon type" },
  { value: "rarity", label: "Rarity" },
  { value: "damageType", label: "Damage type" },
  { value: "ammoType", label: "Ammo type" },
  { value: "source", label: "Source" }
];

type FilterState = {
  query: string;
  weaponType: string;
  ammoType: string;
  damageType: string;
  rarity: string;
  source: string;
  rpm: string;
  craftable: boolean;
  enhanceable: boolean;
  adept: boolean;
};

const initialFilters: FilterState = {
  query: "",
  weaponType: "",
  ammoType: "",
  damageType: "",
  rarity: "",
  source: "",
  rpm: "",
  craftable: false,
  enhanceable: false,
  adept: false
};

const foundryColumnOrder: FoundryColumnKey[] = ["col1", "col2", "trait3", "trait4"];
const emptyColumnOptions: Record<FoundryColumnKey, string[]> = {
  col1: [],
  col2: [],
  trait3: [],
  trait4: []
};

function safeAssetPath(path: string | undefined): string | undefined {
  return path?.startsWith("/assets/destiny/") ? path : undefined;
}

function weaponInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function uniqueColumns(weapons: Weapon[]): number[] {
  return Array.from(
    new Set(weapons.flatMap((weapon) => weapon.perkColumns.map((column) => column.socketIndex)))
  ).sort((a, b) => a - b);
}

export function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [selectedPerks, setSelectedPerks] = useState<string[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnPerkFilter[]>([]);
  const [foundryColumnFilters, setFoundryColumnFilters] = useState<
    Partial<Record<FoundryColumnKey, string>>
  >({});
  const [perkDraft, setPerkDraft] = useState("");
  const [columnPerkDraft, setColumnPerkDraft] = useState("");
  const [columnIndexDraft, setColumnIndexDraft] = useState("3");
  const [sort, setSort] = useState<WeaponSort>("name");
  const [selectedWeaponHash, setSelectedWeaponHash] = useState<number | null>(null);
  const [selectedRollPerks, setSelectedRollPerks] = useState<Record<number, Perk>>({});
  const [selectedPerkDetail, setSelectedPerkDetail] = useState<Perk | null>(null);
  const [savedRolls, setSavedRolls] = useState<SavedRoll[]>([]);
  const [compareRolls, setCompareRolls] = useState<CompareRoll[]>([]);
  const [notes, setNotes] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    loadGeneratedData()
      .then((loadedData) => {
        setData(loadedData);
        setSelectedWeaponHash(loadedData.weapons[0]?.hash ?? null);
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : String(error));
      });

    try {
      setSavedRolls(loadSavedRolls());
    } catch {
      setSavedRolls([]);
    }
  }, []);

  useEffect(() => {
    saveSavedRolls(savedRolls);
  }, [savedRolls]);

  const isDebugRoute = window.location.pathname === "/debug/data-health";

  const filteredWeapons = useMemo(() => {
    if (!data) {
      return [];
    }

    return sortWeapons(
      filterWeapons(data.weapons, {
        query: filters.query,
        weaponType: filters.weaponType || undefined,
        ammoType: filters.ammoType || undefined,
        damageType: filters.damageType || undefined,
        rarity: filters.rarity || undefined,
        source: filters.source || undefined,
        rpm: filters.rpm ? Number(filters.rpm) : undefined,
        craftable: filters.craftable ? true : undefined,
        enhanceable: filters.enhanceable ? true : undefined,
        adept: filters.adept ? true : undefined,
        selectedPerkNames: selectedPerks,
        columnPerkFilters: columnFilters,
        foundryColumnFilters
      }),
      sort
    );
  }, [columnFilters, data, filters, foundryColumnFilters, selectedPerks, sort]);

  const selectedWeapon = useMemo(() => {
    if (!data) {
      return undefined;
    }

    return (
      filteredWeapons.find((weapon) => weapon.hash === selectedWeaponHash) ??
      filteredWeapons[0]
    );
  }, [data, filteredWeapons, selectedWeaponHash]);

  const workbenchOptions = useMemo(() => {
    if (!data) {
      return { rpmOptions: [], columnOptions: emptyColumnOptions };
    }

    return collectWorkbenchOptions(data.weapons, filters.weaponType || undefined);
  }, [data, filters.weaponType]);

  const foundryFilterConflicts = useMemo(() => {
    return Object.fromEntries(
      foundryColumnOrder.map((columnKey) => {
        const value = foundryColumnFilters[columnKey]?.trim();
        const options = workbenchOptions.columnOptions[columnKey];

        return [columnKey, Boolean(value && !options.includes(value))];
      })
    ) as Record<FoundryColumnKey, boolean>;
  }, [foundryColumnFilters, workbenchOptions]);

  useEffect(() => {
    setSelectedRollPerks({});
    setSelectedPerkDetail(null);
    setNotes("");
  }, [selectedWeapon?.hash]);

  useEffect(() => {
    if (
      filters.rpm &&
      !workbenchOptions.rpmOptions.includes(Number(filters.rpm))
    ) {
      updateFilter("rpm", "");
    }
  }, [filters.rpm, workbenchOptions.rpmOptions]);

  if (loadError) {
    return <MissingData error={loadError} />;
  }

  if (!data) {
    return (
      <main className="loading-shell">
        <div className="loading-mark" />
        <p>Loading local Destiny 2 data</p>
      </main>
    );
  }

  if (isDebugRoute) {
    return <DataHealthPage dataHealth={data.dataHealth} />;
  }

  const filterOptions = data.filterOptions;
  const columnOptions = uniqueColumns(data.weapons);

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function updateFoundryColumnFilter(columnKey: FoundryColumnKey, value: string) {
    setFoundryColumnFilters((current) => ({
      ...current,
      [columnKey]: value
    }));
  }

  function clearAllFilters() {
    setFilters(initialFilters);
    setSelectedPerks([]);
    setColumnFilters([]);
    setFoundryColumnFilters({});
    setPerkDraft("");
    setColumnPerkDraft("");
  }

  function addPerkFilter() {
    const value = perkDraft.trim();
    if (!value || selectedPerks.includes(value)) {
      return;
    }
    setSelectedPerks((current) => [...current, value]);
    setPerkDraft("");
  }

  function addColumnFilter() {
    const socketIndex = Number(columnIndexDraft);
    const perkName = columnPerkDraft.trim();
    if (!Number.isFinite(socketIndex) || !perkName) {
      return;
    }

    setColumnFilters((current) => [...current, { socketIndex, perkName }]);
    setColumnPerkDraft("");
  }

  function addCurrentRollToCompare() {
    if (!selectedWeapon) {
      return;
    }

    setCompareRolls((current) => [
      ...current,
      createCompareRoll(selectedWeapon, selectedRollPerks, notes)
    ]);
  }

  function addSavedRollToCompare(roll: SavedRoll) {
    setCompareRolls((current) => [
      ...current,
      savedRollToCompareRoll(roll, selectedWeapon)
    ]);
  }

  function saveCurrentRoll() {
    if (!selectedWeapon) {
      return;
    }

    const now = new Date().toISOString();
    const roll: SavedRoll = {
      id: createSavedRollId(),
      weaponHash: selectedWeapon.hash,
      weaponName: selectedWeapon.name,
      createdAt: now,
      updatedAt: now,
      selectedPerks: Object.entries(selectedRollPerks).map(([socketIndex, perk]) => ({
        socketIndex: Number(socketIndex),
        perkHash: perk.hash,
        perkName: perk.name
      })),
      notes: notes.trim() || undefined
    };

    setSavedRolls((current) => upsertSavedRoll(current, roll));
  }

  function exportRolls() {
    const blob = new Blob([exportSavedRolls(savedRolls)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "destiny-2-saved-rolls.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importRolls(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const imported = importSavedRolls(await file.text());
      setSavedRolls((current) => {
        const byId = new Map(current.map((roll) => [roll.id, roll]));
        for (const roll of imported) {
          byId.set(roll.id, roll);
        }
        return Array.from(byId.values()).sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt)
        );
      });
      setImportError(null);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : String(error));
    } finally {
      event.target.value = "";
    }
  }

  const selectedSavedRolls = savedRolls.filter(
    (roll) => roll.weaponHash === selectedWeapon?.hash
  );

  return (
    <main className="app-shell">
      <aside className="filter-rail">
        <div className="brand-block">
          <div className="brand-mark">D2</div>
          <div>
            <h1>Destiny 2 Weapons Tool</h1>
            <p>{data.manifestMeta.manifestVersion ?? "Local manifest"}</p>
          </div>
        </div>

        <label className="field search-field">
          <span>Search</span>
          <div className="input-with-icon">
            <Search size={16} aria-hidden="true" />
            <input
              value={filters.query}
              onChange={(event) => updateFilter("query", event.target.value)}
              placeholder="Weapon, perk, source"
            />
          </div>
        </label>

        <div className="field-grid">
          <FilterSelect
            label="Archetype"
            value={filters.weaponType}
            values={filterOptions.weaponTypes}
            onChange={(value) => updateFilter("weaponType", value)}
          />
          <FilterSelect
            label="Ammo"
            value={filters.ammoType}
            values={filterOptions.ammoTypes}
            onChange={(value) => updateFilter("ammoType", value)}
          />
          <FilterSelect
            label="Damage"
            value={filters.damageType}
            values={filterOptions.damageTypes}
            onChange={(value) => updateFilter("damageType", value)}
          />
          <FilterSelect
            label="Rarity"
            value={filters.rarity}
            values={filterOptions.rarities}
            onChange={(value) => updateFilter("rarity", value)}
          />
        </div>

        <FilterSelect
          label="Source"
          value={filters.source}
          values={filterOptions.sources}
          onChange={(value) => updateFilter("source", value)}
        />

        <div className="filter-section workbench-section">
          <div className="section-title">
            <Columns3 size={16} aria-hidden="true" />
            <span>Foundry workbench</span>
          </div>
          <FilterSelect
            label="Frame / RPM"
            value={filters.rpm}
            values={workbenchOptions.rpmOptions.map(String)}
            onChange={(value) => updateFilter("rpm", value)}
            disabled={!filters.weaponType || workbenchOptions.rpmOptions.length === 0}
            emptyLabel={filters.weaponType ? "Any" : "Pick archetype first"}
          />
          <div className="workbench-grid">
            {foundryColumnOrder.map((columnKey) => (
              <FoundryColumnInput
                key={columnKey}
                columnKey={columnKey}
                value={foundryColumnFilters[columnKey] ?? ""}
                options={workbenchOptions.columnOptions[columnKey]}
                conflict={foundryFilterConflicts[columnKey]}
                onChange={(value) => updateFoundryColumnFilter(columnKey, value)}
              />
            ))}
          </div>
          {Object.values(foundryFilterConflicts).some(Boolean) ? (
            <p className="field-warning">One selected perk is not valid for this archetype.</p>
          ) : null}
          <button type="button" className="quiet-button" onClick={clearAllFilters}>
            <X size={15} />
            Clear all
          </button>
        </div>

        <div className="toggle-stack">
          <Toggle
            checked={filters.craftable}
            label="Craftable"
            onChange={(checked) => updateFilter("craftable", checked)}
          />
          <Toggle
            checked={filters.enhanceable}
            label="Enhanceable"
            onChange={(checked) => updateFilter("enhanceable", checked)}
          />
          <Toggle
            checked={filters.adept}
            label="Adept"
            onChange={(checked) => updateFilter("adept", checked)}
          />
        </div>

        <div className="filter-section">
          <div className="section-title">
            <SlidersHorizontal size={16} aria-hidden="true" />
            <span>Perks anywhere</span>
          </div>
          <div className="inline-form">
            <input
              list="perk-options"
              value={perkDraft}
              onChange={(event) => setPerkDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addPerkFilter();
              }}
              placeholder="Rampage"
            />
            <button type="button" onClick={addPerkFilter} title="Add perk filter">
              <Check size={16} />
            </button>
          </div>
          <ChipList
            values={selectedPerks}
            onRemove={(value) =>
              setSelectedPerks((current) => current.filter((perk) => perk !== value))
            }
          />
        </div>

        <div className="filter-section">
          <div className="section-title">
            <Database size={16} aria-hidden="true" />
            <span>Column perk</span>
          </div>
          <div className="inline-form column-form">
            <select
              value={columnIndexDraft}
              onChange={(event) => setColumnIndexDraft(event.target.value)}
              aria-label="Socket index"
            >
              {columnOptions.map((socketIndex) => (
                <option key={socketIndex} value={socketIndex}>
                  {socketIndex}
                </option>
              ))}
            </select>
            <input
              list="perk-options"
              value={columnPerkDraft}
              onChange={(event) => setColumnPerkDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addColumnFilter();
              }}
              placeholder="Kill Clip"
            />
            <button type="button" onClick={addColumnFilter} title="Add column perk filter">
              <Check size={16} />
            </button>
          </div>
          <div className="chips">
            {columnFilters.map((filter, index) => (
              <button
                type="button"
                className="chip"
                key={`${filter.socketIndex}-${filter.perkName}-${index}`}
                onClick={() =>
                  setColumnFilters((current) =>
                    current.filter((_, currentIndex) => currentIndex !== index)
                  )
                }
              >
                {filter.socketIndex}: {filter.perkName}
                <X size={13} />
              </button>
            ))}
          </div>
        </div>

        <datalist id="perk-options">
          {filterOptions.perkNames.map((perkName) => (
            <option key={perkName} value={perkName} />
          ))}
        </datalist>
        {foundryColumnOrder.map((columnKey) => (
          <datalist key={columnKey} id={`foundry-${columnKey}-options`}>
            {workbenchOptions.columnOptions[columnKey].map((perkName) => (
              <option key={perkName} value={perkName} />
            ))}
          </datalist>
        ))}
      </aside>

      <section className="results-pane">
        <header className="top-bar">
          <div>
            <p className="eyeline">Local index</p>
            <h2>{filteredWeapons.length.toLocaleString()} weapons</h2>
          </div>
          <div className="toolbar">
            <label className="sort-control">
              <span>Sort</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as WeaponSort)}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <a href="/debug/data-health" className="icon-button" title="Open data health">
              <Database size={17} />
            </a>
            <button type="button" className="icon-button" onClick={exportRolls} title="Export rolls">
              <Download size={17} />
            </button>
            <label className="icon-button file-button" title="Import rolls">
              <Upload size={17} />
              <input type="file" accept="application/json" onChange={importRolls} />
            </label>
          </div>
        </header>

        {importError ? <p className="inline-error">{importError}</p> : null}

        <div className="weapon-grid">
          {filteredWeapons.map((weapon) => (
            <WeaponCard
              key={weapon.hash}
              weapon={weapon}
              selected={weapon.hash === selectedWeapon?.hash}
              onSelect={() => setSelectedWeaponHash(weapon.hash)}
            />
          ))}
        </div>

        {filteredWeapons.length === 0 ? (
          <div className="empty-state">
            <h3>No weapons match {selectedPerks.join(" + ") || "these filters"}.</h3>
          </div>
        ) : null}
      </section>

      <section className="detail-pane">
        {selectedWeapon ? (
          <WeaponDetail
            weapon={selectedWeapon}
            selectedRollPerks={selectedRollPerks}
            onSelectPerk={(socketIndex, perk) => {
              setSelectedRollPerks((current) => ({ ...current, [socketIndex]: perk }));
              setSelectedPerkDetail(perk);
            }}
            selectedPerkDetail={selectedPerkDetail}
            notes={notes}
            onNotesChange={setNotes}
            onSaveRoll={saveCurrentRoll}
            onAddCurrentRollToCompare={addCurrentRollToCompare}
            savedRolls={selectedSavedRolls}
            onAddSavedRollToCompare={addSavedRollToCompare}
            onDeleteRoll={(id) =>
              setSavedRolls((current) => current.filter((roll) => roll.id !== id))
            }
            compareRolls={compareRolls}
            onRemoveCompareRoll={(id) =>
              setCompareRolls((current) => current.filter((roll) => roll.id !== id))
            }
            onClearCompareRolls={() => setCompareRolls([])}
          />
        ) : (
          <div className="empty-state">
            <h3>Select a weapon</h3>
          </div>
        )}
      </section>
    </main>
  );
}

function FilterSelect({
  label,
  value,
  values,
  onChange,
  disabled = false,
  emptyLabel = "Any"
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  emptyLabel?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">{emptyLabel}</option>
        {values.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FoundryColumnInput({
  columnKey,
  value,
  options,
  conflict,
  onChange
}: {
  columnKey: FoundryColumnKey;
  value: string;
  options: string[];
  conflict: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={`field workbench-field ${conflict ? "conflict" : ""}`}>
      <span>{foundryColumnLabels[columnKey]}</span>
      <input
        list={`foundry-${columnKey}-options`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Any perk"
      />
    </label>
  );
}

function Toggle({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function ChipList({
  values,
  onRemove
}: {
  values: string[];
  onRemove: (value: string) => void;
}) {
  return (
    <div className="chips">
      {values.map((value) => (
        <button type="button" className="chip" key={value} onClick={() => onRemove(value)}>
          {value}
          <X size={13} />
        </button>
      ))}
    </div>
  );
}

function WeaponCard({
  weapon,
  selected,
  onSelect
}: {
  weapon: Weapon;
  selected: boolean;
  onSelect: () => void;
}) {
  const iconPath = safeAssetPath(weapon.iconPath);
  const previewPerks = weapon.perkColumns
    .slice(0, 5)
    .map((column) => column.label)
    .join(" · ");

  return (
    <button
      type="button"
      className={`weapon-card ${selected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <AssetThumb path={iconPath} label={weapon.name} />
      <span className="weapon-card-main">
        <strong>{weapon.name}</strong>
        <span>
          {weapon.weaponType ?? "other"} · {weapon.ammoType ?? "ammo unknown"}
        </span>
        <small>
          {weapon.damageType ?? "damage unknown"} · {weapon.rarity ?? "rarity unknown"}
          {weapon.rpm ? ` · ${weapon.rpm} RPM` : ""}
        </small>
        {previewPerks ? <em>{previewPerks}</em> : null}
      </span>
    </button>
  );
}

function AssetThumb({ path, label }: { path: string | undefined; label: string }) {
  return path ? (
    <img className="asset-thumb" src={path} alt="" loading="lazy" />
  ) : (
    <span className="asset-thumb fallback">{weaponInitials(label)}</span>
  );
}

function WeaponDetail({
  weapon,
  selectedRollPerks,
  onSelectPerk,
  selectedPerkDetail,
  notes,
  onNotesChange,
  onSaveRoll,
  onAddCurrentRollToCompare,
  savedRolls,
  onAddSavedRollToCompare,
  onDeleteRoll,
  compareRolls,
  onRemoveCompareRoll,
  onClearCompareRolls
}: {
  weapon: Weapon;
  selectedRollPerks: Record<number, Perk>;
  onSelectPerk: (socketIndex: number, perk: Perk) => void;
  selectedPerkDetail: Perk | null;
  notes: string;
  onNotesChange: (value: string) => void;
  onSaveRoll: () => void;
  onAddCurrentRollToCompare: () => void;
  savedRolls: SavedRoll[];
  onAddSavedRollToCompare: (roll: SavedRoll) => void;
  onDeleteRoll: (id: string) => void;
  compareRolls: CompareRoll[];
  onRemoveCompareRoll: (id: string) => void;
  onClearCompareRolls: () => void;
}) {
  const screenshotPath = safeAssetPath(weapon.screenshotPath);
  const iconPath = safeAssetPath(weapon.iconPath);

  return (
    <div className="detail-content">
      <div
        className="detail-hero"
        style={screenshotPath ? { backgroundImage: `url(${screenshotPath})` } : undefined}
      >
        <div className="detail-hero-shade" />
        <div className="detail-title">
          <AssetThumb path={iconPath} label={weapon.name} />
          <div>
            <h2>{weapon.name}</h2>
            <p>
              {weapon.weaponType ?? "other"} · {weapon.ammoType ?? "ammo unknown"} ·{" "}
              {weapon.damageType ?? "damage unknown"}
              {weapon.rpm ? ` · ${weapon.rpm} RPM` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        {Object.entries(weapon.stats).map(([name, value]) => (
          <div className="stat-row" key={name}>
            <span>{name}</span>
            <strong>{value}</strong>
            <div className="stat-track">
              <div style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
            </div>
          </div>
        ))}
        {Object.keys(weapon.stats).length === 0 ? (
          <p className="muted">No display stats in generated data.</p>
        ) : null}
      </div>

      <div className="perk-columns">
        {weapon.perkColumns.map((column) => (
          <section className="perk-column" key={column.socketIndex}>
            <header>
              <span>{column.label}</span>
              <small>
                {column.socketIndex} · {column.labelConfidence}
              </small>
            </header>
            <div className="perk-list">
              {column.perks.map((perk) => {
                const selected = selectedRollPerks[column.socketIndex]?.hash === perk.hash;
                return (
                  <button
                    type="button"
                    className={`perk-button ${selected ? "selected" : ""}`}
                    key={perk.hash}
                    onClick={() => onSelectPerk(column.socketIndex, perk)}
                  >
                    <AssetThumb path={safeAssetPath(perk.iconPath)} label={perk.name} />
                    <span>
                      <strong>{perk.name}</strong>
                      <small>{perk.itemTypeDisplayName ?? "Plug"}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="roll-builder">
        <div>
          <h3>Roll builder</h3>
          <p>
            {Object.keys(selectedRollPerks).length} selected ·{" "}
            {weapon.rarity ?? "rarity unknown"}
          </p>
        </div>
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Notes"
        />
        <div className="roll-actions">
          <button type="button" className="primary-button" onClick={onSaveRoll}>
            <Save size={16} />
            Save roll
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onAddCurrentRollToCompare}
          >
            <GitCompare size={16} />
            Compare
          </button>
        </div>
      </section>

      {selectedPerkDetail ? (
        <section className="perk-detail">
          <AssetThumb path={safeAssetPath(selectedPerkDetail.iconPath)} label={selectedPerkDetail.name} />
          <div>
            <h3>{selectedPerkDetail.name}</h3>
            <p>{selectedPerkDetail.description ?? "No perk description in generated data."}</p>
          </div>
        </section>
      ) : null}

      <section className="saved-rolls">
        <h3>Saved rolls</h3>
        {savedRolls.map((roll) => (
          <article key={roll.id} className="saved-roll">
            <div>
              <strong>{new Date(roll.updatedAt).toLocaleString()}</strong>
              <p>{roll.selectedPerks.map((perk) => perk.perkName).join(" · ")}</p>
              {roll.notes ? <small>{roll.notes}</small> : null}
            </div>
            <div className="saved-roll-actions">
              <button
                type="button"
                className="icon-button"
                onClick={() => onAddSavedRollToCompare(roll)}
                title="Add saved roll to compare"
              >
                <GitCompare size={16} />
              </button>
              <button type="button" className="icon-button" onClick={() => onDeleteRoll(roll.id)} title="Delete roll">
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
        {savedRolls.length === 0 ? <p className="muted">No saved rolls for this weapon.</p> : null}
      </section>

      <CompareTray
        rolls={compareRolls}
        onRemoveRoll={onRemoveCompareRoll}
        onClear={onClearCompareRolls}
      />
    </div>
  );
}

function CompareTray({
  rolls,
  onRemoveRoll,
  onClear
}: {
  rolls: CompareRoll[];
  onRemoveRoll: (id: string) => void;
  onClear: () => void;
}) {
  const statRows = buildCompareStatRows(rolls);

  return (
    <section className="compare-tray">
      <header>
        <div>
          <h3>Compare</h3>
          <p>{rolls.length} rolls staged</p>
        </div>
        {rolls.length > 0 ? (
          <button type="button" className="quiet-button compact" onClick={onClear}>
            Clear
          </button>
        ) : null}
      </header>

      {rolls.length === 0 ? (
        <p className="muted">Add current or saved rolls to compare base stats side by side.</p>
      ) : (
        <>
          <div className="compare-rolls">
            {rolls.map((roll) => (
              <article key={roll.id}>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => onRemoveRoll(roll.id)}
                  title="Remove from compare"
                >
                  <X size={15} />
                </button>
                <strong>{roll.weaponName}</strong>
                <span>{roll.selectedPerks.map((perk) => perk.perkName).join(" · ") || "No perks selected"}</span>
              </article>
            ))}
          </div>
          {statRows.length > 0 ? (
            <div className="compare-table">
              <div className="compare-row header">
                <span>Stat</span>
                {rolls.map((roll, index) => (
                  <strong key={roll.id}>{index === 0 ? "Base" : `Roll ${index + 1}`}</strong>
                ))}
              </div>
              {statRows.map((row) => (
                <div className="compare-row" key={row.name}>
                  <span>{row.name}</span>
                  {row.values.map((value, index) => (
                    <strong key={`${row.name}-${rolls[index]?.id}`}>
                      {value}
                      {index > 0 && row.deltas[index] !== 0 ? (
                        <em className={row.deltas[index] > 0 ? "positive" : "negative"}>
                          {row.deltas[index] > 0 ? "+" : ""}
                          {row.deltas[index]}
                        </em>
                      ) : null}
                    </strong>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No display stats available for compared rolls.</p>
          )}
        </>
      )}
    </section>
  );
}

function MissingData({ error }: { error: string }) {
  return (
    <main className="missing-data">
      <div className="brand-mark">D2</div>
      <h1>Destiny 2 Weapons Tool</h1>
      <p>{error}</p>
      <code>npm run refresh:data</code>
    </main>
  );
}

function DataHealthPage({ dataHealth }: { dataHealth: DataHealth }) {
  const counts = dataHealth.counts;
  return (
    <main className="debug-page">
      <header className="debug-header">
        <div>
          <p className="eyeline">Debug</p>
          <h1>Data health</h1>
        </div>
        <a className="primary-button" href="/">
          Explorer
        </a>
      </header>

      <section className="debug-grid">
        {Object.entries(counts).map(([key, value]) => (
          <article className="metric-card" key={key}>
            <span>{key}</span>
            <strong>{value.toLocaleString()}</strong>
          </article>
        ))}
      </section>

      <section className="debug-columns">
        <DebugList
          title="Top unresolved hashes"
          rows={dataHealth.topUnresolvedHashes.map((row) => ({
            label: String(row.hash),
            value: row.count
          }))}
        />
        <DebugList
          title="Unknown socket categories"
          rows={dataHealth.topUnknownSocketCategories.map((row) => ({
            label: String(row.socketCategoryHash),
            value: row.count
          }))}
        />
      </section>

      <section className="sample-records">
        <h2>Sample weapon records</h2>
        {dataHealth.sampleWeapons.map((weapon) => (
          <article key={weapon.hash}>
            <strong>{weapon.name}</strong>
            <span>
              {weapon.hash} · {weapon.weaponType ?? "other"} · {weapon.perkColumns.length} columns
            </span>
          </article>
        ))}
      </section>

      <section className="sample-records">
        <h2>Sample raw-to-generated mappings</h2>
        {dataHealth.sampleMappings.map((mapping) => (
          <article key={mapping.weaponHash}>
            <strong>{mapping.weaponName}</strong>
            <span>
              {mapping.socketColumns
                .map(
                  (column) =>
                    `${column.socketIndex}:${column.label}${column.foundryColumnKey ? `/${column.foundryColumnKey}` : ""}[${column.sourcePlugSetHashes.join(",") || "direct"}]`
                )
                .join(" · ")}
            </span>
          </article>
        ))}
      </section>
    </main>
  );
}

function DebugList({
  title,
  rows
}: {
  title: string;
  rows: { label: string; value: number }[];
}) {
  return (
    <section className="debug-list">
      <h2>{title}</h2>
      {rows.length === 0 ? <p className="muted">None recorded.</p> : null}
      {rows.map((row) => (
        <div key={row.label}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
    </section>
  );
}
