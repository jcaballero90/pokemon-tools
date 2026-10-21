import { useEffect, useMemo, useState } from "react";
import {
  evolutionResponseSchema,
  pokedexResponseSchema,
  type CatalogResponse,
  type EvolutionResponse,
  type PokedexResponse
} from "@pokemon-tools/contracts";
import { label, t } from "../../i18n/presentation";
import { api } from "../../lib/api";
import { BaseStats } from "./BaseStats";
import { EvolutionFamily } from "./EvolutionFamily";
import { PokemonAbilities } from "./PokemonAbilities";
import { PokemonArtwork, type PokemonGender } from "./PokemonArtwork";

type PokedexProps = { catalog: CatalogResponse | null };
type SpeciesEntry = CatalogResponse["species"][number];

export function Pokedex({ catalog }: PokedexProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<PokedexResponse | null>(null);
  const [evolution, setEvolution] = useState<EvolutionResponse | null>(null);
  const [shiny, setShiny] = useState(false);
  const [gender, setGender] = useState<PokemonGender>("male");

  const officialSpecies = useMemo(() => catalog?.species.filter((entry) => entry.pokedexEligible !== false) ?? [], [catalog]);
  const filteredSpecies = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return officialSpecies.filter((entry) => matchesSpecies(entry, normalizedQuery)).slice(0, 60);
  }, [officialSpecies, query]);
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
    setSelected(name);
    setDetail(null);
    setEvolution(null);
    setShiny(false);
    setGender("male");
  }

  return (
    <div className="pokedex-layout">
      <PokemonList
        query={query}
        selected={selected}
        species={filteredSpecies}
        onQueryChange={setQuery}
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
                  <div className="pokemon-types" aria-label="Types">
                    {selectedSpecies?.types.map((type) => <span key={type} className={`pokemon-type type-${type.toLowerCase()}`}>{label("types", type)}</span>)}
                  </div>
                  {detail?.unavailable && <p role="status" className="pokedex-status">{detail.reason ?? t.pokedex.descriptiveUnavailable}</p>}
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
          </>
        )}
      </div>
    </div>
  );
}

function matchesSpecies(entry: SpeciesEntry, normalizedQuery: string) {
  if (!normalizedQuery) return true;
  return entry.name.toLowerCase().includes(normalizedQuery) || label("species", entry.name).toLowerCase().includes(normalizedQuery);
}

function sumBaseStats(stats: Record<string, number>) {
  return Object.values(stats).reduce((sum, value) => sum + value, 0);
}

function PokemonList({ query, selected, species, onQueryChange, onSelect }: {
  query: string;
  selected: string | null;
  species: SpeciesEntry[];
  onQueryChange: (query: string) => void;
  onSelect: (name: string) => void;
}) {
  return (
    <aside className="panel pokedex-sidebar">
      <label htmlFor="pokedex-search">{t.pokedex.findPokemon}</label>
      <input
        id="pokedex-search"
        placeholder={t.pokedex.searchPlaceholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <div className="species-list">
        {species.map((entry) => (
          <button key={entry.name} aria-pressed={selected === entry.name} onClick={() => onSelect(entry.name)}>
            <span className="species-name">{label("species", entry.name)}</span>
            <span className="species-types">{entry.types.map((type) => label("types", type)).join(" / ")}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
