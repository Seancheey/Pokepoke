"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { TypeChip } from "@/components/TypeChip";
import { Combobox, type ComboboxOption } from "@/components/Combobox";
import type { PokemonType } from "@/lib/types";
import { POKEMON_TYPES } from "@/lib/types";
import { effectivenessAgainst } from "@/lib/type-chart";
import {
  encodeTeam,
  decodeTeam,
  EMPTY_TEAM,
  type TeamShare,
  type ShareSlot,
} from "@/lib/team-share";
import { cn } from "@/lib/cn";

export type RefPokemon = {
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
export type RefMove = { slug: string; name: string; type: string; category: string; power: number | null };
export type RefAbility = { slug: string; name: string };
export type RefItem = { slug: string; name: string };

const MAX_VP = 510;
const PER_STAT_CAP = 252;
const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
type StatKey = (typeof STAT_KEYS)[number];

export function TeamBuilderClient({
  pokemon,
  moves,
  abilities,
  items,
  initialTeam,
}: {
  pokemon: RefPokemon[];
  moves: RefMove[];
  abilities: RefAbility[];
  items: RefItem[];
  initialTeam: TeamShare | null;
}) {
  const t = useTranslations("TeamBuilder");
  const tStat = useTranslations("TeamBuilder.vpStat");
  const sp = useSearchParams();

  // Build O(1) lookup maps once
  const pokemonBySlug = new Map(pokemon.map((p) => [p.slug, p]));
  const moveBySlug = new Map(moves.map((m) => [m.slug, m]));
  const abilityBySlug = new Map(abilities.map((a) => [a.slug, a]));
  const itemBySlug = new Map(items.map((i) => [i.slug, i]));

  const [team, setTeam] = useState<TeamShare>(initialTeam ?? EMPTY_TEAM);
  const [hydrated, setHydrated] = useState(initialTeam != null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [_isPending, startTransition] = useTransition();

  // If we landed without a pre-decoded team but a `?share=` is present (e.g. client-side
  // route change), decode on mount.
  useEffect(() => {
    if (hydrated) return;
    const share = sp.get("share");
    if (!share) {
      setHydrated(true);
      return;
    }
    decodeTeam(share).then((decoded) => {
      if (decoded) setTeam(decoded);
      setHydrated(true);
    });
  }, [sp]);

  function updateSlot(index: number, mut: (s: ShareSlot) => ShareSlot) {
    setTeam((prev) => ({
      ...prev,
      slots: prev.slots.map((s, i) => (i === index ? mut(s) : s)),
    }));
  }

  function addSlot(speciesSlug: string) {
    const p = pokemonBySlug.get(speciesSlug);
    if (!p || team.slots.length >= 6) return;

    // Pre-fill from Smogon usage data when available; otherwise fall back to
    // the first listed ability and an empty kit.
    const usage = p.usage;
    const learnable = new Set(p.learnableMoves);

    const validAbilities = new Set([...p.abilities, ...(p.hiddenAbility ? [p.hiddenAbility] : [])]);
    const topAbility = usage?.topAbilities.find((a) => validAbilities.has(a.slug))?.slug;
    const topItem = usage?.topItems[0]?.slug;

    // Take up to 4 highest-usage moves that this Pokémon can actually learn.
    const topMoves: string[] = [];
    for (const m of usage?.topMoves ?? []) {
      if (!learnable.has(m.slug)) continue;
      topMoves.push(m.slug);
      if (topMoves.length === 4) break;
    }

    const topSpread = usage?.topSpreads[0];

    setTeam((prev) => ({
      ...prev,
      slots: [
        ...prev.slots,
        {
          s: speciesSlug,
          a: topAbility ?? p.abilities[0],
          i: topItem,
          m: topMoves,
          v: topSpread?.vp ?? [0, 0, 0, 0, 0, 0],
        },
      ],
    }));
  }

  function removeSlot(index: number) {
    setTeam((prev) => ({ ...prev, slots: prev.slots.filter((_, i) => i !== index) }));
  }

  async function copyShare() {
    const payload = await encodeTeam(team);
    const url = `${window.location.origin}${window.location.pathname}?share=${payload}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
      // Also update the visible URL bar (without reloading)
      startTransition(() => {
        window.history.replaceState(null, "", `?share=${payload}`);
      });
      setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      // clipboard write failed — fall back to updating URL only
      startTransition(() => {
        window.history.replaceState(null, "", `?share=${payload}`);
      });
    }
  }

  function clearTeam() {
    setTeam(EMPTY_TEAM);
    startTransition(() => {
      window.history.replaceState(null, "", window.location.pathname);
    });
  }

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        {t("loading")}
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyShare}
            className="rounded-md bg-zinc-950 px-4 py-1.5 text-sm font-semibold text-white shadow hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            disabled={team.slots.length === 0}
          >
            {copyState === "copied" ? t("copied") : t("copyLink")}
          </button>
          <button
            onClick={clearTeam}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {t("clear")}
          </button>
        </div>
      </header>

      {/* Format + regulation */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="rounded-md bg-zinc-100 px-2.5 py-1 font-semibold uppercase tracking-wider text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {t("regulationMA")}
        </div>
        <label className="inline-flex items-center gap-1 font-medium">
          <span className="uppercase tracking-wider text-zinc-500">{t("format")}:</span>
          <select
            value={team.fmt}
            onChange={(e) =>
              setTeam((p) => ({ ...p, fmt: e.target.value as "singles" | "doubles" }))
            }
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="doubles">{t("formatDoubles")}</option>
            <option value="singles">{t("formatSingles")}</option>
          </select>
        </label>
      </div>

      {/* Slots grid */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {team.slots.map((slot, i) => (
          <SlotCard
            key={i}
            index={i}
            slot={slot}
            pokemonBySlug={pokemonBySlug}
            moves={moves}
            moveBySlug={moveBySlug}
            abilityBySlug={abilityBySlug}
            itemBySlug={itemBySlug}
            items={items}
            onMutate={(mut) => updateSlot(i, mut)}
            onRemove={() => removeSlot(i)}
          />
        ))}
        {team.slots.length < 6 ? (
          <AddSlotPicker pokemon={pokemon} onPick={addSlot} />
        ) : null}
      </section>

      {/* Team analysis */}
      {team.slots.length > 0 ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <TeamDefenseTable team={team} pokemonBySlug={pokemonBySlug} />
          <TeamOffenseTable
            team={team}
            pokemonBySlug={pokemonBySlug}
            moveBySlug={moveBySlug}
          />
        </div>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function AddSlotPicker({
  pokemon,
  onPick,
}: {
  pokemon: RefPokemon[];
  onPick: (slug: string) => void;
}) {
  const t = useTranslations("TeamBuilder");

  const options: ComboboxOption[] = useMemo(
    () =>
      pokemon.map((p) => ({
        value: p.slug,
        label: p.name,
        searchText: p.slug, // allow english slug search even when UI is JA / zh
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

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-300 bg-white/60 p-6 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
      <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
        {t("addPokemon")}
      </p>
      <div className="w-full max-w-md">
        <Combobox
          value=""
          options={options}
          onChange={(slug) => slug && onPick(slug)}
          placeholder={t("slotEmptyHint")}
          searchPlaceholder={t("slotEmptyHint")}
          ariaLabel={t("addPokemon")}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function SlotCard({
  index,
  slot,
  pokemonBySlug,
  moves,
  moveBySlug,
  abilityBySlug,
  itemBySlug,
  items,
  onMutate,
  onRemove,
}: {
  index: number;
  slot: ShareSlot;
  pokemonBySlug: Map<string, RefPokemon>;
  moves: RefMove[];
  moveBySlug: Map<string, RefMove>;
  abilityBySlug: Map<string, RefAbility>;
  itemBySlug: Map<string, RefItem>;
  items: RefItem[];
  onMutate: (mut: (s: ShareSlot) => ShareSlot) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("TeamBuilder");
  const tStat = useTranslations("TeamBuilder.vpStat");

  const p = pokemonBySlug.get(slot.s);
  if (!p) return null;

  const validAbilities = [...p.abilities];
  if (p.hiddenAbility && !validAbilities.includes(p.hiddenAbility)) {
    validAbilities.push(p.hiddenAbility);
  }

  const vp = slot.v ?? [0, 0, 0, 0, 0, 0];
  const totalVp = vp.reduce((a, b) => a + b, 0);
  const remaining = MAX_VP - totalVp;

  function setMove(slotIdx: number, val: string) {
    onMutate((s) => {
      const m = [...(s.m ?? [])];
      while (m.length < 4) m.push("");
      m[slotIdx] = val;
      return { ...s, m: m.filter((x) => x).slice(0, 4).concat(Array(4).fill("")).slice(0, 4) };
    });
  }

  function setStat(idx: number, val: number) {
    onMutate((s) => {
      const next = [...(s.v ?? [0, 0, 0, 0, 0, 0])] as [number, number, number, number, number, number];
      next[idx] = Math.min(PER_STAT_CAP, Math.max(0, val));
      return { ...s, v: next };
    });
  }

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center gap-3">
        <Image
          src={p.spriteUrl}
          width={56}
          height={56}
          alt={p.name}
          className="h-14 w-14 shrink-0 object-contain"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold">{p.name}</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            <TypeChip type={p.type1 as PokemonType} size="sm" />
            {p.type2 ? <TypeChip type={p.type2 as PokemonType} size="sm" /> : null}
          </div>
        </div>
        <button
          onClick={onRemove}
          aria-label={t("remove")}
          className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
        >
          ✕
        </button>
      </header>

      <SlotBody
        p={p}
        slot={slot}
        vp={vp}
        remaining={remaining}
        validAbilities={validAbilities}
        abilityBySlug={abilityBySlug}
        items={items}
        moves={moves}
        onMutate={onMutate}
        setMove={setMove}
        setStat={setStat}
      />
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function SlotBody({
  p,
  slot,
  vp,
  remaining,
  validAbilities,
  abilityBySlug,
  items,
  moves,
  onMutate,
  setMove,
  setStat,
}: {
  p: RefPokemon;
  slot: ShareSlot;
  vp: number[];
  remaining: number;
  validAbilities: string[];
  abilityBySlug: Map<string, RefAbility>;
  items: RefItem[];
  moves: RefMove[];
  onMutate: (mut: (s: ShareSlot) => ShareSlot) => void;
  setMove: (slotIdx: number, val: string) => void;
  setStat: (idx: number, val: number) => void;
}) {
  const t = useTranslations("TeamBuilder");
  const tStat = useTranslations("TeamBuilder.vpStat");

  // Per-slot usage lookups (top moves/abilities/items/spreads with %)
  const pctByMove = new Map(p.usage?.topMoves.map((m) => [m.slug, m.pct]) ?? []);
  const pctByAbility = new Map(
    p.usage?.topAbilities.map((a) => [a.slug, a.pct]) ?? [],
  );
  const pctByItem = new Map(p.usage?.topItems.map((i) => [i.slug, i.pct]) ?? []);

  // Ability combobox options — limited to this species' valid abilities.
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

  // Item combobox options — all items, with this species' usage % when known.
  const itemOptions: ComboboxOption[] = items.map((it) => ({
    value: it.slug,
    label: it.name,
    searchText: it.slug,
    usagePct: pctByItem.get(it.slug),
  }));

  // Move combobox options — restricted to this species' learnset.
  const learnable = new Set(p.learnableMoves);
  const learnableMoves = moves.filter((m) => learnable.has(m.slug));
  const moveOptionsBase: ComboboxOption[] = learnableMoves.map((m) => ({
    value: m.slug,
    label: m.name,
    searchText: m.slug,
    usagePct: pctByMove.get(m.slug),
  }));

  // Spread preset options
  const spreadPresets = p.usage?.topSpreads ?? [];
  const currentSpreadKey = vp.join("-");
  const presetMatch = spreadPresets.find((s) => s.vp.join("-") === currentSpreadKey);
  const spreadOptions: ComboboxOption[] = spreadPresets.map((s) => {
    const key = `${s.nature}:${s.vp.join("/")}`;
    return {
      value: key,
      label: `${s.nature} ${s.vp.join("/")}`,
      usagePct: s.pct,
    };
  });

  function applySpread(key: string) {
    const [nature, evs] = key.split(":");
    if (!nature || !evs) return;
    const parts = evs.split("/").map((s) => parseInt(s, 10));
    if (parts.length !== 6) return;
    onMutate((s) => ({
      ...s,
      v: parts as [number, number, number, number, number, number],
    }));
  }

  return (
    <div className="mt-3 space-y-2 text-sm">
      <Field label={t("abilityLabel")}>
        <Combobox
          value={slot.a ?? ""}
          options={abilityOptions}
          onChange={(v) => onMutate((s) => ({ ...s, a: v }))}
          ariaLabel={t("abilityLabel")}
        />
      </Field>

      <Field label={t("itemLabel")}>
        <Combobox
          value={slot.i ?? ""}
          options={itemOptions}
          onChange={(v) => onMutate((s) => ({ ...s, i: v || undefined }))}
          ariaLabel={t("itemLabel")}
          allowClear
          emptyLabel={t("noItem")}
          placeholder={t("noItem")}
        />
      </Field>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {t("movesLabel")}
        </div>
        <div className="mt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {[0, 1, 2, 3].map((mi) => {
            const cur = (slot.m ?? [])[mi] ?? "";
            // If current move isn't in the learnset (e.g. user changed species), include it
            // anyway so the selection is visible and removable.
            const options =
              cur && !learnable.has(cur)
                ? [
                    ...moveOptionsBase,
                    (() => {
                      const m = moves.find((mm) => mm.slug === cur);
                      return m
                        ? { value: m.slug, label: m.name, searchText: m.slug }
                        : null;
                    })(),
                  ].filter((x): x is ComboboxOption => !!x)
                : moveOptionsBase;
            return (
              <Combobox
                key={mi}
                value={cur}
                options={options}
                onChange={(v) => setMove(mi, v)}
                ariaLabel={t("moveSlot", { n: mi + 1 })}
                allowClear
                emptyLabel={t("moveNone")}
                placeholder={t("moveNone")}
              />
            );
          })}
        </div>
      </div>

      {/* Spread preset */}
      {spreadOptions.length > 0 ? (
        <Field label={t("spreadPresetLabel")}>
          <Combobox
            value={presetMatch ? `${presetMatch.nature}:${presetMatch.vp.join("/")}` : ""}
            options={spreadOptions}
            onChange={applySpread}
            placeholder={t("spreadPresetPlaceholder")}
            ariaLabel={t("spreadPresetLabel")}
          />
        </Field>
      ) : null}

      {/* VP inputs */}
      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-zinc-500">
            {t("vpLabel")}
          </span>
          <span
            className={cn(
              "font-mono tabular-nums",
              remaining < 0
                ? "font-bold text-red-600"
                : remaining === 0
                ? "text-emerald-600"
                : "text-zinc-500",
            )}
          >
            {remaining < 0
              ? t("vpOver", { over: -remaining })
              : t("vpRemaining", { remaining })}
          </span>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          {STAT_KEYS.map((k, i) => (
            <label key={k} className="flex items-center gap-1.5 text-xs">
              <span className="w-10 shrink-0 font-semibold uppercase tracking-wider text-zinc-500">
                {tStat(k as StatKey)}
              </span>
              <input
                type="number"
                min={0}
                max={PER_STAT_CAP}
                step={4}
                value={vp[i] ?? 0}
                onChange={(e) => setStat(i, parseInt(e.target.value) || 0)}
                className="w-full rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 text-right font-mono tabular-nums dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// ─── Team Defense / Offense tables ───────────────────────────────────────────

// Color tone for a defensive multiplier (a value ≥1 means it takes that ×damage).
function defenseTone(mult: number): { bg: string; text: string } {
  if (mult === 0) return { bg: "bg-emerald-100 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-300 font-bold" };
  if (mult < 1)  return { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400" };
  if (mult > 1)  return { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400" };
  return { bg: "", text: "text-zinc-500" };
}

function offenseTone(mult: number | null): { bg: string; text: string } {
  if (mult == null) return { bg: "", text: "text-zinc-400" };
  if (mult === 0) return { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400 font-bold" };
  if (mult > 1)  return { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400" };
  if (mult < 1)  return { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400" };
  return { bg: "", text: "text-zinc-500" };
}

function fmtMult(m: number | null): string {
  if (m == null) return "—";
  if (m === 0)  return "×0";
  if (Number.isInteger(m)) return `×${m}`;
  return `×${m}`;
}

function fmtNet(n: number): string {
  if (n > 0) return `+${n}`;
  return `${n}`;
}

// Type label used in the leftmost column — reuses the TypeChip pill so each row
// is identifiable by both color AND the localized type name.

function MatrixHeader({
  slots,
  pokemonBySlug,
  invert,
}: {
  slots: ShareSlot[];
  pokemonBySlug: Map<string, RefPokemon>;
  invert?: boolean; // offense flips the ↑/↓ semantics — display labels accordingly
}) {
  return (
    <thead className="bg-zinc-50 text-xs dark:bg-zinc-950">
      <tr>
        <th className="w-8 px-2 py-2" />
        {slots.map((s, i) => {
          const p = pokemonBySlug.get(s.s);
          return (
            <th key={i} className="px-1 py-2">
              {p ? (
                <Image
                  src={p.spriteUrl}
                  alt={p.name}
                  width={32}
                  height={32}
                  className="mx-auto h-8 w-8 object-contain"
                />
              ) : null}
            </th>
          );
        })}
        <th className="px-2 py-2 text-red-600" title="weak / no super-effective">↓</th>
        <th className="px-2 py-2 text-emerald-600" title="resists / super-effective">↑</th>
        <th className="px-2 py-2 text-sky-600" title="net">=</th>
      </tr>
    </thead>
  );
}

function TeamDefenseTable({
  team,
  pokemonBySlug,
}: {
  team: TeamShare;
  pokemonBySlug: Map<string, RefPokemon>;
}) {
  const t = useTranslations("TeamBuilder");

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-bold uppercase tracking-wider">{t("defenseTitle")}</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-center text-xs">
          <MatrixHeader slots={team.slots} pokemonBySlug={pokemonBySlug} />
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {POKEMON_TYPES.map((atkType) => {
              const cells: { mult: number }[] = team.slots.map((slot) => {
                const p = pokemonBySlug.get(slot.s);
                if (!p) return { mult: 1 };
                const defTypes = [p.type1, p.type2].filter(Boolean) as PokemonType[];
                return { mult: effectivenessAgainst(atkType, defTypes) };
              });
              const weak = cells.filter((c) => c.mult > 1).length;
              const resist = cells.filter((c) => c.mult < 1).length;
              const net = resist - weak;
              const netTone =
                net > 0
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold"
                  : net < 0
                  ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-bold"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500";
              return (
                <tr key={atkType}>
                  <td className="px-2 py-1.5">
                    <TypeChip type={atkType} size="sm" />
                  </td>
                  {cells.map((c, i) => {
                    const tone = defenseTone(c.mult);
                    return (
                      <td key={i} className={cn("px-1.5 py-1.5 font-mono tabular-nums", tone.bg, tone.text)}>
                        {fmtMult(c.mult)}
                      </td>
                    );
                  })}
                  <td className={cn("px-2 py-1.5 font-mono font-bold tabular-nums", weak ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "text-zinc-500")}>
                    {weak || "0"}
                  </td>
                  <td className={cn("px-2 py-1.5 font-mono font-bold tabular-nums", resist ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "text-zinc-500")}>
                    {resist || "0"}
                  </td>
                  <td className={cn("px-2 py-1.5 font-mono tabular-nums", netTone)}>
                    {fmtNet(net)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TeamOffenseTable({
  team,
  pokemonBySlug,
  moveBySlug,
}: {
  team: TeamShare;
  pokemonBySlug: Map<string, RefPokemon>;
  moveBySlug: Map<string, RefMove>;
}) {
  const t = useTranslations("TeamBuilder");

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-bold uppercase tracking-wider">{t("offenseTitle")}</h2>
      <p className="mt-1 text-xs text-zinc-500">{t("offenseHint")}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-center text-xs">
          <MatrixHeader slots={team.slots} pokemonBySlug={pokemonBySlug} invert />
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {POKEMON_TYPES.map((defType) => {
              // Per slot: best multiplier across that slot's damage moves vs defType.
              // null = no damage move selected (can't attack at all).
              const cells: { mult: number | null }[] = team.slots.map((slot) => {
                const moves = (slot.m ?? [])
                  .map((s) => moveBySlug.get(s))
                  .filter(
                    (m): m is RefMove =>
                      !!m && m.category !== "status" && m.power != null && m.power > 0,
                  );
                if (moves.length === 0) return { mult: null };
                const best = Math.max(
                  ...moves.map((m) => effectivenessAgainst(m.type as PokemonType, [defType])),
                );
                return { mult: best };
              });
              const strong = cells.filter((c) => c.mult != null && c.mult > 1).length;
              const weakOrNone = cells.filter(
                (c) => c.mult != null && c.mult < 1,
              ).length;
              const net = strong - weakOrNone;
              const netTone =
                net > 0
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold"
                  : net < 0
                  ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-bold"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500";
              return (
                <tr key={defType}>
                  <td className="px-2 py-1.5">
                    <TypeChip type={defType} size="sm" />
                  </td>
                  {cells.map((c, i) => {
                    const tone = offenseTone(c.mult);
                    return (
                      <td key={i} className={cn("px-1.5 py-1.5 font-mono tabular-nums", tone.bg, tone.text)}>
                        {fmtMult(c.mult)}
                      </td>
                    );
                  })}
                  <td className={cn("px-2 py-1.5 font-mono font-bold tabular-nums", weakOrNone ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "text-zinc-500")}>
                    {weakOrNone || "0"}
                  </td>
                  <td className={cn("px-2 py-1.5 font-mono font-bold tabular-nums", strong ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "text-zinc-500")}>
                    {strong || "0"}
                  </td>
                  <td className={cn("px-2 py-1.5 font-mono tabular-nums", netTone)}>
                    {fmtNet(net)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
