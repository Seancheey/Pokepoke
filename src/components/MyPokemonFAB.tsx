"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  loadAll,
  onSavedMonsChange,
  removeSavedMon,
  clearAllSavedMons,
  dispatchLoadSavedMon,
  type SavedMon,
} from "@/lib/my-pokemon";
import { BrandMark } from "./BrandMark";
import { cn } from "@/lib/cn";

export function MyPokemonFAB() {
  const t = useTranslations("MyPokemon");
  const [items, setItems] = useState<SavedMon[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadAll());
    setHydrated(true);
    return onSavedMonsChange(() => setItems(loadAll()));
  }, []);

  // Hide until hydrated so the SSR'd nothing doesn't conflict with the
  // localStorage-derived state.
  if (!hydrated) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {open ? (
        <Panel
          items={items}
          onClose={() => setOpen(false)}
          onLoad={(m) => {
            dispatchLoadSavedMon(m);
            setOpen(false);
          }}
          onRemove={(id) => removeSavedMon(id)}
          onClearAll={() => {
            if (window.confirm(t("confirmClear"))) clearAllSavedMons();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("title")}
          title={t("title")}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-zinc-200 transition-transform hover:scale-105 active:scale-95 dark:bg-zinc-900 dark:ring-zinc-700"
        >
          <BrandMark className="h-10 w-10" />
          {items.length > 0 ? (
            <span className="pointer-events-none absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
              {items.length > 99 ? "99+" : items.length}
            </span>
          ) : null}
        </button>
      )}
    </div>
  );
}

function Panel({
  items,
  onClose,
  onLoad,
  onRemove,
  onClearAll,
}: {
  items: SavedMon[];
  onClose: () => void;
  onLoad: (m: SavedMon) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}) {
  const t = useTranslations("MyPokemon");
  return (
    <div className="flex max-h-[70vh] w-80 flex-col rounded-lg border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <BrandMark className="h-6 w-6" />
          <h3 className="font-semibold">
            {t("title")} <span className="ml-1 text-xs font-normal text-zinc-500">({items.length})</span>
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
          aria-label={t("close")}
        >
          ✕
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <div className="px-2 py-8 text-center text-sm text-zinc-500">{t("empty")}</div>
        ) : (
          <ul className="space-y-1">
            {items.map((m) => (
              <li key={m.id}>
                <SavedMonRow mon={m} onLoad={() => onLoad(m)} onRemove={() => onRemove(m.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 ? (
        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-zinc-200 px-3 py-2 text-xs dark:border-zinc-700">
          <span className="text-zinc-500">{t("clickToLoad")}</span>
          <button
            onClick={onClearAll}
            className="rounded-md px-2 py-1 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
          >
            {t("clearAll")}
          </button>
        </footer>
      ) : null}
    </div>
  );
}

function SavedMonRow({
  mon,
  onLoad,
  onRemove,
}: {
  mon: SavedMon;
  onLoad: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations("MyPokemon");
  const filledMoves = mon.moves.filter(Boolean).length;
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md border border-transparent p-2",
        "hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60",
      )}
    >
      <button
        type="button"
        onClick={onLoad}
        className="flex flex-1 items-center gap-2 text-left"
        title={t("clickToLoad")}
      >
        <Image src={mon.spriteUrl} alt="" width={36} height={36} unoptimized />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{mon.name}</div>
          <div className="truncate text-xs text-zinc-500">
            {mon.ability || "—"}
            {mon.item ? <> · {mon.item.replace(/-/g, " ")}</> : null}
            {filledMoves ? <> · {filledMoves}/4</> : null}
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("remove")}
        title={t("remove")}
        className="rounded-md p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/40"
      >
        🗑
      </button>
    </div>
  );
}
