/**
 * "Star me on GitHub" CTA, lives in the Nav title bar.
 *
 * Server-rendered — pure anchor + inline SVG. Opens the repo in a new tab.
 * The hover state nudges the star fill to amber to reinforce the action.
 */
import { getTranslations } from "next-intl/server";

const REPO_URL = "https://github.com/Seancheey/PokeDD";

export async function GitHubStarLink() {
  const t = await getTranslations("Nav");
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
        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z" />
      </svg>
      <span className="hidden sm:inline">{t("star")}</span>
    </a>
  );
}
