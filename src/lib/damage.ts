/**
 * Damage formula for Pokémon Champions (Gen 6+ shape).
 *
 * Covers:
 *   - STAB
 *   - Type effectiveness (incl. ability-driven immunities/resistances)
 *   - Stat stages (-6..+6), with crit-ignores semantics
 *   - Nature multipliers (×1.1 / ×0.9)
 *   - Status conditions (burn × 0.5 on physical, paralysis speed handled separately)
 *   - Weather (sun/rain/sand/snow) and Terrain (electric/grassy/psychic/misty)
 *   - Screens (Reflect / Light Screen / Aurora Veil) with doubles 2/3 modifier
 *   - Helping Hand × 1.5
 *   - Spread (doubles, multi-target) × 0.75
 *   - Crit × 1.5 with Gen 6+ rules (ignores adverse stat changes)
 *   - 16-roll variance (85–100%)
 *   - Selected ability modifiers — Intimidate (passive lookup elsewhere; here
 *     we accept the resulting Atk stage), Adaptability, Tough Claws (treated as
 *     "contact-ish"), Strong Jaw / Mega Launcher / Iron Fist / Punk Rock /
 *     Technician / Tinted Lens / Sheer Force / Transistor / Dragon's Maw /
 *     Aerilate-family / Filter / Solid Rock / Prism Armor / Multiscale /
 *     Ice Scales / Punk Rock (def) / Fluffy / Heatproof / Thick Fat /
 *     Water Absorb / Volt Absorb / Flash Fire / Storm Drain / Lightning Rod /
 *     Sap Sipper / Motor Drive / Levitate / Dry Skin / Wonder Guard
 *   - Item modifiers — Life Orb / Choice Band / Choice Specs / Expert Belt /
 *     Assault Vest / Eviolite / type-boost plates (×1.2 if matching attacker
 *     move type) / Muscle Band / Wise Glasses
 *   - Defender hazard chip (Stealth Rock + Spikes layers + Toxic Spikes)
 *
 * Deliberately NOT modeled (yet):
 *   - Tera type (Champions disables Terastallization in PRD)
 *   - Z-moves / Dynamax (Champions doesn't ship these)
 *   - Mold Breaker bypass (would need flag awareness)
 *   - Move flags (punch/bite/sound/pulse) — approximated by hardcoded slug lists
 */

import type { PokemonType } from "./types";
import { effectivenessAgainst } from "./type-chart";

const LEVEL = 50;

// ─── Natures ─────────────────────────────────────────────────────────────────

export type Nature =
  | "Hardy" | "Lonely" | "Adamant" | "Naughty" | "Brave"
  | "Bold" | "Docile" | "Impish" | "Lax" | "Relaxed"
  | "Modest" | "Mild" | "Bashful" | "Rash" | "Quiet"
  | "Calm" | "Gentle" | "Careful" | "Sassy" | "Quirky"
  | "Timid" | "Hasty" | "Jolly" | "Naive" | "Serious";

type StatKey = "atk" | "def" | "spa" | "spd" | "spe";

// Each entry: [up, down]
const NATURE_TABLE: Record<Nature, [StatKey | null, StatKey | null]> = {
  Hardy: [null, null], Docile: [null, null], Bashful: [null, null],
  Quirky: [null, null], Serious: [null, null],

  Lonely:  ["atk", "def"], Adamant: ["atk", "spa"], Naughty: ["atk", "spd"], Brave:   ["atk", "spe"],
  Bold:    ["def", "atk"], Impish:  ["def", "spa"], Lax:     ["def", "spd"], Relaxed: ["def", "spe"],
  Modest:  ["spa", "atk"], Mild:    ["spa", "def"], Rash:    ["spa", "spd"], Quiet:   ["spa", "spe"],
  Calm:    ["spd", "atk"], Gentle:  ["spd", "def"], Careful: ["spd", "spa"], Sassy:   ["spd", "spe"],
  Timid:   ["spe", "atk"], Hasty:   ["spe", "def"], Jolly:   ["spe", "spa"], Naive:   ["spe", "spd"],
};

export const NATURES: readonly Nature[] = Object.keys(NATURE_TABLE) as Nature[];

/** Returns the stat raised (+10%) and lowered (-10%) by a nature, or nulls for neutral. */
export function natureEffect(nat: Nature): { up: StatKey | null; down: StatKey | null } {
  const [up, down] = NATURE_TABLE[nat];
  return { up, down };
}

function natureMult(nat: Nature, stat: StatKey): number {
  const [up, down] = NATURE_TABLE[nat];
  if (up === stat) return 1.1;
  if (down === stat) return 0.9;
  return 1;
}

// ─── Stat computation ────────────────────────────────────────────────────────

/**
 * Stat at level 50 with Champions' Stat Point system.
 * Champions has no editable IVs; neutral non-HP stats are base + 20 + SP,
 * and HP is base + 75 + SP. Nature applies after Stat Points for non-HP.
 */
export function computeStat(
  base: number,
  vp: number,
  nature: Nature,
  stat: StatKey,
  isHp = false,
): number {
  const statPoints = Math.max(0, Math.min(32, Math.floor(vp)));
  if (isHp) return base + 75 + statPoints;
  return Math.floor((base + 20 + statPoints) * natureMult(nature, stat));
}

/** Stat-stage multiplier per Gen 6+ rules. */
function stageFactor(stage: number): number {
  const s = Math.max(-6, Math.min(6, stage));
  if (s >= 0) return (2 + s) / 2;
  return 2 / (2 - s);
}

// ─── Field types ─────────────────────────────────────────────────────────────

export type Weather = "none" | "sun" | "rain" | "sand" | "snow";
export type Terrain = "none" | "electric" | "grassy" | "psychic" | "misty";
export type Status = "none" | "burn" | "paralysis" | "poison" | "toxic" | "sleep" | "freeze";
export type Screens = { reflect: boolean; lightScreen: boolean; auroraVeil: boolean };
export type Hazards = {
  stealthRock: boolean;
  spikes: 0 | 1 | 2 | 3;
  toxicSpikes: 0 | 1 | 2;
};

// ─── Move flag heuristics ────────────────────────────────────────────────────
// We don't yet ingest move flags. Approximate via slug patterns.

const CONTACT_MOVES = new Set<string>([
  "flare-blitz", "knock-off", "fake-out", "u-turn", "close-combat", "wild-charge",
  "dragon-claw", "play-rough", "iron-head", "double-edge", "outrage",
  // ... not exhaustive
]);
const PUNCH_MOVES = new Set([
  "ice-punch", "fire-punch", "thunder-punch", "drain-punch", "focus-punch",
  "mach-punch", "bullet-punch", "shadow-punch", "sky-uppercut", "dynamic-punch",
  "hammer-arm", "meteor-mash", "comet-punch", "power-up-punch",
]);
const BITE_MOVES = new Set([
  "crunch", "fire-fang", "ice-fang", "thunder-fang", "poison-fang", "bite",
  "psychic-fangs", "hyper-fang", "jaw-lock",
]);
const PULSE_MOVES = new Set([
  "water-pulse", "dragon-pulse", "dark-pulse", "aura-sphere", "origin-pulse",
  "heal-pulse", "terrain-pulse",
]);
const SOUND_MOVES = new Set([
  "hyper-voice", "boomburst", "overdrive", "snarl", "round", "echoed-voice",
  "uproar", "growl", "screech", "sing", "supersonic", "perish-song",
  "metal-sound", "chatter", "relic-song", "noble-roar",
]);
const SECONDARY_EFFECT_MOVES = new Set([
  // moves with non-100% secondary effects that benefit Sheer Force
  "ice-beam", "thunderbolt", "flamethrower", "shadow-ball", "sludge-bomb",
  "earth-power", "iron-head", "fire-blast", "psychic", "ancient-power",
  "rock-slide", "air-slash", "play-rough", "moonblast", "discharge", "ominous-wind",
]);
const RECOIL_MOVES = new Set([
  "double-edge", "flare-blitz", "wild-charge", "head-charge", "head-smash",
  "submission", "take-down", "wood-hammer", "volt-tackle",
]);

function isContact(slug: string): boolean { return CONTACT_MOVES.has(slug); }
function isPunch(slug: string): boolean { return PUNCH_MOVES.has(slug); }
function isBite(slug: string): boolean { return BITE_MOVES.has(slug); }
function isPulse(slug: string): boolean { return PULSE_MOVES.has(slug); }
function isSound(slug: string): boolean { return SOUND_MOVES.has(slug); }
function hasSecondary(slug: string): boolean { return SECONDARY_EFFECT_MOVES.has(slug); }
function isRecoil(slug: string): boolean { return RECOIL_MOVES.has(slug); }

// ─── Inputs / outputs ────────────────────────────────────────────────────────

export type CalcInput = {
  attacker: {
    types: [PokemonType, PokemonType | null];
    atk: number;   // base
    spa: number;   // base
    vpAtk: number;
    vpSpa: number;
    nature: Nature;
    ability?: string;
    item?: string;
    status: Status;
    stageAtk: number; // -6..+6
    stageSpa: number;
  };
  defender: {
    types: [PokemonType, PokemonType | null];
    hp: number;    // base
    def: number;   // base
    spd: number;   // base
    vpHp: number;
    vpDef: number;
    vpSpd: number;
    nature: Nature;
    ability?: string;
    item?: string;
    stageDef: number;
    stageSpd: number;
    hpPct: number;     // 1-100; affects Multiscale, hazard chip
  };
  move: {
    slug: string;
    type: PokemonType;
    category: "physical" | "special";
    power: number;
    targetShape: string; // "all-adjacent" etc.
  };
  field: {
    weather: Weather;
    terrain: Terrain;
    format: "singles" | "doubles";
    spread?: boolean;
    crit: boolean;
    helpingHand: boolean;
    screens: Screens;
    hazards: Hazards;
  };
};

export type CalcOutput = {
  rolls: number[];
  min: number;
  max: number;
  defenderMaxHp: number;
  minPct: number;
  maxPct: number;
  stab: number;
  effectiveness: number;
  hazardChipPct: number;
  /** Human-readable trace of applied modifiers */
  notes: string[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SPREAD_SHAPES = new Set(["all-adjacent", "spread"]);

function isGrounded(types: [PokemonType, PokemonType | null], ability?: string): boolean {
  if (types[0] === "flying" || types[1] === "flying") return false;
  if (ability === "levitate") return false;
  return true;
}

function hazardChipPct(defender: CalcInput["defender"], hazards: Hazards): number {
  let pct = 0;
  if (hazards.stealthRock) {
    const eff = effectivenessAgainst("rock", defender.types.filter((t): t is PokemonType => !!t));
    // SR damage: 12.5% × effectiveness multiplier
    pct += 12.5 * eff;
  }
  const grounded = isGrounded(defender.types, defender.ability);
  if (grounded) {
    const spikesPct = [0, 12.5, 16.6, 25][hazards.spikes];
    pct += spikesPct;
  }
  return Math.min(pct, 100);
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function calc(input: CalcInput): CalcOutput | null {
  const { attacker: a, defender: d, move, field } = input;
  if (move.power <= 0) return null;

  const notes: string[] = [];
  const isPhysical = move.category === "physical";

  // ── Ability/Item-based type immunities or absorption ─────────────────────
  // If defender has Water/Volt/Storm Drain/etc., the move is nullified.
  if (d.ability === "water-absorb" && move.type === "water") return zeroResult(d);
  if (d.ability === "storm-drain" && move.type === "water") return zeroResult(d);
  if (d.ability === "volt-absorb" && move.type === "electric") return zeroResult(d);
  if (d.ability === "lightning-rod" && move.type === "electric") return zeroResult(d);
  if (d.ability === "motor-drive" && move.type === "electric") return zeroResult(d);
  if (d.ability === "flash-fire" && move.type === "fire") return zeroResult(d);
  if (d.ability === "well-baked-body" && move.type === "fire") return zeroResult(d);
  if (d.ability === "sap-sipper" && move.type === "grass") return zeroResult(d);
  if (d.ability === "levitate" && move.type === "ground") return zeroResult(d);
  if (d.ability === "earth-eater" && move.type === "ground") return zeroResult(d);
  if (d.ability === "dry-skin" && move.type === "water") return zeroResult(d);

  // ── Effective stats ──────────────────────────────────────────────────────
  const aStatKey: StatKey = isPhysical ? "atk" : "spa";
  const dStatKey: StatKey = isPhysical ? "def" : "spd";
  const aBaseStat = isPhysical ? a.atk : a.spa;
  const aVp = isPhysical ? a.vpAtk : a.vpSpa;
  const dBaseStat = isPhysical ? d.def : d.spd;
  const dVp = isPhysical ? d.vpDef : d.vpSpd;
  const aStageRaw = isPhysical ? a.stageAtk : a.stageSpa;
  const dStageRaw = isPhysical ? d.stageDef : d.stageSpd;

  const A0 = computeStat(aBaseStat, aVp, a.nature, aStatKey);
  const D0 = computeStat(dBaseStat, dVp, d.nature, dStatKey);
  const HP = computeStat(d.hp, d.vpHp, d.nature, "atk", true);

  // Crit ignores adverse stat changes (and screens, and burn).
  const aStage = field.crit ? Math.max(aStageRaw, 0) : aStageRaw;
  const dStage = field.crit ? Math.min(dStageRaw, 0) : dStageRaw;
  let A = Math.floor(A0 * stageFactor(aStage));
  let D = Math.floor(D0 * stageFactor(dStage));

  // ── Atk/Def boosts from items + abilities applied to stats ───────────────
  if (a.item === "choice-band" && isPhysical) { A = Math.floor(A * 1.5); notes.push("Choice Band ×1.5 Atk"); }
  if (a.item === "choice-specs" && !isPhysical) { A = Math.floor(A * 1.5); notes.push("Choice Specs ×1.5 SpA"); }
  if (d.item === "assault-vest" && !isPhysical) { D = Math.floor(D * 1.5); notes.push("Assault Vest ×1.5 SpD"); }
  if (d.item === "eviolite") { D = Math.floor(D * 1.5); notes.push("Eviolite ×1.5"); }

  // Hadron Engine (Miraidon): in Electric Terrain, SpA ×1.33
  if (a.ability === "hadron-engine" && field.terrain === "electric" && !isPhysical) {
    A = Math.floor(A * (5461 / 4096));
    notes.push("Hadron Engine ×1.33 SpA");
  }
  // Orichalcum Pulse (Koraidon): in Sun, Atk ×1.33
  if (a.ability === "orichalcum-pulse" && field.weather === "sun" && isPhysical) {
    A = Math.floor(A * (5461 / 4096));
    notes.push("Orichalcum Pulse ×1.33 Atk");
  }
  // Solar Power: SpA ×1.5 in sun
  if (a.ability === "solar-power" && field.weather === "sun" && !isPhysical) {
    A = Math.floor(A * 1.5);
    notes.push("Solar Power ×1.5 SpA");
  }
  // Sand-boosted SpD on Rock-types
  if (field.weather === "sand" && (d.types[0] === "rock" || d.types[1] === "rock") && !isPhysical) {
    D = Math.floor(D * 1.5);
    notes.push("Sand ×1.5 SpD on Rock");
  }
  // Snow-boosted Def on Ice-types
  if (field.weather === "snow" && (d.types[0] === "ice" || d.types[1] === "ice") && isPhysical) {
    D = Math.floor(D * 1.5);
    notes.push("Snow ×1.5 Def on Ice");
  }

  // ── Type tweaks via attacker abilities (e.g. Refrigerate makes Normal→Ice) ─
  let moveType: PokemonType = move.type;
  let basePower = move.power;
  const aetherKind: Record<string, PokemonType> = {
    "refrigerate": "ice", "pixilate": "fairy", "galvanize": "electric",
    "aerilate": "flying", "normalize": "normal",
  };
  if (a.ability && aetherKind[a.ability] && move.type === "normal") {
    moveType = aetherKind[a.ability];
    basePower = Math.floor(basePower * 1.2);
    notes.push(`${a.ability} → ${moveType} & ×1.2`);
  }

  // ── Base damage ──────────────────────────────────────────────────────────
  // ((2L/5 + 2) × power × A / D) / 50 + 2
  let dmg = Math.floor((Math.floor(((2 * LEVEL) / 5 + 2) * basePower * A) / D) / 50) + 2;

  // ── Modifier chain (Gen 6+ multiplier-aware order) ───────────────────────
  // Spread (doubles, multi-target)
  const isSpread =
    field.spread ??
    (field.format === "doubles" && SPREAD_SHAPES.has(move.targetShape));
  if (isSpread) { dmg = Math.floor(dmg * 0.75); notes.push("Spread ×0.75"); }

  // Helping Hand
  if (field.helpingHand) { dmg = Math.floor(dmg * 1.5); notes.push("Helping Hand ×1.5"); }

  // Weather move boosts
  if (field.weather === "sun") {
    if (moveType === "fire") { dmg = Math.floor(dmg * 1.5); notes.push("Sun ×1.5 Fire"); }
    else if (moveType === "water") { dmg = Math.floor(dmg * 0.5); notes.push("Sun ×0.5 Water"); }
  } else if (field.weather === "rain") {
    if (moveType === "water") { dmg = Math.floor(dmg * 1.5); notes.push("Rain ×1.5 Water"); }
    else if (moveType === "fire") { dmg = Math.floor(dmg * 0.5); notes.push("Rain ×0.5 Fire"); }
  }

  // Terrain (must be grounded for grounded-only effects)
  const defenderGrounded = isGrounded(d.types, d.ability);
  const attackerGrounded = isGrounded(a.types, a.ability);
  if (field.terrain === "electric" && attackerGrounded && moveType === "electric") {
    dmg = Math.floor(dmg * 1.3); notes.push("Electric Terrain ×1.3");
  }
  if (field.terrain === "grassy" && attackerGrounded && moveType === "grass") {
    dmg = Math.floor(dmg * 1.3); notes.push("Grassy Terrain ×1.3");
  }
  if (field.terrain === "psychic" && attackerGrounded && moveType === "psychic") {
    dmg = Math.floor(dmg * 1.3); notes.push("Psychic Terrain ×1.3");
  }
  if (field.terrain === "misty" && defenderGrounded && moveType === "dragon") {
    dmg = Math.floor(dmg * 0.5); notes.push("Misty Terrain ×0.5 Dragon");
  }
  // Grassy Terrain halves Earthquake/Bulldoze/Magnitude vs grounded
  if (field.terrain === "grassy" && defenderGrounded &&
      (move.slug === "earthquake" || move.slug === "bulldoze" || move.slug === "magnitude")) {
    dmg = Math.floor(dmg * 0.5); notes.push("Grassy Terrain ×0.5 ground");
  }

  // Screens (defender side) — ignored by crits, in doubles ×2/3 not ×0.5
  if (!field.crit) {
    const screen = isPhysical
      ? field.screens.reflect || field.screens.auroraVeil
      : field.screens.lightScreen || field.screens.auroraVeil;
    if (screen) {
      const mult = field.format === "doubles" ? 2 / 3 : 0.5;
      dmg = Math.floor(dmg * mult);
      notes.push(`Screens ×${mult.toFixed(2)}`);
    }
  }

  // Crit
  if (field.crit) { dmg = Math.floor(dmg * 1.5); notes.push("Crit ×1.5"); }

  // Attacker ability boosts on move type / kind
  if (a.ability === "tough-claws" && isContact(move.slug)) {
    dmg = Math.floor(dmg * 1.3); notes.push("Tough Claws ×1.3");
  }
  if (a.ability === "strong-jaw" && isBite(move.slug)) {
    dmg = Math.floor(dmg * 1.5); notes.push("Strong Jaw ×1.5");
  }
  if (a.ability === "mega-launcher" && isPulse(move.slug)) {
    dmg = Math.floor(dmg * 1.5); notes.push("Mega Launcher ×1.5");
  }
  if (a.ability === "iron-fist" && isPunch(move.slug)) {
    dmg = Math.floor(dmg * 1.2); notes.push("Iron Fist ×1.2");
  }
  if (a.ability === "punk-rock" && isSound(move.slug)) {
    dmg = Math.floor(dmg * 1.3); notes.push("Punk Rock atk ×1.3");
  }
  if (a.ability === "sheer-force" && hasSecondary(move.slug)) {
    dmg = Math.floor(dmg * 1.3); notes.push("Sheer Force ×1.3");
  }
  if (a.ability === "technician" && basePower <= 60) {
    dmg = Math.floor(dmg * 1.5); notes.push("Technician ×1.5");
  }
  if (a.ability === "transistor" && moveType === "electric") {
    dmg = Math.floor(dmg * 1.3); notes.push("Transistor ×1.3");
  }
  if (a.ability === "dragons-maw" && moveType === "dragon") {
    dmg = Math.floor(dmg * 1.5); notes.push("Dragon's Maw ×1.5");
  }
  if (a.ability === "steely-spirit" && moveType === "steel") {
    dmg = Math.floor(dmg * 1.5); notes.push("Steely Spirit ×1.5");
  }
  if (a.ability === "sand-force" && field.weather === "sand"
      && (moveType === "rock" || moveType === "ground" || moveType === "steel")) {
    dmg = Math.floor(dmg * 1.3); notes.push("Sand Force ×1.3");
  }
  if (a.ability === "reckless" && isRecoil(move.slug)) {
    dmg = Math.floor(dmg * 1.2); notes.push("Reckless ×1.2");
  }

  // Defender ability damping
  if (d.ability === "punk-rock" && isSound(move.slug)) {
    dmg = Math.floor(dmg * 0.5); notes.push("Punk Rock def ×0.5");
  }
  if (d.ability === "ice-scales" && !isPhysical) {
    dmg = Math.floor(dmg * 0.5); notes.push("Ice Scales ×0.5");
  }
  if (d.ability === "fluffy") {
    if (isContact(move.slug)) { dmg = Math.floor(dmg * 0.5); notes.push("Fluffy contact ×0.5"); }
    if (moveType === "fire")  { dmg = Math.floor(dmg * 2);   notes.push("Fluffy fire ×2"); }
  }
  if (d.ability === "heatproof" && moveType === "fire") {
    dmg = Math.floor(dmg * 0.5); notes.push("Heatproof ×0.5");
  }
  if (d.ability === "water-bubble" && moveType === "fire") {
    dmg = Math.floor(dmg * 0.5); notes.push("Water Bubble ×0.5");
  }
  if (d.ability === "thick-fat" && (moveType === "fire" || moveType === "ice")) {
    dmg = Math.floor(dmg * 0.5); notes.push("Thick Fat ×0.5");
  }
  if (d.ability === "purifying-salt" && moveType === "ghost") {
    dmg = Math.floor(dmg * 0.5); notes.push("Purifying Salt ×0.5");
  }
  if (d.ability === "dry-skin" && moveType === "fire") {
    dmg = Math.floor(dmg * 1.25); notes.push("Dry Skin ×1.25");
  }
  if (d.ability === "multiscale" && d.hpPct >= 99.5) {
    dmg = Math.floor(dmg * 0.5); notes.push("Multiscale ×0.5");
  }

  // Item boosts that apply AFTER base modifiers
  if (a.item === "life-orb")     { dmg = Math.floor(dmg * 1.3); notes.push("Life Orb ×1.3"); }
  if (a.item === "muscle-band" && isPhysical) {
    dmg = Math.floor(dmg * 1.1); notes.push("Muscle Band ×1.1");
  }
  if (a.item === "wise-glasses" && !isPhysical) {
    dmg = Math.floor(dmg * 1.1); notes.push("Wise Glasses ×1.1");
  }

  // STAB
  let stab = 1;
  if (a.types.includes(moveType)) {
    stab = a.ability === "adaptability" ? 2 : 1.5;
    dmg = Math.floor(dmg * stab);
    if (a.ability === "adaptability") notes.push("Adaptability STAB ×2");
    else notes.push("STAB ×1.5");
  }

  // Type effectiveness
  const defTypes = d.types.filter((t): t is PokemonType => !!t);
  let eff = effectivenessAgainst(moveType, defTypes);

  // Wonder Guard: only super-effective hits land.
  if (d.ability === "wonder-guard" && eff <= 1) return zeroResult(d, notes.concat("Wonder Guard"));

  // Filter / Solid Rock / Prism Armor: SE hits ×0.75
  if (eff > 1 && (d.ability === "filter" || d.ability === "solid-rock" || d.ability === "prism-armor")) {
    eff *= 0.75;
    notes.push(`${d.ability} ×0.75 SE`);
  }
  // Tinted Lens: NVE hits ×2
  if (eff > 0 && eff < 1 && a.ability === "tinted-lens") {
    eff *= 2;
    notes.push("Tinted Lens ×2 NVE");
  }
  if (eff === 0) return zeroResult(d, notes.concat("Immune"));
  dmg = Math.floor(dmg * eff);

  // Expert Belt — SE only
  if (a.item === "expert-belt" && eff > 1) {
    dmg = Math.floor(dmg * 1.2); notes.push("Expert Belt ×1.2 SE");
  }

  // Burn — halves physical (Guts ignores; Facade unaffected — not modeled)
  if (isPhysical && a.status === "burn" && a.ability !== "guts") {
    dmg = Math.floor(dmg * 0.5); notes.push("Burn ×0.5");
  }

  // ── 16-roll variance ─────────────────────────────────────────────────────
  const rolls: number[] = [];
  for (let r = 85; r <= 100; r++) rolls.push(Math.floor((dmg * r) / 100));
  const min = rolls[0];
  const max = rolls[rolls.length - 1];

  // Hazard chip (informational — affects "is OHKO?" mentally, doesn't enter the formula)
  const hazardPct = hazardChipPct(d, field.hazards);

  return {
    rolls,
    min, max,
    defenderMaxHp: HP,
    minPct: +((100 * min) / HP).toFixed(1),
    maxPct: +((100 * max) / HP).toFixed(1),
    stab,
    effectiveness: eff,
    hazardChipPct: +hazardPct.toFixed(1),
    notes,
  };
}

function zeroResult(d: CalcInput["defender"], notes: string[] = []): CalcOutput {
  const HP = computeStat(d.hp, d.vpHp, d.nature, "atk", true);
  return {
    rolls: Array(16).fill(0),
    min: 0, max: 0,
    defenderMaxHp: HP,
    minPct: 0, maxPct: 0,
    stab: 1,
    effectiveness: 0,
    hazardChipPct: 0,
    notes,
  };
}
