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
      <footer className="mx-auto mt-16 max-w-7xl border-t border-zinc-200 px-4 py-8 text-xs text-zinc-500 dark:border-zinc-800">
        {t("tagline")}
      </footer>
      <MyPokemonFAB />
    </NextIntlClientProvider>
  );
}
