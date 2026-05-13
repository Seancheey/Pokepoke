"use client";

import { useTranslations } from "next-intl";

/**
 * Renders a localized "PHYSICAL / SPECIAL / STATUS" badge for moves.
 * Uses the `Moves.category{Physical,Special,Status}` translation keys.
 */
export function CategoryBadge({ cat }: { cat: string }) {
  const tm = useTranslations("Moves");
  const color =
    cat === "physical"
      ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
      : cat === "special"
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
      : "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
  const label =
    cat === "physical" ? tm("categoryPhysical")
    : cat === "special" ? tm("categorySpecial")
    : cat === "status"  ? tm("categoryStatus")
    : cat;
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${color}`}
    >
      {label}
    </span>
  );
}
