import { useId, useState } from "react";
import type { PokedexResponse } from "@pokemon-tools/contracts";
import { label, t } from "../../i18n/presentation";

type Ability = NonNullable<PokedexResponse["abilities"]>[number];

export function PokemonAbilities({ abilities }: { abilities: Ability[] }) {
  if (!abilities.length) return null;
  return (
    <section className="pokedex-abilities" aria-labelledby="pokedex-abilities-title">
      <h3 id="pokedex-abilities-title">{t.pokedex.abilities}</h3>
      <ul className="pokedex-ability-list">
        {abilities.map((ability) => <PokemonAbility key={`${ability.name}-${ability.isHidden}`} ability={ability} />)}
      </ul>
      <p className="pokedex-ability-help">{t.pokedex.abilityHelp}</p>
    </section>
  );
}

function PokemonAbility({ ability }: { ability: Ability }) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const name = label("abilities", ability.name);
  const content = <>
    <span>{name}</span>
    {ability.isHidden && <small>{t.pokedex.hiddenAbility}</small>}
  </>;

  return (
    <li className={`pokedex-ability${open ? " pokedex-ability--open" : ""}`}>
      {ability.description ? (
        <button
          type="button"
          className="pokedex-ability-chip"
          aria-describedby={tooltipId}
          aria-expanded={open}
          aria-controls={tooltipId}
          onClick={() => setOpen((value) => !value)}
        >
          {content}
        </button>
      ) : <span className="pokedex-ability-chip">{content}</span>}
      {ability.description && <span id={tooltipId} className="pokedex-ability-tooltip" role="tooltip">{ability.description}</span>}
    </li>
  );
}
