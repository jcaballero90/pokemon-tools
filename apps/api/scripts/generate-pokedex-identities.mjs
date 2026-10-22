import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Generations, toID } from "@smogon/calc";

// Update this SHA deliberately when refreshing the upstream identity snapshot.
const POKEAPI_REVISION = "2bf639e5572812a67d2b94903fdcb9d095f5aeb2";
const rawRoot = `https://raw.githubusercontent.com/PokeAPI/pokeapi/${POKEAPI_REVISION}/data/v2/csv`;
const curatedAliases = Object.fromEntries([
  ["Basculegion", "basculegion-male"], ["Basculegion-F", "basculegion-female"],
  ["Basculin", "basculin-red-striped"], ["Darmanitan", "darmanitan-standard"],
  ["Darmanitan-Galar", "darmanitan-galar-standard"], ["Deoxys", "deoxys-normal"],
  ["Dudunsparce", "dudunsparce-two-segment"], ["Eiscue", "eiscue-ice"],
  ["Enamorus", "enamorus-incarnate"], ["Frillish", "frillish-male"],
  ["Giratina", "giratina-altered"], ["Gourgeist", "gourgeist-average"],
  ["Greninja-Bond", "greninja-battle-bond"], ["Indeedee", "indeedee-male"],
  ["Indeedee-F", "indeedee-female"], ["Jellicent", "jellicent-male"],
  ["Keldeo", "keldeo-ordinary"], ["Landorus", "landorus-incarnate"],
  ["Lycanroc", "lycanroc-midday"], ["Maushold", "maushold-family-of-three"],
  ["Maushold-Four", "maushold-family-of-four"], ["Meloetta", "meloetta-aria"],
  ["Meowstic", "meowstic-male"], ["Meowstic-F", "meowstic-female"],
  ["Meowstic-F-Mega", "meowstic-female-mega"], ["Meowstic-M-Mega", "meowstic-male-mega"],
  ["Mimikyu", "mimikyu-disguised"], ["Minior", "minior-red"],
  ["Minior-Meteor", "minior-red-meteor"], ["Morpeko", "morpeko-full-belly"],
  ["Necrozma-Dawn-Wings", "necrozma-dawn"], ["Necrozma-Dusk-Mane", "necrozma-dusk"],
  ["Ogerpon-Cornerstone", "ogerpon-cornerstone-mask"], ["Ogerpon-Hearthflame", "ogerpon-hearthflame-mask"],
  ["Ogerpon-Wellspring", "ogerpon-wellspring-mask"], ["Oinkologne", "oinkologne-male"],
  ["Oinkologne-F", "oinkologne-female"], ["Oricorio", "oricorio-baile"],
  ["Palafin", "palafin-zero"], ["Pumpkaboo", "pumpkaboo-average"],
  ["Pyroar", "pyroar-male"], ["Rockruff-Dusk", "rockruff-own-tempo"],
  ["Shaymin", "shaymin-land"], ["Squawkabilly", "squawkabilly-green-plumage"],
  ["Tatsugiri", "tatsugiri-curly"], ["Thundurus", "thundurus-incarnate"],
  ["Tornadus", "tornadus-incarnate"], ["Toxtricity", "toxtricity-amped"],
  ["Urshifu", "urshifu-single-strike"], ["Wishiwashi", "wishiwashi-solo"],
  ["Wormadam", "wormadam-plant"], ["Zygarde", "zygarde-50"]
].map(([name, identifier]) => [toID(name), identifier]));

for (const suffix of ["Alola", "Hoenn", "Kalos", "Original", "Partner", "Sinnoh", "Unova", "World"]) {
  curatedAliases[toID(`Pikachu-${suffix}`)] = `pikachu-${suffix.toLowerCase()}-cap`;
}
for (const suffix of ["Blue", "White", "Yellow"]) {
  curatedAliases[toID(`Squawkabilly-${suffix}`)] = `squawkabilly-${suffix.toLowerCase()}-plumage`;
}
for (const suffix of ["Aqua", "Blaze", "Combat"]) {
  curatedAliases[toID(`Tauros-Paldea-${suffix}`)] = `tauros-paldea-${suffix.toLowerCase()}-breed`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if (character === "\n" && !quoted) {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  const [headers, ...values] = rows;
  return values.filter((valuesRow) => valuesRow.length > 1).map((valuesRow) =>
    Object.fromEntries(headers.map((header, index) => [header, valuesRow[index] ?? ""]))
  );
}

async function readCsv(name) {
  const response = await globalThis.fetch(`${rawRoot}/${name}.csv`);
  if (!response.ok) throw new Error(`PokéAPI ${name}.csv returned ${response.status}`);
  return parseCsv(await response.text());
}

function localizedNames(rows, idColumn, languageId) {
  return new Map(rows
    .filter((row) => Number(row.local_language_id) === languageId && row.name?.trim())
    .map((row) => [Number(row[idColumn]), row.name.trim()]));
}

function canonicalResourceNames(canonicalNames, resourceRows, nameRows, resourceIdColumn, aliases = {}, exemptions = [], officialOverrides = {}) {
  const englishNames = localizedNames(nameRows, resourceIdColumn, 9);
  const spanishNames = localizedNames(nameRows, resourceIdColumn, 7);
  const resourceByIdentifier = new Map();
  for (const row of resourceRows) {
    const key = toID(row.identifier);
    const current = resourceByIdentifier.get(key);
    const hasBothNames = englishNames.has(Number(row.id)) && spanishNames.has(Number(row.id));
    const currentHasBothNames = current && englishNames.has(Number(current.id)) && spanishNames.has(Number(current.id));
    if (!current || hasBothNames || !currentHasBothNames) resourceByIdentifier.set(key, row);
  }
  const missing = [];
  const exempt = new Set(exemptions.map(toID));
  const result = {};

  for (const canonicalName of canonicalNames) {
    const key = toID(canonicalName);
    if (exempt.has(key)) continue;
    if (officialOverrides[key]) {
      result[key] = { en: canonicalName, esES: officialOverrides[key] };
      continue;
    }
    const identifier = aliases[key] ?? key;
    let resource = resourceByIdentifier.get(toID(identifier));
    if (!resource) {
      const variants = resourceRows.filter((row) => toID(row.identifier).replace(/(?:physical|special)$/, "") === key);
      if (variants.length && new Set(variants.map((row) => spanishNames.get(Number(row.id)))).size === 1) resource = variants[0];
    }
    const english = resource && englishNames.get(Number(resource.id));
    const spanish = resource && spanishNames.get(Number(resource.id));
    if (!resource || !english || !spanish) {
      missing.push(canonicalName);
      continue;
    }
    result[key] = { en: english, esES: spanish };
  }

  if (missing.length) {
    throw new Error(`Official English/Spain Spanish names missing for ${missing.length} catalog entries: ${missing.join(", ")}`);
  }
  return Object.fromEntries(Object.entries(result).map(([key, names]) => [key, names.esES]));
}

function slugify(name) {
  return name.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.'’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function pokemonSpanishName(identity, speciesName, speciesNames, formNames) {
  const baseName = speciesNames.get(identity.speciesId);
  if (!baseName) return undefined;
  if (!identity.pokemonFormId || identity.pokemonIsDefault) return baseName;

  const localizedForm = formNames.get(identity.pokemonFormId);
  const completeName = localizedForm?.pokemon_name?.trim();
  if (completeName) return completeName;
  const formName = localizedForm?.form_name?.trim();
  if (formName) return toID(formName).includes(toID(baseName)) ? formName : `${baseName} ${formName}`;

  // PokéAPI's Spanish (Spain) form-name table is incomplete for forms added
  // after its translation pass. Use official Spanish naming rules where they
  // are documented; forms without a distinct official localized name keep
  // their official Spanish species name.
  const formIdentifier = identity.pokemonFormName ?? "";
  const region = formIdentifier.match(/-(alola|galar|hisui|paldea)$/)?.[1];
  if (region) {
    const regionNames = { alola: "Alola", galar: "Galar", hisui: "Hisui", paldea: "Paldea" };
    return `${baseName} de ${regionNames[region]}`;
  }
  const mega = formIdentifier.match(/-mega(?:-([xyz]))?$/);
  if (mega) return `Mega-${baseName}${mega[1] ? ` ${mega[1].toUpperCase()}` : ""}`;
  return baseName;
}

function abilityFlavourTranslations(abilities, rows, versionGroups) {
  const versionGroupById = new Map(versionGroups.map((row) => [Number(row.id), row]));
  const scarletVioletGroups = new Set(["scarlet-violet", "the-teal-mask", "the-indigo-disk"]);
  const rowsForAbility = new Map();
  for (const row of rows) {
    const languageId = Number(row.language_id);
    if (languageId !== 7 && languageId !== 9) continue;
    const group = versionGroupById.get(Number(row.version_group_id));
    if (!group || Number(group.generation_id) > 9) continue;
    const entries = rowsForAbility.get(Number(row.ability_id)) ?? [];
    entries.push({ row, group });
    rowsForAbility.set(Number(row.ability_id), entries);
  }

  const result = {};
  const missing = [];
  for (const ability of abilities) {
    const entries = rowsForAbility.get(Number(ability.id)) ?? [];
    const choose = (languageId) => {
      const candidates = entries.filter((entry) => Number(entry.row.language_id) === languageId);
      const scarletViolet = candidates.filter((entry) => scarletVioletGroups.has(entry.group.identifier));
      const preferred = scarletViolet.length ? scarletViolet : candidates.filter((entry) => Number(entry.group.generation_id) < 9);
      return preferred.sort((left, right) => Number(right.group.order) - Number(left.group.order))[0];
    };
    const english = choose(9);
    const spanish = choose(7);
    if (!english || !spanish) {
      missing.push(ability.identifier);
      continue;
    }
    result[toID(ability.identifier)] = {
      en: english.row.flavor_text.replace(/\s+/g, " ").trim(),
      esES: spanish.row.flavor_text.replace(/\s+/g, " ").trim(),
      sources: { en: english.group.identifier, esES: spanish.group.identifier }
    };
  }
  return { descriptions: result, missing };
}

const [pokemonRows, formRows, speciesRows, pokedexRows, pokedexes, languages, speciesNameRows, formNameRows,
  moveRows, moveNameRows, pokemonMoveRows, moveLearnMethodRows, machineRows, abilityRows, abilityNameRows, itemRows, itemNameRows, natureRows, natureNameRows,
  typeRows, typeNameRows, abilityFlavourRows, versionGroups, locationRows, locationNameRows, evolutionRows] = await Promise.all([
  readCsv("pokemon"), readCsv("pokemon_forms"), readCsv("pokemon_species"),
  readCsv("pokemon_dex_numbers"), readCsv("pokedexes"), readCsv("languages"),
  readCsv("pokemon_species_names"), readCsv("pokemon_form_names"),
  readCsv("moves"), readCsv("move_names"), readCsv("pokemon_moves"), readCsv("pokemon_move_methods"), readCsv("machines"), readCsv("abilities"), readCsv("ability_names"),
  readCsv("items"), readCsv("item_names"), readCsv("natures"), readCsv("nature_names"),
  readCsv("types"), readCsv("type_names"), readCsv("ability_flavor_text"), readCsv("version_groups"),
  readCsv("locations"), readCsv("location_names"), readCsv("pokemon_evolution")
]);
const englishLanguage = languages.find((row) => Number(row.id) === 9);
const spanishLanguage = languages.find((row) => Number(row.id) === 7);
const latinAmericanSpanish = languages.find((row) => Number(row.id) === 14);
if (englishLanguage?.identifier !== "en" || spanishLanguage?.identifier !== "es" || spanishLanguage?.iso3166 !== "es" || latinAmericanSpanish?.identifier !== "es-419") {
  throw new Error("Pinned PokéAPI language IDs do not match English, Spain Spanish, and Latin American Spanish expectations");
}
const pokemonById = new Map(pokemonRows.map((row) => [Number(row.id), row]));
const speciesById = new Map(speciesRows.map((row) => [Number(row.id), row]));
const pokemonFormsByIdentifier = new Map(formRows.map((row) => [row.identifier, row]));
const pokemonFormByPokemonId = new Map(formRows.map((row) => [Number(row.pokemon_id), row]));
const nationalDexId = Number(pokedexes.find((row) => row.identifier === "national")?.id);
const nationalNumberBySpecies = new Map(pokedexRows
  .filter((row) => Number(row.pokedex_id) === nationalDexId)
  .map((row) => [Number(row.species_id), Number(row.pokedex_number)]));
const gen = Generations.get(9);
const entries = {};
const unresolved = [];

for (const species of [...gen.species].sort((left, right) => left.name.localeCompare(right.name))) {
  const key = toID(species.name);
  const exactPokemonName = curatedAliases[key];
  const matchingPokemon = pokemonRows
    .filter((row) => exactPokemonName ? row.identifier === exactPokemonName : toID(row.identifier) === key)
    .sort((left, right) => Number(right.is_default) - Number(left.is_default) || Number(left.id) - Number(right.id))[0];

  let identity;
  if (matchingPokemon) {
    const form = formRows.find((row) => Number(row.pokemon_id) === Number(matchingPokemon.id) && row.identifier === matchingPokemon.identifier)
      ?? pokemonFormByPokemonId.get(Number(matchingPokemon.id));
    identity = {
      pokemonId: Number(matchingPokemon.id),
      pokemonName: matchingPokemon.identifier,
      pokemonIsDefault: matchingPokemon.is_default === "1",
      pokemonFormId: form ? Number(form.id) : null,
      pokemonFormName: form?.identifier ?? null,
      pokemonFormIsDefault: form?.is_default === "1",
      speciesId: Number(matchingPokemon.species_id),
      evolutionChainId: Number(speciesById.get(Number(matchingPokemon.species_id))?.evolution_chain_id) || null,
      spriteStems: [String(matchingPokemon.id)],
      spriteFormNames: form?.form_identifier ? [form.form_identifier] : [],
      isMega: Boolean(form && form.is_mega === "1")
    };
  } else {
    const matchingForm = exactPokemonName
      ? pokemonFormsByIdentifier.get(exactPokemonName)
      : formRows.find((row) => toID(row.identifier) === key);
    const parent = matchingForm && pokemonById.get(Number(matchingForm.pokemon_id));
    if (matchingForm && parent) {
      const formIdentifier = matchingForm.form_identifier || matchingForm.identifier;
      identity = {
        pokemonId: Number(parent.id),
        pokemonName: parent.identifier,
        pokemonIsDefault: parent.is_default === "1",
        pokemonFormId: Number(matchingForm.id),
        pokemonFormName: matchingForm.identifier,
        pokemonFormIsDefault: matchingForm.is_default === "1",
        speciesId: Number(parent.species_id),
        evolutionChainId: Number(speciesById.get(Number(parent.species_id))?.evolution_chain_id) || null,
        spriteStems: [matchingForm.form_identifier ? `${parent.id}-${formIdentifier}` : String(parent.id)],
        spriteFormNames: [matchingForm.identifier],
        isMega: matchingForm.is_mega === "1"
      };
    }
  }

  const isOgerponTera = /^Ogerpon-(Teal|Wellspring|Hearthflame|Cornerstone)-Tera$/.test(species.name);
  if (!identity && isOgerponTera) {
    const base = pokemonRows.find((row) => row.identifier === "ogerpon");
    const speciesRow = base && speciesById.get(Number(base.species_id));
    identity = {
      pokemonId: null, pokemonName: null, pokemonIsDefault: false,
      pokemonFormId: null, pokemonFormName: null, pokemonFormIsDefault: false,
      speciesId: base ? Number(base.species_id) : null,
      evolutionChainId: Number(speciesRow?.evolution_chain_id) || null,
      spriteStems: [], spriteFormNames: [], isMega: false
    };
  }

  const eligible = Boolean(identity);
  if (!eligible) unresolved.push(species.name);
  const baseKey = toID(species.baseSpecies ?? species.name);
  entries[key] = {
    eligible,
    ...(identity ?? {
      pokemonId: null, pokemonName: null, pokemonIsDefault: false,
      pokemonFormId: null, pokemonFormName: null, pokemonFormIsDefault: false,
      speciesId: null, evolutionChainId: null, spriteStems: [], spriteFormNames: [], isMega: false
    }),
    baseKey,
    nationalDexId: identity?.speciesId ? nationalNumberBySpecies.get(identity.speciesId) ?? 0 : 0,
    pokedexSlug: slugify(species.name),
    pokedexIsBaseForm: species.name === (species.baseSpecies ?? species.name)
  };
}

const eligibleCount = Object.values(entries).filter((entry) => entry.eligible).length;
const missingNationalNumbers = Object.entries(entries).filter(([, entry]) => entry.eligible && !entry.nationalDexId).map(([key]) => key);
if (eligibleCount !== 1324) {
  throw new Error(`Identity manifest audit expected 1324 official entries, found ${eligibleCount}; unresolved: ${unresolved.join(", ")}`);
}
if (missingNationalNumbers.length) {
  throw new Error(`Identity manifest has official entries without a National Dex number: ${missingNationalNumbers.join(", ")}`);
}
const slugs = new Map();
const duplicateSlugs = [];
for (const [key, identity] of Object.entries(entries).filter(([, entry]) => entry.eligible)) {
  const previous = slugs.get(identity.pokedexSlug);
  if (previous) duplicateSlugs.push(`${identity.pokedexSlug}: ${previous}, ${key}`);
  slugs.set(identity.pokedexSlug, key);
}
if (duplicateSlugs.length) throw new Error(`Pokédex URL slug collisions: ${duplicateSlugs.join("; ")}`);

const speciesNamesById = localizedNames(speciesNameRows, "pokemon_species_id", 7);
const formsById = new Map(formNameRows
  .filter((row) => Number(row.local_language_id) === 7)
  .map((row) => [Number(row.pokemon_form_id), row]));
const pokemonTranslations = { species: {}, moves: {}, abilities: {}, items: {}, types: {}, natures: {} };
const missingSpeciesTranslations = [];
for (const species of gen.species) {
  const identity = entries[toID(species.name)];
  if (!identity?.eligible) continue;
  const localized = pokemonSpanishName(identity, species.name, speciesNamesById, formsById);
  if (!localized) {
    missingSpeciesTranslations.push(`${species.name} (species ${identity.speciesId}, form ${identity.pokemonFormId})`);
    continue;
  }
  pokemonTranslations.species[toID(species.name)] = localized;
}
if (missingSpeciesTranslations.length) {
  throw new Error(`Official Spain Spanish species/form names missing: ${missingSpeciesTranslations.join(", ")}`);
}

const moveAliases = { visegrip: "vice-grip" };
const aliases = { moves: moveAliases };
const simulatorOnlyMoves = ["(No Move)", "Paleo Wave", "Polar Flare", "Shadow Strike", ...[...gen.moves].map((move) => move.name).filter((name) => name.startsWith("Hidden Power "))];
const abilityAliases = Object.fromEntries([
  "Embody Aspect (Cornerstone)", "Embody Aspect (Hearthflame)", "Embody Aspect (Teal)", "Embody Aspect (Wellspring)"
].map((name) => [toID(name), "embody-aspect"]));
const abilityNameExemptions = ["Mountaineer", "Persistent", "Rebound"];
const abilityCoverageExceptions = [
  { name: "Mountaineer", reason: "Smogon CAP-only custom ability; not an official Pokémon ability." },
  { name: "Persistent", reason: "No official name rows in the pinned PokéAPI revision; retained as an unmapped calculator catalog entry." },
  { name: "Rebound", reason: "No official name rows in the pinned PokéAPI revision; retained as an unmapped calculator catalog entry." }
];
// PokéAPI lacks language-7 rows for these used evolution locations. Names are
// the in-game Spain Spanish names; source pages are recorded in the manifest.
const officialEvolutionLocationOverrides = {
  mtcoronet: "Monte Corona",
  eternaforest: "Bosque Vetusto",
  sinnohroute217: "Ruta 217",
  chargestonecave: "Cueva Electrorroca",
  pinwheelforest: "Bosque Azulejo",
  twistmountain: "Monte Tuerca",
  dustybowl: "Cuenca Polvorienta"
};
const itemNameExemptions = ["Crucibellite", "Vile Vial"];
const itemCoverageExceptions = [
  { name: "Crucibellite", reason: "Smogon CAP-only custom item; not an official Pokémon item." },
  { name: "Vile Vial", reason: "Smogon CAP-only custom item; not an official Pokémon item." }
];
const officialAbilityNameOverrides = { auraguard: "Aura Protectora", eelevate: "Impulso Anguila", firemane: "Crin de Fuego" };
const officialMoveNameOverrides = {
  "gmaxwildfire": "Gigallamarada", "gmaxbefuddle": "Gigaestupor", "gmaxvoltcrash": "Gigatronada",
  "gmaxgoldrush": "Gigamonedas", "gmaxchistrike": "Gigapuñición", "gmaxterror": "Gigaaparición",
  "gmaxresonance": "Gigamelodía", "gmaxcuddle": "Gigaternura", "gmaxreplenish": "Gigarreciclaje",
  "gmaxmalodor": "Gigapestilencia", "gmaxstonesurge": "Gigatrampa Rocas", "gmaxwindrage": "Gigahuracán",
  "gmaxstunshock": "Gigadescarga", "gmaxfinale": "Gigacolofón", "gmaxdepletion": "Gigadesgaste",
  "gmaxgravitas": "Gigabóveda", "gmaxvolcalith": "Gigarroca Ígnea", "gmaxsandblast": "Gigapolvareda",
  "gmaxsnooze": "Gigasopor", "gmaxtartness": "Gigacorrosión", "gmaxsweetness": "Giganéctar",
  "gmaxsmite": "Gigacastigo", "gmaxsteelsurge": "Gigatrampa Acero", "gmaxmeltdown": "Gigafundido",
  "gmaxfoamburst": "Gigaespuma", "gmaxcentiferno": "Gigacienfuegos", "gmaxvinelash": "Gigalianas",
  "gmaxcannonade": "Gigacañonazo", "gmaxdrumsolo": "Gigarredoble", "gmaxfireball": "Gigaesfera Ígnea",
  "gmaxhydrosnipe": "Gigadisparo", "gmaxoneblow": "Gigagolpe Brusco", "gmaxrapidflow": "Gigagolpe Fluido",
  "nihillight": "Luz Devastadora"
};
const officialItemNameOverrides = {
  "aloraichiumz": "Alo-Raistal Z", "buginiumz": "Insectostal Z", "darkiniumz": "Nictostal Z",
  "decidiumz": "Dueyestal Z", "dragoniumz": "Dracostal Z", "eeviumz": "Eeveestal Z",
  "electriumz": "Electrostal Z", "fairiumz": "Feeristal Z", "fightiniumz": "Lizastal Z",
  "firiumz": "Pirostal Z", "flyiniumz": "Aerostal Z", "ghostiumz": "Espectrostal Z",
  "grassiumz": "Fitostal Z", "groundiumz": "Geostal Z", "iciumz": "Criostal Z",
  "inciniumz": "Incinostal Z", "kommoniumz": "Kommostal Z", "lunaliumz": "Lunalastal Z",
  "lycaniumz": "Lycanrostal Z", "marshadiumz": "Marshastal Z", "mewniumz": "Mewstal Z",
  "mimikiumz": "Mimikyustal Z", "normaliumz": "Normastal Z", "pikaniumz": "Pikastal Z",
  "pikashuniumz": "Ash-Pikastal Z", "poisoniumz": "Toxistal Z", "primariumz": "Primastal Z",
  "psychiumz": "Psicostal Z", "rockiumz": "Litostal Z", "snorliumz": "Snorlastal Z",
  "solganiumz": "Solgaleostal Z", "steeliumz": "Metalostal Z", "tapuniumz": "Tapistal Z",
  "ultranecroziumz": "Ultranecrostal Z", "wateriumz": "Hidrostal Z",
  "prettyfeather": "Pluma Bella", leek: "Puerro", berry: "Baya", berserkgene: "Gen Loco",
  bitterberry: "Bayamarga", burntberry: "Antiquembaya", iceberry: "Baya Hielo", mintberry: "Baya Menta",
  miracleberry: "Baya Milagro", mysteryberry: "Baya Misterio", przcureberry: "Antiparabaya",
  goldberry: "Baya Dorada", pinkbow: "Lazo Rosa", polkadotbow: "Cintalunares", psncureberry: "Bayantídoto",
  mail: "Carta"
};
pokemonTranslations.moves = canonicalResourceNames([...gen.moves].map((move) => move.name), moveRows, moveNameRows, "move_id", aliases.moves, simulatorOnlyMoves, officialMoveNameOverrides);
const abilityNames = [...gen.abilities].map((ability) => ability.name);
pokemonTranslations.abilities = canonicalResourceNames(abilityNames, abilityRows, abilityNameRows, "ability_id", abilityAliases, abilityNameExemptions, officialAbilityNameOverrides);
pokemonTranslations.items = canonicalResourceNames([...gen.items].map((item) => item.name), itemRows, itemNameRows, "item_id", aliases.items, itemNameExemptions, officialItemNameOverrides);
pokemonTranslations.types = canonicalResourceNames([...gen.types].map((type) => type.name).filter((name) => name !== "???"), typeRows, typeNameRows, "type_id", aliases.types);
pokemonTranslations.natures = canonicalResourceNames([...gen.natures].map((nature) => nature.name), natureRows, natureNameRows, "nature_id", aliases.natures);

const scarletVioletVersionGroup = versionGroups.find((group) => group.identifier === "scarlet-violet");
if (!scarletVioletVersionGroup) throw new Error("Pinned PokéAPI revision is missing the Scarlet/Violet version group");
const scarletVioletVersionGroupId = Number(scarletVioletVersionGroup.id);
const pokemonIdsBySpecies = new Map();
for (const [speciesKey, identity] of Object.entries(entries)) {
  if (!identity.eligible || !identity.pokemonId) continue;
  const speciesKeys = pokemonIdsBySpecies.get(identity.pokemonId) ?? [];
  speciesKeys.push(speciesKey);
  pokemonIdsBySpecies.set(identity.pokemonId, speciesKeys);
}
const moveRowsById = new Map(moveRows.map((row) => [Number(row.id), row]));
const methodsById = new Map(moveLearnMethodRows.map((row) => [Number(row.id), row.identifier]));
const machineNumbersByMoveId = new Map();
for (const row of machineRows) {
  if (Number(row.version_group_id) !== scarletVioletVersionGroupId) continue;
  const moveId = Number(row.move_id);
  const machineNumber = Number(row.machine_number);
  if (!Number.isInteger(machineNumber) || machineNumber <= 0) continue;
  const numbers = machineNumbersByMoveId.get(moveId) ?? new Set();
  numbers.add(machineNumber);
  machineNumbersByMoveId.set(moveId, numbers);
}
const moveTypesById = new Map(typeRows.map((row) => [Number(row.id), gen.types.get(toID(row.identifier))?.name ?? null]));
const englishMoveNamesById = localizedNames(moveNameRows, "move_id", 9);
const spanishMoveNamesById = localizedNames(moveNameRows, "move_id", 7);
const learnsetsBySpecies = new Map();
const moveMetadataById = new Map();
const unsupportedMoveRows = [];
const missingSpanishMoveNames = new Set();
const missingMachineNumbers = new Set();

for (const row of pokemonMoveRows) {
  if (Number(row.version_group_id) !== scarletVioletVersionGroupId) continue;
  const speciesKeys = pokemonIdsBySpecies.get(Number(row.pokemon_id));
  if (!speciesKeys?.length) continue;

  const moveResource = moveRowsById.get(Number(row.move_id));
  const method = methodsById.get(Number(row.pokemon_move_method_id));
  if (!moveResource || !method) {
    unsupportedMoveRows.push({ pokemonId: Number(row.pokemon_id), moveId: Number(row.move_id), methodId: Number(row.pokemon_move_method_id) });
    continue;
  }

  const calcMove = gen.moves.get(toID(moveResource.identifier));
  const englishMoveName = englishMoveNamesById.get(Number(moveResource.id));
  const spanishMoveName = spanishMoveNamesById.get(Number(moveResource.id));
  const name = calcMove?.name ?? englishMoveName;
  if (!name) {
    unsupportedMoveRows.push({ pokemonId: Number(row.pokemon_id), moveId: Number(row.move_id), methodId: Number(row.pokemon_move_method_id) });
    continue;
  }
  if (!pokemonTranslations.moves[toID(name)] && spanishMoveName) pokemonTranslations.moves[toID(name)] = spanishMoveName;
  if (!pokemonTranslations.moves[toID(name)] && !spanishMoveName) missingSpanishMoveNames.add(name);

  const methodId = Number(row.pokemon_move_method_id);
  const sourceLevel = Number(row.level);
  const acquisition = method === "level-up" && sourceLevel >= 0 ? [methodId, sourceLevel] : [methodId];
  const moveType = moveTypesById.get(Number(moveResource.type_id)) ?? null;
  const category = ({ "1": "status", "2": "physical", "3": "special" })[moveResource.damage_class_id] ?? null;
  const machineNumbers = [...(machineNumbersByMoveId.get(Number(moveResource.id)) ?? [])].sort((left, right) => left - right);
  if (method === "machine" && machineNumbers.length === 0) missingMachineNumbers.add(name);
  moveMetadataById.set(Number(moveResource.id), [name, moveType, category, machineNumbers]);

  for (const speciesKey of speciesKeys) {
    const learnset = learnsetsBySpecies.get(speciesKey) ?? new Map();
    const acquisitions = learnset.get(Number(moveResource.id)) ?? [];
    if (!acquisitions.some((current) => current.length === acquisition.length && current.every((part, index) => part === acquisition[index]))) acquisitions.push(acquisition);
    learnset.set(Number(moveResource.id), acquisitions);
    learnsetsBySpecies.set(speciesKey, learnset);
  }
}

if (unsupportedMoveRows.length) {
  throw new Error(`Scarlet/Violet learnsets contain ${unsupportedMoveRows.length} rows with unrecognized move or acquisition-method identifiers`);
}
if (missingSpanishMoveNames.size) {
  throw new Error(`Scarlet/Violet learnset moves are missing official Spain Spanish labels: ${[...missingSpanishMoveNames].join(", ")}`);
}
if (missingMachineNumbers.size) {
  throw new Error(`Scarlet/Violet machine-acquired moves are missing machine numbers: ${[...missingMachineNumbers].join(", ")}`);
}
const scarletVioletLearnsets = Object.fromEntries([...learnsetsBySpecies.entries()]
  .map(([speciesKey, learnset]) => [speciesKey, [...learnset.entries()]
    .map(([moveId, acquisitions]) => [moveId, acquisitions.sort((left, right) => left[0] - right[0] || (left[1] ?? -1) - (right[1] ?? -1))])
    .sort(([left], [right]) => left - right)])
  .sort(([left], [right]) => left.localeCompare(right)));
const scarletVioletMoves = Object.fromEntries([...moveMetadataById.entries()].sort(([left], [right]) => left - right));
const moveMethods = Object.fromEntries([...methodsById.entries()].sort(([left], [right]) => left - right));
const moveLearnsetSource = {
  provider: "PokéAPI",
  repository: "https://github.com/PokeAPI/pokeapi",
  revision: POKEAPI_REVISION,
  versionGroup: "scarlet-violet",
  versionGroupId: scarletVioletVersionGroupId,
  includedVersionGroups: ["scarlet-violet"],
  excludedVersionGroups: ["the-teal-mask", "the-indigo-disk"]
};
const moveLearnsetSnapshot = {
  source: moveLearnsetSource,
  coverage: {
    availableSpecies: Object.keys(scarletVioletLearnsets).length,
    unavailableSpecies: eligibleCount - Object.keys(scarletVioletLearnsets).length
  },
  methods: moveMethods,
  moves: scarletVioletMoves,
  entries: scarletVioletLearnsets
};

const sourceFiles = [
  "data/v2/csv/pokemon.csv", "data/v2/csv/pokemon_forms.csv", "data/v2/csv/pokemon_species.csv",
  "data/v2/csv/pokemon_dex_numbers.csv", "data/v2/csv/pokedexes.csv", "data/v2/csv/languages.csv",
  "data/v2/csv/pokemon_species_names.csv", "data/v2/csv/pokemon_form_names.csv",
  "data/v2/csv/moves.csv", "data/v2/csv/move_names.csv", "data/v2/csv/pokemon_moves.csv",
  "data/v2/csv/pokemon_move_methods.csv", "data/v2/csv/machines.csv", "data/v2/csv/abilities.csv",
  "data/v2/csv/ability_names.csv", "data/v2/csv/ability_flavor_text.csv", "data/v2/csv/version_groups.csv",
  "data/v2/csv/items.csv", "data/v2/csv/item_names.csv", "data/v2/csv/natures.csv",
  "data/v2/csv/nature_names.csv", "data/v2/csv/types.csv", "data/v2/csv/type_names.csv",
  "data/v2/csv/locations.csv", "data/v2/csv/location_names.csv", "data/v2/csv/pokemon_evolution.csv"
];
const abilityResourcesById = new Map(abilityNames.map((name) => {
  const key = toID(name);
  const identifier = abilityAliases[key] ?? key;
  const resource = abilityRows.find((row) => toID(row.identifier) === toID(identifier));
  return resource ? [Number(resource.id), resource] : [];
}));
const abilityResources = [...abilityResourcesById.values()].filter(Boolean);
const abilityFlavorResult = abilityFlavourTranslations(abilityResources, abilityFlavourRows, versionGroups);
const abilityDescriptions = abilityFlavorResult.descriptions;
const unavailableAbilityDescriptions = [
  ...abilityNames
  .filter((name) => name !== "Mountaineer" && !abilityResources.some((ability) => toID(ability.identifier) === toID(abilityAliases[toID(name)] ?? name)))
  .map((name) => ({ name, reason: "No official bilingual ability resource is present in the pinned PokéAPI revision." })),
  ...abilityFlavorResult.missing.map((identifier) => ({
    name: abilityResources.find((ability) => toID(ability.identifier) === identifier)?.identifier ?? identifier,
    reason: "No bilingual game flavor text is present for Scarlet/Violet or an earlier version group in the pinned PokéAPI revision."
  }))
];
const datasetSource = {
  repository: "https://github.com/PokeAPI/pokeapi",
  revision: POKEAPI_REVISION,
  languageIds: { en: 9, esES: 7, es419Excluded: 14 },
  files: sourceFiles,
  namingReferences: [
    "https://assets.pokemon.com/assets/cms2-es-es/pdf/trading-card-game/rulebook/svi_rulebook_es.pdf",
    "https://legends.pokemon.com/es-es/mega-pokemon",
    "https://www.wikidex.net/wiki/Lista_de_movimientos",
    "https://www.wikidex.net/wiki/Lista_de_habilidades_en_todos_los_idiomas",
    "https://www.wikidex.net/wiki/Lista_de_objetos_en_todos_los_idiomas?oldid=3554608",
    "https://www.wikidex.net/wiki/Baya",
    "https://www.wikidex.net/wiki/Cintalunares",
    "https://bulbapedia.bulbagarden.net/wiki/Berserk_Gene",
    "https://www.wikidex.net/wiki/Aura_Guard?mobileaction=toggle_view_mobile",
    "https://www.wikidex.net/wiki/Eelevate_%28habilidad%29",
    "https://www.wikidex.net/wiki/Crin_de_Fuego",
    "https://www.wikidex.net/wiki/Monte_Corona",
    "https://www.wikidex.net/wiki/Bosque_Eterna",
    "https://www.wikidex.net/wiki/Ruta_217",
    "https://www.wikidex.net/wiki/Chargestone_Cave",
    "https://www.wikidex.net/wiki/Pinwheel_Forest",
    "https://www.wikidex.net/wiki/Monte_tuerca",
    "https://www.wikidex.net/wiki/Dusty_Bowl"
  ],
  officialMoveOverrideKeys: Object.keys(officialMoveNameOverrides),
  officialItemOverrideKeys: Object.keys(officialItemNameOverrides),
  officialAbilityOverrideKeys: Object.keys(officialAbilityNameOverrides),
  officialEvolutionLocationOverrideKeys: Object.keys(officialEvolutionLocationOverrides),
  abilityFlavorTextCoverage: { available: Object.keys(abilityDescriptions).length, unavailable: unavailableAbilityDescriptions.length },
  formFallbackPolicy: "Prefer PokéAPI language 7 form labels. For missing labels use documented Spain Spanish regional and Mega naming; otherwise retain the official localized species name.",
  battleCatalog: "@smogon/calc 0.12.0 Generation 9",
  moveLearnsets: moveLearnsetSource
};
const translationsManifest = {
  version: 1,
  source: datasetSource,
  exemptions: { moves: simulatorOnlyMoves, abilities: abilityCoverageExceptions, items: itemCoverageExceptions },
  unavailableAbilityDescriptions,
  coverage: Object.fromEntries(Object.entries(pokemonTranslations).map(([category, translations]) => [category, Object.keys(translations).length])),
  catalog: pokemonTranslations,
  evolutionLocations: (() => {
    const names = { en: localizedNames(locationNameRows, "location_id", 9), esES: localizedNames(locationNameRows, "location_id", 7) };
    const byId = new Map(locationRows.map((row) => [Number(row.id), row.identifier]));
    const usedIds = new Set(evolutionRows.map((row) => Number(row.location_id)).filter((id) => Number.isInteger(id) && id > 0));
    const result = { en: {}, esES: {} };
    const unavailable = [];
    for (const id of usedIds) {
      const identifier = byId.get(id);
      if (!identifier) continue;
      const english = names.en.get(id);
      const spanish = names.esES.get(id) ?? officialEvolutionLocationOverrides[toID(identifier)];
      if (!english || !spanish) {
        unavailable.push({ identifier, missing: [!english && "en", !spanish && "es-ES"].filter(Boolean) });
        continue;
      }
      result.en[toID(identifier)] = english;
      result.esES[toID(identifier)] = spanish;
    }
    return { labels: result, unavailable };
  })()
};

const manifest = {
  version: 1,
  source: {
    repository: "https://github.com/PokeAPI/pokeapi",
    revision: POKEAPI_REVISION,
    files: sourceFiles,
    battleCatalog: "@smogon/calc 0.12.0 Generation 9"
  },
  curatedAliases,
  entries
};
const target = resolve(import.meta.dirname, "../src/modules/catalog/pokedex-identities.json");
await writeFile(target, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
const translationsTarget = resolve(import.meta.dirname, "../src/modules/catalog/pokemon-translations.generated.json");
await writeFile(translationsTarget, `${JSON.stringify(translationsManifest, null, 2)}\n`, "utf8");
const abilityDescriptionsTarget = resolve(import.meta.dirname, "../src/modules/catalog/ability-descriptions.generated.json");
await writeFile(abilityDescriptionsTarget, `${JSON.stringify({ source: datasetSource, descriptions: abilityDescriptions, unavailable: unavailableAbilityDescriptions }, null, 2)}\n`, "utf8");
const moveLearnsetsTarget = resolve(import.meta.dirname, "../src/modules/catalog/pokemon-moves.generated.json");
await writeFile(moveLearnsetsTarget, `${JSON.stringify(moveLearnsetSnapshot)}\n`, "utf8");
globalThis.console.log(`Wrote ${eligibleCount} eligible identities, ${Object.keys(pokemonTranslations.species).length} official species/form labels, six complete name catalogs, ${Object.keys(abilityDescriptions).length} bilingual ability descriptions, and Scarlet/Violet learnsets for ${moveLearnsetSnapshot.coverage.availableSpecies} species/forms (${moveLearnsetSnapshot.coverage.unavailableSpecies} unavailable).`);
