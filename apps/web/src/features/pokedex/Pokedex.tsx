import { useEffect, useMemo, useState, type UIEvent } from "react";
import { Link } from "react-router";
import {
  evolutionResponseSchema,
  pokedexResponseSchema,
  type CatalogResponse,
  type EvolutionResponse,
  type PokedexResponse
} from "@pokemon-tools/contracts";
import { label, locale, t } from "../../i18n/presentation";
import { api } from "../../lib/api";
import { speciesPath } from "../../lib/pokedex-routes";
import { BaseStats } from "./BaseStats";
import { EvolutionFamily } from "./EvolutionFamily";
import { PokemonAbilities } from "./PokemonAbilities";
import { PokemonArtwork, type PokemonGender } from "./PokemonArtwork";
import { PokemonMoves } from "./PokemonMoves";

type PokedexProps = { catalog: CatalogResponse | null; selectedSpecies?: string | null };
type SpeciesEntry = CatalogResponse["species"][number];
const POKEDEX_PAGE_SIZE = 60;

export function Pokedex({ catalog, selectedSpecies: routeSelectedSpecies }: PokedexProps) {
  const [query, setQuery] = useState("");
  const [localSelected, setLocalSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<PokedexResponse | null>(null);
  const [evolution, setEvolution] = useState<EvolutionResponse | null>(null);
  const [shiny, setShiny] = useState(false);
  const [gender, setGender] = useState<PokemonGender>("male");
  const [visibleLimit, setVisibleLimit] = useState(POKEDEX_PAGE_SIZE);
  const selected = routeSelectedSpecies === undefined ? localSelected : routeSelectedSpecies;

  const officialSpecies = useMemo(() => {
    return (catalog?.species.filter((entry) => entry.pokedexEligible !== false) ?? []).sort(compareSpeciesByNationalNumber);
  }, [catalog]);
  const matchingSpecies = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    return officialSpecies.filter((entry) => matchesSpecies(entry, normalizedQuery));
  }, [officialSpecies, query, locale]);
  const visibleSpecies = matchingSpecies.slice(0, visibleLimit);
  const selectedSpecies = officialSpecies.find((entry) => entry.name === selected);
  const maxStatTotal = useMemo(
    () => officialSpecies.reduce((max, entry) => Math.max(max, sumBaseStats(entry.baseStats)), 1),
    [officialSpecies]
  );

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    void api(`/pokedex/${encodeURIComponent(selected)}`, { signal: controller.signal }, pokedexResponseSchema)
      .then((response) => { if (!controller.signal.aborted) setDetail(response); })
      .catch(() => { if (!controller.signal.aborted) setDetail({ source: "PokéAPI", unavailable: true }); });
    return () => controller.abort();
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    void api(`/pokedex/${encodeURIComponent(selected)}/evolution`, { signal: controller.signal }, evolutionResponseSchema)
      .then((response) => { if (!controller.signal.aborted) setEvolution(response); })
      .catch(() => {
        if (!controller.signal.aborted) setEvolution({ source: "PokéAPI", nodes: [], edges: [], megaForms: [], unavailable: true });
      });
    return () => controller.abort();
  }, [selected]);

  function handleSpeciesSelect(name: string) {
    if (name === selected) return;
    if (routeSelectedSpecies === undefined) setLocalSelected(name);
    setDetail(null);
    setEvolution(null);
    setShiny(false);
    setGender("male");
  }

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    setVisibleLimit(POKEDEX_PAGE_SIZE);
  }

  function handleLoadMore() {
    setVisibleLimit((current) => Math.min(current + POKEDEX_PAGE_SIZE, matchingSpecies.length));
  }

  return (
    <div className="pokedex-layout">
      <PokemonList
        query={query}
        selected={selected}
        species={visibleSpecies}
        matchingCount={matchingSpecies.length}
        hasMore={visibleSpecies.length < matchingSpecies.length}
        onQueryChange={handleQueryChange}
        onLoadMore={handleLoadMore}
        onSelect={handleSpeciesSelect}
      />
      <div className="pokedex-content" aria-live="polite">
        {!selected ? (
          <div className="panel pokemon-detail"><p>{t.pokedex.selectPokemon}</p></div>
        ) : (
          <>
            <section className="panel pokemon-detail" aria-label={label("species", selected)}>
              <div className="pokedex-primary-grid">
                <div className="pokedex-information">
                  <span className="eyebrow">{t.pokedex.generationData}</span>
                  {detail?.pokedexId && <p className="national-number">{t.pokedex.nationalNumber.replace("{id}", String(detail.pokedexId))}</p>}
                  <h2>{label("species", selected)}</h2>
                  <div className="pokemon-types" aria-label={t.pokedex.types}>
                    {selectedSpecies?.types.map((type) => <span key={type} className={`pokemon-type type-${type.toLowerCase()}`}>{label("types", type)}</span>)}
                  </div>
                  {detail?.unavailable && <p role="status" className="pokedex-status">
                    {detail.unavailableReasonCode === "official-form-not-in-pokeapi" ? t.pokedex.officialFormUnavailable : t.pokedex.descriptiveUnavailable}
                  </p>}
                  {detail?.stale && <p role="status" className="pokedex-status">{t.pokedex.cachedDataStale}</p>}
                  {!detail && <p role="status" className="pokedex-status">{t.pokedex.loadingDetails}</p>}
                  <BaseStats species={selectedSpecies} maxTotal={maxStatTotal} />
                  {detail && !detail.unavailable && detail.abilities && <PokemonAbilities abilities={detail.abilities} />}
                </div>
                <PokemonArtwork
                  name={label("species", selected)}
                  detail={detail}
                  shiny={shiny}
                  onShinyChange={setShiny}
                  gender={gender}
                  onGenderChange={setGender}
                />
              </div>
            </section>
                <EvolutionFamily
              selected={selected}
              selectedFamilyKey={detail?.familyKey}
              catalog={officialSpecies}
              evolution={evolution}
              onSelect={handleSpeciesSelect}
            />
            <PokemonMoves key={selected} species={selected} catalog={catalog} />
          </>
        )}
      </div>
    </div>
  );
}

function matchesSpecies(entry: SpeciesEntry, normalizedQuery: string) {
  if (!normalizedQuery) return true;
  return normalizeSearchText(entry.name).includes(normalizedQuery) || normalizeSearchText(label("species", entry.name)).includes(normalizedQuery);
}

function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
}

function compareSpeciesByNationalNumber(left: SpeciesEntry, right: SpeciesEntry) {
  const leftNumber = getNationalNumber(left);
  const rightNumber = getNationalNumber(right);
  if (leftNumber !== rightNumber) return leftNumber - rightNumber;

  const formOrder = getFormOrder(left) - getFormOrder(right);
  if (formOrder !== 0) return formOrder;
  return left.name.localeCompare(right.name, "en");
}

function getNationalNumber(entry: SpeciesEntry) {
  return entry.nationalDexId && entry.nationalDexId > 0 ? entry.nationalDexId : Number.MAX_SAFE_INTEGER;
}

function getFormOrder(entry: SpeciesEntry) {
  if (entry.pokedexIsBaseForm === true) return 0;
  if (entry.pokedexIsBaseForm === false) return 2;
  return 1;
}

function formatNationalNumber(nationalDexId: number) {
  return String(nationalDexId).padStart(4, "0");
}

function sumBaseStats(stats: Record<string, number>) {
  return Object.values(stats).reduce((sum, value) => sum + value, 0);
}

function PokemonList({ query, selected, species, matchingCount, hasMore, onQueryChange, onLoadMore, onSelect }: {
  query: string;
  selected: string | null;
  species: SpeciesEntry[];
  matchingCount: number;
  hasMore: boolean;
  onQueryChange: (query: string) => void;
  onLoadMore: () => void;
  onSelect: (name: string) => void;
}) {
  function handleSpeciesListScroll(event: UIEvent<HTMLDivElement>) {
    const list = event.currentTarget;
    const reachedBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 24;
    if (reachedBottom && hasMore) onLoadMore();
  }

  return (
    <aside className="panel pokedex-sidebar">
      <label htmlFor="pokedex-search">{t.pokedex.findPokemon}</label>
      <input
        id="pokedex-search"
        placeholder={t.pokedex.searchPlaceholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <p className="species-count" aria-live="polite">
        {t.pokedex.speciesCount.replace("{shown}", String(species.length)).replace("{total}", String(matchingCount))}
      </p>
      <div id="pokedex-species-list" className="species-list" onScroll={handleSpeciesListScroll}>
        {species.length === 0 ? <p className="species-empty" role="status">{t.pokedex.noPokemonMatches}</p> : species.map((entry) => (
          <Link key={entry.name} to={speciesPath(entry)} aria-current={selected === entry.name ? "page" : undefined} onClick={() => onSelect(entry.name)}>
            <span className="species-row-heading">
              <span className="species-name">{label("species", entry.name)}</span>
              {getNationalNumber(entry) !== Number.MAX_SAFE_INTEGER && (
                <span className="species-national-number">
                  #{formatNationalNumber(entry.nationalDexId ?? 0)}
                </span>
              )}
            </span>
            <span className="species-types">{entry.types.map((type) => label("types", type)).join(" / ")}</span>
          </Link>
        ))}
      </div>
      {hasMore && <button type="button" className="button button-outline button-sm pokedex-load-more" aria-controls="pokedex-species-list" onClick={onLoadMore}>{t.pokedex.loadMore}</button>}
    </aside>
  );
}
