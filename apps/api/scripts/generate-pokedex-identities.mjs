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

const [pokemonRows, formRows, speciesRows, pokedexRows, pokedexes] = await Promise.all([
  readCsv("pokemon"), readCsv("pokemon_forms"), readCsv("pokemon_species"),
  readCsv("pokemon_dex_numbers"), readCsv("pokedexes")
]);
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
    nationalDexId: identity?.speciesId ? nationalNumberBySpecies.get(identity.speciesId) ?? 0 : 0
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
const manifest = {
  version: 1,
  source: {
    repository: "https://github.com/PokeAPI/pokeapi",
    revision: POKEAPI_REVISION,
    files: ["data/v2/csv/pokemon.csv", "data/v2/csv/pokemon_forms.csv", "data/v2/csv/pokemon_species.csv", "data/v2/csv/pokemon_dex_numbers.csv", "data/v2/csv/pokedexes.csv"],
    battleCatalog: "@smogon/calc 0.12.0 Generation 9"
  },
  curatedAliases,
  entries
};
const target = resolve(import.meta.dirname, "../src/modules/catalog/pokedex-identities.json");
await writeFile(target, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
globalThis.console.log(`Wrote ${eligibleCount} eligible and ${unresolved.length} excluded identities to ${target}`);
