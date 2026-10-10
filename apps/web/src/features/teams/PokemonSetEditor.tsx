import type { CatalogResponse, PokemonSet } from "@pokemon-tools/contracts";
import { CatalogInput } from "../../components/catalog-input";
import { catalogTranslations, formatMessage, label, t } from "../../i18n/presentation";

const noOptions: string[] = [];
const statNames = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
const moveSlots = [0, 1, 2, 3] as const;
const statBlocks = ["evs", "ivs", "boosts"] as const;
const teamStatuses: PokemonSet["status"][] = [
  "Healthy",
  "Burned",
  "Poisoned",
  "Badly Poisoned",
  "Paralyzed",
  "Asleep",
  "Frozen"
];

type StatBlock = (typeof statBlocks)[number];

export type PokemonSetEditorProps = {
  index: number;
  set: PokemonSet;
  catalog: CatalogResponse | null;
  speciesNames: string[];
  moveNames: string[];
  compact: boolean;
  isLastSet: boolean;
  onChange: (set: PokemonSet) => void;
  onRemove: () => void;
};

export function PokemonSetEditor({
  index,
  set,
  catalog,
  speciesNames,
  moveNames,
  compact,
  isLastSet,
  onChange,
  onRemove
}: PokemonSetEditorProps) {
  function handleSpeciesChange(species: string) {
    onChange({ ...set, species });
  }

  function handleNicknameChange(nickname: string) {
    onChange({ ...set, nickname });
  }

  function handleAbilityChange(ability: string) {
    onChange({ ...set, ability });
  }

  function handleItemChange(item: string) {
    onChange({ ...set, item });
  }

  function handleNatureChange(nature: string) {
    onChange({ ...set, nature });
  }

  function handleLevelChange(level: string) {
    onChange({ ...set, level: Number(level) });
  }

  function handleTeraTypeChange(teraType: string) {
    onChange({ ...set, teraType: teraType || undefined });
  }

  function handleStatusChange(status: string) {
    onChange({ ...set, status: status as PokemonSet["status"] });
  }

  function handleMoveChange(moveIndex: number, move: string) {
    const moves = Array.from({ length: 4 }, (_, slot) =>
      slot === moveIndex ? move : set.moves[slot] ?? ""
    );
    onChange({ ...set, moves });
  }

  function handleStatChange(block: StatBlock, stat: (typeof statNames)[number], value: string) {
    onChange({
      ...set,
      [block]: { ...set[block], [stat]: Number(value) }
    });
  }

  return (
    <details
      className="set-card"
      open={!compact && isLastSet}
    >
      <summary>
        <span className="set-number">{String(index + 1).padStart(2, "0")}</span>
        <b>{set.species ? label("species", set.species) : t.team.choosePokemon}</b>
        <small>{set.item ? label("items", set.item) : t.team.noItem}</small>
      </summary>

      <div className="set-fields">
        <label>
          {t.team.species}
          <CatalogInput
            list="species-list"
            category="species"
            options={speciesNames}
            translations={catalogTranslations}
            value={set.species}
            onChange={handleSpeciesChange}
          />
        </label>
        <label>
          {t.team.nickname}
          <input
            value={set.nickname ?? ""}
            onChange={(event) => handleNicknameChange(event.target.value)}
          />
        </label>
        <label>
          {t.team.ability}
          <CatalogInput
            list="abilities-list"
            category="abilities"
            options={catalog?.abilities ?? noOptions}
            translations={catalogTranslations}
            value={set.ability}
            onChange={handleAbilityChange}
          />
        </label>
        <label>
          {t.team.item}
          <CatalogInput
            list="items-list"
            category="items"
            options={catalog?.items ?? noOptions}
            translations={catalogTranslations}
            value={set.item}
            onChange={handleItemChange}
          />
        </label>
        <label>
          {t.team.nature}
          <select value={set.nature} onChange={(event) => handleNatureChange(event.target.value)}>
            {catalog?.natures.map((nature) => (
              <option key={nature} value={nature}>{label("natures", nature)}</option>
            ))}
          </select>
        </label>
        <label>
          {t.team.level}
          <input
            type="number"
            min="1"
            max="100"
            value={set.level}
            onChange={(event) => handleLevelChange(event.target.value)}
          />
        </label>
        <label>
          {t.team.teraType}
          <select value={set.teraType ?? ""} onChange={(event) => handleTeraTypeChange(event.target.value)}>
            <option value="">{t.team.noTeraType}</option>
            {catalog?.types.map((type) => (
              <option key={type} value={type}>{label("types", type)}</option>
            ))}
          </select>
        </label>
        <label>
          {t.team.status}
          <select value={set.status} onChange={(event) => handleStatusChange(event.target.value)}>
            {teamStatuses.map((status) => (
              <option key={status} value={status}>{t.team.statuses[status]}</option>
            ))}
          </select>
        </label>

        <MoveSlots
          moves={set.moves}
          moveNames={moveNames}
          onMoveChange={handleMoveChange}
        />
        <StatBlocks set={set} onStatChange={handleStatChange} />

        <button className="text-link danger" onClick={onRemove}>
          {t.team.removePokemon}
        </button>
      </div>
    </details>
  );
}

function MoveSlots({ moves, moveNames, onMoveChange }: {
  moves: string[];
  moveNames: string[];
  onMoveChange: (index: number, move: string) => void;
}) {
  return (
    <div className="wide">
      <b>{t.team.moves}</b>
      <div className="four-grid">
        {moveSlots.map((moveIndex) => (
          <CatalogInput
            key={moveIndex}
            list="moves-list"
            category="moves"
            options={moveNames}
            translations={catalogTranslations}
            placeholder={formatMessage(t.team.movePlaceholder, { number: moveIndex + 1 })}
            value={moves[moveIndex] ?? ""}
            onChange={(move) => onMoveChange(moveIndex, move)}
          />
        ))}
      </div>
    </div>
  );
}

function StatBlocks({ set, onStatChange }: {
  set: PokemonSet;
  onStatChange: (block: StatBlock, stat: (typeof statNames)[number], value: string) => void;
}) {
  return (
    <>
      {statBlocks.map((block) => (
        <div className="wide" key={block}>
          <b>{t.team[block]}</b>
          <div className="six-grid">
            {statNames.map((stat) => (
              <label key={stat}>
                {t.team.stats[stat]}
                <input
                  type="number"
                  value={set[block][stat]}
                  onChange={(event) => onStatChange(block, stat, event.target.value)}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
