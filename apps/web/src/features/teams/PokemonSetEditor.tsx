import { useState } from "react";
import type { CatalogResponse, PokemonSet } from "@pokemon-tools/contracts";
import { BoundedIntegerInput } from "../../components/bounded-integer-input";
import { CatalogInput } from "../../components/catalog-input";
import { catalogTranslations, formatMessage, label, t } from "../../i18n/presentation";
import { setValidationMessage, validatePokemonSet, type SetValidationIssue } from "./set-validation";

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
type SetStat = (typeof statNames)[number];

export type PokemonSetEditorProps = {
  index: number;
  set: PokemonSet;
  catalog: CatalogResponse | null;
  speciesNames: string[];
  moveNames: string[];
  isLastSet: boolean;
  showValidationErrors: boolean;
  onChange: (set: PokemonSet) => void;
  onRemove: () => void;
  onNumericValidityChange: (index: number, field: string, valid: boolean) => void;
};

export function PokemonSetEditor({
  index,
  set,
  catalog,
  speciesNames,
  moveNames,
  isLastSet,
  showValidationErrors,
  onChange,
  onRemove,
  onNumericValidityChange
}: PokemonSetEditorProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const issues = validatePokemonSet(set, catalog);

  function markTouched(field: string) {
    setTouched((current) => ({ ...current, [field]: true }));
    setEditing((current) => ({ ...current, [field]: false }));
  }

  function markEditing(field: string) {
    setEditing((current) => ({ ...current, [field]: true }));
  }

  function fieldIssue(field: string): SetValidationIssue | undefined {
    return issues.find((issue) => issue.field === field);
  }

  function showFieldIssue(field: string) {
    const issue = fieldIssue(field);
    return issue && (showValidationErrors || touched[field] || !editing[field]) && ![
      "whole-number", "out-of-range"
    ].includes(issue.code) ? (
      <small className="field-error" role="alert">{formatValidationIssue(issue)}</small>
    ) : null;
  }

  function formatValidationIssue(issue: SetValidationIssue) {
    return setValidationMessage(issue);
  }

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

  function handleLevelChange(level: number | null) {
    if (level !== null) onChange({ ...set, level });
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

  function handleStatChange(block: StatBlock, stat: SetStat, value: number | null) {
    if (value === null) return;
    onChange({
      ...set,
      [block]: { ...set[block], [stat]: value }
    });
  }

  return (
    <details className="set-card" open={isLastSet}>
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
            aria-invalid={Boolean(showValidationErrors || touched.species || !editing.species) && Boolean(fieldIssue("species"))}
            onFocus={() => markEditing("species")}
            onBlur={() => markTouched("species")}
            onChange={handleSpeciesChange}
          />
          {showFieldIssue("species")}
        </label>
        <label>
          {t.team.nickname}
          <input value={set.nickname ?? ""} onChange={(event) => handleNicknameChange(event.target.value)} />
        </label>
        <label>
          {t.team.ability}
          <CatalogInput
            list="abilities-list"
            category="abilities"
            options={catalog?.abilities ?? noOptions}
            translations={catalogTranslations}
            value={set.ability}
            aria-invalid={Boolean(showValidationErrors || touched.ability || !editing.ability) && Boolean(fieldIssue("ability"))}
            onFocus={() => markEditing("ability")}
            onBlur={() => markTouched("ability")}
            onChange={handleAbilityChange}
          />
          {showFieldIssue("ability")}
        </label>
        <label>
          {t.team.item}
          <CatalogInput
            list="items-list"
            category="items"
            options={catalog?.items ?? noOptions}
            translations={catalogTranslations}
            value={set.item}
            aria-invalid={Boolean(showValidationErrors || touched.item || !editing.item) && Boolean(fieldIssue("item"))}
            onFocus={() => markEditing("item")}
            onBlur={() => markTouched("item")}
            onChange={handleItemChange}
          />
          {showFieldIssue("item")}
        </label>
        <label>
          {t.team.nature}
          <select
            value={set.nature}
            aria-invalid={Boolean(showValidationErrors || touched.nature || !editing.nature) && Boolean(fieldIssue("nature"))}
            onFocus={() => markEditing("nature")}
            onBlur={() => markTouched("nature")}
            onChange={(event) => handleNatureChange(event.target.value)}
          >
            {catalog?.natures.map((nature) => (
              <option key={nature} value={nature}>{label("natures", nature)}</option>
            ))}
          </select>
          {showFieldIssue("nature")}
        </label>
        <label>
          {t.team.level}
          <BoundedIntegerInput
            value={set.level}
            min={1}
            max={100}
            rangeHint={formatMessage(t.team.validation.wholeNumberRange, { min: 1, max: 100 })}
            wholeNumberHint={t.team.validation.wholeNumber}
            onValueChange={handleLevelChange}
            onValidityChange={(valid) => onNumericValidityChange(index, "level", valid)}
          />
        </label>
        <label>
          {t.team.teraType}
          <select
            value={set.teraType ?? ""}
            aria-invalid={Boolean(showValidationErrors || touched.teraType || !editing.teraType) && Boolean(fieldIssue("teraType"))}
            onFocus={() => markEditing("teraType")}
            onBlur={() => markTouched("teraType")}
            onChange={(event) => handleTeraTypeChange(event.target.value)}
          >
            <option value="">{t.team.noTeraType}</option>
            {catalog?.types.map((type) => (
              <option key={type} value={type}>{label("types", type)}</option>
            ))}
          </select>
          {showFieldIssue("teraType")}
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
          issues={issues}
          touched={touched}
          editing={editing}
          showValidationErrors={showValidationErrors}
          onBlur={markTouched}
          onFocus={markEditing}
          onMoveChange={handleMoveChange}
        />
        <StatBlocks
          set={set}
          issues={issues}
          showValidationErrors={showValidationErrors}
          onStatChange={handleStatChange}
          onNumericValidityChange={(field, valid) => onNumericValidityChange(index, field, valid)}
        />

        <button type="button" className="text-link danger" onClick={onRemove}>
          {t.team.removePokemon}
        </button>
      </div>
    </details>
  );
}
function MoveSlots({ moves, moveNames, issues, touched, editing, showValidationErrors, onBlur, onFocus, onMoveChange }: {
  moves: string[];
  moveNames: string[];
  issues: SetValidationIssue[];
  touched: Record<string, boolean>;
  editing: Record<string, boolean>;
  showValidationErrors: boolean;
  onBlur: (field: string) => void;
  onFocus: (field: string) => void;
  onMoveChange: (index: number, move: string) => void;
}) {
  return (
    <div className="wide">
      <b>{t.team.moves}</b>
      <div className="four-grid">
        {moveSlots.map((moveIndex) => {
          const field = `moves.${moveIndex}`;
          const issue = issues.find((candidate) => candidate.field === field);
          const showIssue = issue && (showValidationErrors || touched[field] || !editing[field]);
          return (
            <label className="move-slot" key={moveIndex}>
              <CatalogInput
                list="moves-list"
                category="moves"
                options={moveNames}
                translations={catalogTranslations}
                placeholder={formatMessage(t.team.movePlaceholder, { number: moveIndex + 1 })}
                value={moves[moveIndex] ?? ""}
                aria-label={formatMessage(t.team.movePlaceholder, { number: moveIndex + 1 })}
                aria-invalid={Boolean(showIssue)}
                onFocus={() => onFocus(field)}
                onBlur={() => onBlur(field)}
                onChange={(move) => onMoveChange(moveIndex, move)}
              />
              {showIssue && <small className="field-error" role="alert">{setValidationMessage(issue)}</small>}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function StatBlocks({ set, issues, showValidationErrors, onStatChange, onNumericValidityChange }: {
  set: PokemonSet;
  issues: SetValidationIssue[];
  showValidationErrors: boolean;
  onStatChange: (block: StatBlock, stat: SetStat, value: number | null) => void;
  onNumericValidityChange: (field: string, valid: boolean) => void;
}) {
  const evTotal = statNames.reduce((sum, stat) => sum + (Number.isFinite(set.evs[stat]) ? set.evs[stat] : 0), 0);
  const evTotalIssue = issues.find((issue) => issue.field === "evs");

  function maximumFor(block: StatBlock, stat: SetStat) {
    if (block !== "evs") return block === "ivs" ? 31 : 6;
    const others = statNames.reduce((sum, otherStat) => (
      otherStat === stat ? sum : sum + (Number.isFinite(set.evs[otherStat]) ? set.evs[otherStat] : 0)
    ), 0);
    return Math.max(0, Math.min(252, 510 - others));
  }

  return (
    <>
      {statBlocks.map((block) => (
        <div className="wide" key={block}>
          <b>{t.team[block]}</b>
          {block === "evs" && (
            <p className={evTotal > 510 ? "field-error" : "ev-total"}>
              {formatMessage(t.team.evTotal, { total: evTotal })}
              {showValidationErrors && evTotalIssue && <span> — {setValidationMessage(evTotalIssue)}</span>}
            </p>
          )}
          <div className="six-grid">
            {statNames.map((stat) => {
              const field = `${block}.${stat}`;
              const min = block === "boosts" ? -6 : 0;
              const max = maximumFor(block, stat);
              return (
                <label key={stat}>
                  {t.team.stats[stat]}
                  <BoundedIntegerInput
                    value={set[block][stat]}
                    min={min}
                    max={max}
                    rangeHint={formatMessage(t.team.validation.wholeNumberRange, { min, max })}
                    wholeNumberHint={t.team.validation.wholeNumber}
                    clampHint={(value) => block === "evs"
                      ? formatMessage(t.team.evClamp, { value, used: evTotal - set.evs[stat] })
                      : formatMessage(t.team.validation.clamped, { value })}
                    aria-label={`${t.team.stats[stat]} ${t.team[block]}`}
                    onValueChange={(value) => onStatChange(block, stat, value)}
                    onValidityChange={(valid) => onNumericValidityChange(field, valid)}
                  />
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
