import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { BrandMark } from "./BrandMark";
import { FormatToggle } from "./FormatToggle";

export async function Nav() {
  const t = await getTranslations("Nav");
  const SECTION_LINKS = [
    { href: "/pokemon-champions/pokemon", label: t("pokemon") },
    { href: "/pokemon-champions/moves", label: t("moves") },
    { href: "/pokemon-champions/abilities", label: t("abilities") },
    { href: "/pokemon-champions/items", label: t("items") },
    { href: "/pokemon-champions/team-builder", label: t("teamBuilder") },
    { href: "/pokemon-champions/pokemon-builder", label: t("pokemonBuilder") },
    { href: "/pokemon-champions/damage-calc", label: t("damageCalc") },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link href="/pokemon-champions" className="flex items-center gap-2">
          <BrandMark className="h-7 w-7" />
          <span className="text-base font-bold tracking-tight">
            {t("brand")}
            <span className="ml-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {t("section")}
            </span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto md:flex">
          {SECTION_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <FormatToggle />
          <LocaleSwitcher />
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-zinc-100 px-4 py-2 md:hidden dark:border-zinc-900">
        {SECTION_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
