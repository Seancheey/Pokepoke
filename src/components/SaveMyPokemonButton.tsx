"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  addSavedMon,
  findSavedBySlug,
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

  function flashSaved() {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1400);
  }

  function onSaveClick() {
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

  return (
    <>
      {variant === "pill" ? (
        <button
          type="button"
          onClick={onSaveClick}
          className={cn(
            "w-full rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
            savedToast
              ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "border-zinc-300 bg-white text-zinc-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-red-900 dark:hover:bg-red-950/30 dark:hover:text-red-300",
            className,
          )}
        >
          {savedToast ? `✓ ${t("saved")}` : `★ ${t("save")}`}
        </button>
      ) : (
        <button
          type="button"
          onClick={onSaveClick}
          title={t("save")}
          aria-label={t("save")}
          className={cn(
            "rounded-md p-1 text-base transition-colors",
            savedToast
              ? "text-emerald-600"
              : "text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800",
            className,
          )}
        >
          {savedToast ? "✓" : "★"}
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
            {mon.ability || "—"}
            {mon.item ? <> · {mon.item.replace(/-/g, " ")}</> : null}
          </div>
          <div className="truncate text-zinc-500">
            {mon.nature} · {filledMoves}/4 · EV {mon.ev.join("/")}
          </div>
        </div>
      </div>
    </div>
  );
}
