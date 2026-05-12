import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { TypeChip } from "@/components/TypeChip";
import type { PokemonType } from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import { localizedPokemonName } from "@/lib/i18n-pokemon";

export const dynamic = "force-dynamic";

export default async function PokemonDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Detail");

  const p = await prisma.pokemon.findUnique({ where: { slug } });
  if (!p) notFound();

  const bst = p.hp + p.atk + p.def + p.spa + p.spd + p.spe;
  const stats = [
    { k: "hp", v: p.hp }, { k: "atk", v: p.atk }, { k: "def", v: p.def },
    { k: "spa", v: p.spa }, { k: "spd", v: p.spd }, { k: "spe", v: p.spe },
  ];
  const max = Math.max(...stats.map((s) => s.v), 200);
  const abilityList: string[] = JSON.parse(p.abilities);
  const displayName = localizedPokemonName(p, locale as Locale);
  const cols = await getTranslations("List.columns");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/pokemon-champions/pokemon"
        className="text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
      >
        {t("back")}
      </Link>

      <header className="mt-3 flex flex-col items-start gap-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center">
        <Image
          src={p.spriteUrl}
          alt={p.name}
          width={160}
          height={160}
          priority
          className="h-32 w-32 shrink-0 object-contain"
        />
        <div className="flex-1">
          <div className="text-xs font-mono text-zinc-500">
            #{p.dexNo.toString().padStart(3, "0")}
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{displayName}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <TypeChip type={p.type1 as PokemonType} />
            {p.type2 ? <TypeChip type={p.type2 as PokemonType} /> : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{t("usage")}</span>{" "}
              {p.usagePct.toFixed(1)}%
            </span>
            {p.rank ? (
              <span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{t("rank")}</span>{" "}
                #{p.rank}
              </span>
            ) : null}
            <span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{t("bst")}</span>{" "}
              {bst}
            </span>
          </div>
        </div>
      </header>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-bold">{t("baseStats")}</h2>
        <dl className="mt-4 space-y-2">
          {stats.map((s) => (
            <div
              key={s.k}
              className="grid grid-cols-[5rem_3rem_1fr] items-center gap-3"
            >
              <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {cols(s.k as never)}
              </dt>
              <dd className="font-mono tabular-nums">{s.v}</dd>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-amber-400"
                  style={{ width: `${Math.min(100, (s.v / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-bold">{t("abilities")}</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {abilityList.map((a) => (
            <li
              key={a}
              className="rounded-md bg-zinc-100 px-3 py-1 text-sm font-medium dark:bg-zinc-800"
            >
              {a.replace(/-/g, " ")}
            </li>
          ))}
          {p.hiddenAbility ? (
            <li className="rounded-md border border-dashed border-zinc-400 px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {p.hiddenAbility.replace(/-/g, " ")}{" "}
              <span className="text-xs">{t("hiddenSuffix")}</span>
            </li>
          ) : null}
        </ul>
        <p className="mt-3 text-xs text-zinc-500">{t("phase1Note")}</p>
      </section>
    </main>
  );
}
