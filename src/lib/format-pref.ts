/**
 * Global user preference for the battle format (singles | doubles). Used
 * to pick which slice of usageStats (per-Pokémon Smogon stats) the
 * builder UIs surface — the meta diverges between the two formats so
 * showing one set of numbers for both was misleading.
 *
 * Stored in localStorage; broadcast via a CustomEvent so any consumer
 * subscribed via useFormatPref() picks up changes from elsewhere in
 * the app (e.g. the Nav toggle) without a page reload.
 */

export type BattleFormat = "singles" | "doubles";

const STORAGE_KEY = "pokedd:battle-format";
const CHANGED_EVENT = "pokedd:battle-format-changed";

const DEFAULT_FORMAT: BattleFormat = "doubles";

export function loadFormatPref(): BattleFormat {
  if (typeof window === "undefined") return DEFAULT_FORMAT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "singles" || raw === "doubles") return raw;
    return DEFAULT_FORMAT;
  } catch {
    return DEFAULT_FORMAT;
  }
}

export function saveFormatPref(fmt: BattleFormat) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, fmt);
    window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
  } catch {
    // localStorage disabled — silently no-op
  }
}

export function onFormatPrefChange(handler: (fmt: BattleFormat) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const wrap = () => handler(loadFormatPref());
  window.addEventListener(CHANGED_EVENT, wrap);
  return () => window.removeEventListener(CHANGED_EVENT, wrap);
}
