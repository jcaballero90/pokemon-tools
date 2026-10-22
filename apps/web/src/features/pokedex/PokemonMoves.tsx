import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { CircleHelp } from "lucide-react";
import { pokedexMovesResponseSchema, type CatalogResponse, type MoveLearnAcquisition, type PokedexLearnedMove, type PokedexMovesResponse } from "@pokemon-tools/contracts";
import { formatMessage, label, t } from "../../i18n/presentation";
import { catalogId } from "../../lib/catalog-labels";
import { api } from "../../lib/api";
import { TypeIcon } from "../type-chart/type-visuals";

type PokemonMovesProps = { species: string; catalog: CatalogResponse | null };
type MoveGroupId = "level-up" | "machine" | "tutor" | "egg" | "form-change" | "other";
type MoveTabId = "level-up" | "machine" | "egg" | "other";
type MoveGroup = { id: MoveGroupId; moves: MoveRow[] };
type MoveRow = { move: PokedexLearnedMove; acquisitions: MoveLearnAcquisition[] };
type Category = NonNullable<PokedexLearnedMove["category"]>;

const generationFolders = [{ id: "scarlet-violet", label: "scarletViolet" }] as const;
const methodTabs = [
  { id: "level-up", label: "level" },
  { id: "machine", label: "machine" },
  { id: "egg", label: "egg" },
  { id: "other", label: "other" }
] as const;
const categoryIcons: Record<Category, string> = {
  physical: "https://archives.bulbagarden.net/media/upload/b/b4/PhysicalIC_SV.png",
  special: "https://archives.bulbagarden.net/media/upload/5/5b/SpecialIC_SV.png",
  status: "https://archives.bulbagarden.net/media/upload/e/e0/StatusIC_SV.png"
};
const groupOrder: MoveGroupId[] = ["level-up", "machine", "tutor", "egg", "form-change", "other"];

export function PokemonMoves({ species, catalog }: PokemonMovesProps) {
  const [response, setResponse] = useState<PokedexMovesResponse | null>(null);
  const [search, setSearch] = useState("");
  const [activeMethodTab, setActiveMethodTab] = useState<MoveTabId>("level-up");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setResponse(null);
    setFailed(false);
    setActiveMethodTab("level-up");
    void api<PokedexMovesResponse>(`/pokedex/${encodeURIComponent(species)}/moves`, { signal: controller.signal }, pokedexMovesResponseSchema)
      .then((result) => {
        if (controller.signal.aborted) return;
        const parsed = pokedexMovesResponseSchema.safeParse(result);
        if (parsed.success) setResponse(parsed.data);
        else setFailed(true);
      })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [species, attempt]);

  const normalizedSearch = normalizeSearch(search);
  const filteredMoves = useMemo(() => response?.moves.filter((move) =>
    normalizeSearch(move.name).includes(normalizedSearch) || normalizeSearch(label("moves", move.name)).includes(normalizedSearch)
  ) ?? [], [response, normalizedSearch]);
  const groups = useMemo(() => groupMoves(filteredMoves), [filteredMoves]);
  const visibleGroups = groups.filter((group) => tabForGroup(group.id) === activeMethodTab);
  const visibleMethodTabs = methodTabs.filter((tab) => tab.id !== "other" || response?.moves.some((move) =>
    move.acquisition.some((acquisition) => tabForMethod(acquisition.method) === "other")
  ));
  const knownUnlearnedMove = normalizedSearch && response && !response.unavailable
    ? catalog?.moves.find((name) => normalizeSearch(name) === normalizedSearch || normalizeSearch(label("moves", name)) === normalizedSearch)
    : undefined;

  function handleMoveSearchChange(value: string) {
    setSearch(value);
    const query = normalizeSearch(value);
    if (!query || !response || response.unavailable) return;
    const matchingMove = response.moves.find((move) =>
      normalizeSearch(move.name).includes(query) || normalizeSearch(label("moves", move.name)).includes(query)
    );
    if (!matchingMove) return;
    const matchingAcquisition = matchingMove.acquisition.find((acquisition) => tabForMethod(acquisition.method) === activeMethodTab)
      ?? matchingMove.acquisition[0];
    if (matchingAcquisition) setActiveMethodTab(tabForMethod(matchingAcquisition.method));
  }

  function handleMethodTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1
        : event.key === "Home" ? "start"
          : event.key === "End" ? "end" : null;
    if (direction === null) return;
    const tabs = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='tab']")];
    if (!tabs.length) return;
    event.preventDefault();
    const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = direction === "start" ? 0
      : direction === "end" ? tabs.length - 1
        : (currentIndex + direction + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    const nextMethod = nextTab.dataset.methodTab as MoveTabId;
    setActiveMethodTab(nextMethod);
    nextTab.focus();
  }

  return (
    <section className="panel pokedex-moves" aria-labelledby="pokedex-moves-title">
      <div className="pokedex-moves-heading">
        <div>
          <h2 id="pokedex-moves-title">{t.pokedex.moves.title}</h2>
          <p>{t.pokedex.moves.subtitle}</p>
          <small>{response?.source ? t.pokedex.moves.source : null}</small>
        </div>
      </div>
      <nav className="pokedex-generation-nav" aria-label={t.pokedex.moves.generations}>
        <div className="pokedex-generation-tabs" role="tablist" aria-label={t.pokedex.moves.generations}>
          {generationFolders.map((folder) => (
            <button
              type="button"
              role="tab"
              id={`moves-game-${folder.id}`}
              aria-selected="true"
              aria-controls="pokedex-move-generation-panel"
              className="pokedex-generation-tab"
              key={folder.id}
            >
              {t.pokedex.moves.games[folder.label]}
            </button>
          ))}
        </div>
      </nav>
      <div id="pokedex-move-generation-panel" role="tabpanel" aria-labelledby={`moves-game-${generationFolders[0].id}`}>
        <label htmlFor="pokedex-move-search">{t.pokedex.moves.searchLabel}</label>
        <input
          id="pokedex-move-search"
          type="search"
          placeholder={t.pokedex.moves.searchPlaceholder}
          value={search}
          onChange={(event) => handleMoveSearchChange(event.target.value)}
        />
        {response && !response.unavailable && response.moves.length > 0 && <nav className="pokedex-generation-nav pokedex-move-method-nav" aria-label={t.pokedex.moves.methodTabsLabel}>
          <div className="pokedex-generation-tabs" role="tablist" aria-label={t.pokedex.moves.methodTabsLabel} onKeyDown={handleMethodTabKeyDown}>
            {visibleMethodTabs.map((tab) => (
              <button
                type="button"
                role="tab"
                id={`moves-method-${tab.id}`}
                data-method-tab={tab.id}
                aria-selected={activeMethodTab === tab.id}
                aria-controls="pokedex-move-method-panel"
                tabIndex={activeMethodTab === tab.id ? 0 : -1}
                className="pokedex-generation-tab"
                key={tab.id}
                onClick={() => setActiveMethodTab(tab.id)}
              >
                {t.pokedex.moves.methodTabs[tab.label]}
              </button>
            ))}
          </div>
        </nav>}
        {!response && !failed && <p role="status" className="pokedex-status">{t.pokedex.moves.loading}</p>}
        {failed && <div role="status" className="pokedex-moves-error">
          <p>{t.pokedex.moves.failed}</p>
          <button type="button" className="button button-outline button-sm" onClick={() => setAttempt((current) => current + 1)}>{t.pokedex.moves.retry}</button>
        </div>}
        {response?.unavailable && <p role="status" className="pokedex-status">{t.pokedex.moves.unavailable}</p>}
        {response && !response.unavailable && response.moves.length === 0 && <p role="status" className="pokedex-status">{t.pokedex.moves.noMoves}</p>}
        {response && !response.unavailable && response.moves.length > 0 && filteredMoves.length === 0 && (
          <p role="status" className="pokedex-status">
            {knownUnlearnedMove
              ? formatMessage(t.pokedex.moves.knownMoveNotLearned, { move: label("moves", knownUnlearnedMove) })
              : t.pokedex.moves.noTextMatches}
          </p>
        )}
        {response && !response.unavailable && response.moves.length > 0 && <div id="pokedex-move-method-panel" role="tabpanel" aria-labelledby={`moves-method-${activeMethodTab}`} className="pokedex-move-scroll">
          {filteredMoves.length > 0 && (visibleGroups.length === 0
            ? <p role="status" className="pokedex-status">{t.pokedex.moves.noMovesInTab}</p>
            : visibleGroups.map((group) => (
              <section className="pokedex-move-group" key={group.id} aria-label={activeMethodTab === "other" ? undefined : groupLabel(group.id)} aria-labelledby={activeMethodTab === "other" ? `pokedex-move-group-${group.id}` : undefined}>
                {activeMethodTab === "other" && <h3 id={`pokedex-move-group-${group.id}`}>{groupLabel(group.id)}</h3>}
                <ul className="pokedex-move-list">
                  {group.moves.map((row) => (
                    <li className="pokedex-move-row" key={`${group.id}-${catalogId(row.move.name)}`}>
                      <MoveIcons move={row.move} />
                      <span className="pokedex-move-name">{label("moves", row.move.name)}</span>
                      {group.id !== "egg" && <span className="pokedex-move-acquisition">{formatGroupAcquisition(group.id, row.acquisitions)}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )))}
        </div>}
      </div>
    </section>
  );
}

function MoveIcons({ move }: { move: PokedexLearnedMove }) {
  const typeName = move.type ? label("types", move.type) : t.pokedex.moves.unavailableValue;
  const typeAccessibleLabel = move.type
    ? formatMessage(t.pokedex.moves.typeIconLabel, { type: typeName })
    : t.pokedex.moves.typeUnavailable;
  const categoryAccessibleLabel = move.category
    ? formatMessage(t.pokedex.moves.categoryIconLabel, { category: t.pokedex.moves.categories[move.category] })
    : t.pokedex.moves.categoryUnavailable;

  return (
    <span className="pokedex-move-icons">
      <span className="pokedex-move-type-icon" role="img" aria-label={typeAccessibleLabel} title={typeAccessibleLabel}>
        {move.type ? <TypeIcon type={move.type} size={19} /> : <CircleHelp size={17} aria-hidden />}
      </span>
      <span className={`pokedex-move-category-icon${move.category ? ` pokedex-move-category-icon--${move.category}` : ""}`} role="img" aria-label={categoryAccessibleLabel} title={categoryAccessibleLabel}>
        {move.category ? <img src={categoryIcons[move.category]} width="20" height="16" alt="" aria-hidden="true" draggable="false" /> : <CircleHelp size={17} aria-hidden />}
      </span>
    </span>
  );
}

function groupMoves(moves: PokedexLearnedMove[]): MoveGroup[] {
  const grouped = new Map<MoveGroupId, Map<string, MoveRow>>();
  for (const move of moves) {
    for (const acquisition of move.acquisition) {
      const id = acquisitionGroup(acquisition.method);
      const rows = grouped.get(id) ?? new Map<string, MoveRow>();
      const key = catalogId(move.name);
      const row = rows.get(key) ?? { move, acquisitions: [] };
      if (!row.acquisitions.some((current) => JSON.stringify(current) === JSON.stringify(acquisition))) row.acquisitions.push(acquisition);
      rows.set(key, row);
      grouped.set(id, rows);
    }
  }

  return groupOrder.flatMap((id) => {
    const rows = grouped.get(id);
    if (!rows?.size) return [];
    const sorted = [...rows.values()].sort((left, right) => compareMoveRows(id, left, right));
    return [{ id, moves: sorted }];
  });
}

function acquisitionGroup(method: string): MoveGroupId {
  return method === "level-up" || method === "machine" || method === "tutor" || method === "egg" || method === "form-change"
    ? method
    : "other";
}

function tabForMethod(method: string): MoveTabId {
  return method === "level-up" || method === "machine" || method === "egg" ? method : "other";
}

function tabForGroup(group: MoveGroupId): MoveTabId {
  return tabForMethod(group);
}

function compareMoveRows(group: MoveGroupId, left: MoveRow, right: MoveRow) {
  if (group === "level-up") {
    const leftLevel = Math.min(...left.acquisitions.map((acquisition) => acquisition.level ?? Number.MAX_SAFE_INTEGER));
    const rightLevel = Math.min(...right.acquisitions.map((acquisition) => acquisition.level ?? Number.MAX_SAFE_INTEGER));
    if (leftLevel !== rightLevel) return leftLevel - rightLevel;
  }
  if (group === "machine") {
    const leftMachine = Math.min(...left.acquisitions.flatMap((acquisition) => acquisition.machineNumbers ?? []), Number.MAX_SAFE_INTEGER);
    const rightMachine = Math.min(...right.acquisitions.flatMap((acquisition) => acquisition.machineNumbers ?? []), Number.MAX_SAFE_INTEGER);
    if (leftMachine !== rightMachine) return leftMachine - rightMachine;
  }
  return left.move.name.localeCompare(right.move.name, "en");
}

function groupLabel(group: MoveGroupId) {
  const labels: Record<MoveGroupId, string> = {
    "level-up": t.pokedex.moves.groups.level,
    machine: t.pokedex.moves.groups.machine,
    tutor: t.pokedex.moves.groups.tutor,
    egg: t.pokedex.moves.groups.egg,
    "form-change": t.pokedex.moves.groups.formChange,
    other: t.pokedex.moves.groups.other
  };
  return labels[group];
}

function formatGroupAcquisition(group: MoveGroupId, acquisitions: MoveLearnAcquisition[]) {
  if (group === "level-up") {
    return acquisitions.map((acquisition) => {
      if (acquisition.level !== undefined) return formatMessage(t.pokedex.moves.methods.levelUp, { level: acquisition.level });
      if (acquisition.event) return t.pokedex.moves.eventMove;
      return t.pokedex.moves.methods.other;
    }).join(", ");
  }
  if (group === "machine") {
    const numbers = [...new Set(acquisitions.flatMap((acquisition) => acquisition.machineNumbers ?? []))].sort((left, right) => left - right);
    return numbers.length
      ? numbers.map((number) => formatMessage(t.pokedex.moves.methods.machineNumber, { number: String(number).padStart(3, "0") })).join(", ")
      : t.pokedex.moves.methods.machine;
  }
  return "";
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
}
