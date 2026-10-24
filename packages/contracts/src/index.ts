import { z } from "zod";

export const generation = 9 as const;

export const statIds = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
export const statBlockSchema = z.object({
  hp: z.number().int().min(0).max(252).default(0),
  atk: z.number().int().min(0).max(252).default(0),
  def: z.number().int().min(0).max(252).default(0),
  spa: z.number().int().min(0).max(252).default(0),
  spd: z.number().int().min(0).max(252).default(0),
  spe: z.number().int().min(0).max(252).default(0)
});
export const ivBlockSchema = z.object(Object.fromEntries(statIds.map((stat) => [stat, z.number().int().min(0).max(31).default(31)])) as Record<(typeof statIds)[number], z.ZodDefault<z.ZodNumber>>);
export const boostBlockSchema = z.object(Object.fromEntries(statIds.map((stat) => [stat, z.number().int().min(-6).max(6).default(0)])) as Record<(typeof statIds)[number], z.ZodDefault<z.ZodNumber>>);

export const pokemonSetSchema = z.object({
  species: z.string().trim().min(1).max(80),
  nickname: z.string().trim().max(80).optional(),
  item: z.string().trim().max(80).default(""),
  ability: z.string().trim().max(80).default(""),
  nature: z.string().trim().max(40).default("Serious"),
  level: z.number().int().min(1).max(100).default(50),
  moves: z.array(z.string().trim().min(1).max(80)).max(4).default([]),
  evs: statBlockSchema.prefault({}),
  ivs: ivBlockSchema.prefault({}),
  boosts: boostBlockSchema.prefault({}),
  teraType: z.string().trim().max(32).optional(),
  status: z.enum(["Healthy", "Burned", "Poisoned", "Badly Poisoned", "Paralyzed", "Asleep", "Frozen"]).default("Healthy")
}).superRefine((set, context) => {
  const total = statIds.reduce((sum, stat) => sum + set.evs[stat], 0);
  if (total > 510) context.addIssue({ code: "custom", path: ["evs"], message: "EV total cannot exceed 510", params: { rule: "ev-total" } });
});

export const teamInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  notes: z.string().trim().max(2000).default(""),
  format: z.literal("gen9").default("gen9"),
  pokemon: z.array(pokemonSetSchema).max(6)
});

export const fieldSchema = z.object({
  gameType: z.enum(["Singles", "Doubles"]).default("Singles"),
  weather: z.enum(["", "Sun", "Rain", "Sand", "Snow"]).default(""),
  terrain: z.enum(["", "Electric", "Grassy", "Misty", "Psychic"]).default(""),
  reflect: z.boolean().default(false),
  lightScreen: z.boolean().default(false),
  auroraVeil: z.boolean().default(false),
  helpingHand: z.boolean().default(false),
  critical: z.boolean().default(false),
  attackerTerastallized: z.boolean().default(false),
  defenderTerastallized: z.boolean().default(false),
  friendGuard: z.boolean().default(false),
  stealthRock: z.boolean().default(false),
  spikes: z.number().int().min(0).max(3).default(0)
});

export const damageRequestSchema = z.object({
  attacker: pokemonSetSchema,
  defender: pokemonSetSchema,
  move: z.string().trim().min(1).max(80),
  field: fieldSchema.prefault({})
});

export const damageResponseSchema = z.object({
  generation: z.literal(9),
  min: z.number().int().nonnegative(),
  max: z.number().int().nonnegative(),
  minPercent: z.number().nonnegative(),
  maxPercent: z.number().nonnegative(),
  koChanceOnHit: z.number().min(0).max(1),
  defenderHp: z.number().int().positive(),
  description: z.string(),
  matchup: z.object({ attacker: z.string(), defender: z.string(), move: z.string() }).optional(),
  hasEffect: z.boolean().optional()
});

export const catalogResponseSchema = z.object({
  species: z.array(z.object({
    name: z.string(), types: z.array(z.string()), baseStats: z.record(z.string(), z.number()),
    pokedexEligible: z.boolean().optional(),
    nationalDexId: z.number().int().positive().optional(),
    pokedexSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    pokedexIsBaseForm: z.boolean().optional()
  })),
  moves: z.array(z.string()),
  moveDetails: z.record(z.string(), z.object({
    type: z.string().trim().min(1),
    category: z.enum(["Physical", "Special", "Status"])
  })).optional(),
  abilities: z.array(z.string()), items: z.array(z.string()),
  types: z.array(z.string()), natures: z.array(z.string()),
  translations: z.object({
    species: z.record(z.string(), z.string()),
    moves: z.record(z.string(), z.string()),
    abilities: z.record(z.string(), z.string()),
    items: z.record(z.string(), z.string()),
    types: z.record(z.string(), z.string()),
    natures: z.record(z.string(), z.string()),
    evolutionLocations: z.object({
      en: z.record(z.string(), z.string()),
      esES: z.record(z.string(), z.string())
    }).optional()
  }).optional()
});

export const typeChartResponseSchema = z.array(z.object({
  attack: z.string(), against: z.record(z.string(), z.number())
}));

const pokedexArtworkVariantSchema = z.object({ normal: z.array(z.url()), shiny: z.array(z.url()) });
export const pokedexResponseSchema = z.object({
  source: z.literal("PokéAPI"),
  pokedexId: z.number().int().positive().optional(),
  familyKey: z.string().optional(),
  sprite: z.url().nullable().optional(),
  artwork: z.object({
    normal: z.array(z.url()),
    shiny: z.array(z.url()),
    genderVariants: z.object({
      male: pokedexArtworkVariantSchema,
      female: pokedexArtworkVariantSchema
    }).optional()
  }).optional(),
  abilities: z.array(z.object({
    name: z.string().trim().min(1).max(80),
    isHidden: z.boolean(),
    description: z.string().trim().max(2000).optional(),
    descriptions: z.object({
      en: z.string().trim().max(2000),
      esES: z.string().trim().max(2000),
      sources: z.object({ en: z.string(), esES: z.string() }).optional()
    }).optional()
  })).optional(),
  heightDecimeters: z.number().int().nonnegative().optional(),
  weightHectograms: z.number().int().nonnegative().optional(),
  unavailable: z.boolean().optional(),
  reason: z.string().optional(),
  unavailableReasonCode: z.enum(["official-form-not-in-pokeapi", "pokemon-details-unavailable"]).optional(),
  stale: z.boolean().optional()
});

export const evolutionNodeSchema = z.object({
  key: z.string(),
  name: z.string(),
  pokedexId: z.number().int().positive(),
  pokedexSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  pokedexIsBaseForm: z.boolean().optional(),
  iconCandidates: z.array(z.url())
});
export const evolutionConditionSchema = z.object({
  field: z.enum([
    "trigger", "item", "held_item", "known_move", "known_move_type", "location", "min_level",
    "min_happiness", "min_beauty", "min_affection", "gender", "time_of_day",
    "relative_physical_stats", "party_species", "party_type", "trade_species",
    "required_pokemon_form", "evolved_pokemon_form", "needs_overworld_rain", "needs_multiplayer",
    "near_special_rock", "turn_upside_down", "region", "used_move", "min_move_count",
    "min_steps", "min_damage_taken", "allowed_natures", "condition_expression"
  ]),
  value: z.union([z.string(), z.number(), z.boolean()])
});
export const evolutionEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  alternatives: z.array(z.array(z.string())),
  conditionAlternatives: z.array(z.array(evolutionConditionSchema)).optional()
});
export const evolutionResponseSchema = z.object({
  source: z.literal("PokéAPI"),
  nodes: z.array(evolutionNodeSchema),
  edges: z.array(evolutionEdgeSchema),
  megaForms: z.array(evolutionNodeSchema),
  unavailable: z.boolean().optional(),
  unavailableReasonCode: z.literal("evolution-chain-unavailable").optional(),
  stale: z.boolean().optional()
});

export const moveLearnAcquisitionSchema = z.object({
  method: z.string().trim().min(1).max(60),
  level: z.number().int().positive().optional(),
  machineNumbers: z.array(z.number().int().positive()).optional(),
  event: z.boolean().optional()
});
export const pokedexLearnedMoveSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.string().trim().min(1).max(40).nullable(),
  category: z.enum(["physical", "special", "status"]).nullable(),
  acquisition: z.array(moveLearnAcquisitionSchema).min(1)
});
export const pokedexMovesResponseSchema = z.object({
  source: z.object({
    provider: z.literal("PokéAPI"),
    repository: z.url(),
    revision: z.string().regex(/^[0-9a-f]{40}$/),
    versionGroup: z.literal("scarlet-violet"),
    versionGroupId: z.number().int().positive()
  }),
  species: z.string().trim().min(1).max(100),
  moves: z.array(pokedexLearnedMoveSchema),
  unavailable: z.boolean().optional(),
  unavailableReasonCode: z.literal("no-scarlet-violet-learnset").optional()
});

export const savedTeamResponseSchema = teamInputSchema.extend({
  id: z.string(), ownerId: z.string(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime()
});
export const savedTeamsResponseSchema = z.array(savedTeamResponseSchema);
export const apiErrorCodes = [
  "sign-in-required", "untrusted-origin", "team-not-found", "internal-error", "request-failed",
  "not-found", "body-too-large", "unsupported-media-type", "rate-limited", "validation-failed",
  "unknown-species", "unknown-move", "unknown-ability", "unknown-item", "unknown-nature", "unknown-type",
  "missing-attacker-tera-type", "missing-defender-tera-type", "untrusted-ingress", "ingress-not-configured"
] as const;
export const apiErrorCodeSchema = z.enum(apiErrorCodes);
export const apiValidationIssueSchema = z.object({
  code: apiErrorCodeSchema,
  path: z.array(z.union([z.string(), z.number().int().nonnegative()])),
  value: z.string().optional(),
  rule: z.enum(["required", "type", "minimum", "maximum", "length-minimum", "length-maximum", "invalid-value", "ev-total"]).optional(),
  minimum: z.number().optional(), maximum: z.number().optional(), expected: z.array(z.string()).optional()
});
export const apiErrorResponseSchema = z.object({
  error: z.union([z.string(), z.array(z.string()), z.record(z.string(), z.unknown())]),
  code: apiErrorCodeSchema,
  issues: z.array(apiValidationIssueSchema).optional()
});
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiValidationIssue = z.infer<typeof apiValidationIssueSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

export function zodValidationIssues(issues: readonly z.core.$ZodIssue[]): ApiValidationIssue[] {
  return issues.map((issue) => {
    const base: ApiValidationIssue = { code: "validation-failed", path: issue.path.filter((part): part is string | number => typeof part === "string" || typeof part === "number") };
    if (issue.code === "too_small") return { ...base, rule: issue.origin === "number" ? "minimum" : "length-minimum", minimum: Number(issue.minimum) };
    if (issue.code === "too_big") return { ...base, rule: issue.origin === "number" ? "maximum" : "length-maximum", maximum: Number(issue.maximum) };
    if (issue.code === "invalid_type") return { ...base, rule: "type", expected: [issue.expected] };
    if (issue.code === "invalid_value") return { ...base, rule: "invalid-value", expected: issue.values.map(String) };
    if (issue.code === "custom" && issue.params?.rule === "ev-total") return { ...base, rule: "ev-total", maximum: 510 };
    return { ...base, rule: "invalid-value" };
  });
}

// Browser drafts deliberately accept incomplete edits. Submission still uses
// teamInputSchema and the stricter per-Pokémon constraints above.
const draftStatBlockSchema = z.record(z.enum(statIds), z.number());
const draftPokemonSchema = z.object({
  species: z.string(), nickname: z.string().optional(), item: z.string(), ability: z.string(),
  nature: z.string(), level: z.number(), moves: z.array(z.string()).max(4),
  evs: draftStatBlockSchema, ivs: draftStatBlockSchema, boosts: draftStatBlockSchema,
  teraType: z.string().optional(),
  status: z.enum(["Healthy", "Burned", "Poisoned", "Badly Poisoned", "Paralyzed", "Asleep", "Frozen"])
});
export const teamDraftSchema = z.object({
  name: z.string(), notes: z.string(), format: z.literal("gen9"), pokemon: z.array(draftPokemonSchema).max(6)
});
export const teamDraftSourceSchema = z.object({ ownerId: z.string().min(1), teamId: z.string().min(1) });
export const versionedTeamDraftSchema = z.object({ version: z.literal(1), team: teamDraftSchema, source: teamDraftSourceSchema.optional() });

export type PokemonSet = z.infer<typeof pokemonSetSchema>;
export type TeamInput = z.infer<typeof teamInputSchema>;
export type FieldInput = z.infer<typeof fieldSchema>;
export type DamageRequest = z.infer<typeof damageRequestSchema>;
export type DamageResponse = z.infer<typeof damageResponseSchema>;
export type CatalogResponse = z.infer<typeof catalogResponseSchema>;
export type TypeChartResponse = z.infer<typeof typeChartResponseSchema>;
export type PokedexResponse = z.infer<typeof pokedexResponseSchema>;
export type EvolutionNode = z.infer<typeof evolutionNodeSchema>;
export type EvolutionCondition = z.infer<typeof evolutionConditionSchema>;
export type EvolutionEdge = z.infer<typeof evolutionEdgeSchema>;
export type EvolutionResponse = z.infer<typeof evolutionResponseSchema>;
export type MoveLearnAcquisition = z.infer<typeof moveLearnAcquisitionSchema>;
export type PokedexLearnedMove = z.infer<typeof pokedexLearnedMoveSchema>;
export type PokedexMovesResponse = z.infer<typeof pokedexMovesResponseSchema>;
export type SavedTeamResponse = z.infer<typeof savedTeamResponseSchema>;
export type TeamDraft = z.infer<typeof teamDraftSchema>;
export type TeamDraftSource = z.infer<typeof teamDraftSourceSchema>;
