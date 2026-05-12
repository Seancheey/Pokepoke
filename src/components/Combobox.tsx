"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type ComboboxOption = {
  value: string;
  /** Main visible label */
  label: string;
  /** Optional alternate search text (lowercased automatically) */
  searchText?: string;
  /** 0–100; renders a small usage badge on the right */
  usagePct?: number;
  /** Small icon/sprite on the left (sized ~h-6 w-6) */
  prefix?: React.ReactNode;
  /** Additional content shown after the label */
  suffix?: React.ReactNode;
  /** Whether this option is disabled (e.g. not in learnset) */
  disabled?: boolean;
};

const MAX_VISIBLE = 80;

/**
 * Searchable dropdown with optional usage-percentage badges.
 *
 * - Click the trigger to open
 * - Type to filter (matches `label` and `searchText`)
 * - ↑/↓ to highlight, Enter to select, Esc to close
 * - Options without a search query are sorted by `usagePct` desc (highest first)
 */
export function Combobox({
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder = "Search…",
  ariaLabel,
  className,
  allowClear = false,
  emptyLabel = "(none)",
}: {
  value: string;
  options: ComboboxOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  ariaLabel?: string;
  className?: string;
  /** If true, the empty value "" is an explicit option ("none") */
  allowClear?: boolean;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const selected = options.find((o) => o.value === value);

  // Filter + sort
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? options.filter(
          (o) =>
            o.label.toLowerCase().includes(q) ||
            (o.searchText && o.searchText.toLowerCase().includes(q)) ||
            o.value.toLowerCase().includes(q),
        )
      : options;
    // Stable sort: usagePct desc, then label asc
    const sorted = [...matched].sort((a, b) => {
      const ua = a.usagePct ?? -1;
      const ub = b.usagePct ?? -1;
      if (ub !== ua) return ub - ua;
      return a.label.localeCompare(b.label);
    });
    return sorted.slice(0, MAX_VISIBLE);
  }, [options, query]);

  // Click-outside
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open) {
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
    }
  }, [open]);

  // Scroll highlighted into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[highlight] as HTMLElement | undefined;
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlight, open, filtered.length]);

  function selectAt(i: number) {
    const opt = filtered[i];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectAt(highlight);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-md border border-zinc-300 bg-white px-2 py-1 text-left text-sm hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
      >
        {selected ? (
          <>
            {selected.prefix ? <span className="shrink-0">{selected.prefix}</span> : null}
            <span className="min-w-0 flex-1 truncate">{selected.label}</span>
            {selected.usagePct != null ? (
              <UsageBadge pct={selected.usagePct} />
            ) : null}
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-zinc-400">
            {placeholder ?? "—"}
          </span>
        )}
        <span aria-hidden className="shrink-0 text-xs text-zinc-400">▾</span>
      </button>

      {open ? (
        <div
          role="dialog"
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-hidden rounded-md border border-zinc-300 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
            }}
            onKeyDown={onKey}
            placeholder={searchPlaceholder}
            className="w-full border-b border-zinc-200 bg-transparent px-2 py-1.5 text-sm focus:outline-none dark:border-zinc-800"
          />
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="max-h-64 overflow-y-auto py-1"
          >
            {allowClear && !query ? (
              <li
                role="option"
                aria-selected={value === ""}
                onMouseDown={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="cursor-pointer px-2 py-1 text-xs italic text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {emptyLabel}
              </li>
            ) : null}
            {filtered.length === 0 ? (
              <li className="px-2 py-3 text-center text-xs text-zinc-500">
                No matches
              </li>
            ) : null}
            {filtered.map((opt, i) => {
              const isSelected = opt.value === value;
              const isHighlighted = i === highlight;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectAt(i);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-2 py-1 text-sm",
                    isHighlighted
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : isSelected
                      ? "bg-zinc-50 dark:bg-zinc-900"
                      : "",
                    opt.disabled && "opacity-40 cursor-not-allowed",
                  )}
                >
                  {opt.prefix ? <span className="shrink-0">{opt.prefix}</span> : null}
                  <span className="min-w-0 flex-1 truncate">
                    {opt.label}
                    {opt.suffix ? (
                      <span className="ml-1 text-xs text-zinc-500">{opt.suffix}</span>
                    ) : null}
                  </span>
                  {opt.usagePct != null ? <UsageBadge pct={opt.usagePct} /> : null}
                </li>
              );
            })}
            {options.length > MAX_VISIBLE && !query ? (
              <li className="px-2 py-1.5 text-center text-[10px] text-zinc-400">
                Showing {MAX_VISIBLE} of {options.length} — type to filter
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function UsageBadge({ pct }: { pct: number }) {
  const tone =
    pct >= 50
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
      : pct >= 10
      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
        tone,
      )}
    >
      {pct.toFixed(1)}%
    </span>
  );
}
