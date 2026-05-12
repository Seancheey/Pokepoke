"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { TypeChip } from "@/components/TypeChip";
import type { PokemonType } from "@/lib/types";
import { calc, type Weather, type CalcOutput } from "@/lib/damage";
import type { RefAbility, RefItem } from "../team-builder/TeamBuilderClient";
import { cn } from "@/lib/cn";

export type CalcRefPokemon = {
  slug: string;
  name: string;
  type1: string;
  type2: string | null;
  spriteUrl: string;
  hp: number; atk: number; def: number; spa: number; spd: number; spe: number;
};
export type CalcRefMove = {
  slug: string; name: string; type: string;
  category: string; // "physical" | "special" | "status"
  power: number;
  targetShape: string;
};

export function DamageCalcClient({
  pokemon,
  moves,
  abilities: _abilities,
  items: _items,
}: {
  pokemon: CalcRefPokemon[];
  moves: CalcRefMove[];
  abilities: RefAbility[];
  items: RefItem[];
}) {
  const t = useTranslations("DamageCalc");

  const [attackerSlug, setAttackerSlug] = useState<string>(pokemon[0]?.slug ?? "");
  const [defenderSlug, setDefenderSlug] = useState<string>(pokemon[1]?.slug ?? "");
  const [moveSlug, setMoveSlug] = useState<string>("");

  const [weather, setWeather] = useState<Weather>("none");
  const [format, setFormat] = useState<"singles" | "doubles">("doubles");
  const [burn, setBurn] = useState(false);
  const [crit, setCrit] = useState(false);

  const attacker = pokemon.find((p) => p.slug === attackerSlug);
  const defender = pokemon.find((p) => p.slug === defenderSlug);
  const move = moves.find((m) => m.slug === moveSlug);

  const result: CalcOutput | null = useMemo(() => {
    if (!attacker || !defender || !move) return null;
    if (move.category === "status" || move.power <= 0) return null;
    return calc({
      attacker: {
        types: [attacker.type1 as PokemonType, attacker.type2 as PokemonType | null],
        atk: attacker.atk, spa: attacker.spa,
        vpAtk: 252, vpSpa: 252, // simple max attacker assumption for v1
      },
      defender: {
        types: [defender.type1 as PokemonType, defender.type2 as PokemonType | null],
        hp: defender.hp, def: defender.def, spd: defender.spd,
        vpHp: 4, vpDef: 0, vpSpd: 0, // baseline defensive v1
      },
      move: {
        type: move.type as PokemonType,
        category: move.category as "physical" | "special",
        power: move.power,
        targetShape: move.targetShape,
      },
      field: { weather, format, burn, crit },
    });
  }, [attacker, defender, move, weather, format, burn, crit]);

  return (
    <div>
      <header>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <SideCard
          title={t("attacker")}
          pokemon={pokemon}
          selectedSlug={attackerSlug}
          onSelect={setAttackerSlug}
        >
          <label className="mt-3 block">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("moveLabel")}
            </span>
            <select
              value={moveSlug}
              onChange={(e) => setMoveSlug(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">{t("noResult")}</option>
              {moves
                .filter((m) => m.category !== "status" && m.power > 0)
                .map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.name} · {m.type} · {m.power}
                  </option>
                ))}
            </select>
          </label>
        </SideCard>

        <SideCard
          title={t("defender")}
          pokemon={pokemon}
          selectedSlug={defenderSlug}
          onSelect={setDefenderSlug}
        />
      </div>

      <FieldStrip
        weather={weather}
        setWeather={setWeather}
        format={format}
        setFormat={setFormat}
        burn={burn}
        setBurn={setBurn}
        crit={crit}
        setCrit={setCrit}
      />

      <ResultCard result={result} move={move} attacker={attacker} defender={defender} />

      <p className="mt-6 text-xs text-zinc-500">{t("notes")}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function SideCard({
  title,
  pokemon,
  selectedSlug,
  onSelect,
  children,
}: {
  title: string;
  pokemon: CalcRefPokemon[];
  selectedSlug: string;
  onSelect: (s: string) => void;
  children?: React.ReactNode;
}) {
  const t = useTranslations("DamageCalc");
  const selected = pokemon.find((p) => p.slug === selectedSlug);

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">{title}</h2>
      <div className="mt-3 flex items-center gap-3">
        {selected ? (
          <Image
            src={selected.spriteUrl}
            width={56}
            height={56}
            alt={selected.name}
            className="h-14 w-14 shrink-0 object-contain"
          />
        ) : null}
        <select
          value={selectedSlug}
          onChange={(e) => onSelect(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {pokemon.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      {selected ? (
        <div className="mt-2 flex flex-wrap gap-1">
          <TypeChip type={selected.type1 as PokemonType} size="sm" />
          {selected.type2 ? <TypeChip type={selected.type2 as PokemonType} size="sm" /> : null}
        </div>
      ) : null}
      {children}
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function FieldStrip({
  weather, setWeather, format, setFormat, burn, setBurn, crit, setCrit,
}: {
  weather: Weather; setWeather: (w: Weather) => void;
  format: "singles" | "doubles"; setFormat: (f: "singles" | "doubles") => void;
  burn: boolean; setBurn: (b: boolean) => void;
  crit: boolean; setCrit: (b: boolean) => void;
}) {
  const t = useTranslations("DamageCalc");

  return (
    <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">{t("field")}</h2>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t("weather")}:
          </span>
          <select
            value={weather}
            onChange={(e) => setWeather(e.target.value as Weather)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="none">{t("weatherNone")}</option>
            <option value="sun">{t("weatherSun")}</option>
            <option value="rain">{t("weatherRain")}</option>
            <option value="sand">{t("weatherSand")}</option>
            <option value="snow">{t("weatherSnow")}</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t("format")}:
          </span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "singles" | "doubles")}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="doubles">{t("formatDoubles")}</option>
            <option value="singles">{t("formatSingles")}</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs font-medium">
          <input type="checkbox" checked={burn} onChange={(e) => setBurn(e.target.checked)} />
          {t("burn")}
        </label>
        <label className="flex items-center gap-1.5 text-xs font-medium">
          <input type="checkbox" checked={crit} onChange={(e) => setCrit(e.target.checked)} />
          {t("crit")}
        </label>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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
      ? "0× (immune)"
      : `${result.effectiveness}×`;
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
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={t("minMax")} value={`${result.min} – ${result.max}`} mono />
        <Stat
          label={t("pctRange")}
          value={`${result.minPct}% – ${result.maxPct}%`}
          mono
        />
        <Stat label={t("stab")} value={result.stab === 1.5 ? "1.5×" : "1×"} mono />
        <Stat label={t("effectiveness")} value={effLabel} mono className={effTone} />
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
    </section>
  );
}

function Stat({
  label, value, mono = false, className = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <div
        className={cn(
          "mt-1 text-base",
          mono ? "font-mono tabular-nums" : "",
          className,
        )}
      >
        {value}
      </div>
    </div>
  );
}
