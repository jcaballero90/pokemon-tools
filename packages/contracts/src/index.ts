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
  species: z.array(z.object({ name: z.string(), types: z.array(z.string()), baseStats: z.record(z.string(), z.number()) })),
  moves: z.array(z.string()), abilities: z.array(z.string()), items: z.array(z.string()),
  types: z.array(z.string()), natures: z.array(z.string())
});

export const typeChartResponseSchema = z.array(z.object({
  attack: z.string(), against: z.record(z.string(), z.number())
}));

export const pokedexResponseSchema = z.object({
  source: z.literal("PokéAPI"),
  pokedexId: z.number().int().positive().optional(),
  sprite: z.url().nullable().optional(),
  heightDecimeters: z.number().int().nonnegative().optional(),
  weightHectograms: z.number().int().nonnegative().optional(),
  unavailable: z.boolean().optional(),
  reason: z.string().optional(),
  stale: z.boolean().optional()
});

const proSetSchema = z.object({
  species: z.string(), item: z.string(), ability: z.string(), teraType: z.string(), nature: z.string(),
  evs: z.record(z.string(), z.number()), ivs: z.record(z.string(), z.number()), moves: z.array(z.string())
});

export const proTeamsResponseSchema = z.array(z.object({
  id: z.string(), player: z.string(), event: z.string(), eventDate: z.string(), placement: z.string(),
  format: z.string(), sets: z.array(proSetSchema),
  source: z.object({ title: z.string(), url: z.url(), pasteUrl: z.url() })
}));

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
export const versionedTeamDraftSchema = z.object({ version: z.literal(1), team: teamDraftSchema });

export type PokemonSet = z.infer<typeof pokemonSetSchema>;
export type TeamInput = z.infer<typeof teamInputSchema>;
export type FieldInput = z.infer<typeof fieldSchema>;
export type DamageRequest = z.infer<typeof damageRequestSchema>;
export type DamageResponse = z.infer<typeof damageResponseSchema>;
export type CatalogResponse = z.infer<typeof catalogResponseSchema>;
export type TypeChartResponse = z.infer<typeof typeChartResponseSchema>;
export type PokedexResponse = z.infer<typeof pokedexResponseSchema>;
export type ProTeamsResponse = z.infer<typeof proTeamsResponseSchema>;
export type SavedTeamResponse = z.infer<typeof savedTeamResponseSchema>;
export type TeamDraft = z.infer<typeof teamDraftSchema>;
