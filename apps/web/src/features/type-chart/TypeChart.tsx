import { useEffect, useState } from "react";
import {
  pokedexResponseSchema,
  type CatalogResponse,
  type PokedexResponse,
  type TypeChartResponse
} from "@pokemon-tools/contracts";
import { t } from "../../i18n/presentation";
import { api } from "../../lib/api";
import { DefenderSelector } from "./DefenderSelector";
import { buildEffectivenessGroups, EffectivenessResults } from "./EffectivenessResults";

type LoadState = "loading" | "ready" | "unavailable";

type TypeChartProps = {
  chart: TypeChartResponse | null;
  catalog: CatalogResponse | null;
  chartStatus: LoadState;
  catalogStatus: LoadState;
};

export function TypeChart({ chart, catalog, chartStatus, catalogStatus }: TypeChartProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [speciesInput, setSpeciesInput] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [spriteDetails, setSpriteDetails] = useState<PokedexResponse | null>(null);

  const types = chart
    ?.map((row) => row.attack)
    .filter((type) => type !== "Stellar" && type !== "???") ?? [];
  const speciesOptions = catalog?.species.map((species) => species.name) ?? [];

  useEffect(() => {
    if (!selectedSpecies) return;

    const controller = new AbortController();
    void api(
      `/pokedex/${encodeURIComponent(selectedSpecies)}`,
      { signal: controller.signal },
      pokedexResponseSchema
    )
      .then((details) => {
        if (!controller.signal.aborted) setSpriteDetails(details);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSpriteDetails({ source: "PokéAPI", unavailable: true });
      });

    return () => controller.abort();
  }, [selectedSpecies]);

  function handleTypeToggle(type: string) {
    setSpeciesInput("");
    setSelectedSpecies(null);
    setSpriteDetails(null);
    setSelectedTypes((current) => {
      if (current.includes(type)) return current.filter((selected) => selected !== type);
      if (current.length >= 2) return current;
      return [...current, type];
    });
  }

  function handleSpeciesInput(value: string) {
    const species = catalog?.species.find((entry) => entry.name === value);
    setSpeciesInput(value);
    setSelectedSpecies(species?.name ?? null);
    setSpriteDetails(null);

    if (species) {
      const speciesTypes = [...new Set(species.types)]
        .filter((type) => types.includes(type))
        .slice(0, 2);
      setSelectedTypes(speciesTypes);
    }
  }

  function handleClearSelection() {
    setSelectedTypes([]);
    setSpeciesInput("");
    setSelectedSpecies(null);
    setSpriteDetails(null);
  }

  function handleSpriteError(speciesName: string) {
    setSpriteDetails((current) => (
      selectedSpecies === speciesName && current ? { ...current, sprite: null } : current
    ));
  }

  if (chartStatus === "loading") {
    return <ChartPanel role="status">{t.chart.loading}</ChartPanel>;
  }

  if (chartStatus === "unavailable" || !chart?.length || !types.length) {
    return <ChartPanel role="alert">{t.chart.unavailable}</ChartPanel>;
  }

  const groups = selectedTypes.length > 0
    ? buildEffectivenessGroups(chart, selectedTypes)
    : [];

  return (
    <div className="panel defensive-chart">
      <DefenderSelector
        types={types}
        speciesOptions={speciesOptions}
        catalogStatus={catalogStatus}
        selectedTypes={selectedTypes}
        selectedSpecies={selectedSpecies}
        speciesInput={speciesInput}
        spriteDetails={spriteDetails}
        onTypeToggle={handleTypeToggle}
        onSpeciesInput={handleSpeciesInput}
        onClear={handleClearSelection}
        onSpriteError={handleSpriteError}
      />
      <EffectivenessResults
        hasSelection={selectedTypes.length > 0}
        groups={groups}
      />
    </div>
  );
}

function ChartPanel({ children, role }: { children: string; role: "status" | "alert" }) {
  return <div className="panel defensive-chart chart-message" role={role}>{children}</div>;
}
