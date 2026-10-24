import { useState } from "react";
import { statIds, type CatalogResponse, type DamageRequest, type PokemonSet } from "@pokemon-tools/contracts";
import { BoundedIntegerInput } from "../../components/bounded-integer-input";
import { Button } from "../../components/ui/button";
import { CatalogInput } from "../../components/catalog-input";
import { catalogTranslations, formatMessage, label, t } from "../../i18n/presentation";
import { isCatalogMove, setValidationMessage, type SetValidationIssue } from "../teams/set-validation";
import type { DamageSpreadDraft, DamageSpreadId, DamageSpreadStat } from "./damage-spreads";

export type DamageField = DamageRequest["field"];
export type DamageSetField = "species" | "item" | "ability";

type TransferSummary = { attacker: PokemonSet; defender: PokemonSet } | null;

type DamageFormProps = {
  catalog: CatalogResponse | null;
  speciesNames: string[];
  attacker: PokemonSet;
  defender: PokemonSet;
  attackerIssues: SetValidationIssue[];
  defenderIssues: SetValidationIssue[];
  attackerOverrides: DamageSpreadDraft;
  defenderOverrides: DamageSpreadDraft;
  move: string;
  field: DamageField;
  transferSummary: TransferSummary;
  isCalculating: boolean;
  error: string | null;
  onAttackerFieldChange: (field: DamageSetField, value: string) => void;
  onDefenderFieldChange: (field: DamageSetField, value: string) => void;
  onSpreadChange: (side: DamageSpreadId, spread: "evs" | "ivs", stat: DamageSpreadStat, value: string) => void;
  onResetSpreadOverrides: (side: DamageSpreadId) => void;
  onMoveChange: (move: string) => void;
  onGameTypeChange: (gameType: string) => void;
  onWeatherChange: (weather: string) => void;
  onTerrainChange: (terrain: string) => void;
  onConditionChange: (key: DamageConditionKey, checked: boolean) => void;
  onSpikesChange: (spikes: number | null) => void;
  onCalculate: () => void;
};

const noOptions: string[] = [];
const weatherOptions = ["", "Sun", "Rain", "Sand", "Snow"] as const;
const terrainOptions = ["", "Electric", "Grassy", "Misty", "Psychic"] as const;
const damageConditionKeys = [
  "reflect",
  "lightScreen",
  "auroraVeil",
  "helpingHand",
  "critical",
  "attackerTerastallized",
  "defenderTerastallized",
  "friendGuard",
  "stealthRock"
] as const;
export type DamageConditionKey = (typeof damageConditionKeys)[number];

export function DamageForm({
  catalog,
  speciesNames,
  attacker,
  defender,
  attackerIssues,
  defenderIssues,
  attackerOverrides,
  defenderOverrides,
  move,
  field,
  transferSummary,
  isCalculating,
  error,
  onAttackerFieldChange,
  onDefenderFieldChange,
  onSpreadChange,
  onResetSpreadOverrides,
  onMoveChange,
  onGameTypeChange,
  onWeatherChange,
  onTerrainChange,
  onConditionChange,
  onSpikesChange,
  onCalculate
}: DamageFormProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [showActionErrors, setShowActionErrors] = useState(false);
  const [numericValidity, setNumericValidity] = useState<Record<string, boolean>>({});
  const moveIssue: SetValidationIssue | null = !catalog
    ? { field: "catalog", code: "catalog-unavailable" }
    : !move.trim()
      ? { field: "move", code: "required" }
      : !isCatalogMove(move, catalog)
        ? { field: "move", code: "unknown-move", value: move }
        : null;
  const allSetIssues = [...attackerIssues, ...defenderIssues];
  const hasValidationIssues = allSetIssues.length > 0 || Boolean(moveIssue);
  const hasInvalidNumber = Object.values(numericValidity).some((valid) => !valid);
  const canCalculate = !hasValidationIssues && !hasInvalidNumber;

  function markTouched(field: string) {
    setTouched((current) => ({ ...current, [field]: true }));
    setEditing((current) => ({ ...current, [field]: false }));
  }

  function markEditing(field: string) {
    setEditing((current) => ({ ...current, [field]: true }));
  }

  function handleNumericValidityChange(fieldName: string, valid: boolean) {
    const next = { ...numericValidity, [fieldName]: valid };
    setNumericValidity(next);
  }

  function handleCalculate() {
    setShowActionErrors(true);
    if (!canCalculate) return;
    onCalculate();
  }

  function fieldIssue(issues: SetValidationIssue[], fieldName: string) {
    return issues.find((issue) => issue.field === fieldName);
  }

  function showFieldIssue(issues: SetValidationIssue[], fieldName: string, touchedKey: string) {
    const issue = fieldIssue(issues, fieldName);
    return issue && (showActionErrors || touched[touchedKey] || !editing[touchedKey]) ? (
      <small className="field-error" role="alert">{setValidationMessage(issue)}</small>
    ) : null;
  }

  function handleAttackerSpeciesChange(species: string) {
    onAttackerFieldChange("species", species);
  }

  function handleDefenderSpeciesChange(species: string) {
    onDefenderFieldChange("species", species);
  }

  function handleAttackerItemChange(item: string) {
    onAttackerFieldChange("item", item);
  }

  function handleDefenderItemChange(item: string) {
    onDefenderFieldChange("item", item);
  }

  function handleAttackerAbilityChange(ability: string) {
    onAttackerFieldChange("ability", ability);
  }

  function handleDefenderAbilityChange(ability: string) {
    onDefenderFieldChange("ability", ability);
  }

  return (
    <div className="panel damage-form">
      <span className="eyebrow">{t.damage.formEyebrow}</span>
      {transferSummary && <TransferredSetSummary sets={transferSummary} />}
      <div className="two-grid">
        <label>
          {t.damage.attacker}
          <CatalogInput
            list="species-list"
            category="species"
            options={speciesNames}
            translations={catalogTranslations}
            value={attacker.species}
            aria-invalid={Boolean(showActionErrors || touched["attacker.species"] || !editing["attacker.species"]) && Boolean(fieldIssue(attackerIssues, "species"))}
            onFocus={() => markEditing("attacker.species")}
            onBlur={() => markTouched("attacker.species")}
            onChange={handleAttackerSpeciesChange}
          />
          {showFieldIssue(attackerIssues, "species", "attacker.species")}
        </label>
        <label>
          {t.damage.defender}
          <CatalogInput
            list="species-list"
            category="species"
            options={speciesNames}
            translations={catalogTranslations}
            value={defender.species}
            aria-invalid={Boolean(showActionErrors || touched["defender.species"] || !editing["defender.species"]) && Boolean(fieldIssue(defenderIssues, "species"))}
            onFocus={() => markEditing("defender.species")}
            onBlur={() => markTouched("defender.species")}
            onChange={handleDefenderSpeciesChange}
          />
          {showFieldIssue(defenderIssues, "species", "defender.species")}
        </label>
        <label>
          {t.damage.attackerItem}
          <CatalogInput
            list="items-list"
            category="items"
            options={catalog?.items ?? noOptions}
            translations={catalogTranslations}
            value={attacker.item}
            aria-invalid={Boolean(showActionErrors || touched["attacker.item"] || !editing["attacker.item"]) && Boolean(fieldIssue(attackerIssues, "item"))}
            onFocus={() => markEditing("attacker.item")}
            onBlur={() => markTouched("attacker.item")}
            onChange={handleAttackerItemChange}
          />
          {showFieldIssue(attackerIssues, "item", "attacker.item")}
        </label>
        <label>
          {t.damage.defenderItem}
          <CatalogInput
            list="items-list"
            category="items"
            options={catalog?.items ?? noOptions}
            translations={catalogTranslations}
            value={defender.item}
            aria-invalid={Boolean(showActionErrors || touched["defender.item"] || !editing["defender.item"]) && Boolean(fieldIssue(defenderIssues, "item"))}
            onFocus={() => markEditing("defender.item")}
            onBlur={() => markTouched("defender.item")}
            onChange={handleDefenderItemChange}
          />
          {showFieldIssue(defenderIssues, "item", "defender.item")}
        </label>
        <label>
          {t.damage.attackerAbility}
          <CatalogInput
            list="abilities-list"
            category="abilities"
            options={catalog?.abilities ?? noOptions}
            translations={catalogTranslations}
            value={attacker.ability}
            aria-invalid={Boolean(showActionErrors || touched["attacker.ability"] || !editing["attacker.ability"]) && Boolean(fieldIssue(attackerIssues, "ability"))}
            onFocus={() => markEditing("attacker.ability")}
            onBlur={() => markTouched("attacker.ability")}
            onChange={handleAttackerAbilityChange}
          />
          {showFieldIssue(attackerIssues, "ability", "attacker.ability")}
        </label>
        <label>
          {t.damage.defenderAbility}
          <CatalogInput
            list="abilities-list"
            category="abilities"
            options={catalog?.abilities ?? noOptions}
            translations={catalogTranslations}
            value={defender.ability}
            aria-invalid={Boolean(showActionErrors || touched["defender.ability"] || !editing["defender.ability"]) && Boolean(fieldIssue(defenderIssues, "ability"))}
            onFocus={() => markEditing("defender.ability")}
            onBlur={() => markTouched("defender.ability")}
            onChange={handleDefenderAbilityChange}
          />
          {showFieldIssue(defenderIssues, "ability", "defender.ability")}
        </label>
        <label>
          {t.damage.move}
          <CatalogInput
            list="moves-list"
            category="moves"
            options={catalog?.moves ?? noOptions}
            translations={catalogTranslations}
            value={move}
            aria-invalid={Boolean(showActionErrors || touched.move || !editing.move) && Boolean(moveIssue)}
            onFocus={() => markEditing("move")}
            onBlur={() => markTouched("move")}
            onChange={onMoveChange}
          />
          {moveIssue && (showActionErrors || touched.move) && (
            <small className="field-error" role="alert">{setValidationMessage(moveIssue)}</small>
          )}
        </label>
        <label>
          {t.damage.battleType}
          <select value={field.gameType} onChange={(event) => onGameTypeChange(event.target.value)}>
            <option value="Singles">{t.damage.gameTypes.Singles}</option>
            <option value="Doubles">{t.damage.gameTypes.Doubles}</option>
          </select>
        </label>
        <label>
          {t.damage.weatherLabel}
          <select value={field.weather} onChange={(event) => onWeatherChange(event.target.value)}>
            {weatherOptions.map((value) => (
              <option key={value || "none"} value={value}>
                {value ? t.damage.weather[value] : t.damage.weather.none}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.damage.terrainLabel}
          <select value={field.terrain} onChange={(event) => onTerrainChange(event.target.value)}>
            {terrainOptions.map((value) => (
              <option key={value || "none"} value={value}>
                {value ? t.damage.terrain[value] : t.damage.terrain.none}
              </option>
            ))}
          </select>
        </label>
      </div>

      <details className="damage-spread">
        <summary>{t.damage.optionalSpreads}</summary>
        <p>{t.damage.optionalSpreadsHelp}</p>
        <div className="damage-spread-columns">
          <DamageSpreadSide
            side="attacker"
            set={attacker}
            issues={attackerIssues}
            draft={attackerOverrides}
            onChange={onSpreadChange}
            onReset={onResetSpreadOverrides}
            onNumericValidityChange={handleNumericValidityChange}
          />
          <DamageSpreadSide
            side="defender"
            set={defender}
            issues={defenderIssues}
            draft={defenderOverrides}
            onChange={onSpreadChange}
            onReset={onResetSpreadOverrides}
            onNumericValidityChange={handleNumericValidityChange}
          />
        </div>
      </details>

      <div className="check-grid">
        {damageConditionKeys.map((key) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={field[key]}
              onChange={(event) => onConditionChange(key, event.target.checked)}
            />
            {" "}{t.damage.fieldLabels[key]}
          </label>
        ))}
      </div>

      <label>
        {t.damage.spikesLayers}
        <BoundedIntegerInput
          id="damage-spikes"
          value={field.spikes}
          min={0}
          max={3}
          rangeHint={formatMessage(t.team.validation.wholeNumberRange, { min: 0, max: 3 })}
          wholeNumberHint={t.team.validation.wholeNumber}
          onValueChange={onSpikesChange}
          onValidityChange={(valid) => handleNumericValidityChange("spikes", valid)}
          clampHint={(value) => formatMessage(t.team.validation.clamped, { value })}
        />
      </label>

      {(showActionErrors && hasValidationIssues) && (
        <div className="damage-validation-errors" role="alert">
          {[...attackerIssues, ...defenderIssues, ...(moveIssue ? [moveIssue] : [])].map((issue, index) => (
            <p key={`${issue.field}-${issue.code}-${index}`}>{setValidationMessage(issue)}</p>
          ))}
        </div>
      )}
      {showActionErrors && hasInvalidNumber && <p className="field-error" role="alert">{t.team.validation.numericDraftInvalid}</p>}
      <Button disabled={isCalculating} onClick={handleCalculate}>
        {isCalculating ? t.damage.calculating : t.damage.calculate}
      </Button>
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  );
}

function DamageSpreadSide({ side, set, issues, draft, onChange, onReset, onNumericValidityChange }: {
  side: DamageSpreadId;
  set: PokemonSet;
  issues: SetValidationIssue[];
  draft: DamageSpreadDraft;
  onChange: DamageFormProps["onSpreadChange"];
  onReset: DamageFormProps["onResetSpreadOverrides"];
  onNumericValidityChange: (field: string, valid: boolean) => void;
}) {
  const [clearMessage, setClearMessage] = useState("");
  const sideLabel = side === "attacker" ? t.damage.attacker : t.damage.defender;
  const evTotal = statIds.reduce((sum, stat) => sum + effectiveValue(set.evs[stat], draft.evs[stat]), 0);
  const evTotalIssue = issues.find((issue) => issue.field === "evs");

  function otherEvTotal(stat: DamageSpreadStat) {
    return statIds.reduce((sum, otherStat) => otherStat === stat
      ? sum
      : sum + effectiveValue(set.evs[otherStat], draft.evs[otherStat]), 0);
  }

  function maximumEv(stat: DamageSpreadStat) {
    const others = otherEvTotal(stat);
    return Math.max(0, Math.min(252, 510 - others));
  }

  function handleSpreadChange(spread: "evs" | "ivs", stat: DamageSpreadStat, value: number | null) {
    setClearMessage("");
    if (value !== null) {
      onChange(side, spread, stat, String(value));
      return;
    }
    if (spread === "evs") {
      const remaining = maximumEv(stat);
      if (set.evs[stat] > remaining) {
        onChange(side, spread, stat, String(remaining));
        setClearMessage(formatMessage(t.team.validation.clearingWouldExceed, { value: remaining }));
        return;
      }
    }
    onChange(side, spread, stat, "");
  }

  return (
    <fieldset className="damage-spread-side">
      <legend>{sideLabel}</legend>
      <Button type="button" variant="ghost" size="sm" onClick={() => { setClearMessage(""); onReset(side); }}>
        {t.damage.resetOverrides}
      </Button>
      {(["evs", "ivs"] as const).map((spread) => (
        <section className="damage-spread-group" key={spread}>
          <h4>{spread === "evs" ? t.damage.evs : t.damage.ivs}</h4>
          {spread === "evs" && (
            <p className={evTotal > 510 ? "field-error" : "ev-total"}>
              {formatMessage(t.team.evTotal, { total: evTotal })}
              {evTotalIssue && <span> — {setValidationMessage(evTotalIssue)}</span>}
            </p>
          )}
          <div className="damage-stat-grid">
            {statIds.map((stat) => {
              const field = `${side}.${spread}.${stat}`;
              const inherited = set[spread][stat];
              const raw = draft[spread][stat];
              const parsed = raw.trim() === "" ? null : Number(raw);
              const inputValue = parsed !== null && Number.isInteger(parsed) ? parsed : inherited;
              const minimum = 0;
              const maximum = spread === "evs" ? maximumEv(stat) : 31;
              const fieldIssue = issues.find((issue) => issue.field === `${spread}.${stat}`);
              return (
                <label key={stat}>
                  {t.team.stats[stat]}
                  <BoundedIntegerInput
                    value={inputValue}
                    min={minimum}
                    max={maximum}
                    allowEmpty
                    empty={raw.trim() === ""}
                    rangeHint={formatMessage(t.team.validation.wholeNumberRange, { min: minimum, max: maximum })}
                    wholeNumberHint={t.team.validation.wholeNumber}
                    aria-label={formatMessage(t.damage.spreadInputLabel, {
                      side: sideLabel,
                      stat: t.pokedex.stats[stat],
                      spread: spread === "evs" ? t.damage.evs : t.damage.ivs
                    })}
                    aria-invalid={Boolean(fieldIssue)}
                    placeholder={spread === "evs" ? "0–252" : "0–31"}
                    onValueChange={(value) => handleSpreadChange(spread, stat, value)}
                    onValidityChange={(valid) => onNumericValidityChange(field, valid)}
                    clampHint={(value) => spread === "evs"
                      ? formatMessage(t.team.evClamp, { value, used: otherEvTotal(stat) })
                      : formatMessage(t.team.validation.clamped, { value })}
                  />
                  <small>{formatMessage(t.damage.inheritedValue, { value: inherited })}</small>
                  {fieldIssue && <small className="field-error" role="alert">{setValidationMessage(fieldIssue)}</small>}
                </label>
              );
            })}
          </div>
          {spread === "evs" && clearMessage && <p className="field-feedback" role="status">{clearMessage}</p>}
        </section>
      ))}
    </fieldset>
  );
}

function effectiveValue(source: number, override: string) {
  const raw = override.trim();
  if (!raw) return source;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : source;
}

function TransferredSetSummary({ sets }: { sets: NonNullable<TransferSummary> }) {
  return (
    <section className="damage-transfer-summary" aria-label={t.damage.transferredSets}>
      <h3>{t.damage.transferredSets}</h3>
      <div>
        <SetSummary side={t.damage.attacker} set={sets.attacker} />
        <SetSummary side={t.damage.defender} set={sets.defender} />
      </div>
    </section>
  );
}

function SetSummary({ side, set }: { side: string; set: PokemonSet }) {
  const spread = (values: PokemonSet["evs"] | PokemonSet["ivs"]) => statIds
    .map((stat) => `${t.team.stats[stat]} ${values[stat]}`)
    .join(" / ");
  const boosts = statIds.filter((stat) => set.boosts[stat] !== 0)
    .map((stat) => `${t.team.stats[stat]} ${set.boosts[stat] > 0 ? "+" : ""}${set.boosts[stat]}`)
    .join(" / ") || t.damage.noneValue;
  const moves = set.moves.filter(Boolean).map((move) => label("moves", move)).join(" / ") || t.damage.noneValue;
  const summary = formatMessage(t.damage.transferredSetSummary, {
    species: label("species", set.species),
    nickname: set.nickname ? ` (${set.nickname})` : "",
    level: set.level,
    nature: label("natures", set.nature),
    item: set.item ? label("items", set.item) : t.damage.noneValue,
    ability: set.ability ? label("abilities", set.ability) : t.damage.noneValue,
    moves,
    status: t.team.statuses[set.status],
    evs: spread(set.evs),
    ivs: spread(set.ivs),
    boosts,
    tera: set.teraType ? label("types", set.teraType) : t.team.noTeraType
  });
  return <p><b>{side}:</b> {summary}</p>;
}
