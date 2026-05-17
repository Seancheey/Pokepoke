"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  addSavedMon,
  findExactMatch,
  findSavedBySlug,
  onSavedMonsChange,
  replaceSavedMon,
  type SavedMon,
} from "@/lib/my-pokemon";
import { cn } from "@/lib/cn";

type MonInput = Omit<SavedMon, "id" | "savedAt">;

type Variant = "pill" | "icon";

export function SaveMyPokemonButton({
  mon,
  variant = "pill",
  className,
}: {
  mon: MonInput;
  variant?: Variant;
  className?: string;
}) {
  const t = useTranslations("MyPokemon");
  const [savedToast, setSavedToast] = useState(false);
  const [dupExisting, setDupExisting] = useState<SavedMon | null>(null);
  const [exactMatch, setExactMatch] = useState<SavedMon | null>(null);

  // Re-check whether the current config exactly matches an existing saved
  // entry. Recomputed when `mon` changes (via the serialized signature) and
  // when localStorage changes (someone added/removed/cleared elsewhere).
  const monKey = stableKey(mon);
  useEffect(() => {
    const check = () => setExactMatch(findExactMatch(mon));
    check();
    return onSavedMonsChange(check);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monKey]);

  function flashSaved() {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1400);
  }

  function onSaveClick() {
    if (exactMatch) {
      // Already saved with the same config — nothing meaningful to do, but
      // still flash a quick "already saved" hint so the click registers.
      flashSaved();
      return;
    }
    const existing = findSavedBySlug(mon.slug);
    if (existing) {
      setDupExisting(existing);
    } else {
      addSavedMon(mon);
      flashSaved();
    }
  }

  function onReplace() {
    if (!dupExisting) return;
    replaceSavedMon(dupExisting.id, mon);
    setDupExisting(null);
    flashSaved();
  }
  function onSaveAnyway() {
    addSavedMon(mon);
    setDupExisting(null);
    flashSaved();
  }
  function onCancel() {
    setDupExisting(null);
  }

  const tooltip = exactMatch ? t("alreadySaved") : t("save");
  const pillLabel = savedToast
    ? `✓ ${t("saved")}`
    : exactMatch
    ? `★ ${t("alreadySaved")}`
    : `★ ${t("save")}`;
  const iconLabel = savedToast ? "✓" : "★";

  return (
    <>
      {variant === "pill" ? (
        <button
          type="button"
          onClick={onSaveClick}
          title={tooltip}
          className={cn(
            "w-full rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
            savedToast
              ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
              : exactMatch
              ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-300"
              : "border-zinc-300 bg-white text-zinc-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-red-900 dark:hover:bg-red-950/30 dark:hover:text-red-300",
            className,
          )}
        >
          {pillLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onSaveClick}
          title={tooltip}
          aria-label={tooltip}
          className={cn(
            "rounded-md p-1 text-base transition-colors",
            savedToast
              ? "text-emerald-600"
              : exactMatch
              ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              : "text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800",
            className,
          )}
        >
          {iconLabel}
        </button>
      )}

      {dupExisting ? (
        <DedupDialog
          existing={dupExisting}
          incoming={mon}
          onReplace={onReplace}
          onSaveAnyway={onSaveAnyway}
          onCancel={onCancel}
        />
      ) : null}
    </>
  );
}

function DedupDialog({
  existing,
  incoming,
  onReplace,
  onSaveAnyway,
  onCancel,
}: {
  existing: SavedMon;
  incoming: MonInput;
  onReplace: () => void;
  onSaveAnyway: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("MyPokemon");
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold">{t("dupTitle")}</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("dupMessage", { name: incoming.name })}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <CompareCard label={t("dupExisting")} mon={existing} />
          <CompareCard label={t("dupIncoming")} mon={incoming} />
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t("dupCancel")}
          </button>
          <button
            type="button"
            onClick={onSaveAnyway}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t("dupSaveAnyway")}
          </button>
          <button
            type="button"
            onClick={onReplace}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            {t("dupReplace")}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompareCard({
  label,
  mon,
}: {
  label: string;
  mon: SavedMon | MonInput;
}) {
  const t = useTranslations("MyPokemon");
  const filledMoves = mon.moves.filter(Boolean).length;
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-800/50">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <Image src={mon.spriteUrl} alt="" width={32} height={32} unoptimized />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{mon.name}</div>
          <div className="truncate text-zinc-500">
            {mon.abilityName || mon.ability || "—"}
            {mon.item ? <> · {mon.itemName || mon.item.replace(/-/g, " ")}</> : null}
          </div>
          <div className="truncate text-zinc-500">
            {mon.nature} · {filledMoves}/4 · EV {mon.ev.join("/")}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stable stringification of the config so the match effect re-fires only when
// the underlying values change, not when the parent re-renders with a fresh
// object reference.
function stableKey(mon: MonInput): string {
  return [
    mon.slug,
    mon.ability,
    mon.item,
    mon.nature,
    mon.ev.join(","),
    mon.moves.filter(Boolean).slice().sort().join(","),
  ].join("|");
}
