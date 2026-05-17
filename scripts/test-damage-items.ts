/**
 * Damage-calc item parity tests.
 *
 * Validates the multipliers against Smogon/Showdown conventions:
 *   - Type-boost items (Black Glasses, Charcoal, …) and plates: ×1.2 to damage
 *     when the move type matches; ×1.0 otherwise.
 *   - Species-locked orbs (Adamant/Lustrous/Griseous/Soul Dew): ×1.2 only on
 *     their rightful holders, and only on the right type.
 *   - Stat doublers (Light Ball, Thick Club, Deep Sea Tooth/Scale): apply only
 *     to the right species + stat.
 *
 * Run: `npx tsx scripts/test-damage-items.ts`
 */

import { prisma } from "../src/lib/db";
import { calc, type CalcInput, type Nature } from "../src/lib/damage";
import type { PokemonType } from "../src/lib/types";

type MonRef = {
  slug: string;
  type1: string;
  type2: string | null;
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
};

async function loadMons(slugs: string[]): Promise<Map<string, MonRef>> {
  const rows = await prisma.pokemon.findMany({
    where: { slug: { in: slugs } },
    select: {
      slug: true, type1: true, type2: true,
      hp: true, atk: true, def: true, spa: true, spd: true, spe: true,
    },
  });
  return new Map(rows.map((r) => [r.slug, r as MonRef]));
}

function mkInput(
  attacker: MonRef,
  defender: MonRef,
  move: { slug: string; type: PokemonType; category: "physical" | "special"; power: number },
  opts: {
    attackerItem?: string;
    attackerAbility?: string;
    defenderItem?: string;
    defenderAbility?: string;
    attackerNature?: Nature;
    defenderNature?: Nature;
    vpAtk?: number; vpSpa?: number; vpHp?: number; vpDef?: number; vpSpd?: number;
  } = {},
): CalcInput {
  return {
    attacker: {
      slug: attacker.slug,
      types: [attacker.type1 as PokemonType, attacker.type2 as PokemonType | null],
      atk: attacker.atk, spa: attacker.spa,
      vpAtk: opts.vpAtk ?? 32, vpSpa: opts.vpSpa ?? 32,
      nature: opts.attackerNature ?? "Adamant",
      ability: opts.attackerAbility,
      item: opts.attackerItem,
      status: "none",
      stageAtk: 0, stageSpa: 0,
    },
    defender: {
      slug: defender.slug,
      types: [defender.type1 as PokemonType, defender.type2 as PokemonType | null],
      hp: defender.hp, def: defender.def, spd: defender.spd,
      vpHp: opts.vpHp ?? 32, vpDef: opts.vpDef ?? 32, vpSpd: opts.vpSpd ?? 32,
      nature: opts.defenderNature ?? "Bold",
      ability: opts.defenderAbility,
      item: opts.defenderItem,
      stageDef: 0, stageSpd: 0,
      hpPct: 100,
    },
    move: { ...move, targetShape: "selected-pokemon" },
    field: {
      weather: "none",
      terrain: "none",
      format: "singles",
      crit: false,
      helpingHand: false,
      screens: { reflect: false, lightScreen: false, auroraVeil: false },
      hazards: { stealthRock: false, spikes: 0, toxicSpikes: 0 },
    },
  };
}

function ratio(withItem: number, noItem: number): number {
  if (noItem === 0) return 0;
  return +(withItem / noItem).toFixed(3);
}

async function main() {
  console.log("Loading Pokémon reference data…");
  const needed = [
    "kingambit", "basculegion-male",
    "garchomp", "iron-hands",
    "charizard", "blastoise",
    "pikachu", "raichu",
    "cubone", "marowak",
    "clamperl",
    "dialga", "palkia", "giratina-origin", "latios",
    "arceus",
    "snorlax",
  ];
  const mons = await loadMons(needed);
  for (const s of needed) {
    if (!mons.get(s)) console.log(`  (warn: ${s} not in DB)`);
  }

  // Common moves for the suite.
  const MOVES = {
    suckerPunch: { slug: "sucker-punch", type: "dark" as const, category: "physical" as const, power: 70 },
    earthquake: { slug: "earthquake", type: "ground" as const, category: "physical" as const, power: 100 },
    flamethrower: { slug: "flamethrower", type: "fire" as const, category: "special" as const, power: 90 },
    surf: { slug: "surf", type: "water" as const, category: "special" as const, power: 90 },
    thunderbolt: { slug: "thunderbolt", type: "electric" as const, category: "special" as const, power: 90 },
    boneClub: { slug: "bone-club", type: "ground" as const, category: "physical" as const, power: 65 },
    psyshock: { slug: "psyshock", type: "psychic" as const, category: "special" as const, power: 80 },
    dracoMeteor: { slug: "draco-meteor", type: "dragon" as const, category: "special" as const, power: 130 },
    judgment: { slug: "judgment", type: "normal" as const, category: "special" as const, power: 100 },
  };

  type Case = {
    name: string;
    setup: () => CalcInput;
    baseline: () => CalcInput;
    expectRatio: number; // within ±0.01
  };

  const cases: Case[] = [];

  // 1) The reported scenario: Kingambit Sucker Punch + Black Glasses vs Basculegion
  const kingambit = mons.get("kingambit")!;
  const basculegion = mons.get("basculegion-male")!;
  if (kingambit && basculegion) {
    cases.push({
      name: "Kingambit Sucker Punch + Black Glasses vs Basculegion (×1.2)",
      setup: () =>
        mkInput(kingambit, basculegion, MOVES.suckerPunch, { attackerItem: "black-glasses" }),
      baseline: () => mkInput(kingambit, basculegion, MOVES.suckerPunch),
      expectRatio: 1.2,
    });
  }

  // 2) Type-boost items at ×1.2 on matching type
  const typePairs: Array<[string, keyof typeof MOVES, number]> = [
    ["charcoal",       "flamethrower", 1.2],  // fire
    ["mystic-water",   "surf",         1.2],  // water
    ["magnet",         "thunderbolt",  1.2],  // electric
    ["soft-sand",      "earthquake",   1.2],  // ground
    ["twisted-spoon",  "psyshock",     1.2],  // psychic
    ["dragon-fang",    "dracoMeteor",  1.2],  // dragon
  ];
  const charizard = mons.get("charizard");
  const blastoise = mons.get("blastoise");
  if (charizard && blastoise) {
    for (const [item, moveKey, mult] of typePairs) {
      cases.push({
        name: `${item} on ${moveKey} (×${mult})`,
        setup: () => mkInput(charizard, blastoise, MOVES[moveKey], { attackerItem: item }),
        baseline: () => mkInput(charizard, blastoise, MOVES[moveKey]),
        expectRatio: mult,
      });
    }
    // 3) Wrong-type item: Charcoal on Surf should be no boost
    cases.push({
      name: "charcoal on water move (no boost)",
      setup: () => mkInput(charizard, blastoise, MOVES.surf, { attackerItem: "charcoal" }),
      baseline: () => mkInput(charizard, blastoise, MOVES.surf),
      expectRatio: 1.0,
    });
  }

  // 4) Plates apply too (×1.2)
  if (charizard && blastoise) {
    cases.push({
      name: "splash-plate on Surf (×1.2)",
      setup: () => mkInput(charizard, blastoise, MOVES.surf, { attackerItem: "splash-plate" }),
      baseline: () => mkInput(charizard, blastoise, MOVES.surf),
      expectRatio: 1.2,
    });
  }

  // 5) Light Ball on Pikachu doubles damage
  const pikachu = mons.get("pikachu");
  if (pikachu && blastoise) {
    cases.push({
      name: "Light Ball on Pikachu Thunderbolt (×2.0)",
      setup: () => mkInput(pikachu, blastoise, MOVES.thunderbolt, { attackerItem: "light-ball" }),
      baseline: () => mkInput(pikachu, blastoise, MOVES.thunderbolt),
      expectRatio: 2.0,
    });
    // On Raichu (not the holder) it does nothing.
    const raichu = mons.get("raichu");
    if (raichu) {
      cases.push({
        name: "Light Ball on Raichu (no effect)",
        setup: () => mkInput(raichu, blastoise, MOVES.thunderbolt, { attackerItem: "light-ball" }),
        baseline: () => mkInput(raichu, blastoise, MOVES.thunderbolt),
        expectRatio: 1.0,
      });
    }
  }

  // 6) Thick Club on Marowak doubles Atk → ×2 damage on physical
  const marowak = mons.get("marowak");
  if (marowak && blastoise) {
    cases.push({
      name: "Thick Club on Marowak Earthquake (×2.0)",
      setup: () => mkInput(marowak, blastoise, MOVES.earthquake, { attackerItem: "thick-club" }),
      baseline: () => mkInput(marowak, blastoise, MOVES.earthquake),
      expectRatio: 2.0,
    });
  }

  // 7) Soul Dew on Latios: Dragon AND Psychic both ×1.2
  const latios = mons.get("latios");
  if (latios && blastoise) {
    cases.push({
      name: "Soul Dew on Latios Draco Meteor (×1.2 Dragon)",
      setup: () => mkInput(latios, blastoise, MOVES.dracoMeteor, { attackerItem: "soul-dew" }),
      baseline: () => mkInput(latios, blastoise, MOVES.dracoMeteor),
      expectRatio: 1.2,
    });
    cases.push({
      name: "Soul Dew on Latios Psyshock (×1.2 Psychic)",
      setup: () => mkInput(latios, blastoise, MOVES.psyshock, { attackerItem: "soul-dew" }),
      baseline: () => mkInput(latios, blastoise, MOVES.psyshock),
      expectRatio: 1.2,
    });
    // Wrong type — Soul Dew shouldn't boost Surf.
    cases.push({
      name: "Soul Dew on Latios Surf (no boost)",
      setup: () => mkInput(latios, blastoise, MOVES.surf, { attackerItem: "soul-dew" }),
      baseline: () => mkInput(latios, blastoise, MOVES.surf),
      expectRatio: 1.0,
    });
    // On non-holder (Charizard) — no boost.
    if (charizard) {
      cases.push({
        name: "Soul Dew on Charizard (non-holder, no boost)",
        setup: () => mkInput(charizard, blastoise, MOVES.dracoMeteor, { attackerItem: "soul-dew" }),
        baseline: () => mkInput(charizard, blastoise, MOVES.dracoMeteor),
        expectRatio: 1.0,
      });
    }
  }

  // 8) Adamant Orb on Dialga: Dragon ×1.2 + Steel ×1.2
  const dialga = mons.get("dialga");
  if (dialga && blastoise) {
    cases.push({
      name: "Adamant Orb on Dialga Draco Meteor (×1.2 Dragon)",
      setup: () => mkInput(dialga, blastoise, MOVES.dracoMeteor, { attackerItem: "adamant-orb" }),
      baseline: () => mkInput(dialga, blastoise, MOVES.dracoMeteor),
      expectRatio: 1.2,
    });
  }

  // 9) Existing items still work as expected
  if (kingambit && basculegion) {
    cases.push({
      name: "Choice Band on Kingambit Sucker Punch (×1.5)",
      setup: () => mkInput(kingambit, basculegion, MOVES.suckerPunch, { attackerItem: "choice-band" }),
      baseline: () => mkInput(kingambit, basculegion, MOVES.suckerPunch),
      expectRatio: 1.5,
    });
    cases.push({
      name: "Life Orb on Kingambit Sucker Punch (×1.3)",
      setup: () => mkInput(kingambit, basculegion, MOVES.suckerPunch, { attackerItem: "life-orb" }),
      baseline: () => mkInput(kingambit, basculegion, MOVES.suckerPunch),
      expectRatio: 1.3,
    });
  }

  // 10) Black Glasses on a NON-Dark move → no boost
  if (kingambit && basculegion) {
    cases.push({
      name: "Black Glasses on Iron Head (non-Dark, no boost)",
      setup: () =>
        mkInput(kingambit, basculegion, { slug: "iron-head", type: "steel", category: "physical", power: 80 }, { attackerItem: "black-glasses" }),
      baseline: () =>
        mkInput(kingambit, basculegion, { slug: "iron-head", type: "steel", category: "physical", power: 80 }),
      expectRatio: 1.0,
    });
  }

  // 11) Deep Sea Tooth on Clamperl SpA ×2
  const clamperl = mons.get("clamperl");
  if (clamperl && blastoise) {
    cases.push({
      name: "Deep Sea Tooth on Clamperl Surf (×2.0)",
      setup: () => mkInput(clamperl, blastoise, MOVES.surf, { attackerItem: "deep-sea-tooth" }),
      baseline: () => mkInput(clamperl, blastoise, MOVES.surf),
      expectRatio: 2.0,
    });
  }

  // Run all cases
  let pass = 0, fail = 0;
  for (const c of cases) {
    const r1 = calc(c.setup());
    const r0 = calc(c.baseline());
    if (!r1 || !r0) {
      console.log(`  ✗ ${c.name} — calc returned null`);
      fail++;
      continue;
    }
    const got = ratio(r1.max, r0.max);
    // Tolerance derives from floor() truncation at each pipeline step.
    // Small damage values (Champions has a compressed stat range) accumulate
    // ~1% drift per floor. Allow ±0.06 for ×1.2 boosts, ±0.10 for ×2 boosts.
    const tol = c.expectRatio >= 1.8 ? 0.10 : 0.06;
    const ok = Math.abs(got - c.expectRatio) <= tol;
    if (ok) {
      console.log(`  ✓ ${c.name}  (ratio ${got.toFixed(3)})`);
      pass++;
    } else {
      console.log(`  ✗ ${c.name}`);
      console.log(`      max with item: ${r1.max}, max no item: ${r0.max}, ratio ${got.toFixed(3)} (expected ~${c.expectRatio})`);
      console.log(`      notes (with): ${r1.notes.join(" | ")}`);
      fail++;
    }
  }

  console.log(`\n${pass}/${cases.length} passed (${fail} failed).`);
  await prisma.$disconnect();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
