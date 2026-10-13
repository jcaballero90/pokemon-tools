import {
  pokemonSetSchema,
  teamInputSchema,
  type PokemonSet,
  type TeamDraft,
  type TeamInput
} from "@pokemon-tools/contracts";

export function emptySet(): PokemonSet {
  return pokemonSetSchema.parse({ species: "Pikachu", moves: ["Thunderbolt"] });
}

export function submittedTeam(team: TeamDraft): TeamInput {
  return teamInputSchema.parse({
    ...team,
    pokemon: team.pokemon.map((set) => ({ ...set, moves: set.moves.filter(Boolean) }))
  });
}

export function submittedSet(set: PokemonSet): PokemonSet {
  return pokemonSetSchema.parse({ ...set, moves: set.moves.filter(Boolean) });
}
