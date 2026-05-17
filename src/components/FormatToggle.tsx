"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  loadFormatPref,
  saveFormatPref,
  onFormatPrefChange,
  type BattleFormat,
} from "@/lib/format-pref";
import { cn } from "@/lib/cn";

/**
 * Compact Singles / Doubles toggle for the site nav. Reads/writes the global
 * format preference; emits a custom event so other components (Pokémon Builder
 * stat panel, Team Builder coverage tables, Hub top-10) react live.
 */
export function FormatToggle({ className }: { className?: string }) {
  const t = useTranslations("Nav");
  const [fmt, setFmt] = useState<BattleFormat>("doubles");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFmt(loadFormatPref());
    setHydrated(true);
    return onFormatPrefChange(setFmt);
  }, []);

  if (!hydrated) return null;

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-50 p-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800",
        className,
      )}
      role="group"
      aria-label={t("formatLabel")}
    >
      <Option
        active={fmt === "doubles"}
        onClick={() => saveFormatPref("doubles")}
        label={t("formatDoubles")}
      />
      <Option
        active={fmt === "singles"}
        onClick={() => saveFormatPref("singles")}
        label={t("formatSingles")}
      />
    </div>
  );
}

function Option({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-2 py-0.5 font-medium transition-colors",
        active
          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
