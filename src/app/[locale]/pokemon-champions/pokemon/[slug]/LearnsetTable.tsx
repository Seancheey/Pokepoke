"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TypeChip } from "@/components/TypeChip";
import { CategoryBadge } from "@/components/CategoryBadge";
import type { PokemonType } from "@/lib/types";
import { cn } from "@/lib/cn";

export type LearnsetRow = {
  slug: string;
  name: string;
  type: string;
  category: string; // "physical" | "special" | "status"
  power: number | null;
  accuracy: number | null;
  pp: number;
  /** Per-mon usage % if known (from Smogon overlay) */
  usagePct?: number;
};

type SortKey = "name" | "type" | "category" | "power" | "accuracy" | "pp" | "usage";
const NUMERIC: SortKey[] = ["power", "accuracy", "pp", "usage"];

export function LearnsetTable({ moves }: { moves: LearnsetRow[] }) {
  const t = useTranslations("Moves.columns");
  const td = useTranslations("Detail");

  const [sort, setSort] = useState<SortKey>("usage");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? moves.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.slug.toLowerCase().includes(q) ||
            m.type.toLowerCase().includes(q),
        )
      : moves;
  }, [moves, query]);

  const sorted = useMemo(() => {
    const factor = dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sort === "power") { av = a.power ?? -1; bv = b.power ?? -1; }
      else if (sort === "accuracy") { av = a.accuracy ?? -1; bv = b.accuracy ?? -1; }
      else if (sort === "pp") { av = a.pp; bv = b.pp; }
      else if (sort === "usage") { av = a.usagePct ?? -1; bv = b.usagePct ?? -1; }
      else if (sort === "type") { av = a.type; bv = b.type; }
      else if (sort === "category") { av = a.category; bv = b.category; }
      else { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      if (av < bv) return -1 * factor;
      if (av > bv) return 1 * factor;
      return 0;
    });
  }, [filtered, sort, dir]);

  function clickSort(k: SortKey) {
    if (sort === k) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(k);
      setDir(NUMERIC.includes(k) ? "desc" : "asc");
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-bold">
          {td("learnset")}{" "}
          <span className="text-sm font-normal text-zinc-500">
            ({td("learnsetCount", { count: moves.length })})
          </span>
        </h2>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={td("learnsetSearch")}
          className="w-56 rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-950">
            <tr>
              <Th k="name" label={t("name")} sort={sort} dir={dir} onClick={clickSort} align="left" />
              <Th k="type" label={t("type")} sort={sort} dir={dir} onClick={clickSort} align="left" />
              <Th k="category" label={t("category")} sort={sort} dir={dir} onClick={clickSort} align="left" />
              <Th k="power" label={t("power")} sort={sort} dir={dir} onClick={clickSort} />
              <Th k="accuracy" label={t("accuracy")} sort={sort} dir={dir} onClick={clickSort} />
              <Th k="pp" label={t("pp")} sort={sort} dir={dir} onClick={clickSort} />
              <Th k="usage" label={t("usage")} sort={sort} dir={dir} onClick={clickSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {sorted.map((m) => (
              <tr key={m.slug} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-3 py-1.5">
                  <Link
                    href={`/pokemon-champions/moves/${m.slug}`}
                    className="font-semibold text-zinc-950 hover:text-red-600 dark:text-zinc-50"
                  >
                    {m.name}
                  </Link>
                </td>
                <td className="px-3 py-1.5">
                  <TypeChip type={m.type as PokemonType} size="sm" />
                </td>
                <td className="px-3 py-1.5">
                  <CategoryBadge cat={m.category} />
                </td>
                <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                  {m.power ?? "—"}
                </td>
                <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                  {m.accuracy ?? "—"}
                </td>
                <td className="px-3 py-1.5 text-right font-mono tabular-nums">{m.pp}</td>
                <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                  {m.usagePct != null ? `${m.usagePct.toFixed(1)}%` : "—"}
                </td>
              </tr>
            ))}
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-zinc-500">
                  —
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Th({
  k, label, sort, dir, onClick, align = "right",
}: {
  k: SortKey;
  label: string;
  sort: SortKey;
  dir: "asc" | "desc";
  onClick: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort === k;
  return (
    <th className={cn("px-3 py-2", align === "left" ? "text-left" : "text-right")}>
      <button
        type="button"
        onClick={() => onClick(k)}
        className={cn(
          "inline-flex items-center gap-1 font-semibold transition-colors",
          active
            ? "text-zinc-950 dark:text-zinc-50"
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200",
        )}
      >
        <span>{label}</span>
        <span aria-hidden className="text-[10px]">
          {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

