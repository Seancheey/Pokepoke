import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type PlaceholderKey = "moves" | "abilities" | "items" | "teamBuilder" | "teams" | "damageCalc";

export async function PlaceholderPage({ which }: { which: PlaceholderKey }) {
  const t = await getTranslations("Placeholder");
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
        {t(`${which}.phase`)}
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
        {t(`${which}.title`)}
      </h1>
      <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
        {t(`${which}.desc`)}
      </p>
      <Link
        href="/pokemon-champions"
        className="mt-6 inline-block rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
      >
        {t("back")}
      </Link>
    </main>
  );
}
