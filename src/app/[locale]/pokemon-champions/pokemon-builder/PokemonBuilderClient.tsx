"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { TypeChip } from "@/components/TypeChip";
import { Combobox, type ComboboxOption } from "@/components/Combobox";
import type { PokemonType } from "@/lib/types";
import {
  calc,
  computeStat,
  NATURES,
  natureEffect,
  type Nature,
  type CalcInput,
} from "@/lib/damage";
import { cn } from "@/lib/cn";

export type BuilderRefPokemon = {
  slug: string;
  name: string;
  type1: string;
  type2: string | null;
  spriteUrl: string;
  abilities: string[];
  hiddenAbility: string | null;
  hp: number; atk: number; def: number; spa: number; spd: number; spe: number;
  learnableMoves: string[];
  usagePct: number;
  usage: PokemonUsage | null;
};
export type PokemonUsage = {
  topAbilities: Array<{ slug: string; pct: number }>;
  topItems: Array<{ slug: string; pct: number }>;
  topMoves: Array<{ slug: string; pct: number }>;
  topSpreads: Array<{
    nature: string;
    vp: [number, number, number, number, number, number];
    pct: number;
  }>;
  source?: string;
};
export type BuilderRefMove = {
  slug: string;
  name: string;
  type: string;
  category: "physical" | "special" | "status";
  power: number | null;
  targetShape: string;
};
export type BuilderRefAbility = { slug: string; name: string };
export type BuilderRefItem = { slug: string; name: string };

const PER_STAT_CAP = 32;
const MAX_EV_TOTAL = 66;
const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
type StatKey = (typeof STAT_KEYS)[number];

type Build = {
  slug: string;
  ability: string;
  item: string;
  nature: Nature;
  moves: string[];           // length 4, "" for empty
  ev: [number, number, number, number, number, number];
  stages: { atk: number; def: number; spa: number; spd: number; spe: number };
};

// ─────────────────────────────────────────────────────────────────────────────

export function PokemonBuilderClient({
  pokemon,
  moves,
  abilities,
  items,
}: {
  pokemon: BuilderRefPokemon[];
  moves: BuilderRefMove[];
  abilities: BuilderRefAbility[];
  items: BuilderRefItem[];
}) {
  const t = useTranslations("PokemonBuilder");
  const tStat = useTranslations("TeamBuilder.evStat");

  const pokemonBySlug = useMemo(() => new Map(pokemon.map((p) => [p.slug, p])), [pokemon]);
  const moveBySlug = useMemo(() => new Map(moves.map((m) => [m.slug, m])), [moves]);
  const abilityBySlug = useMemo(() => new Map(abilities.map((a) => [a.slug, a])), [abilities]);
  const itemBySlug = useMemo(() => new Map(items.map((i) => [i.slug, i])), [items]);

  const top30 = useMemo(
    () => pokemon.filter((p) => p.usagePct > 0).slice(0, 30),
    [pokemon],
  );

  const [build, setBuild] = useState<Build | null>(null);
  const [customSlugs, setCustomSlugs] = useState<string[]>([]);

  // Targets: top 30 + custom additions (deduped, custom appended in order)
  const targets = useMemo(() => {
    const seen = new Set(top30.map((p) => p.slug));
    const customs = customSlugs
      .map((s) => pokemonBySlug.get(s))
      .filter((p): p is BuilderRefPokemon => !!p && !seen.has(p.slug));
    return [...top30, ...customs];
  }, [top30, customSlugs, pokemonBySlug]);

  function selectPokemon(slug: string) {
    const p = pokemonBySlug.get(slug);
    if (!p) return;
    const u = p.usage;
    const validAbilities = new Set([...p.abilities, ...(p.hiddenAbility ? [p.hiddenAbility] : [])]);
    const topAbility = u?.topAbilities.find((a) => validAbilities.has(a.slug))?.slug;
    const topItem = u?.topItems[0]?.slug ?? "";
    const learnable = new Set(p.learnableMoves);
    const topMoves: string[] = [];
    for (const m of u?.topMoves ?? []) {
      if (!learnable.has(m.slug)) continue;
      topMoves.push(m.slug);
      if (topMoves.length === 4) break;
    }
    while (topMoves.length < 4) topMoves.push("");
    const topSpread = u?.topSpreads[0];
    const nature = (topSpread?.nature ?? "Adamant") as Nature;
    const ev = (topSpread?.vp ?? [0, 0, 0, 0, 0, 0]) as Build["ev"];
    setBuild({
      slug,
      ability: topAbility ?? p.abilities[0] ?? "",
      item: topItem,
      nature,
      moves: topMoves,
      ev,
      stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    });
  }

  const pickerOptions: ComboboxOption[] = useMemo(
    () => pokemon
      .filter((p) => p.usagePct >= 0)
      .map((p) => ({
        value: p.slug,
        label: p.name,
        searchText: p.slug,
        usagePct: p.usagePct,
        prefix: (
          <Image src={p.spriteUrl} alt="" width={28} height={28} unoptimized />
        ),
      })),
    [pokemon],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
      </header>

      {!build ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-semibold">{t("pickPrompt")}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t("pickHint")}</p>
          <div className="mt-4 max-w-md">
            <Combobox
              value=""
              onChange={selectPokemon}
              options={pickerOptions}
              placeholder={t("speciesPlaceholder")}
            />
          </div>
        </section>
      ) : (
        <BuilderBody
          build={build}
          setBuild={setBuild}
          pokemonBySlug={pokemonBySlug}
          moveBySlug={moveBySlug}
          abilityBySlug={abilityBySlug}
          itemBySlug={itemBySlug}
          pickerOptions={pickerOptions}
          allMoves={moves}
          allAbilities={abilities}
          allItems={items}
          targets={targets}
          customSlugs={customSlugs}
          setCustomSlugs={setCustomSlugs}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function BuilderBody({
  build,
  setBuild,
  pokemonBySlug,
  moveBySlug,
  abilityBySlug,
  itemBySlug,
  pickerOptions,
  allMoves,
  allAbilities,
  allItems,
  targets,
  customSlugs,
  setCustomSlugs,
}: {
  build: Build;
  setBuild: (b: Build | null | ((prev: Build | null) => Build | null)) => void;
  pokemonBySlug: Map<string, BuilderRefPokemon>;
  moveBySlug: Map<string, BuilderRefMove>;
  abilityBySlug: Map<string, BuilderRefAbility>;
  itemBySlug: Map<string, BuilderRefItem>;
  pickerOptions: ComboboxOption[];
  allMoves: BuilderRefMove[];
  allAbilities: BuilderRefAbility[];
  allItems: BuilderRefItem[];
  targets: BuilderRefPokemon[];
  customSlugs: string[];
  setCustomSlugs: (s: string[] | ((prev: string[]) => string[])) => void;
}) {
  const t = useTranslations("PokemonBuilder");
  const tStat = useTranslations("TeamBuilder.evStat");
  const p = pokemonBySlug.get(build.slug);
  if (!p) return null;

  function update(mut: (b: Build) => Build) {
    setBuild((prev) => (prev ? mut(prev) : prev));
  }

  // Reset to a fresh species pick — clears all overrides.
  function reset() { setBuild(null); }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <ConfigPanel
        p={p}
        build={build}
        update={update}
        reset={reset}
        moveBySlug={moveBySlug}
        abilityBySlug={abilityBySlug}
        itemBySlug={itemBySlug}
        pickerOptions={pickerOptions}
        allMoves={allMoves}
        allAbilities={allAbilities}
        allItems={allItems}
        setBuild={setBuild}
        pokemonBySlug={pokemonBySlug}
      />
      <div className="space-y-6 min-w-0">
        <ComputedStatsCard p={p} build={build} />
        <SpeedTierCard p={p} build={build} targets={targets} />
        <OffenseMatrixCard
          p={p}
          build={build}
          targets={targets}
          moveBySlug={moveBySlug}
          pokemonBySlug={pokemonBySlug}
        />
        <DefenseMatrixCard
          p={p}
          build={build}
          targets={targets}
          moveBySlug={moveBySlug}
        />
        <CustomTargetsCard
          customSlugs={customSlugs}
          setCustomSlugs={setCustomSlugs}
          pickerOptions={pickerOptions}
          pokemonBySlug={pokemonBySlug}
        />
      </div>
    </div>
  );
}

// ─── Config panel ────────────────────────────────────────────────────────────

function ConfigPanel({
  p,
  build,
  update,
  reset,
  setBuild,
  moveBySlug,
  abilityBySlug,
  itemBySlug,
  pickerOptions,
  allMoves,
  allAbilities,
  allItems,
  pokemonBySlug,
}: {
  p: BuilderRefPokemon;
  build: Build;
  update: (mut: (b: Build) => Build) => void;
  reset: () => void;
  setBuild: (b: Build | null | ((prev: Build | null) => Build | null)) => void;
  moveBySlug: Map<string, BuilderRefMove>;
  abilityBySlug: Map<string, BuilderRefAbility>;
  itemBySlug: Map<string, BuilderRefItem>;
  pickerOptions: ComboboxOption[];
  allMoves: BuilderRefMove[];
  allAbilities: BuilderRefAbility[];
  allItems: BuilderRefItem[];
  pokemonBySlug: Map<string, BuilderRefPokemon>;
}) {
  const t = useTranslations("PokemonBuilder");
  const tStat = useTranslations("TeamBuilder.evStat");
  const tStatShort = useTranslations("StatShort");
  const tNature = useTranslations("Natures");

  const validAbilities = useMemo(() => {
    const arr = [...p.abilities];
    if (p.hiddenAbility && !arr.includes(p.hiddenAbility)) arr.push(p.hiddenAbility);
    return arr;
  }, [p]);
  const pctByMove = useMemo(
    () => new Map(p.usage?.topMoves.map((m) => [m.slug, m.pct]) ?? []),
    [p],
  );
  const pctByAbility = useMemo(
    () => new Map(p.usage?.topAbilities.map((a) => [a.slug, a.pct]) ?? []),
    [p],
  );
  const pctByItem = useMemo(
    () => new Map(p.usage?.topItems.map((i) => [i.slug, i.pct]) ?? []),
    [p],
  );

  const abilityOptions: ComboboxOption[] = validAbilities.map((a) => {
    const ref = abilityBySlug.get(a);
    return {
      value: a,
      label: ref?.name ?? a,
      searchText: a,
      usagePct: pctByAbility.get(a),
      suffix: p.hiddenAbility === a ? "★" : null,
    };
  });
  const itemOptions: ComboboxOption[] = allItems.map((it) => ({
    value: it.slug,
    label: it.name,
    searchText: it.slug,
    usagePct: pctByItem.get(it.slug),
  }));
  const learnable = useMemo(() => new Set(p.learnableMoves), [p]);
  const moveOptions: ComboboxOption[] = allMoves
    .filter((m) => learnable.has(m.slug))
    .map((m) => ({
      value: m.slug,
      label: m.name,
      searchText: m.slug,
      usagePct: pctByMove.get(m.slug),
    }));

  const ev = build.ev;
  const totalEv = ev.reduce((a, b) => a + b, 0);
  const remaining = MAX_EV_TOTAL - totalEv;
  const natureOptions: ComboboxOption[] = NATURES.map((n) => {
    const { up, down } = natureEffect(n);
    const localized = tNature(n as never);
    const annot = up && down
      ? ` +${tStatShort(up)} −${tStatShort(down)}`
      : ` ${tNature("neutralSuffix")}`;
    return { value: n, label: localized + annot, searchText: n };
  });

  return (
    <aside className="sticky top-24 self-start space-y-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <Image src={p.spriteUrl} alt={p.name} width={60} height={60} unoptimized />
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-bold">{p.name}</div>
          <div className="mt-1 flex gap-1">
            <TypeChip type={p.type1 as PokemonType} size="sm" />
            {p.type2 ? <TypeChip type={p.type2 as PokemonType} size="sm" /> : null}
          </div>
        </div>
        <button
          onClick={reset}
          className="rounded-md p-1 text-xs text-zinc-400 hover:text-red-600"
          title={t("changeSpecies")}
        >
          ✕
        </button>
      </div>

      {/* Switch species */}
      <div>
        <Label>{t("species")}</Label>
        <Combobox
          value={build.slug}
          onChange={(slug) => {
            const np = pokemonBySlug.get(slug);
            if (!np) return;
            // Re-auto-fill from the new species' usage data
            const u = np.usage;
            const valid = new Set([...np.abilities, ...(np.hiddenAbility ? [np.hiddenAbility] : [])]);
            const topAb = u?.topAbilities.find((a) => valid.has(a.slug))?.slug;
            const topIt = u?.topItems[0]?.slug ?? "";
            const lset = new Set(np.learnableMoves);
            const tm: string[] = [];
            for (const m of u?.topMoves ?? []) {
              if (!lset.has(m.slug)) continue;
              tm.push(m.slug);
              if (tm.length === 4) break;
            }
            while (tm.length < 4) tm.push("");
            const sp = u?.topSpreads[0];
            setBuild({
              slug,
              ability: topAb ?? np.abilities[0] ?? "",
              item: topIt,
              nature: (sp?.nature ?? "Adamant") as Nature,
              moves: tm,
              ev: (sp?.vp ?? [0, 0, 0, 0, 0, 0]) as Build["ev"],
              stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
            });
          }}
          options={pickerOptions}
        />
      </div>

      <div>
        <Label>{t("ability")}</Label>
        <Combobox
          value={build.ability}
          onChange={(v) => update((b) => ({ ...b, ability: v }))}
          options={abilityOptions}
        />
      </div>

      <div>
        <Label>{t("item")}</Label>
        <Combobox
          value={build.item}
          onChange={(v) => update((b) => ({ ...b, item: v }))}
          options={itemOptions}
          allowClear
        />
      </div>

      <div>
        <Label>{t("nature")}</Label>
        <Combobox
          value={build.nature}
          onChange={(v) => update((b) => ({ ...b, nature: v as Nature }))}
          options={natureOptions}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("moves")}</Label>
        {[0, 1, 2, 3].map((i) => (
          <Combobox
            key={i}
            value={build.moves[i] ?? ""}
            onChange={(v) => update((b) => {
              const m = [...b.moves];
              m[i] = v;
              return { ...b, moves: m };
            })}
            options={moveOptions}
            placeholder={`${t("moveSlot")} ${i + 1}`}
            allowClear
          />
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between text-xs">
          <Label>{t("evs")}</Label>
          <span
            className={cn(
              "font-mono tabular-nums",
              remaining < 0 ? "font-bold text-red-600"
              : remaining === 0 ? "text-emerald-600"
              : "text-zinc-500",
            )}
          >
            {remaining < 0 ? `+${-remaining} ${t("over")}` : `${remaining} ${t("left")}`}
          </span>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-1.5 text-xs">
          {STAT_KEYS.map((k, i) => (
            <label key={k} className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 font-semibold uppercase text-zinc-500">
                {tStat(k as StatKey)}
              </span>
              <input
                type="number"
                min={0}
                max={PER_STAT_CAP}
                step={1}
                value={ev[i] ?? 0}
                onChange={(e) => update((b) => {
                  const v = Math.max(0, Math.min(PER_STAT_CAP, parseInt(e.target.value) || 0));
                  const next = [...b.ev] as Build["ev"];
                  next[i] = v;
                  return { ...b, ev: next };
                })}
                className="w-full rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 text-right font-mono tabular-nums dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>{t("stages")}</Label>
        <div className="mt-1 grid grid-cols-2 gap-1.5 text-xs">
          {(["atk","def","spa","spd","spe"] as const).map((k) => (
            <label key={k} className="flex items-center gap-1.5">
              <span className="w-10 shrink-0 font-semibold uppercase text-zinc-500">
                {tStat(k as StatKey)}
              </span>
              <Stepper
                value={build.stages[k]}
                min={-6}
                max={6}
                onChange={(v) => update((b) => ({ ...b, stages: { ...b.stages, [k]: v } }))}
              />
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
      {children}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const tone = value > 0 ? "text-emerald-600" : value < 0 ? "text-red-600" : "text-zinc-500";
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="rounded border border-zinc-300 px-1.5 leading-none dark:border-zinc-700"
      >−</button>
      <span className={cn("w-6 text-center font-mono tabular-nums", tone)}>
        {value > 0 ? `+${value}` : value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="rounded border border-zinc-300 px-1.5 leading-none dark:border-zinc-700"
      >+</button>
    </div>
  );
}

// ─── Computed stats ──────────────────────────────────────────────────────────

function ComputedStatsCard({ p, build }: { p: BuilderRefPokemon; build: Build }) {
  const t = useTranslations("PokemonBuilder");
  const tStat = useTranslations("TeamBuilder.evStat");

  const stats = useMemo(() => ({
    hp:  computeStat(p.hp,  build.ev[0], build.nature, "atk", true),
    atk: computeStat(p.atk, build.ev[1], build.nature, "atk", false),
    def: computeStat(p.def, build.ev[2], build.nature, "def", false),
    spa: computeStat(p.spa, build.ev[3], build.nature, "spa", false),
    spd: computeStat(p.spd, build.ev[4], build.nature, "spd", false),
    spe: computeStat(p.spe, build.ev[5], build.nature, "spe", false),
  }), [p, build.nature, build.ev]);
  const bst = p.hp + p.atk + p.def + p.spa + p.spd + p.spe;
  const fx = natureEffect(build.nature);

  return (
    <Card title={t("computedStats")}>
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
          <tr>
            <th className="px-2 py-1.5 text-left">{t("stat")}</th>
            <th className="px-2 py-1.5 text-right">{t("base")}</th>
            <th className="px-2 py-1.5 text-right">{t("ev")}</th>
            <th className="px-2 py-1.5 text-right">{t("computed")}</th>
          </tr>
        </thead>
        <tbody>
          {(["hp","atk","def","spa","spd","spe"] as const).map((k, i) => {
            const arrow = fx.up === k ? "▲" : fx.down === k ? "▼" : "";
            const arrowTone = fx.up === k ? "text-red-500" : fx.down === k ? "text-blue-500" : "";
            return (
              <tr key={k} className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800">
                <td className="px-2 py-1.5 font-semibold uppercase text-zinc-600 dark:text-zinc-400">
                  {tStat(k as StatKey)} <span className={arrowTone}>{arrow}</span>
                </td>
                <td className="px-2 py-1.5 text-right font-mono tabular-nums text-zinc-500">
                  {p[k]}
                </td>
                <td className="px-2 py-1.5 text-right font-mono tabular-nums text-zinc-500">
                  {build.ev[i]}
                </td>
                <td className="px-2 py-1.5 text-right font-mono tabular-nums font-bold">
                  {stats[k]}
                </td>
              </tr>
            );
          })}
          <tr>
            <td className="px-2 py-1.5 text-xs uppercase tracking-wider text-zinc-500">BST</td>
            <td className="px-2 py-1.5 text-right font-mono tabular-nums text-zinc-500">{bst}</td>
            <td colSpan={2}></td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}

// ─── Speed tier ──────────────────────────────────────────────────────────────

function SpeedTierCard({
  p,
  build,
  targets,
}: {
  p: BuilderRefPokemon;
  build: Build;
  targets: BuilderRefPokemon[];
}) {
  const t = useTranslations("PokemonBuilder");

  const [mods, setMods] = useState({ tailwind: false, scarf: false });
  // Stages already in build; expose Tailwind / Scarf as overlay multipliers.

  const mySpe = useMemo(() => {
    let s = computeStat(p.spe, build.ev[5], build.nature, "spe", false);
    s = Math.floor(s * stageMult(build.stages.spe));
    if (build.item === "choice-scarf" || mods.scarf) s = Math.floor(s * 1.5);
    if (mods.tailwind) s = Math.floor(s * 2);
    if (build.item === "iron-ball") s = Math.floor(s * 0.5);
    return s;
  }, [p, build, mods]);

  const rows = useMemo(() => {
    return targets.map((tp) => {
      const u = tp.usage;
      const spread = u?.topSpreads[0];
      const nat = (spread?.nature ?? "Hardy") as Nature;
      const ev = spread?.vp[5] ?? 0;
      let s = computeStat(tp.spe, ev, nat, "spe", false);
      if (u?.topItems[0]?.slug === "choice-scarf") s = Math.floor(s * 1.5);
      return { p: tp, spe: s };
    }).sort((a, b) => b.spe - a.spe);
  }, [targets]);

  return (
    <Card
      title={t("speedTier")}
      action={
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Pill
            active={mods.tailwind}
            onClick={() => setMods((m) => ({ ...m, tailwind: !m.tailwind }))}
            label={t("tailwind")}
          />
          <Pill
            active={mods.scarf}
            onClick={() => setMods((m) => ({ ...m, scarf: !m.scarf }))}
            label={t("scarf")}
          />
          <span className="ml-2 rounded bg-zinc-100 px-2 py-0.5 font-mono tabular-nums dark:bg-zinc-800">
            {t("yourSpeed")}: <span className="font-bold">{mySpe}</span>
          </span>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-2 py-1.5 text-left">#</th>
              <th className="px-2 py-1.5 text-left">{t("pokemon")}</th>
              <th className="px-2 py-1.5 text-right">{t("usage")}</th>
              <th className="px-2 py-1.5 text-right">{t("speed")}</th>
              <th className="px-2 py-1.5 text-right">{t("vsYou")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const diff = mySpe - r.spe;
              const tone = diff > 0
                ? "text-emerald-600"
                : diff < 0 ? "text-red-600" : "text-zinc-500";
              const label = diff > 0 ? t("outspeed") : diff < 0 ? t("outsped") : t("tied");
              return (
                <tr key={r.p.slug} className={cn(
                  "border-b border-zinc-100 last:border-b-0 dark:border-zinc-800",
                  r.p.slug === build.slug && "bg-zinc-50 dark:bg-zinc-900/50",
                )}>
                  <td className="px-2 py-1.5 text-zinc-400 font-mono tabular-nums">{i + 1}</td>
                  <td className="px-2 py-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Image src={r.p.spriteUrl} alt="" width={24} height={24} unoptimized />
                      <span className="font-medium">{r.p.name}</span>
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-zinc-500">
                    {r.p.usagePct > 0 ? `${r.p.usagePct.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">{r.spe}</td>
                  <td className={cn("px-2 py-1.5 text-right font-mono tabular-nums", tone)}>
                    {label} ({diff > 0 ? "+" : ""}{diff})
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Offense matrix ──────────────────────────────────────────────────────────

function OffenseMatrixCard({
  p,
  build,
  targets,
  moveBySlug,
  pokemonBySlug,
}: {
  p: BuilderRefPokemon;
  build: Build;
  targets: BuilderRefPokemon[];
  moveBySlug: Map<string, BuilderRefMove>;
  pokemonBySlug: Map<string, BuilderRefPokemon>;
}) {
  const t = useTranslations("PokemonBuilder");

  const myDamagingMoves = useMemo(() => {
    return build.moves
      .map((s) => moveBySlug.get(s))
      .filter((m): m is BuilderRefMove => !!m && m.category !== "status" && (m.power ?? 0) > 0);
  }, [build.moves, moveBySlug]);

  return (
    <Card title={t("offenseTitle")} subtitle={t("offenseHint")}>
      {myDamagingMoves.length === 0 ? (
        <Empty>{t("noOffensiveMoves")}</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="sticky left-0 z-10 bg-white px-2 py-1.5 text-left dark:bg-zinc-900">
                  {t("target")}
                </th>
                {myDamagingMoves.map((m) => (
                  <th key={m.slug} className="px-2 py-1.5 text-center">
                    <span className="inline-flex items-center gap-1">
                      <TypeChip type={m.type as PokemonType} size="sm" />
                      <span className="text-zinc-700 dark:text-zinc-300">{m.name}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {targets.map((tp) => (
                <tr key={tp.slug} className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800">
                  <td className="sticky left-0 z-10 bg-white px-2 py-1.5 dark:bg-zinc-900">
                    <span className="inline-flex items-center gap-1.5">
                      <Image src={tp.spriteUrl} alt="" width={22} height={22} unoptimized />
                      <span className="font-medium">{tp.name}</span>
                    </span>
                  </td>
                  {myDamagingMoves.map((m) => (
                    <td key={m.slug} className="px-1.5 py-1.5 text-center">
                      <DamageCell
                        attacker={p}
                        attackerBuild={build}
                        defender={tp}
                        move={m}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Defense matrix ──────────────────────────────────────────────────────────

function DefenseMatrixCard({
  p,
  build,
  targets,
  moveBySlug,
}: {
  p: BuilderRefPokemon;
  build: Build;
  targets: BuilderRefPokemon[];
  moveBySlug: Map<string, BuilderRefMove>;
}) {
  const t = useTranslations("PokemonBuilder");

  // My damaging moves — used for the "Can you OHKO before they hit?" column.
  const myDamagingMoves = useMemo(
    () => build.moves
      .map((s) => moveBySlug.get(s))
      .filter((m): m is BuilderRefMove => !!m && m.category !== "status" && (m.power ?? 0) > 0),
    [build.moves, moveBySlug],
  );
  const mySpeed = useMemo(() => speedFromBuild(p, build), [p, build]);

  // For each top target, gather their top 4 damaging moves
  const targetThreats = useMemo(() => {
    return targets.map((tp) => {
      const learnable = new Set(tp.learnableMoves);
      const damaging = (tp.usage?.topMoves ?? [])
        .filter((m) => learnable.has(m.slug))
        .map((m) => moveBySlug.get(m.slug))
        .filter((m): m is BuilderRefMove => !!m && m.category !== "status" && (m.power ?? 0) > 0)
        .slice(0, 4);
      return { p: tp, moves: damaging };
    });
  }, [targets, moveBySlug]);

  return (
    <Card title={t("defenseTitle")} subtitle={t("defenseHint")}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="sticky left-0 z-10 bg-white px-2 py-1.5 text-left dark:bg-zinc-900">
                {t("attacker")}
              </th>
              <th className="px-2 py-1.5 text-left whitespace-nowrap">{t("matchupOutcome")}</th>
              <th className="px-2 py-1.5 text-left">{t("threats")}</th>
            </tr>
          </thead>
          <tbody>
            {targetThreats.map((tt) => (
              <tr key={tt.p.slug} className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800 align-top">
                <td className="sticky left-0 z-10 bg-white px-2 py-1.5 dark:bg-zinc-900">
                  <span className="inline-flex items-center gap-1.5">
                    <Image src={tt.p.spriteUrl} alt="" width={22} height={22} unoptimized />
                    <span className="font-medium">{tt.p.name}</span>
                  </span>
                </td>
                <td className="px-2 py-1.5">
                  <OutcomeBadge
                    p={p}
                    build={build}
                    target={tt.p}
                    myDamagingMoves={myDamagingMoves}
                    mySpeed={mySpeed}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {tt.moves.length === 0 ? (
                      <span className="text-xs text-zinc-400">{t("noKnownMoves")}</span>
                    ) : tt.moves.map((m) => (
                      <ThreatChip
                        key={m.slug}
                        attacker={tt.p}
                        defender={p}
                        defenderBuild={build}
                        move={m}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function OutcomeBadge({
  p,
  build,
  target,
  myDamagingMoves,
  mySpeed,
}: {
  p: BuilderRefPokemon;
  build: Build;
  target: BuilderRefPokemon;
  myDamagingMoves: BuilderRefMove[];
  mySpeed: number;
}) {
  const t = useTranslations("PokemonBuilder");
  const targetBuild = defenderDefaultBuild(target);
  const theirSpeed = speedFromBuild(target, targetBuild);

  // Best of my damaging moves against this target → highest OHKO%.
  const best = useMemo(() => {
    let bestOhko = 0;
    let bestMaxPct = 0;
    let bestMove: BuilderRefMove | null = null;
    for (const m of myDamagingMoves) {
      const r = runCalc(p, build, target, targetBuild, m);
      if (!r) continue;
      if (r.ohkoPct > bestOhko || (r.ohkoPct === bestOhko && r.maxPct > bestMaxPct)) {
        bestOhko = r.ohkoPct;
        bestMaxPct = r.maxPct;
        bestMove = m;
      }
    }
    return { ohkoPct: bestOhko, maxPct: bestMaxPct, move: bestMove };
  }, [p, build, target, targetBuild, myDamagingMoves]);

  const faster = mySpeed > theirSpeed;
  const tied = mySpeed === theirSpeed;
  const ohkoFull = best.ohkoPct >= 100;
  const ohkoPartial = best.ohkoPct > 0;

  let label: string;
  let tone: string;
  if (faster && ohkoFull) {
    label = t("outcomeWin");
    tone = "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-900";
  } else if (faster && ohkoPartial) {
    label = `${t("outcomeMaybeOhko")} ${best.ohkoPct.toFixed(0)}%`;
    tone = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300";
  } else if (faster) {
    label = t("outcomeFasterNoKo");
    tone = "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300";
  } else if (tied && ohkoFull) {
    label = t("outcomeSpeedTieKo");
    tone = "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300";
  } else if (tied) {
    label = t("outcomeSpeedTie");
    tone = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  } else if (ohkoFull) {
    // They outspeed AND we can OHKO them — only matters if we survive their hit
    label = `${t("outcomeSlowerKo")} ${best.ohkoPct.toFixed(0)}%`;
    tone = "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300";
  } else if (ohkoPartial) {
    label = `${t("outcomeSlowerMaybe")} ${best.ohkoPct.toFixed(0)}%`;
    tone = "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300";
  } else {
    label = t("outcomeLose");
    tone = "bg-rose-100 text-rose-800 ring-1 ring-rose-300 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-900";
  }

  const speedArrow = faster ? "▲" : tied ? "=" : "▼";
  const speedTone = faster ? "text-emerald-600" : tied ? "text-zinc-500" : "text-rose-600";
  const tooltip = `${t("yourSpeed")} ${mySpeed} ${speedArrow} ${theirSpeed}${best.move ? ` · ${best.move.name} ${best.maxPct.toFixed(0)}% max` : ""}`;

  return (
    <span
      className={cn(
        "inline-flex flex-col items-start gap-0.5 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap",
        tone,
      )}
      title={tooltip}
    >
      <span className="inline-flex items-center gap-1">
        <span className={cn("font-mono tabular-nums", speedTone)}>{speedArrow}</span>
        {label}
      </span>
      {best.move ? (
        <span className="font-mono tabular-nums text-[10px] opacity-80">
          {best.move.name} · {best.maxPct.toFixed(0)}%
        </span>
      ) : null}
    </span>
  );
}

// ─── Custom targets ──────────────────────────────────────────────────────────

function CustomTargetsCard({
  customSlugs,
  setCustomSlugs,
  pickerOptions,
  pokemonBySlug,
}: {
  customSlugs: string[];
  setCustomSlugs: (s: string[] | ((prev: string[]) => string[])) => void;
  pickerOptions: ComboboxOption[];
  pokemonBySlug: Map<string, BuilderRefPokemon>;
}) {
  const t = useTranslations("PokemonBuilder");
  const [pick, setPick] = useState("");
  return (
    <Card title={t("customTitle")} subtitle={t("customHint")}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[220px] flex-1">
          <Combobox
            value={pick}
            onChange={(v) => {
              if (v && !customSlugs.includes(v)) setCustomSlugs((p) => [...p, v]);
              setPick("");
            }}
            options={pickerOptions}
            placeholder={t("addCustomPlaceholder")}
          />
        </div>
      </div>
      {customSlugs.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {customSlugs.map((slug) => {
            const p = pokemonBySlug.get(slug);
            if (!p) return null;
            return (
              <span
                key={slug}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
              >
                <Image src={p.spriteUrl} alt="" width={18} height={18} unoptimized />
                {p.name}
                <button
                  onClick={() => setCustomSlugs((p) => p.filter((s) => s !== slug))}
                  className="ml-1 text-zinc-400 hover:text-red-500"
                >×</button>
              </span>
            );
          })}
        </div>
      ) : null}
    </Card>
  );
}

// ─── Damage cells ────────────────────────────────────────────────────────────

function DamageCell({
  attacker,
  attackerBuild,
  defender,
  move,
}: {
  attacker: BuilderRefPokemon;
  attackerBuild: Build;
  defender: BuilderRefPokemon;
  move: BuilderRefMove;
}) {
  const result = useMemo(
    () => runCalc(attacker, attackerBuild, defender, defenderDefaultBuild(defender), move),
    [attacker, attackerBuild, defender, move],
  );
  if (!result) return <span className="text-zinc-400">—</span>;
  const { minPct, maxPct, ohkoPct, twoHkoPct } = result;
  const tone = ohkoPct >= 100
    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 font-bold"
    : ohkoPct >= 50
    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
    : twoHkoPct >= 100
    ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
    : maxPct >= 50
    ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
    : "bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500";
  return (
    <span className={cn("inline-block min-w-[88px] rounded px-2 py-1 font-mono tabular-nums text-xs", tone)}>
      <span className="block">{minPct.toFixed(0)}–{maxPct.toFixed(0)}%</span>
      <span className="block text-[10px] opacity-80">
        {ohkoPct >= 100 ? "OHKO" : ohkoPct > 0 ? `${ohkoPct.toFixed(0)}% OHKO` : twoHkoPct >= 100 ? "2HKO" : ""}
      </span>
    </span>
  );
}

function ThreatChip({
  attacker,
  defender,
  defenderBuild,
  move,
}: {
  attacker: BuilderRefPokemon;
  defender: BuilderRefPokemon;
  defenderBuild: Build;
  move: BuilderRefMove;
}) {
  const result = useMemo(
    () => runCalc(attacker, attackerDefaultBuild(attacker), defender, defenderBuild, move),
    [attacker, defender, defenderBuild, move],
  );
  if (!result) return null;
  const { minPct, maxPct, ohkoPct, twoHkoPct } = result;
  const tone = ohkoPct >= 100
    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 font-bold ring-1 ring-rose-300"
    : ohkoPct >= 50
    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
    : twoHkoPct >= 100
    ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
    : maxPct >= 50
    ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
    : "bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500";
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs", tone)}
      title={`${maxPct.toFixed(0)}% max · ${ohkoPct.toFixed(0)}% OHKO`}
    >
      <TypeChip type={move.type as PokemonType} size="sm" />
      <span className="font-medium">{move.name}</span>
      <span className="ml-1 font-mono tabular-nums opacity-80">
        {minPct.toFixed(0)}–{maxPct.toFixed(0)}%
      </span>
      {ohkoPct >= 100 ? <span className="ml-1 font-bold">OHKO</span>
        : ohkoPct > 0 ? <span className="ml-1 font-mono text-[10px]">{ohkoPct.toFixed(0)}%</span>
        : twoHkoPct >= 100 ? <span className="ml-1 font-bold">2HKO</span>
        : null}
    </span>
  );
}

// ─── Shared layout ───────────────────────────────────────────────────────────

function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Pill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md border px-2 py-0.5 text-xs font-medium",
        active
          ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
      )}
    >
      {label}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500 dark:bg-zinc-800/50">
      {children}
    </div>
  );
}

// ─── Calc helpers ────────────────────────────────────────────────────────────

function stageMult(s: number): number {
  if (s >= 0) return (2 + s) / 2;
  return 2 / (2 - s);
}

function speedFromBuild(p: BuilderRefPokemon, build: Build): number {
  let s = computeStat(p.spe, build.ev[5], build.nature, "spe", false);
  s = Math.floor(s * stageMult(build.stages.spe));
  if (build.item === "choice-scarf") s = Math.floor(s * 1.5);
  if (build.item === "iron-ball") s = Math.floor(s * 0.5);
  return s;
}

function attackerDefaultBuild(p: BuilderRefPokemon): Build {
  const u = p.usage;
  const sp = u?.topSpreads[0];
  const validAbilities = new Set([...p.abilities, ...(p.hiddenAbility ? [p.hiddenAbility] : [])]);
  const ab = u?.topAbilities.find((a) => validAbilities.has(a.slug))?.slug
          ?? p.abilities[0] ?? "";
  return {
    slug: p.slug,
    ability: ab,
    item: u?.topItems[0]?.slug ?? "",
    nature: (sp?.nature ?? "Adamant") as Nature,
    moves: [],
    ev: (sp?.vp ?? [0, 0, 0, 0, 0, 0]) as Build["ev"],
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  };
}

function defenderDefaultBuild(p: BuilderRefPokemon): Build {
  // Defenders use the same usage-derived spread as attackers; the defensive
  // stats just come from the EV row's HP/Def/SpD slots.
  return attackerDefaultBuild(p);
}

function runCalc(
  attacker: BuilderRefPokemon,
  attackerBuild: Build,
  defender: BuilderRefPokemon,
  defenderBuild: Build,
  move: BuilderRefMove,
): { minPct: number; maxPct: number; ohkoPct: number; twoHkoPct: number } | null {
  if (move.category === "status" || (move.power ?? 0) <= 0) return null;
  const input: CalcInput = {
    attacker: {
      types: [attacker.type1 as PokemonType, (attacker.type2 ?? null) as PokemonType | null],
      atk: attacker.atk,
      spa: attacker.spa,
      vpAtk: attackerBuild.ev[1],
      vpSpa: attackerBuild.ev[3],
      nature: attackerBuild.nature,
      ability: attackerBuild.ability || undefined,
      item: attackerBuild.item || undefined,
      status: "none",
      stageAtk: attackerBuild.stages.atk,
      stageSpa: attackerBuild.stages.spa,
    },
    defender: {
      types: [defender.type1 as PokemonType, (defender.type2 ?? null) as PokemonType | null],
      hp: defender.hp,
      def: defender.def,
      spd: defender.spd,
      vpHp: defenderBuild.ev[0],
      vpDef: defenderBuild.ev[2],
      vpSpd: defenderBuild.ev[4],
      nature: defenderBuild.nature,
      ability: defenderBuild.ability || undefined,
      item: defenderBuild.item || undefined,
      stageDef: defenderBuild.stages.def,
      stageSpd: defenderBuild.stages.spd,
      hpPct: 100,
    },
    move: {
      slug: move.slug,
      type: move.type as PokemonType,
      category: move.category as "physical" | "special",
      power: move.power ?? 0,
      targetShape: move.targetShape,
    },
    field: {
      weather: "none",
      terrain: "none",
      format: "doubles",
      crit: false,
      helpingHand: false,
      screens: { reflect: false, lightScreen: false, auroraVeil: false },
      hazards: { stealthRock: false, spikes: 0, toxicSpikes: 0 },
    },
  };
  const out = calc(input);
  if (!out) return null;
  const ohkoCount = out.rolls.filter((r) => r >= out.defenderMaxHp).length;
  const ohkoPct = (ohkoCount / out.rolls.length) * 100;
  const twoHkoPct = out.min * 2 >= out.defenderMaxHp ? 100 : 0;
  return { minPct: out.minPct, maxPct: out.maxPct, ohkoPct, twoHkoPct };
}
