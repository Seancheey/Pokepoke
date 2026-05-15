"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { TypeChip } from "@/components/TypeChip";
import { Combobox, type ComboboxOption } from "@/components/Combobox";
import type { PokemonType } from "@/lib/types";
import {
  calc,
  NATURES,
  natureEffect,
  type Weather,
  type Terrain,
  type Status,
  type Nature,
  type CalcOutput,
} from "@/lib/damage";
import { cn } from "@/lib/cn";

// ─── Reference types passed from the server page ─────────────────────────────

export type CalcRefPokemon = {
  slug: string;
  name: string;
  type1: string;
  type2: string | null;
  spriteUrl: string;
  hp: number; atk: number; def: number; spa: number; spd: number; spe: number;
  abilities: string[];
  hiddenAbility: string | null;
  learnableMoves: string[];
  usagePct: number;
  usage: {
    topAbilities: Array<{ slug: string; pct: number }>;
    topItems: Array<{ slug: string; pct: number }>;
    topMoves: Array<{ slug: string; pct: number }>;
    topSpreads: Array<{
      nature: string;
      vp: [number, number, number, number, number, number];
      pct: number;
    }>;
  } | null;
};
export type CalcRefMove = {
  slug: string; name: string; type: string;
  category: string; // "physical" | "special" | "status"
  power: number;
  targetShape: string;
};
export type CalcRefAbility = { slug: string; name: string };
export type CalcRefItem = { slug: string; name: string };

// ─── Side state ──────────────────────────────────────────────────────────────

type SideState = {
  slug: string;
  ability: string;
  item: string;
  nature: Nature;
  status: Status;
  hpPct: number;
  vp: [number, number, number, number, number, number]; // hp/atk/def/spa/spd/spe
  stageAtk: number;
  stageDef: number;
  stageSpa: number;
  stageSpd: number;
};

function defaultSide(p: CalcRefPokemon | undefined, attacking: boolean): SideState {
  const top = p?.usage;
  const ability = top?.topAbilities[0]?.slug ?? p?.abilities[0] ?? "";
  const item = top?.topItems[0]?.slug ?? "";
  const spread = top?.topSpreads[0];
  const nature = (spread?.nature ?? (attacking ? "Adamant" : "Bold")) as Nature;
  // Default EV: top spread for attacker, defensive baseline for defender
  const vp: [number, number, number, number, number, number] = spread
    ? spread.vp
    : attacking
    ? [2, 32, 0, 0, 0, 32]
    : [32, 0, 32, 0, 2, 0];
  return {
    slug: p?.slug ?? "",
    ability, item, nature,
    status: "none",
    hpPct: 100,
    vp,
    stageAtk: 0, stageDef: 0, stageSpa: 0, stageSpd: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export function DamageCalcClient({
  pokemon,
  moves,
  abilities,
  items,
}: {
  pokemon: CalcRefPokemon[];
  moves: CalcRefMove[];
  abilities: CalcRefAbility[];
  items: CalcRefItem[];
}) {
  const t = useTranslations("DamageCalc");

  const monBySlug = useMemo(
    () => new Map(pokemon.map((p) => [p.slug, p])),
    [pokemon],
  );
  const abilityBySlug = useMemo(
    () => new Map(abilities.map((a) => [a.slug, a])),
    [abilities],
  );
  const itemBySlug = useMemo(() => new Map(items.map((i) => [i.slug, i])), [items]);
  const moveBySlug = useMemo(() => new Map(moves.map((m) => [m.slug, m])), [moves]);

  // Default to top-2 mons in the meta — keeps it interesting on first load.
  const topMons = useMemo(
    () => [...pokemon].sort((a, b) => b.usagePct - a.usagePct),
    [pokemon],
  );
  const [atk, setAtk] = useState<SideState>(() =>
    defaultSide(topMons[0], true),
  );
  const [def, setDef] = useState<SideState>(() =>
    defaultSide(topMons[1], false),
  );
  const [moveSlug, setMoveSlug] = useState<string>(() => {
    const top = topMons[0]?.usage?.topMoves.find(
      (m) => moveBySlug.get(m.slug)?.category !== "status",
    );
    return top?.slug ?? "";
  });

  const [weather, setWeather] = useState<Weather>("none");
  const [terrain, setTerrain] = useState<Terrain>("none");
  const [format, setFormat] = useState<"singles" | "doubles">("doubles");
  const [crit, setCrit] = useState(false);
  const [helpingHand, setHelpingHand] = useState(false);
  const [reflect, setReflect] = useState(false);
  const [lightScreen, setLightScreen] = useState(false);
  const [auroraVeil, setAuroraVeil] = useState(false);
  const [stealthRock, setStealthRock] = useState(false);
  const [spikes, setSpikes] = useState<0 | 1 | 2 | 3>(0);

  // When attacker species changes, refresh defaults
  function pickAttackerSpecies(slug: string) {
    const p = monBySlug.get(slug);
    setAtk(defaultSide(p, true));
    // Switch move to that mon's top damage move if possible
    const learn = new Set(p?.learnableMoves);
    const top = p?.usage?.topMoves.find(
      (m) =>
        learn.has(m.slug) &&
        moveBySlug.get(m.slug)?.category !== "status",
    );
    if (top) setMoveSlug(top.slug);
  }

  function pickDefenderSpecies(slug: string) {
    setDef(defaultSide(monBySlug.get(slug), false));
  }

  const attackerMon = monBySlug.get(atk.slug);
  const defenderMon = monBySlug.get(def.slug);
  const move = moveBySlug.get(moveSlug);

  const result: CalcOutput | null = useMemo(() => {
    if (!attackerMon || !defenderMon || !move) return null;
    if (move.category === "status" || move.power <= 0) return null;
    return calc({
      attacker: {
        types: [attackerMon.type1 as PokemonType, attackerMon.type2 as PokemonType | null],
        atk: attackerMon.atk, spa: attackerMon.spa,
        vpAtk: atk.vp[1], vpSpa: atk.vp[3],
        nature: atk.nature,
        ability: atk.ability || undefined,
        item: atk.item || undefined,
        status: atk.status,
        stageAtk: atk.stageAtk, stageSpa: atk.stageSpa,
      },
      defender: {
        types: [defenderMon.type1 as PokemonType, defenderMon.type2 as PokemonType | null],
        hp: defenderMon.hp, def: defenderMon.def, spd: defenderMon.spd,
        vpHp: def.vp[0], vpDef: def.vp[2], vpSpd: def.vp[4],
        nature: def.nature,
        ability: def.ability || undefined,
        item: def.item || undefined,
        stageDef: def.stageDef, stageSpd: def.stageSpd,
        hpPct: def.hpPct,
      },
      move: {
        slug: move.slug,
        type: move.type as PokemonType,
        category: move.category as "physical" | "special",
        power: move.power,
        targetShape: move.targetShape,
      },
      field: {
        weather, terrain, format, crit, helpingHand,
        screens: { reflect, lightScreen, auroraVeil },
        hazards: { stealthRock, spikes, toxicSpikes: 0 },
      },
    });
  }, [
    attackerMon, defenderMon, move, atk, def,
    weather, terrain, format, crit, helpingHand,
    reflect, lightScreen, auroraVeil, stealthRock, spikes,
  ]);

  const speciesOptions: ComboboxOption[] = useMemo(
    () =>
      pokemon.map((p) => ({
        value: p.slug,
        label: p.name,
        searchText: p.slug,
        usagePct: p.usagePct > 0 ? p.usagePct : undefined,
        prefix: (
          <Image
            src={p.spriteUrl}
            alt=""
            width={24}
            height={24}
            unoptimized
            className="h-6 w-6 object-contain"
          />
        ),
        suffix: (
          <span className="ml-1 inline-flex gap-1">
            <TypeChip type={p.type1 as PokemonType} size="sm" />
            {p.type2 ? <TypeChip type={p.type2 as PokemonType} size="sm" /> : null}
          </span>
        ),
      })),
    [pokemon],
  );

  // Move options scoped to attacker's learnset, damage moves only.
  const moveOptions: ComboboxOption[] = useMemo(() => {
    if (!attackerMon) return [];
    const learn = new Set(attackerMon.learnableMoves);
    const pctByMove = new Map(attackerMon.usage?.topMoves.map((m) => [m.slug, m.pct]) ?? []);
    return moves
      .filter((m) => m.category !== "status" && m.power > 0 && learn.has(m.slug))
      .map((m) => ({
        value: m.slug,
        label: `${m.name} · ${m.type} · ${m.power}`,
        searchText: m.slug,
        usagePct: pctByMove.get(m.slug),
      }));
  }, [attackerMon, moves]);

  return (
    <div>
      <header>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>
      </header>

      {/* Move selector */}
      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t("moveLabel")}
          </span>
          <div className="mt-1">
            <Combobox
              value={moveSlug}
              options={moveOptions}
              onChange={setMoveSlug}
              placeholder={t("movePlaceholder")}
              ariaLabel={t("moveLabel")}
              allowClear
            />
          </div>
        </label>
      </section>

      {/* Two-side grid */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <SidePanel
          title={t("attacker")}
          side={atk}
          setSide={setAtk}
          mon={attackerMon}
          speciesOptions={speciesOptions}
          onSpeciesChange={pickAttackerSpecies}
          abilities={abilities}
          abilityBySlug={abilityBySlug}
          items={items}
          itemBySlug={itemBySlug}
          isAttacker
        />
        <SidePanel
          title={t("defender")}
          side={def}
          setSide={setDef}
          mon={defenderMon}
          speciesOptions={speciesOptions}
          onSpeciesChange={pickDefenderSpecies}
          abilities={abilities}
          abilityBySlug={abilityBySlug}
          items={items}
          itemBySlug={itemBySlug}
        />
      </div>

      {/* Field strip */}
      <FieldStrip
        weather={weather} setWeather={setWeather}
        terrain={terrain} setTerrain={setTerrain}
        format={format} setFormat={setFormat}
        crit={crit} setCrit={setCrit}
        helpingHand={helpingHand} setHelpingHand={setHelpingHand}
        reflect={reflect} setReflect={setReflect}
        lightScreen={lightScreen} setLightScreen={setLightScreen}
        auroraVeil={auroraVeil} setAuroraVeil={setAuroraVeil}
        stealthRock={stealthRock} setStealthRock={setStealthRock}
        spikes={spikes} setSpikes={setSpikes}
      />

      <ResultCard
        result={result} move={move} attacker={attackerMon} defender={defenderMon}
      />
    </div>
  );
}

// ─── Side panel ──────────────────────────────────────────────────────────────

function SidePanel({
  title,
  side,
  setSide,
  mon,
  speciesOptions,
  onSpeciesChange,
  abilities,
  abilityBySlug,
  items,
  itemBySlug,
  isAttacker,
}: {
  title: string;
  side: SideState;
  setSide: React.Dispatch<React.SetStateAction<SideState>>;
  mon: CalcRefPokemon | undefined;
  speciesOptions: ComboboxOption[];
  onSpeciesChange: (slug: string) => void;
  abilities: CalcRefAbility[];
  abilityBySlug: Map<string, CalcRefAbility>;
  items: CalcRefItem[];
  itemBySlug: Map<string, CalcRefItem>;
  isAttacker?: boolean;
}) {
  const t = useTranslations("DamageCalc");
  const tNature = useTranslations("Natures");
  const tStat = useTranslations("StatShort");

  const pctByAbility = new Map(mon?.usage?.topAbilities.map((a) => [a.slug, a.pct]) ?? []);
  const pctByItem = new Map(mon?.usage?.topItems.map((i) => [i.slug, i.pct]) ?? []);

  const validAbilities = mon
    ? [...mon.abilities, ...(mon.hiddenAbility ? [mon.hiddenAbility] : [])]
    : [];
  const abilityOptions: ComboboxOption[] = validAbilities.map((slug) => ({
    value: slug,
    label: abilityBySlug.get(slug)?.name ?? slug,
    usagePct: pctByAbility.get(slug),
    suffix: mon?.hiddenAbility === slug ? "★" : null,
  }));

  const itemOptions: ComboboxOption[] = items.map((it) => ({
    value: it.slug,
    label: it.name,
    searchText: it.slug,
    usagePct: pctByItem.get(it.slug),
  }));

  const natureOptions: ComboboxOption[] = NATURES.map((n) => {
    const { up, down } = natureEffect(n);
    const localized = tNature(n as never);
    const effectText = up && down
      ? ` +${tStat(up)} −${tStat(down)}`
      : ` ${tNature("neutralSuffix")}`;
    return {
      value: n,
      label: localized + effectText,
      // Allow searching by raw English name even when UI is non-English.
      searchText: `${n.toLowerCase()} ${localized}`,
    };
  });

  const statuses: Status[] = ["none", "burn", "paralysis", "poison", "toxic", "sleep", "freeze"];
  const statusOptions: ComboboxOption[] = statuses.map((s) => ({
    value: s,
    label: t(`status${s.charAt(0).toUpperCase()}${s.slice(1)}` as `status${Capitalize<Status>}`),
  }));

  function setStage(key: "stageAtk" | "stageDef" | "stageSpa" | "stageSpd", value: number) {
    setSide((s) => ({ ...s, [key]: Math.max(-6, Math.min(6, value)) }));
  }

  // Show offensive stages for attacker, defensive for defender
  const stageRows: Array<{ key: "stageAtk" | "stageDef" | "stageSpa" | "stageSpd"; label: string }> = isAttacker
    ? [
        { key: "stageAtk", label: "Atk" },
        { key: "stageSpa", label: "SpA" },
      ]
    : [
        { key: "stageDef", label: "Def" },
        { key: "stageSpd", label: "SpD" },
      ];

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">{title}</h2>

      <div className="mt-3 flex items-center gap-3">
        {mon ? (
          <Image
            src={mon.spriteUrl}
            width={48}
            height={48}
            alt={mon.name}
            unoptimized
            className="h-12 w-12 shrink-0 object-contain"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <Combobox
            value={side.slug}
            options={speciesOptions}
            onChange={onSpeciesChange}
            placeholder={t("speciesPlaceholder")}
            ariaLabel={t("speciesLabel")}
          />
          {mon ? (
            <div className="mt-2 flex flex-wrap gap-1">
              <TypeChip type={mon.type1 as PokemonType} size="sm" />
              {mon.type2 ? <TypeChip type={mon.type2 as PokemonType} size="sm" /> : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <SmallField label={t("abilityLabel")}>
          <Combobox
            value={side.ability}
            options={abilityOptions}
            onChange={(v) => setSide((s) => ({ ...s, ability: v }))}
            placeholder={t("abilityPlaceholder")}
            allowClear
          />
        </SmallField>
        <SmallField label={t("itemLabel")}>
          <Combobox
            value={side.item}
            options={itemOptions}
            onChange={(v) => setSide((s) => ({ ...s, item: v }))}
            placeholder={t("itemPlaceholder")}
            allowClear
          />
        </SmallField>
        <SmallField label={t("natureLabel")}>
          <Combobox
            value={side.nature}
            options={natureOptions}
            onChange={(v) => setSide((s) => ({ ...s, nature: v as Nature }))}
            placeholder={t("natureLabel")}
          />
        </SmallField>
        <SmallField label={t("statusLabel")}>
          <Combobox
            value={side.status}
            options={statusOptions}
            onChange={(v) => setSide((s) => ({ ...s, status: v as Status }))}
            placeholder={t("statusLabel")}
          />
        </SmallField>
      </div>

      {/* EV inputs (compact: only the relevant offensive/defensive ones get full attention) */}
      <div className="mt-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {t("evLabel")}
        </div>
        <div className="mt-1 grid grid-cols-3 gap-1.5 text-xs">
          {(["HP","Atk","Def","SpA","SpD","Spe"] as const).map((label, i) => (
            <label key={label} className="flex items-center gap-1">
              <span className="w-8 shrink-0 text-zinc-500">{label}</span>
              <input
                type="number" min={0} max={32} step={1}
                value={side.vp[i]}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(32, parseInt(e.target.value) || 0));
                  setSide((s) => {
                    const next = [...s.vp] as [number, number, number, number, number, number];
                    next[i] = v;
                    return { ...s, vp: next };
                  });
                }}
                className="w-full rounded-md border border-zinc-300 bg-white px-1 py-0.5 text-right font-mono tabular-nums dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Stat stage steppers */}
      <div className="mt-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {t("stageLabel")}
        </div>
        <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
          {stageRows.map((row) => (
            <div key={row.key} className="flex items-center justify-between rounded-md border border-zinc-300 px-2 py-0.5 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setStage(row.key, side[row.key] - 1)}
                className="h-5 w-5 rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label={`Decrease ${row.label}`}
              >−</button>
              <span className="font-mono tabular-nums">
                {row.label} {side[row.key] > 0 ? "+" : ""}{side[row.key]}
              </span>
              <button
                type="button"
                onClick={() => setStage(row.key, side[row.key] + 1)}
                className="h-5 w-5 rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label={`Increase ${row.label}`}
              >+</button>
            </div>
          ))}
        </div>
      </div>

      {/* HP % (defender only) */}
      {!isAttacker ? (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-zinc-500">
            {t("hpPctLabel")}:
          </span>
          <input
            type="range" min={1} max={100} step={1}
            value={side.hpPct}
            onChange={(e) =>
              setSide((s) => ({ ...s, hpPct: parseInt(e.target.value) }))
            }
            className="flex-1"
          />
          <span className="w-10 text-right font-mono tabular-nums">{side.hpPct}%</span>
        </div>
      ) : null}
    </article>
  );
}

function SmallField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}

// ─── Field strip ─────────────────────────────────────────────────────────────

function FieldStrip(props: {
  weather: Weather; setWeather: (w: Weather) => void;
  terrain: Terrain; setTerrain: (t: Terrain) => void;
  format: "singles" | "doubles"; setFormat: (f: "singles" | "doubles") => void;
  crit: boolean; setCrit: (b: boolean) => void;
  helpingHand: boolean; setHelpingHand: (b: boolean) => void;
  reflect: boolean; setReflect: (b: boolean) => void;
  lightScreen: boolean; setLightScreen: (b: boolean) => void;
  auroraVeil: boolean; setAuroraVeil: (b: boolean) => void;
  stealthRock: boolean; setStealthRock: (b: boolean) => void;
  spikes: 0 | 1 | 2 | 3; setSpikes: (n: 0 | 1 | 2 | 3) => void;
}) {
  const t = useTranslations("DamageCalc");

  return (
    <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">{t("field")}</h2>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <Pill label={t("weather")}>
          <select
            value={props.weather}
            onChange={(e) => props.setWeather(e.target.value as Weather)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="none">{t("weatherNone")}</option>
            <option value="sun">{t("weatherSun")}</option>
            <option value="rain">{t("weatherRain")}</option>
            <option value="sand">{t("weatherSand")}</option>
            <option value="snow">{t("weatherSnow")}</option>
          </select>
        </Pill>
        <Pill label={t("terrain")}>
          <select
            value={props.terrain}
            onChange={(e) => props.setTerrain(e.target.value as Terrain)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="none">{t("terrainNone")}</option>
            <option value="electric">{t("terrainElectric")}</option>
            <option value="grassy">{t("terrainGrassy")}</option>
            <option value="psychic">{t("terrainPsychic")}</option>
            <option value="misty">{t("terrainMisty")}</option>
          </select>
        </Pill>
        <Pill label={t("format")}>
          <select
            value={props.format}
            onChange={(e) => props.setFormat(e.target.value as "singles" | "doubles")}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="doubles">{t("formatDoubles")}</option>
            <option value="singles">{t("formatSingles")}</option>
          </select>
        </Pill>
        <CheckChip checked={props.crit} onChange={props.setCrit} label={t("crit")} />
        <CheckChip checked={props.helpingHand} onChange={props.setHelpingHand} label={t("helpingHand")} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {t("screens")}:
        </span>
        <CheckChip checked={props.reflect} onChange={props.setReflect} label={t("reflect")} />
        <CheckChip checked={props.lightScreen} onChange={props.setLightScreen} label={t("lightScreen")} />
        <CheckChip checked={props.auroraVeil} onChange={props.setAuroraVeil} label={t("auroraVeil")} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {t("hazards")}:
        </span>
        <CheckChip checked={props.stealthRock} onChange={props.setStealthRock} label={t("stealthRock")} />
        <Pill label={t("spikes")}>
          <select
            value={props.spikes}
            onChange={(e) => props.setSpikes(parseInt(e.target.value) as 0 | 1 | 2 | 3)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </Pill>
      </div>
    </section>
  );
}

function Pill({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}:
      </span>
      {children}
    </label>
  );
}

function CheckChip({
  checked, onChange, label,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        checked
          ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
          : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {label}
    </label>
  );
}

// ─── Result panel ────────────────────────────────────────────────────────────

function ResultCard({
  result, move, attacker, defender,
}: {
  result: CalcOutput | null;
  move: CalcRefMove | undefined;
  attacker: CalcRefPokemon | undefined;
  defender: CalcRefPokemon | undefined;
}) {
  const t = useTranslations("DamageCalc");

  if (!result || !move || !attacker || !defender) {
    return (
      <section className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
        {t("noResult")}
      </section>
    );
  }

  const effLabel =
    result.effectiveness === 0
      ? "×0 (immune)"
      : `×${result.effectiveness}`;
  const effTone =
    result.effectiveness === 0
      ? "text-zinc-500"
      : result.effectiveness >= 2
      ? "text-emerald-600 font-bold"
      : result.effectiveness <= 0.5
      ? "text-amber-600"
      : "text-zinc-600";

  return (
    <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-bold">{t("result")}</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label={t("minMax")} value={`${result.min} – ${result.max}`} />
        <Stat label={t("pctRange")} value={`${result.minPct}% – ${result.maxPct}%`} />
        <Stat label={t("stab")} value={`×${result.stab}`} />
        <Stat label={t("effectiveness")} value={effLabel} className={effTone} />
        <Stat
          label={t("hazardChip")}
          value={`-${result.hazardChipPct}%`}
          className={result.hazardChipPct > 0 ? "text-amber-600" : "text-zinc-400"}
        />
      </div>

      {/* Roll histogram */}
      <div className="mt-5">
        <div className="flex items-end gap-0.5">
          {result.rolls.map((r, i) => {
            const pct = result.max === 0 ? 0 : (r / result.max) * 100;
            return (
              <div
                key={i}
                title={`${r} (${((100 * r) / result.defenderMaxHp).toFixed(1)}%)`}
                className={cn(
                  "flex-1 rounded-t bg-gradient-to-t from-red-500 to-amber-400",
                  result.effectiveness === 0 && "from-zinc-300 to-zinc-200",
                )}
                style={{ height: `${Math.max(4, pct)}px` }}
              />
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
          <span>85%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Modifier trace */}
      <div className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {t("modifiers")}
        </h3>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {result.notes.length === 0 ? (
            <li className="text-xs italic text-zinc-400">{t("noModifiers")}</li>
          ) : (
            result.notes.map((n, i) => (
              <li
                key={i}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {n}
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}

function Stat({
  label, value, className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={cn("mt-1 font-mono text-base tabular-nums", className)}>{value}</div>
    </div>
  );
}
