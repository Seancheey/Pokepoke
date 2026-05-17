/**
 * "Star me on GitHub" CTA, lives in the Nav title bar (and inside the mobile
 * drawer). Pure anchor + inline SVG; opens the repo in a new tab. Client
 * component so it can be reused from both server- and client-side parents.
 */
"use client";

import { useTranslations } from "next-intl";

const REPO_URL = "https://github.com/Seancheey/PokeDD";

export function GitHubStarLink() {
  const t = useTranslations("Nav");
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={t("starOnGithub")}
      aria-label={t("starOnGithub")}
      className="group inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-amber-700 dark:hover:bg-amber-950/40 dark:hover:text-amber-300"
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden
        className="h-3.5 w-3.5"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
        />
      </svg>
      <span className="hidden sm:inline">{t("star")}</span>
    </a>
  );
}
