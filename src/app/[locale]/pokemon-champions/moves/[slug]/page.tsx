import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { TypeChip } from "@/components/TypeChip";
import type { PokemonType } from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import { localizedMoveName, localizedMoveEffect } from "@/lib/i18n-pokemon";

export const dynamic = "force-dynamic";

export default async function MoveDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Moves");
  const td = await getTranslations("Moves.detail");
  const cols = await getTranslations("Moves.columns");

  const m = await prisma.move.findUnique({ where: { slug } });
  if (!m) notFound();

  const displayName = localizedMoveName(m, locale as Locale);
  const effect = localizedMoveEffect(m, locale as Locale);

  const stats: Array<{ label: string; value: string }> = [
    { label: cols("power"), value: m.power == null ? "—" : `${m.power}` },
    { label: cols("accuracy"), value: m.accuracy == null ? "—" : `${m.accuracy}` },
    { label: cols("pp"), value: `${m.pp}` },
    { label: cols("priority"), value: m.priority > 0 ? `+${m.priority}` : `${m.priority}` },
    { label: cols("usage"), value: `${m.usagePct.toFixed(1)}%` },
    { label: td("target"), value: m.targetShape },
    { label: td("contact"), value: m.makesContact ? td("yes") : td("no") },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/pokemon-champions/moves"
        className="text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
      >
        {t("back")}
      </Link>

      <header className="mt-3 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{displayName}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <TypeChip type={m.type as PokemonType} />
          <CategoryBadge cat={m.category} />
        </div>
        <p className="mt-4 text-base text-zinc-700 dark:text-zinc-300">{effect}</p>
      </header>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-bold">{td("stats")}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-baseline justify-between gap-2">
              <dt className="text-xs uppercase tracking-wider text-zinc-500">{s.label}</dt>
              <dd className="font-mono text-sm tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-zinc-500">{td("phase1Note")}</p>
      </section>
    </main>
  );
}

function CategoryBadge({ cat }: { cat: string }) {
  const color =
    cat === "physical"
      ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
      : cat === "special"
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
      : "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${color}`}
    >
      {cat}
    </span>
  );
}
