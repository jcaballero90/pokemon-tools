import type { PokedexResponse } from "@pokemon-tools/contracts";
import { CatalogInput } from "../../components/catalog-input";
import { Button } from "../../components/ui/button";
import { catalogTranslations, formatMessage, label, t } from "../../i18n/presentation";
import { TypeIcon, typeClassName } from "./type-visuals";

type LoadState = "loading" | "ready" | "unavailable";

type DefenderSelectorProps = {
  types: string[];
  speciesOptions: string[];
  catalogStatus: LoadState;
  selectedTypes: string[];
  selectedSpecies: string | null;
  speciesInput: string;
  spriteDetails: PokedexResponse | null;
  onTypeToggle: (type: string) => void;
  onSpeciesInput: (value: string) => void;
  onClear: () => void;
  onSpriteError: (speciesName: string) => void;
};

export function DefenderSelector({
  types,
  speciesOptions,
  catalogStatus,
  selectedTypes,
  selectedSpecies,
  speciesInput,
  spriteDetails,
  onTypeToggle,
  onSpeciesInput,
  onClear,
  onSpriteError
}: DefenderSelectorProps) {
  const speciesSelected = selectedSpecies !== null;
  const catalogReady = catalogStatus === "ready" && speciesOptions.length > 0;
  const selectedTypeCount = selectedTypes.length;
  let speciesFinderHelp = t.chart.pokemonHelp;

  if (catalogStatus === "loading") speciesFinderHelp = t.chart.pokemonLoading;
  else if (catalogStatus === "unavailable") speciesFinderHelp = t.chart.pokemonUnavailable;
  else if (speciesSelected) speciesFinderHelp = t.chart.pokemonSelected;

  return (
    <section className="defender-selector" aria-labelledby="defender-heading">
      <div className="defender-heading-row">
        <div>
          <span className="eyebrow">{t.chart.defendAgainst}</span>
          <h2 id="defender-heading">{t.chart.chooseDefender}</h2>
        </div>
        <span className="selection-count" aria-live="polite">
          {formatMessage(t.chart.selectionCount, { count: selectedTypeCount })}
        </span>
      </div>

      <label className="species-finder-label" htmlFor="defender-species">
        {t.chart.findPokemon}
      </label>
      <CatalogInput
        id="defender-species"
        aria-label={t.chart.findPokemon}
        aria-describedby="defender-finder-help"
        className="species-finder"
        category="species"
        list="species-list"
        options={speciesOptions}
        translations={catalogTranslations}
        placeholder={catalogReady ? t.chart.pokemonPlaceholder : t.chart.pokemonLoadingPlaceholder}
        disabled={!catalogReady}
        value={speciesInput}
        onChange={onSpeciesInput}
      />
      <p className="finder-help" id="defender-finder-help">
        {speciesFinderHelp}
      </p>

      <div className="type-selection-heading">
        <h3 id="defending-type-heading">{t.chart.selectTypes}</h3>
        {selectedTypeCount === 2 && <p>{t.chart.maxTypesReached}</p>}
      </div>
      <div className="defending-type-options" role="group" aria-labelledby="defending-type-heading">
        {types.map((type) => {
          const selected = selectedTypes.includes(type);
          const disabled = selectedTypeCount === 2 && !selected;
          const typeClass = typeClassName(type);

          return (
            <button
              className={`type-button${typeClass ? ` ${typeClass}` : ""}`}
              type="button"
              key={type}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onTypeToggle(type)}
            >
              <TypeIcon type={type} size={23} />
              <span>{label("types", type)}</span>
              {selected && <span className="selected-check" aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="clear-defender-button"
        disabled={selectedTypeCount === 0 && speciesInput.length === 0}
        onClick={onClear}
      >
        {t.chart.clearSelection}
      </Button>
      {selectedSpecies && (
        <SpeciesPreview
          speciesName={label("species", selectedSpecies)}
          details={spriteDetails}
          onSpriteError={() => onSpriteError(selectedSpecies)}
        />
      )}
    </section>
  );
}

function SpeciesPreview({
  speciesName,
  details,
  onSpriteError
}: {
  speciesName: string;
  details: PokedexResponse | null;
  onSpriteError: () => void;
}) {
  const spriteUrl = details?.sprite ?? null;

  return (
    <div className="selected-species" aria-label={t.chart.selectedPokemon}>
      {spriteUrl
        ? <img src={spriteUrl} alt={speciesName} width="72" height="72" onError={onSpriteError} />
        : <div className="species-sprite-placeholder" aria-hidden="true"><TypeIcon type="Normal" size={30} /></div>}
      <div className="selected-species-copy">
        <span className="eyebrow">{t.chart.selectedPokemon}</span>
        <strong>{speciesName}</strong>
        {details === null && <span className="sprite-status" role="status">{t.chart.pokemonImageLoading}</span>}
        {details?.unavailable && <span className="sprite-status">{t.chart.pokemonImageUnavailable}</span>}
      </div>
    </div>
  );
}
