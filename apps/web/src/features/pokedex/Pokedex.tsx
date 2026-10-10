import { useEffect, useMemo, useState } from "react";
import {
  pokedexResponseSchema,
  type CatalogResponse,
  type PokedexResponse
} from "@pokemon-tools/contracts";
import { formatMessage, label, t } from "../../i18n/presentation";
import { api } from "../../lib/api";

type PokedexProps = { catalog: CatalogResponse | null };
type SpeciesEntry = CatalogResponse["species"][number];
type StatRow = { name: string; label: string; value: number };

export function Pokedex({ catalog }: PokedexProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<PokedexResponse | null>(null);

  const filteredSpecies = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return catalog?.species
      .filter((entry) => matchesSpecies(entry, normalizedQuery))
      .slice(0, 60) ?? [];
  }, [catalog, query]);

  const selectedSpecies = catalog?.species.find((entry) => entry.name === selected);
  const statRows = useMemo(() => buildStatRows(selectedSpecies), [selectedSpecies]);

  useEffect(() => {
    if (!selected) return;

    const controller = new AbortController();
    void api(
      `/pokedex/${encodeURIComponent(selected)}`,
      { signal: controller.signal },
      pokedexResponseSchema
    )
      .then((response) => {
        if (!controller.signal.aborted) setDetail(response);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setDetail({ source: "PokéAPI", unavailable: true });
        }
      });

    return () => controller.abort();
  }, [selected]);

  function handleQueryChange(value: string) {
    setQuery(value);
  }

  function handleSpeciesSelect(name: string) {
    setSelected(name);
    setDetail(null);
  }

  return (
    <div className="pokedex-layout">
      <PokemonList
        query={query}
        species={filteredSpecies}
        onQueryChange={handleQueryChange}
        onSelect={handleSpeciesSelect}
      />
      <PokemonDetail
        selected={selected}
        detail={detail}
        statRows={statRows}
      />
    </div>
  );
}

function matchesSpecies(entry: SpeciesEntry, normalizedQuery: string) {
  const canonicalName = entry.name.toLowerCase();
  const localizedName = label("species", entry.name).toLowerCase();
  return canonicalName.includes(normalizedQuery) || localizedName.includes(normalizedQuery);
}

function buildStatRows(species: SpeciesEntry | undefined): StatRow[] {
  const stats = species?.baseStats ?? {};
  return Object.entries(stats).map(([name, value]) => ({
    name,
    label: t.team.stats[name as keyof typeof t.team.stats] ?? name.toUpperCase(),
    value
  }));
}

function PokemonList({ query, species, onQueryChange, onSelect }: {
  query: string;
  species: SpeciesEntry[];
  onQueryChange: (query: string) => void;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="panel">
      <label>
        {t.pokedex.findPokemon}
        <input
          placeholder={t.pokedex.searchPlaceholder}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      <div className="species-list">
        {species.map((entry) => (
          <button key={entry.name} onClick={() => onSelect(entry.name)}>
            {label("species", entry.name)}
            <span>{entry.types.map((type) => label("types", type)).join(" / ")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PokemonDetail({ selected, detail, statRows }: {
  selected: string | null;
  detail: PokedexResponse | null;
  statRows: StatRow[];
}) {
  if (!selected) {
    return <div className="panel pokemon-detail"><p>{t.pokedex.selectPokemon}</p></div>;
  }

  const speciesLabel = label("species", selected);
  return (
    <div className="panel pokemon-detail">
      <span className="eyebrow">{t.pokedex.generationData}</span>
      <h2>{speciesLabel}</h2>
      {detail?.sprite && (
        <img src={detail.sprite} alt={speciesLabel} width="144" height="144" />
      )}
      {detail?.pokedexId && (
        <p>{formatMessage(t.pokedex.nationalNumber, { id: detail.pokedexId })}</p>
      )}
      {detail?.unavailable && <p role="status">{t.pokedex.descriptiveUnavailable}</p>}
      {detail?.stale && <p role="status">{t.pokedex.cachedDataStale}</p>}
      {!detail && <p role="status">{t.pokedex.loadingDetails}</p>}

      <h3>{t.pokedex.baseStats}</h3>
      <div className="stats-list">
        {statRows.map((row) => (
          <div key={row.name}>
            <span>{row.label}</span>
            <meter min="0" max="255" value={row.value} />
            <b>{row.value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
