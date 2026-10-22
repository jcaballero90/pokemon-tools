import { Generations, toID } from "@smogon/calc";
import {
  evolutionResponseSchema,
  pokedexResponseSchema,
  type EvolutionEdge,
  type EvolutionCondition,
  type EvolutionNode,
  type EvolutionResponse,
  type PokedexResponse
} from "@pokemon-tools/contracts";
import type { Database } from "../../db.js";
import { InputValidationError } from "../../http-errors.js";
import { errorText } from "../../resources/errors.js";
import { knownSpecies } from "./catalog.js";
import { pokedexIdentities, pokedexIdentity, type PokedexIdentity } from "./pokedex-identities.js";
import abilityDescriptionData from "./ability-descriptions.generated.json" with { type: "json" };

const DAY = 86_400_000;
const SPRITE_ROOT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
const generation9 = "generation-ix";
const unavailable = (reason?: string) => ({ source: "PokéAPI" as const, unavailable: true, ...(reason ? { reason } : {}) });
type AbilityDescription = { en: string; esES: string; sources?: { en: string; esES: string } };
const abilityDescriptions = (abilityDescriptionData as { descriptions: Record<string, AbilityDescription> }).descriptions;

type JsonRecord = Record<string, unknown>;
const record = (value: unknown): JsonRecord => value && typeof value === "object" ? value as JsonRecord : {};
const nested = (value: unknown, ...keys: string[]): unknown => keys.reduce<unknown>((current, key) => record(current)[key], value);
const spriteUrl = (value: unknown): string | undefined => typeof value === "string" && isAllowedSprite(value) ? value : undefined;
const unique = (values: (string | undefined)[]) => [...new Set(values.filter((value): value is string => Boolean(value)))];

function safeCachedDetails(value: unknown): PokedexResponse | undefined {
  const result = pokedexResponseSchema.safeParse(value);
  if (!result.success) return undefined;
  const data = result.data;
  return {
    ...data,
    ...(data.abilities ? { abilities: data.abilities.map((ability) => localizedAbility(ability.name, ability.isHidden)) } : {}),
    sprite: data.sprite && isAllowedSprite(data.sprite) ? data.sprite : null,
    ...(data.artwork ? {
      artwork: {
        normal: data.artwork.normal.filter(isAllowedSprite),
        shiny: data.artwork.shiny.filter(isAllowedSprite),
        ...(data.artwork.genderVariants ? {
          genderVariants: {
            male: {
              normal: data.artwork.genderVariants.male.normal.filter(isAllowedSprite),
              shiny: data.artwork.genderVariants.male.shiny.filter(isAllowedSprite)
            },
            female: {
              normal: data.artwork.genderVariants.female.normal.filter(isAllowedSprite),
              shiny: data.artwork.genderVariants.female.shiny.filter(isAllowedSprite)
            }
          }
        } : {})
      }
    } : {})
  };
}

export function isAllowedSprite(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "raw.githubusercontent.com" &&
      url.port === "" && url.username === "" && url.password === "" &&
      url.pathname.startsWith("/PokeAPI/sprites/master/sprites/pokemon/");
  } catch {
    return false;
  }
}

function baseSpriteCandidates(sprites: unknown, shiny: boolean): string[] {
  const front = (source: string, game: string) => nested(sprites, "versions", generation9, game, source);
  const collectGame = (game: string) => [
    front(`front_${shiny ? "shiny" : "default"}`, game),
    front(`back_${shiny ? "shiny" : "default"}`, game)
  ];
  return unique([
    ...collectGame("scarlet-violet").map(spriteUrl),
    ...collectGame("legends-za").map(spriteUrl),
    ...collectGame("champions").map(spriteUrl),
    spriteUrl(nested(sprites, "other", "home", shiny ? "front_shiny" : "front_default")),
    spriteUrl(nested(sprites, "other", "official-artwork", shiny ? "front_shiny" : "front_default"))
  ]);
}

function femaleSpriteCandidates(sprites: unknown, shiny: boolean): string[] {
  const front = (source: string, game: string) => nested(sprites, "versions", generation9, game, source);
  const collectGame = (game: string) => [
    front(`front_${shiny ? "shiny_female" : "female"}`, game),
    front(`back_${shiny ? "shiny_female" : "female"}`, game)
  ];
  return unique([
    ...collectGame("scarlet-violet").map(spriteUrl),
    ...collectGame("legends-za").map(spriteUrl),
    ...collectGame("champions").map(spriteUrl)
  ]);
}

function fixedArtworkGender(identity: PokedexIdentity, requestedSpecies: string): "male" | "female" | undefined {
  const names = [identity.pokemonName, identity.pokemonFormName].filter((name): name is string => Boolean(name));
  const gender = names.some((name) => /(?:^|-)female(?:-|$)|(?:^|-)f(?:-|$)/i.test(name))
    ? "female"
    : names.some((name) => /(?:^|-)male(?:-|$)|(?:^|-)m(?:-|$)/i.test(name)) ? "male" : undefined;
  const requestedKey = toID(requestedSpecies);
  const resourceKey = toID(identity.pokemonName ?? "");
  if (gender && (requestedKey === resourceKey || requestedKey !== toID(identity.baseKey))) return gender;
  return undefined;
}

function genderArtworkCandidates(sprites: unknown, identity: PokedexIdentity, requestedSpecies: string) {
  const shared = { normal: baseSpriteCandidates(sprites, false), shiny: baseSpriteCandidates(sprites, true) };
  const femaleNormal = femaleSpriteCandidates(sprites, false);
  const femaleShiny = femaleSpriteCandidates(sprites, true);
  const fixedGender = fixedArtworkGender(identity, requestedSpecies);
  const unavailable = { normal: [], shiny: [] };
  return {
    male: fixedGender === "female" ? unavailable : shared,
    female: fixedGender === "male" ? unavailable : {
      normal: fixedGender === "female" ? unique([...femaleNormal, ...shared.normal]) : femaleNormal.length ? femaleNormal : shared.normal,
      shiny: fixedGender === "female" ? unique([...femaleShiny, ...shared.shiny]) : femaleNormal.length ? femaleShiny : shared.shiny
    }
  };
}

function localizedAbility(name: string, isHidden: boolean) {
  const canonical = gen.abilities.get(toID(name))?.name ?? name;
  const descriptions = abilityDescriptions[toID(canonical)];
  return {
    name: canonical,
    isHidden,
    ...(descriptions ? { description: descriptions.en, descriptions } : {})
  };
}

function pokedexAbilities(value: unknown) {
  const entries = Array.isArray(value) ? value.map(record) : [];
  return entries.flatMap((entry) => {
    const resource = record(entry.ability);
    const rawName = typeof resource.name === "string" ? resource.name : "";
    if (!rawName) return [];
    return [localizedAbility(rawName, entry.is_hidden === true)];
  });
}

export async function pokedex(db: Database, species: string): Promise<PokedexResponse> {
  const identity = pokedexIdentity(species);
  if (!knownSpecies(species) || !identity?.eligible) {
    throw new InputValidationError(errorText.unknownGeneration9Species, [{ code: "unknown-species", path: ["species"], value: species }], "unknown-species");
  }
  if (!identity.pokemonId) return { source: "PokéAPI", pokedexId: identity.nationalDexId, familyKey: identity.baseKey, unavailable: true, reason: "Exact PokéAPI artwork is unavailable for this official battle form." };

  const key = `pokedex:v4:${toID(species)}`;
  const legacyKeys = [`pokedex:v3:${toID(species)}`, `pokedex:v2:${toID(species)}`];
  let previous: { payload: unknown; fetchedAt: Date } | null = null;
  try { previous = await db.pokedexCache.findUnique({ where: { key } }); } catch { /* cache failures never block live details */ }
  const isLegacy = !previous;
  for (const legacyKey of legacyKeys) {
    if (previous) break;
    try { previous = await db.pokedexCache.findUnique({ where: { key: legacyKey } }); } catch { /* older cache is best effort */ }
  }
  const cached = previous ? safeCachedDetails(previous.payload) : undefined;
  if (!isLegacy && cached && previous && Date.now() - previous.fetchedAt.getTime() < DAY) return cached;

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${identity.pokemonId}`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`PokéAPI ${response.status}`);
    const data = record(await response.json());
    const sprites = data.sprites;
    const genderVariants = genderArtworkCandidates(sprites, identity, species);
    const defaultGender = fixedArtworkGender(identity, species) ?? "male";
    const normal = genderVariants[defaultGender].normal;
    const shiny = genderVariants[defaultGender].shiny;
    const abilities = pokedexAbilities(data.abilities);
    const payload = pokedexResponseSchema.parse({
      source: "PokéAPI",
      ...(identity.nationalDexId ? { pokedexId: identity.nationalDexId } : {}),
      familyKey: identity.isMega ? identity.baseKey : toID(species),
      sprite: normal[0] ?? null,
      artwork: { normal, shiny, genderVariants },
      abilities,
      ...(typeof data.height === "number" ? { heightDecimeters: data.height } : {}),
      ...(typeof data.weight === "number" ? { weightHectograms: data.weight } : {})
    });
    try { await db.pokedexCache.upsert({ where: { key }, update: { payload, fetchedAt: new Date() }, create: { key, payload } }); } catch { /* fresh data is still useful */ }
    return payload;
  } catch {
    if (cached) return { ...cached, pokedexId: cached.pokedexId ?? identity.nationalDexId, familyKey: cached.familyKey ?? (identity.isMega ? identity.baseKey : toID(species)), stale: true };
    return { ...unavailable(), pokedexId: identity.nationalDexId, familyKey: identity.isMega ? identity.baseKey : toID(species) };
  }
}

type EvolutionDetail = {
  trigger?: { name?: string };
  item?: { name?: string } | null;
  held_item?: { name?: string } | null;
  known_move?: { name?: string } | null;
  known_move_type?: { name?: string } | null;
  location?: { name?: string } | null;
  min_level?: number | null;
  min_happiness?: number | null;
  min_beauty?: number | null;
  min_affection?: number | null;
  gender?: number | null;
  time_of_day?: string;
  relative_physical_stats?: number | null;
  party_species?: { name?: string } | null;
  party_type?: { name?: string } | null;
  trade_species?: { name?: string } | null;
  required_pokemon_form?: { name?: string } | null;
  evolved_pokemon_form?: { name?: string } | null;
  needs_overworld_rain?: boolean;
  needs_multiplayer?: boolean;
  near_special_rock?: boolean;
  turn_upside_down?: boolean;
  region?: { name?: string } | null;
  used_move?: { name?: string } | null;
  min_move_count?: number | null;
  min_steps?: number | null;
  min_damage_taken?: number | null;
  allowed_natures?: { name?: string }[] | null;
  condition_expression?: { expression?: string; percentage_chance?: number } | null;
  version_group?: { name?: string } | null;
  is_default?: boolean;
};
type EvolutionTree = {
  species?: { name?: string; url?: string };
  evolution_details?: EvolutionDetail[];
  evolves_to?: EvolutionTree[];
};
type EvolutionChainPayload = { chain?: EvolutionTree };
type EvolutionGroup = { sourceFormName?: string; targetFormName?: string; details: EvolutionDetail[] };

function groupEvolutionDetails(details: EvolutionDetail[]): EvolutionGroup[] {
  if (!details.length) return [{ details: [] }];
  const groups = new Map<string, EvolutionGroup>();
  for (const detail of details) {
    const sourceFormName = detail.required_pokemon_form?.name;
    const targetFormName = detail.evolved_pokemon_form?.name;
    const key = `${toID(sourceFormName ?? "")}:${toID(targetFormName ?? "")}`;
    const group = groups.get(key) ?? { ...(sourceFormName ? { sourceFormName } : {}), ...(targetFormName ? { targetFormName } : {}), details: [] };
    group.details.push(detail);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function titleWords(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function requirementFor(detail: EvolutionDetail): string[] {
  const trigger = detail.trigger?.name;
  const conditions: string[] = [];
  if (detail.min_level != null) conditions.push(`Level ${detail.min_level}`);
  else if (trigger === "level-up") conditions.push("Level up");
  if (detail.item?.name) conditions.push(`Use ${titleWords(detail.item.name)}`);
  if (trigger === "trade") conditions.push("Trade");
  if (detail.held_item?.name) conditions.push(`holding ${titleWords(detail.held_item.name)}`);
  if (detail.min_happiness != null) conditions.push("high friendship");
  if (detail.min_beauty != null) conditions.push(`Beauty ${detail.min_beauty}+`);
  if (detail.min_affection != null) conditions.push("high affection");
  if (detail.gender === 1) conditions.push("female");
  if (detail.gender === 2) conditions.push("male");
  if (detail.time_of_day) conditions.push(`during ${detail.time_of_day}`);
  if (detail.relative_physical_stats === -1) conditions.push("Attack lower than Defense");
  if (detail.relative_physical_stats === 0) conditions.push("Attack equal to Defense");
  if (detail.relative_physical_stats === 1) conditions.push("Attack higher than Defense");
  if (detail.known_move?.name) conditions.push(`knows ${titleWords(detail.known_move.name)}`);
  if (detail.known_move_type?.name) conditions.push(`knows a ${titleWords(detail.known_move_type.name)} move`);
  if (detail.location?.name) conditions.push(`at ${titleWords(detail.location.name)}`);
  if (detail.party_species?.name) conditions.push(`with ${titleWords(detail.party_species.name)} in the party`);
  if (detail.party_type?.name) conditions.push(`with a ${titleWords(detail.party_type.name)} type in the party`);
  if (detail.trade_species?.name) conditions.push(`trade for ${titleWords(detail.trade_species.name)}`);
  if (detail.needs_overworld_rain) conditions.push("while it is raining");
  if (detail.needs_multiplayer) conditions.push("in multiplayer");
  if (detail.near_special_rock) conditions.push("near a special rock");
  if (detail.turn_upside_down) conditions.push("with the device turned upside down");
  if (detail.region?.name) conditions.push(`in the ${titleWords(detail.region.name)} region`);
  if (detail.required_pokemon_form?.name) conditions.push(`in ${titleWords(detail.required_pokemon_form.name)} form`);
  if (detail.evolved_pokemon_form?.name) conditions.push(`evolve into ${titleWords(detail.evolved_pokemon_form.name)} form`);
  if (detail.used_move?.name) conditions.push(`use ${titleWords(detail.used_move.name)}`);
  if (detail.min_move_count != null) conditions.push(`use the move ${detail.min_move_count} times`);
  if (detail.min_steps != null) conditions.push(`walk ${detail.min_steps} steps`);
  if (detail.min_damage_taken != null) conditions.push(`after taking ${detail.min_damage_taken} damage`);
  if (detail.allowed_natures?.length) conditions.push(`with ${detail.allowed_natures.map((nature) => titleWords(nature.name ?? "")).filter(Boolean).join(" or ")} nature`);
  if (detail.condition_expression?.expression) {
    const chance = detail.condition_expression.percentage_chance;
    conditions.push(`special condition ${detail.condition_expression.expression}${chance == null ? "" : ` (${chance}% chance)`}`);
  }
  if (!conditions.length && trigger) conditions.push(titleWords(trigger));
  return conditions;
}

function evolutionMethods(details: EvolutionDetail[]): string[][] {
  if (!details.length) return [["Evolution method unavailable"]];
  // PokéAPI marks the version group where a method was introduced. Prefer an
  // explicit Scarlet/Violet method when provided; otherwise keep current methods
  // and alternatives instead of dropping older methods that still work today.
  const scarletViolet = details.filter((detail) => detail.version_group?.name === "scarlet-violet");
  const defaults = details.filter((detail) => detail.is_default === true);
  const chosen = scarletViolet.length ? scarletViolet : defaults.length ? defaults : details;
  const alternatives = [...new Map(chosen.map(requirementFor)
    .filter((requirements) => requirements.length)
    .map((requirements) => [requirements.join("\u0000"), requirements])).values()];
  return alternatives.length ? alternatives : [["Evolution method unavailable"]];
}

function evolutionConditions(details: EvolutionDetail[]): EvolutionCondition[][] {
  // Keep these alternatives in the same order as evolutionMethods so the UI
  // can render official, localized requirements without parsing English copy.
  const scarletViolet = details.filter((detail) => detail.version_group?.name === "scarlet-violet");
  const defaults = details.filter((detail) => detail.is_default === true);
  const chosen = scarletViolet.length ? scarletViolet : defaults.length ? defaults : details;
  const alternatives = new Map<string, EvolutionCondition[]>();
  for (const detail of chosen) {
    const conditions: EvolutionCondition[] = [];
    const addString = (field: EvolutionCondition["field"], value?: string | null) => {
      if (value) conditions.push({ field, value });
    };
    const addNumber = (field: EvolutionCondition["field"], value?: number | null) => {
      if (value != null) conditions.push({ field, value });
    };
    const addFlag = (field: EvolutionCondition["field"], value?: boolean) => {
      if (value) conditions.push({ field, value });
    };
    addString("trigger", detail.trigger?.name);
    addString("item", detail.item?.name);
    addString("held_item", detail.held_item?.name);
    addString("known_move", detail.known_move?.name);
    addString("known_move_type", detail.known_move_type?.name);
    addString("location", detail.location?.name);
    addNumber("min_level", detail.min_level);
    addNumber("min_happiness", detail.min_happiness);
    addNumber("min_beauty", detail.min_beauty);
    addNumber("min_affection", detail.min_affection);
    if (detail.gender === 1) conditions.push({ field: "gender", value: "female" });
    if (detail.gender === 2) conditions.push({ field: "gender", value: "male" });
    addString("time_of_day", detail.time_of_day);
    addNumber("relative_physical_stats", detail.relative_physical_stats);
    addString("party_species", detail.party_species?.name);
    addString("party_type", detail.party_type?.name);
    addString("trade_species", detail.trade_species?.name);
    addString("required_pokemon_form", detail.required_pokemon_form?.name);
    addString("evolved_pokemon_form", detail.evolved_pokemon_form?.name);
    addFlag("needs_overworld_rain", detail.needs_overworld_rain);
    addFlag("needs_multiplayer", detail.needs_multiplayer);
    addFlag("near_special_rock", detail.near_special_rock);
    addFlag("turn_upside_down", detail.turn_upside_down);
    addString("region", detail.region?.name);
    addString("used_move", detail.used_move?.name);
    addNumber("min_move_count", detail.min_move_count);
    addNumber("min_steps", detail.min_steps);
    addNumber("min_damage_taken", detail.min_damage_taken);
    for (const nature of detail.allowed_natures ?? []) addString("allowed_natures", nature.name);
    if (detail.condition_expression?.expression) addString("condition_expression", detail.condition_expression.expression);
    const key = conditions.map(({ field, value }) => `${field}:${value}`).join("\u0000");
    if (!alternatives.has(key)) alternatives.set(key, conditions);
  }
  return [...alternatives.values()];
}

function identityForFormName(speciesId: number, formName: string): { key: string; identity: PokedexIdentity } | undefined {
  const normalizedForm = toID(formName);
  const matching = Object.entries(pokedexIdentities).find(([, identity]) => identity.eligible && identity.speciesId === speciesId &&
    (toID(identity.pokemonFormName ?? "") === normalizedForm || toID(identity.pokemonName ?? "") === normalizedForm));
  return matching ? { key: matching[0], identity: matching[1] } : undefined;
}

function identityForSpeciesId(speciesId: number, formName?: string): { key: string; identity: PokedexIdentity } | undefined {
  const matching = Object.entries(pokedexIdentities)
    .filter(([, identity]) => identity.eligible && identity.speciesId === speciesId && !identity.isMega);
  const preferredForm = formName ? identityForFormName(speciesId, formName) : undefined;
  const preferred: [string, PokedexIdentity] | undefined = preferredForm
    ? [preferredForm.key, preferredForm.identity]
    : matching.find(([, identity]) => identity.pokemonIsDefault && identity.pokemonFormIsDefault)
    ?? matching.find(([, identity]) => identity.pokemonIsDefault)
    ?? matching[0];
  return preferred ? { key: preferred[0], identity: preferred[1] } : undefined;
}

function speciesIdFromUrl(url?: string): number | undefined {
  const match = url?.match(/\/pokemon-species\/(\d+)\/?$/);
  return match ? Number(match[1]) : undefined;
}

function makeNode(key: string, identity: PokedexIdentity): EvolutionNode | undefined {
  if (!identity.speciesId) return undefined;
  const candidates = identity.spriteStems.flatMap((stem) => {
    const ordinary = spriteUrl(`${SPRITE_ROOT}versions/${generation9}/scarlet-violet/icons/${stem}.png`);
    const isFemale = /female/i.test(`${identity.pokemonName ?? ""} ${identity.pokemonFormName ?? ""}`);
    const female = spriteUrl(`${SPRITE_ROOT}versions/${generation9}/scarlet-violet/icons/female/${stem}.png`);
    const officialArtwork = spriteUrl(`${SPRITE_ROOT}other/official-artwork/${stem}.png`);
    return isFemale ? [female, ordinary, officialArtwork] : [ordinary, officialArtwork];
  });
  return { key, name: speciesName(key), pokedexId: identity.nationalDexId, pokedexSlug: identity.pokedexSlug, pokedexIsBaseForm: identity.pokedexIsBaseForm, iconCandidates: unique(candidates) };
}

const gen = Generations.get(9);
function speciesName(key: string) { return gen.species.get(toID(key))?.name ?? key; }

function buildEvolutionResponse(chain: EvolutionTree, selected: PokedexIdentity): EvolutionResponse {
  const nodes: EvolutionNode[] = [];
  const edges: EvolutionEdge[] = [];
  const addNode = (key: string, identity: PokedexIdentity) => {
    const node = makeNode(key, identity);
    if (node && !nodes.some((existing) => existing.key === node.key)) nodes.push(node);
    return node;
  };
  const visit = (current: EvolutionTree, formHint?: string, ancestors = new Set<string>()) => {
    const speciesId = speciesIdFromUrl(current.species?.url);
    const selectedForm = speciesId === selected.speciesId && !selected.isMega ? selected.pokemonFormName ?? undefined : undefined;
    const match = speciesId ? identityForSpeciesId(speciesId, formHint ?? selectedForm) : undefined;
    if (speciesId === undefined || !match) return;
    const node = addNode(match.key, match.identity);
    if (!node) return;
    const state = `${speciesId}:${match.identity.pokemonFormName ?? match.identity.pokemonName ?? "default"}`;
    if (ancestors.has(state)) return;
    const nextAncestors = new Set([...ancestors, state]);
    for (const child of current.evolves_to ?? []) {
      const targetSpeciesId = speciesIdFromUrl(child.species?.url);
      if (!targetSpeciesId) continue;
      const groups = groupEvolutionDetails(child.evolution_details ?? []);
      const selectedAtThisStage = speciesId === selected.speciesId && !selected.isMega;
      const groupsForCurrentForm = groups.filter((group) => {
        if (!selectedAtThisStage || !groups.some((candidate) => candidate.sourceFormName)) return true;
        if (group.sourceFormName) return toID(group.sourceFormName) === toID(selected.pokemonFormName ?? selected.pokemonName ?? "");
        return match.identity.pokemonIsDefault;
      });
      for (const group of groupsForCurrentForm) {
        const sourceIdentity = group.sourceFormName
          ? identityForFormName(speciesId, group.sourceFormName)
          : match;
        const targetIdentity = group.targetFormName
          ? identityForFormName(targetSpeciesId, group.targetFormName)
          : identityForSpeciesId(targetSpeciesId);
        if (!sourceIdentity || !targetIdentity) continue;
        const sourceNode = addNode(sourceIdentity.key, sourceIdentity.identity);
        const targetNode = addNode(targetIdentity.key, targetIdentity.identity);
        if (!sourceNode || !targetNode || sourceNode.key === targetNode.key) continue;
        const methods = evolutionMethods(group.details);
        const conditions = evolutionConditions(group.details);
        const existing = edges.find((edge) => edge.from === sourceNode.key && edge.to === targetNode.key);
        if (existing) {
          existing.alternatives = [...existing.alternatives, ...methods.filter((method) => !existing.alternatives.some((prior) => prior.join("\u0000") === method.join("\u0000")))];
          if (existing.conditionAlternatives) {
            existing.conditionAlternatives = [...existing.conditionAlternatives, ...conditions.filter((method) => !existing.conditionAlternatives?.some((prior) => JSON.stringify(prior) === JSON.stringify(method)))];
          } else if (conditions.length) existing.conditionAlternatives = conditions;
        } else edges.push({ from: sourceNode.key, to: targetNode.key, alternatives: methods, ...(conditions.length ? { conditionAlternatives: conditions } : {}) });
        const targetForm = group.targetFormName ?? targetIdentity.identity.pokemonFormName ?? undefined;
        visit(child, targetForm, nextAncestors);
      }
    }
  };
  visit(chain);

  const familyBases = new Set(nodes.map((node) => pokedexIdentity(node.name)?.baseKey ?? toID(node.name)));
  const megaForms = Object.entries(pokedexIdentities)
    .filter(([, identity]) => identity.eligible && identity.isMega && familyBases.has(identity.baseKey))
    .map(([key, identity]) => makeNode(key, identity))
    .filter((node): node is EvolutionNode => Boolean(node));
  return evolutionResponseSchema.parse({ source: "PokéAPI", nodes, edges, megaForms });
}

function isEvolutionTree(value: unknown): value is EvolutionTree {
  const candidate = record(value);
  const species = record(candidate.species);
  if (typeof species.name !== "string" || !speciesIdFromUrl(typeof species.url === "string" ? species.url : undefined)) return false;
  if (candidate.evolution_details !== undefined && !Array.isArray(candidate.evolution_details)) return false;
  if (candidate.evolves_to !== undefined && (!Array.isArray(candidate.evolves_to) || !candidate.evolves_to.every(isEvolutionTree))) return false;
  return true;
}

function cachedEvolutionChain(value: unknown): EvolutionTree | undefined {
  const chain = record(value).chain;
  return isEvolutionTree(chain) ? chain : undefined;
}

export async function pokedexEvolution(db: Database, species: string): Promise<EvolutionResponse> {
  const identity = pokedexIdentity(species);
  if (!knownSpecies(species) || !identity?.eligible) {
    throw new InputValidationError(errorText.unknownGeneration9Species, [{ code: "unknown-species", path: ["species"], value: species }], "unknown-species");
  }
  if (!identity.evolutionChainId) return { source: "PokéAPI", nodes: [], edges: [], megaForms: [], unavailable: true };

  const cacheKey = `evolution:v2:${identity.evolutionChainId}`;
  let previous: { payload: unknown; fetchedAt: Date } | null = null;
  try { previous = await db.pokedexCache.findUnique({ where: { key: cacheKey } }); } catch { /* cache is best effort */ }
  const cached = previous ? cachedEvolutionChain(previous.payload) : undefined;
  if (cached && previous && Date.now() - previous.fetchedAt.getTime() < DAY) return buildEvolutionResponse(cached, identity);

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/evolution-chain/${identity.evolutionChainId}`, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error(`PokéAPI ${response.status}`);
    const payload = await response.json() as EvolutionChainPayload;
    if (!payload.chain) throw new Error("PokéAPI evolution chain missing");
    const result = buildEvolutionResponse(payload.chain, identity);
    try { await db.pokedexCache.upsert({ where: { key: cacheKey }, update: { payload: { chain: payload.chain }, fetchedAt: new Date() }, create: { key: cacheKey, payload: { chain: payload.chain } } }); } catch { /* response remains useful without caching */ }
    return result;
  } catch {
    if (cached) return { ...buildEvolutionResponse(cached, identity), stale: true };
    return { source: "PokéAPI", nodes: [], edges: [], megaForms: [], unavailable: true };
  }
}
