import { useMemo } from "react";
import type { CatalogResponse, PokemonSet, TeamDraft } from "@pokemon-tools/contracts";
import { Button } from "../../components/ui/button";
import { t } from "../../i18n/presentation";
import { emptySet } from "./team-model";
import { PokemonSetEditor } from "./PokemonSetEditor";

const noOptions: string[] = [];

export type TeamEditorProps = {
  title: string;
  team: TeamDraft;
  onChange: (team: TeamDraft) => void;
  catalog: CatalogResponse | null;
  compact?: boolean;
};

export function TeamEditor({ title, team, onChange, catalog, compact = false }: TeamEditorProps) {
  const speciesNames = useMemo(
    () => catalog?.species.map((entry) => entry.name) ?? noOptions,
    [catalog]
  );

  function handleTeamNameChange(name: string) {
    onChange({ ...team, name });
  }

  function handleSetChange(index: number, updatedSet: PokemonSet) {
    const pokemon = team.pokemon.map((set, setIndex) =>
      setIndex === index ? updatedSet : set
    );
    onChange({ ...team, pokemon });
  }

  function handleSetRemove(index: number) {
    const pokemon = team.pokemon.filter((_, setIndex) => setIndex !== index);
    onChange({ ...team, pokemon });
  }

  function handleSetAdd() {
    onChange({ ...team, pokemon: [...team.pokemon, emptySet()] });
  }

  return (
    <section className="panel team-editor">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{compact ? t.team.sideB : t.team.sideA}</span>
          <h2>{title}</h2>
        </div>
        <span>{team.pokemon.length}/6</span>
      </div>

      <label>
        {t.team.name}
        <input
          value={team.name}
          onChange={(event) => handleTeamNameChange(event.target.value)}
        />
      </label>

      {team.pokemon.map((set, index) => (
        <PokemonSetEditor
          key={index}
          index={index}
          set={set}
          catalog={catalog}
          speciesNames={speciesNames}
          moveNames={catalog?.moves ?? noOptions}
          compact={compact}
          isLastSet={index === team.pokemon.length - 1}
          onChange={(updatedSet) => handleSetChange(index, updatedSet)}
          onRemove={() => handleSetRemove(index)}
        />
      ))}

      <Button
        variant="outline"
        disabled={team.pokemon.length >= 6}
        onClick={handleSetAdd}
      >
        {t.team.addPokemon}
      </Button>
    </section>
  );
}
