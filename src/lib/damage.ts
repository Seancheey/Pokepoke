/**
 * Simplified damage formula for Pokémon Champions (Gen 6+ shape).
 *
 * v1 scope: STAB, type effectiveness, weather (sun/rain), spread (doubles),
 * burn (physical halved), crit (×1.5), 16 random rolls (85–100%).
 *
 * Out of scope for v1: stat stages, screens, hazards chip, ability-driven
 * modifiers (Adaptability, Transistor, Tinted Lens, etc.), nature multipliers.
 * Stats are computed Level-50 with VP-only contribution (Champions removed IVs).
 *
 * Reference: Bulbapedia damage formula.
 */

import type { PokemonType } from "./types";
import { effectivenessAgainst } from "./type-chart";

const LEVEL = 50;

/**
 * Stat at level 50 with Champions' VP-only system (no IVs, no nature in v1).
 *   stat = floor((2*base + VP/4) * level / 100) + 5
 *   HP   = floor((2*base + VP/4) * level / 100) + level + 10
 */
export function statAtLevel(base: number, vp: number, isHp = false): number {
  const core = Math.floor(((2 * base + Math.floor(vp / 4)) * LEVEL) / 100);
  return isHp ? core + LEVEL + 10 : core + 5;
}

export type Weather = "none" | "sun" | "rain" | "sand" | "snow";

export type CalcInput = {
  attacker: {
    types: [PokemonType, PokemonType | null];
    atk: number;   // base
    spa: number;   // base
    vpAtk: number;
    vpSpa: number;
  };
  defender: {
    types: [PokemonType, PokemonType | null];
    hp: number;    // base
    def: number;   // base
    spd: number;   // base
    vpHp: number;
    vpDef: number;
    vpSpd: number;
  };
  move: {
    type: PokemonType;
    category: "physical" | "special" | "status";
    power: number;
    targetShape: string; // "all-adjacent" etc.
  };
  field: {
    weather: Weather;
    format: "singles" | "doubles";
    spread?: boolean;  // override; auto when targetShape implies it
    burn?: boolean;
    crit?: boolean;
  };
};

export type CalcOutput = {
  // Damage roll range (16 integers from min to max in steps of 1%).
  rolls: number[];
  min: number;
  max: number;
  defenderMaxHp: number;
  minPct: number;
  maxPct: number;
  stab: 1 | 1.5;
  effectiveness: number; // multiplier applied
};

const SPREAD_SHAPES = new Set(["all-adjacent", "spread"]);

export function calc(input: CalcInput): CalcOutput | null {
  if (input.move.category === "status" || input.move.power <= 0) return null;

  const isPhysical = input.move.category === "physical";
  const baseA = isPhysical ? input.attacker.atk : input.attacker.spa;
  const vpA = isPhysical ? input.attacker.vpAtk : input.attacker.vpSpa;
  const baseD = isPhysical ? input.defender.def : input.defender.spd;
  const vpD = isPhysical ? input.defender.vpDef : input.defender.vpSpd;

  const A = statAtLevel(baseA, vpA);
  const D = statAtLevel(baseD, vpD);
  const HP = statAtLevel(input.defender.hp, input.defender.vpHp, true);

  // Core: floor( floor( floor(2L/5+2) * power * A/D ) / 50 ) + 2
  let dmg = Math.floor(
    (Math.floor(((2 * LEVEL) / 5 + 2) * input.move.power * A) / D) / 50,
  );
  dmg = dmg + 2;

  // Spread modifier (doubles, multi-target moves)
  const isSpread =
    input.field.spread ??
    (input.field.format === "doubles" && SPREAD_SHAPES.has(input.move.targetShape));
  if (isSpread) dmg = Math.floor(dmg * 0.75);

  // Weather
  if (input.field.weather === "sun") {
    if (input.move.type === "fire") dmg = Math.floor(dmg * 1.5);
    else if (input.move.type === "water") dmg = Math.floor(dmg * 0.5);
  } else if (input.field.weather === "rain") {
    if (input.move.type === "water") dmg = Math.floor(dmg * 1.5);
    else if (input.move.type === "fire") dmg = Math.floor(dmg * 0.5);
  }

  // Crit
  if (input.field.crit) dmg = Math.floor(dmg * 1.5);

  // STAB
  const stab: 1 | 1.5 =
    input.attacker.types.includes(input.move.type) ? 1.5 : 1;
  if (stab > 1) dmg = Math.floor(dmg * stab);

  // Type effectiveness
  const defTypes = input.defender.types.filter((t): t is PokemonType => !!t);
  const eff = effectivenessAgainst(input.move.type, defTypes);
  if (eff === 0) {
    return {
      rolls: [0],
      min: 0, max: 0,
      defenderMaxHp: HP,
      minPct: 0, maxPct: 0,
      stab,
      effectiveness: 0,
    };
  }
  dmg = Math.floor(dmg * eff);

  // Burn — physical only
  if (input.field.burn && isPhysical) dmg = Math.floor(dmg * 0.5);

  // 16 rolls of 85..100%
  const rolls: number[] = [];
  for (let r = 85; r <= 100; r++) {
    rolls.push(Math.floor((dmg * r) / 100));
  }
  const min = rolls[0];
  const max = rolls[rolls.length - 1];

  return {
    rolls,
    min, max,
    defenderMaxHp: HP,
    minPct: +((100 * min) / HP).toFixed(1),
    maxPct: +((100 * max) / HP).toFixed(1),
    stab,
    effectiveness: eff,
  };
}
