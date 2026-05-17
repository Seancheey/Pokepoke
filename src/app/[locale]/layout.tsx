import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { Nav } from "@/components/Nav";
import { MyPokemonFAB } from "@/components/MyPokemonFAB";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Footer");

  return (
    <NextIntlClientProvider>
      <Nav />
      {children}
      <footer className="mx-auto mt-16 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-4 py-8 text-xs text-zinc-500 dark:border-zinc-800">
        <span>{t("tagline")}</span>
        <a
          href="https://github.com/Seancheey/PokeDD/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 font-medium text-zinc-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-red-900 dark:hover:bg-red-950/30 dark:hover:text-red-300"
        >
          <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5" fill="currentColor">
            <path d="M2.75 2.5h10.5a.75.75 0 0 1 .75.75v7a.75.75 0 0 1-.75.75H8.06l-3.22 3.22A.75.75 0 0 1 3.5 13.69V11H2.75a.75.75 0 0 1-.75-.75v-7a.75.75 0 0 1 .75-.75Z" />
          </svg>
          {t("feedback")}
        </a>
      </footer>
      <MyPokemonFAB />
    </NextIntlClientProvider>
  );
}
