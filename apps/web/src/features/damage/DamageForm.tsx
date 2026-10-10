import type { CatalogResponse, DamageRequest, PokemonSet } from "@pokemon-tools/contracts";
import { Button } from "../../components/ui/button";
import { CatalogInput } from "../../components/catalog-input";
import { catalogTranslations, t } from "../../i18n/presentation";

export type DamageField = DamageRequest["field"];
export type DamageSetField = "species" | "item" | "ability";

type DamageFormProps = {
  catalog: CatalogResponse | null;
  speciesNames: string[];
  attacker: PokemonSet;
  defender: PokemonSet;
  move: string;
  field: DamageField;
  isCalculating: boolean;
  error: string | null;
  onAttackerFieldChange: (field: DamageSetField, value: string) => void;
  onDefenderFieldChange: (field: DamageSetField, value: string) => void;
  onMoveChange: (move: string) => void;
  onGameTypeChange: (gameType: string) => void;
  onWeatherChange: (weather: string) => void;
  onTerrainChange: (terrain: string) => void;
  onConditionChange: (key: DamageConditionKey, checked: boolean) => void;
  onSpikesChange: (spikes: string) => void;
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
  move,
  field,
  isCalculating,
  error,
  onAttackerFieldChange,
  onDefenderFieldChange,
  onMoveChange,
  onGameTypeChange,
  onWeatherChange,
  onTerrainChange,
  onConditionChange,
  onSpikesChange,
  onCalculate
}: DamageFormProps) {
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
      <div className="two-grid">
        <label>
          {t.damage.attacker}
          <CatalogInput
            list="species-list"
            category="species"
            options={speciesNames}
            translations={catalogTranslations}
            value={attacker.species}
            onChange={handleAttackerSpeciesChange}
          />
        </label>
        <label>
          {t.damage.defender}
          <CatalogInput
            list="species-list"
            category="species"
            options={speciesNames}
            translations={catalogTranslations}
            value={defender.species}
            onChange={handleDefenderSpeciesChange}
          />
        </label>
        <label>
          {t.damage.attackerItem}
          <CatalogInput
            list="items-list"
            category="items"
            options={catalog?.items ?? noOptions}
            translations={catalogTranslations}
            value={attacker.item}
            onChange={handleAttackerItemChange}
          />
        </label>
        <label>
          {t.damage.defenderItem}
          <CatalogInput
            list="items-list"
            category="items"
            options={catalog?.items ?? noOptions}
            translations={catalogTranslations}
            value={defender.item}
            onChange={handleDefenderItemChange}
          />
        </label>
        <label>
          {t.damage.attackerAbility}
          <CatalogInput
            list="abilities-list"
            category="abilities"
            options={catalog?.abilities ?? noOptions}
            translations={catalogTranslations}
            value={attacker.ability}
            onChange={handleAttackerAbilityChange}
          />
        </label>
        <label>
          {t.damage.defenderAbility}
          <CatalogInput
            list="abilities-list"
            category="abilities"
            options={catalog?.abilities ?? noOptions}
            translations={catalogTranslations}
            value={defender.ability}
            onChange={handleDefenderAbilityChange}
          />
        </label>
        <label>
          {t.damage.move}
          <CatalogInput
            list="moves-list"
            category="moves"
            options={catalog?.moves ?? noOptions}
            translations={catalogTranslations}
            value={move}
            onChange={onMoveChange}
          />
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
        <input
          type="number"
          min="0"
          max="3"
          value={field.spikes}
          onChange={(event) => onSpikesChange(event.target.value)}
        />
      </label>
      <Button disabled={isCalculating} onClick={onCalculate}>
        {isCalculating ? t.damage.calculating : t.damage.calculate}
      </Button>
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  );
}
