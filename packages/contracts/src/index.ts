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
  if (total > 510) context.addIssue({ code: "custom", path: ["evs"], message: "EV total cannot exceed 510" });
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
  description: z.string()
});

export type PokemonSet = z.infer<typeof pokemonSetSchema>;
export type TeamInput = z.infer<typeof teamInputSchema>;
export type FieldInput = z.infer<typeof fieldSchema>;
export type DamageRequest = z.infer<typeof damageRequestSchema>;
export type DamageResponse = z.infer<typeof damageResponseSchema>;
