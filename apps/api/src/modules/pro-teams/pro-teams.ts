type Spread = Partial<Record<"hp" | "atk" | "def" | "spa" | "spd" | "spe", number>>;
function set(species: string, item: string, ability: string, teraType: string, nature: string, evs: Spread, moves: string[], ivs: Spread = {}) {
  return { species, item, ability, teraType, nature, evs, ivs, moves };
}

// EVs and explicit IVs transcribed from linked player PokéPastes. Missing IVs
// remain unknown; no assumption about a player's unlisted values is stored.
export const proTeams = [
  {
    id: "worlds-2024-ceribelli", player: "Luca Ceribelli", event: "2024 Pokémon World Championships",
    eventDate: "2024-08-18", placement: "Champion", format: "VGC Regulation G",
    source: { title: "Luca Ceribelli's Worlds report", url: "https://victoryroad.pro/2024/09/22/luca-ceribelli-worlds-report/", pasteUrl: "https://pokepast.es/774751c5dc2c4500" },
    sets: [
      set("Miraidon", "Choice Specs", "Hadron Engine", "Fairy", "Modest", { hp: 44, def: 4, spa: 244, spd: 12, spe: 204 }, ["Electro Drift", "Draco Meteor", "Volt Switch", "Dazzling Gleam"]),
      set("Whimsicott", "Covert Cloak", "Prankster", "Dark", "Timid", { hp: 236, spd: 164, spe: 108 }, ["Moonblast", "Tailwind", "Light Screen", "Encore"], { atk: 0 }),
      set("Urshifu-Rapid-Strike", "Focus Sash", "Unseen Fist", "Stellar", "Adamant", { atk: 252, spd: 4, spe: 252 }, ["Surging Strikes", "Close Combat", "Aqua Jet", "Protect"]),
      set("Ogerpon-Hearthflame", "Hearthflame Mask", "Mold Breaker", "Fire", "Adamant", { hp: 188, atk: 76, def: 52, spd: 4, spe: 188 }, ["Ivy Cudgel", "Wood Hammer", "Follow Me", "Spiky Shield"]),
      set("Farigiraf", "Electric Seed", "Armor Tail", "Water", "Bold", { hp: 204, def: 164, spa: 4, spd: 108, spe: 28 }, ["Foul Play", "Psychic Noise", "Trick Room", "Helping Hand"], { atk: 6 }),
      set("Iron Hands", "Assault Vest", "Quark Drive", "Bug", "Brave", { hp: 76, atk: 180, def: 12, spd: 236 }, ["Drain Punch", "Low Kick", "Wild Charge", "Fake Out"], { spe: 0 })
    ]
  },
  {
    id: "worlds-2025-brok", player: "Aaron Brok", event: "2025 Pokémon World Championships",
    eventDate: "2025-08-15", placement: "Top 16 (13th)", format: "VGC Regulation I",
    source: { title: "Aaron Brok's Worlds report", url: "https://victoryroad.pro/2025/10/31/aaron-brok-worlds/", pasteUrl: "https://pokepast.es/e7a476940e468a9d" },
    sets: [
      set("Calyrex-Shadow", "Focus Sash", "As One (Spectrier)", "Ghost", "Timid", { def: 4, spa: 252, spe: 252 }, ["Psychic", "Astral Barrage", "Encore", "Protect"], { atk: 1 }),
      set("Zamazenta-Crowned", "Rusted Shield", "Dauntless Shield", "Dragon", "Careful", { hp: 164, atk: 4, def: 172, spd: 76, spe: 92 }, ["Body Press", "Iron Head", "Wide Guard", "Protect"], { spa: 30 }),
      set("Chien-Pao", "Assault Vest", "Sword of Ruin", "Poison", "Jolly", { hp: 220, spd: 36, spe: 252 }, ["Ice Spinner", "Ruination", "Ice Shard", "Sucker Punch"], { spa: 15 }),
      set("Raging Bolt", "Booster Energy", "Protosynthesis", "Electric", "Modest", { hp: 148, def: 60, spa: 180, spd: 4, spe: 116 }, ["Thunderbolt", "Thunderclap", "Dragon Pulse", "Protect"], { atk: 20 }),
      set("Ogerpon-Cornerstone", "Cornerstone Mask", "Sturdy", "Rock", "Adamant", { hp: 252, atk: 28, def: 52, spd: 4, spe: 172 }, ["Ivy Cudgel", "Taunt", "Follow Me", "Spiky Shield"], { spa: 20 }),
      set("Amoonguss", "Rocky Helmet", "Regenerator", "Fairy", "Bold", { hp: 244, def: 236, spd: 28 }, ["Sludge Bomb", "Spore", "Rage Powder", "Protect"], { atk: 0, spe: 27 })
    ]
  }
];
