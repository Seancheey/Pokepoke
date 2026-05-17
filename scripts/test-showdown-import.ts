/**
 * Integration test for the Showdown importer. Loads real slug sets out of
 * Prisma so it catches any species/move/ability/item that doesn't slug to
 * the value we have in the DB.
 *
 * Run: `npx tsx scripts/test-showdown-import.ts`
 */

import { prisma } from "../src/lib/db";
import {
  parseShowdownText,
  convertEvToSp,
  extractPokePasteId,
  type LookupSets,
} from "../src/lib/showdown-import";

type Case = {
  name: string;
  input: string;
  expect?: {
    slotCount?: number;
    firstSlot?: {
      s?: string;
      a?: string;
      i?: string;
      m?: string[];
      n?: string;
      t?: string;
    };
    warningKinds?: string[];
  };
};

const CASES: Case[] = [
  {
    name: "Classic Garchomp — no nickname, no gender",
    input: `Garchomp @ Choice Scarf
Ability: Rough Skin
Level: 50
Tera Type: Steel
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Earthquake
- Dragon Claw
- Stone Edge
- Fire Fang`,
    expect: {
      slotCount: 1,
      firstSlot: {
        s: "garchomp",
        a: "rough-skin",
        i: "choice-scarf",
        m: ["earthquake", "dragon-claw", "stone-edge", "fire-fang"],
        n: "Jolly",
        t: "steel",
      },
    },
  },
  {
    name: "Indeedee-F → indeedee-female override",
    input: `Indeedee-F @ Psychic Seed
Ability: Psychic Surge
Level: 50
Tera Type: Fairy
EVs: 252 HP / 4 Def / 252 SpD
Calm Nature
IVs: 0 Atk
- Follow Me
- Helping Hand
- Trick Room
- Dazzling Gleam`,
    expect: {
      slotCount: 1,
      firstSlot: {
        s: "indeedee-female",
        a: "psychic-surge",
        i: "psychic-seed",
        n: "Calm",
        t: "fairy",
      },
      warningKinds: ["iv-ignored"],
    },
  },
  {
    name: "Ogerpon-Wellspring with nickname + gender",
    input: `Splash Daddy (Ogerpon-Wellspring) (F) @ Wellspring Mask
Ability: Water Absorb
Level: 50
Tera Type: Water
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Ivy Cudgel
- Horn Leech
- Spiky Shield
- U-turn`,
    expect: {
      slotCount: 1,
      firstSlot: {
        s: "ogerpon-wellspring-mask",
        a: "water-absorb",
        i: "wellspring-mask",
        m: ["ivy-cudgel", "horn-leech", "spiky-shield", "u-turn"],
        n: "Jolly",
        t: "water",
      },
    },
  },
  {
    name: "Tauros-Paldea-Combat → -combat-breed override",
    input: `Tauros-Paldea-Combat @ Choice Band
Ability: Intimidate
Level: 50
Tera Type: Fighting
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Close Combat
- Headlong Rush
- Rock Slide
- Body Press`,
    expect: {
      slotCount: 1,
      firstSlot: {
        s: "tauros-paldea-combat-breed",
        a: "intimidate",
        i: "choice-band",
        n: "Jolly",
        t: "fighting",
      },
    },
  },
  {
    name: "Farfetch'd-Galar with apostrophe stripping",
    input: `Farfetch'd-Galar @ Leek
Ability: Scrappy
Level: 50
Tera Type: Fighting
EVs: 252 Atk / 4 SpD / 252 Spe
Adamant Nature
- Brave Bird
- Close Combat
- Knock Off
- Defog`,
    expect: {
      slotCount: 1,
      firstSlot: {
        s: "farfetchd-galar",
        a: "scrappy",
        i: "stick", // Showdown's "Leek" → our pre-rename slug "stick"
        n: "Adamant",
        t: "fighting",
      },
    },
  },
  {
    name: "Mr. Mime base — period stripping",
    input: `Mr. Mime @ Eviolite
Ability: Vital Spirit
- Fake Out
- Trick Room
- Psychic
- Protect`,
    expect: {
      slotCount: 1,
      firstSlot: {
        s: "mr-mime",
        a: "vital-spirit",
        i: "eviolite",
      },
    },
  },
  {
    name: "Oversized EV trim — 252/252/252 totals get clamped to 66",
    input: `Iron Hands @ Assault Vest
Ability: Quark Drive
Level: 50
Tera Type: Grass
EVs: 252 HP / 252 Atk / 252 SpD
Adamant Nature
- Drain Punch
- Wild Charge
- Heavy Slam
- Ice Punch`,
    expect: {
      slotCount: 1,
      firstSlot: {
        s: "iron-hands",
        a: "quark-drive",
        i: "assault-vest",
        n: "Adamant",
      },
      warningKinds: ["ev-trimmed"],
    },
  },
  {
    name: "Indeedee-M plus minimal block (no item, no nature)",
    input: `Indeedee-M
Ability: Psychic Surge
- Expanding Force
- Psyshock
- Dazzling Gleam
- Trick Room`,
    expect: {
      slotCount: 1,
      firstSlot: { s: "indeedee-male" },
    },
  },
  {
    name: "Full 6-mon paste",
    input: `Garchomp @ Choice Scarf
Ability: Rough Skin
Level: 50
Tera Type: Steel
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Earthquake
- Dragon Claw
- Stone Edge
- Fire Fang

Iron Hands @ Assault Vest
Ability: Quark Drive
Level: 50
Tera Type: Grass
EVs: 252 HP / 196 Atk / 60 SpD
Adamant Nature
- Drain Punch
- Wild Charge
- Heavy Slam
- Fake Out

Flutter Mane @ Life Orb
Ability: Protosynthesis
Level: 50
Tera Type: Fairy
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
IVs: 0 Atk
- Moonblast
- Shadow Ball
- Dazzling Gleam
- Protect

Amoonguss @ Rocky Helmet
Ability: Regenerator
Level: 50
Tera Type: Water
EVs: 244 HP / 92 Def / 172 SpD
Sassy Nature
IVs: 0 Atk / 0 Spe
- Spore
- Rage Powder
- Pollen Puff
- Protect

Rillaboom @ Miracle Seed
Ability: Grassy Surge
Level: 50
Tera Type: Fire
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Wood Hammer
- Fake Out
- Grassy Glide
- U-turn

Urshifu-Rapid-Strike @ Mystic Water
Ability: Unseen Fist
Level: 50
Tera Type: Water
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Surging Strikes
- Close Combat
- Aqua Jet
- Detect`,
    expect: { slotCount: 6 },
  },
  {
    name: "Unknown species emits warning + skips slot",
    input: `MissingNo @ Choice Specs
Ability: Levitate
- Hyper Beam`,
    expect: { slotCount: 0, warningKinds: ["unknown-species"] },
  },
];

function deepEqualSubset(obj: any, expected: any): boolean {
  for (const k of Object.keys(expected)) {
    const a = obj?.[k];
    const b = expected[k];
    if (Array.isArray(b)) {
      if (!Array.isArray(a)) return false;
      if (a.length !== b.length) return false;
      for (let i = 0; i < b.length; i++) if (a[i] !== b[i]) return false;
    } else if (a !== b) {
      return false;
    }
  }
  return true;
}

async function buildLookup(): Promise<LookupSets> {
  const [species, moves, abilities, items] = await Promise.all([
    prisma.pokemon.findMany({
      select: {
        slug: true,
        abilities: true,
        hiddenAbility: true,
        learnableMoves: true,
      },
    }),
    prisma.move.findMany({ select: { slug: true } }),
    prisma.ability.findMany({ select: { slug: true } }),
    prisma.item.findMany({ select: { slug: true } }),
  ]);

  const learnableBySpecies = new Map<string, Set<string>>();
  const validAbilitiesBySpecies = new Map<string, Set<string>>();
  for (const p of species) {
    try {
      learnableBySpecies.set(p.slug, new Set(JSON.parse(p.learnableMoves) as string[]));
    } catch {
      learnableBySpecies.set(p.slug, new Set());
    }
    const abs = new Set<string>();
    try {
      for (const a of JSON.parse(p.abilities) as string[]) abs.add(a);
    } catch {}
    if (p.hiddenAbility) abs.add(p.hiddenAbility);
    validAbilitiesBySpecies.set(p.slug, abs);
  }

  return {
    speciesSlugs: new Set(species.map((p) => p.slug)),
    moveSlugs: new Set(moves.map((m) => m.slug)),
    abilitySlugs: new Set(abilities.map((a) => a.slug)),
    itemSlugs: new Set(items.map((i) => i.slug)),
    learnableBySpecies,
    validAbilitiesBySpecies,
  };
}

async function main() {
  console.log("Loading DB lookup sets…");
  const lookup = await buildLookup();
  console.log(
    `Loaded ${lookup.speciesSlugs.size} species, ${lookup.moveSlugs.size} moves, ${lookup.abilitySlugs.size} abilities, ${lookup.itemSlugs.size} items.\n`,
  );

  // Sanity-check the EV converter in isolation.
  const evConvCases: [number[], number[], number][] = [
    [[4, 252, 0, 0, 0, 252], [1, 32, 0, 0, 0, 32], 0],
    // 252×3 = 96 SP raw → trim 30 evenly across pumped stats → [22, 22, 22]
    [[252, 252, 252, 0, 0, 0], [22, 22, 22, 0, 0, 0], 30],
    [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], 0],
    // 252+252 = 64 SP (both round up to 32), so adding 4 EV (rounds to 1) → 65 — under cap
    [[252, 252, 0, 0, 4, 0], [32, 32, 0, 0, 1, 0], 0],
  ];
  let evPass = 0;
  for (const [evIn, spExpected, trimExpected] of evConvCases) {
    const { sp, trimmedBy } = convertEvToSp(evIn as any);
    const ok = sp.every((v, i) => v === spExpected[i]) && trimmedBy === trimExpected;
    if (ok) evPass++;
    else
      console.log(
        `  EV conv FAIL: in=${evIn.join("/")} → sp=${sp.join("/")} (expected ${spExpected.join("/")}), trimmed=${trimmedBy} (expected ${trimExpected})`,
      );
  }
  console.log(`EV conversion: ${evPass}/${evConvCases.length} passed.\n`);

  // PokePaste URL parser
  const urlCases: [string, string | null][] = [
    ["https://pokepast.es/abc123", "abc123"],
    ["https://pokepast.es/abc123/raw", "abc123"],
    ["https://www.pokepast.es/AbC123XYZ", "AbC123XYZ"],
    ["https://example.com/abc123", null],
    ["not a url", null],
    ["https://pokepast.es/", null],
    ["https://pokepast.es/abc-123", null], // hyphens not allowed in PokePaste IDs
  ];
  let urlPass = 0;
  for (const [u, want] of urlCases) {
    const got = extractPokePasteId(u);
    if (got === want) urlPass++;
    else console.log(`  URL FAIL: ${u} → ${got} (expected ${want})`);
  }
  console.log(`PokePaste URL parser: ${urlPass}/${urlCases.length} passed.\n`);

  // Main parser cases
  let pass = 0;
  let fail = 0;
  for (const c of CASES) {
    const { team, warnings } = parseShowdownText(c.input, lookup);
    let ok = true;
    const errors: string[] = [];

    if (c.expect?.slotCount !== undefined && team.slots.length !== c.expect.slotCount) {
      ok = false;
      errors.push(`slotCount: got ${team.slots.length}, want ${c.expect.slotCount}`);
    }
    if (c.expect?.firstSlot) {
      const first = team.slots[0];
      if (!first) {
        ok = false;
        errors.push(`firstSlot: no slot produced`);
      } else if (!deepEqualSubset(first, c.expect.firstSlot)) {
        ok = false;
        errors.push(
          `firstSlot mismatch:\n    got=${JSON.stringify(first)}\n    want=${JSON.stringify(c.expect.firstSlot)}`,
        );
      }
    }
    if (c.expect?.warningKinds) {
      const kinds = new Set(warnings.map((w) => w.kind));
      for (const want of c.expect.warningKinds) {
        if (!kinds.has(want as any)) {
          ok = false;
          errors.push(`missing warning: ${want}`);
        }
      }
    }

    if (ok) {
      console.log(`  ✓ ${c.name}`);
      pass++;
    } else {
      console.log(`  ✗ ${c.name}`);
      for (const e of errors) console.log(`      ${e}`);
      if (warnings.length > 0) {
        console.log(`      warnings: ${warnings.map((w) => `${w.kind}: ${w.detail}`).join("; ")}`);
      }
      fail++;
    }
  }

  console.log(`\n${pass}/${CASES.length} parser cases passed (${fail} failed).`);

  await prisma.$disconnect();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
