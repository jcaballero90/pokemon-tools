import { toID } from "@smogon/calc";
import { type PokedexMovesResponse, pokedexMovesResponseSchema } from "@pokemon-tools/contracts";
import { InputValidationError } from "../../http-errors.js";
import { errorText } from "../../resources/errors.js";
import { knownSpecies } from "./catalog.js";
import { pokedexIdentity } from "./pokedex-identities.js";
import moveData from "./pokemon-moves.generated.json" with { type: "json" };

type MoveMeta = [name: string, type: string | null, category: "physical" | "special" | "status" | null, machineNumbers?: number[]];
type AcquisitionTuple = [methodId: number] | [methodId: number, level: number];
type CompactLearnsets = {
  source: { provider: "PokéAPI"; repository: string; revision: string; versionGroup: "scarlet-violet"; versionGroupId: number };
  methods: Record<string, string>;
  moves: Record<string, MoveMeta>;
  entries: Record<string, Array<[moveId: number, acquisitions: AcquisitionTuple[]]>>;
};
const learnsets = moveData as unknown as CompactLearnsets;

export function pokedexMoves(species: string): PokedexMovesResponse {
  const identity = pokedexIdentity(species);
  if (!knownSpecies(species) || !identity?.eligible) {
    throw new InputValidationError(errorText.unknownGeneration9Species, [{ code: "unknown-species", path: ["species"], value: species }], "unknown-species");
  }

  const speciesKey = toID(species);
  const rows = learnsets.entries[speciesKey];
  if (!rows) {
    return pokedexMovesResponseSchema.parse({
      source: learnsets.source,
      species,
      moves: [],
      unavailable: true,
      unavailableReasonCode: "no-scarlet-violet-learnset"
    });
  }

  const moves = rows.map(([moveId, acquisitions]) => {
    const metadata = learnsets.moves[String(moveId)];
    if (!metadata) throw new Error(`Generated Scarlet/Violet learnset references missing move id ${moveId}`);
    return {
      name: metadata[0],
      type: metadata[1],
      category: metadata[2],
      acquisition: acquisitions.map(([methodId, level]) => {
        const method = learnsets.methods[String(methodId)];
        if (!method) throw new Error(`Generated Scarlet/Violet learnset references missing acquisition method id ${methodId}`);
        if (method === "level-up" && typeof level === "number") {
          return level === 0 ? { method, event: true } : { method, level };
        }
        if (method === "machine" && metadata[3]?.length) return { method, machineNumbers: metadata[3] };
        return { method };
      })
    };
  }).sort((left, right) => left.name.localeCompare(right.name, "en"));

  return pokedexMovesResponseSchema.parse({
    source: learnsets.source,
    species,
    moves
  });
}
