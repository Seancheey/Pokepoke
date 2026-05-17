/**
 * localStorage-backed "My Pokémon" collection — the user's personal stash of
 * saved builds that hovers in the bottom-left of every page. Pure browser
 * API; React glue lives in src/components/MyPokemonFAB.tsx.
 *
 * Persistence:
 *   - Key: `pokedd:my-pokemon` → JSON-serialized SavedMon[]
 *   - Two custom events fire on window:
 *       pokedd:my-pokemon-changed — list contents changed (add / remove / clear)
 *       pokedd:load-saved-mon     — a saved mon was clicked; payload is the mon
 *
 * The "load" event is a pub/sub bridge between the FAB (a layout-level
 * component) and the active builder page below it: both PokemonBuilder
 * and TeamBuilder subscribe and pick up the dispatched mon.
 */

export type SavedMon = {
  id: string;
  slug: string;
  name: string;            // localized species name at save time
  spriteUrl: string;
  type1: string;
  type2: string | null;
  ability: string;         // slug (canonical, used to load back)
  abilityName?: string;    // localized at save time (optional for legacy entries)
  item: string;            // slug
  itemName?: string;       // localized at save time
  nature: string;
  moves: string[];         // length 4, "" for empty (slugs)
  moveNames?: string[];    // localized move names, parallel to moves
  ev: [number, number, number, number, number, number];
  savedAt: number;         // unix ms
};

const STORAGE_KEY = "pokedd:my-pokemon";
const CHANGED_EVENT = "pokedd:my-pokemon-changed";
const LOAD_EVENT = "pokedd:load-saved-mon";

export function loadAll(): SavedMon[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveAll(items: SavedMon[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
  } catch {
    // localStorage full / disabled — silently no-op
  }
}

export function addSavedMon(input: Omit<SavedMon, "id" | "savedAt">): SavedMon {
  const list = loadAll();
  const saved: SavedMon = {
    ...input,
    id: randomId(),
    savedAt: Date.now(),
  };
  saveAll([saved, ...list]);
  return saved;
}

export function findSavedBySlug(slug: string): SavedMon | null {
  return loadAll().find((m) => m.slug === slug) ?? null;
}

/**
 * Returns true when the two configs match exactly on every field the user can
 * tweak: species, ability, item, nature, EVs (in order) and the moveset (order
 * insensitive, empty slots dropped). Used to mark the ★ button as "already
 * saved" so the user knows the current configuration is in their stash.
 */
export function isSameConfig(
  a: Omit<SavedMon, "id" | "savedAt">,
  b: Omit<SavedMon, "id" | "savedAt">,
): boolean {
  if (a.slug !== b.slug) return false;
  if (a.ability !== b.ability) return false;
  if (a.item !== b.item) return false;
  if (a.nature !== b.nature) return false;
  if (a.ev.length !== b.ev.length) return false;
  for (let i = 0; i < a.ev.length; i++) {
    if (a.ev[i] !== b.ev[i]) return false;
  }
  const movesA = a.moves.filter(Boolean).slice().sort();
  const movesB = b.moves.filter(Boolean).slice().sort();
  if (movesA.length !== movesB.length) return false;
  for (let i = 0; i < movesA.length; i++) {
    if (movesA[i] !== movesB[i]) return false;
  }
  return true;
}

export function findExactMatch(
  input: Omit<SavedMon, "id" | "savedAt">,
): SavedMon | null {
  return loadAll().find((m) => isSameConfig(input, m)) ?? null;
}

export function replaceSavedMon(
  id: string,
  input: Omit<SavedMon, "id" | "savedAt">,
): SavedMon | null {
  const list = loadAll();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const replaced: SavedMon = {
    ...input,
    id,
    savedAt: Date.now(),
  };
  const next = [...list];
  next[idx] = replaced;
  saveAll(next);
  return replaced;
}

export function removeSavedMon(id: string) {
  saveAll(loadAll().filter((m) => m.id !== id));
}

export function clearAllSavedMons() {
  saveAll([]);
}

export function dispatchLoadSavedMon(mon: SavedMon) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LOAD_EVENT, { detail: mon }));
}

export function onSavedMonsChange(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGED_EVENT, handler);
  return () => window.removeEventListener(CHANGED_EVENT, handler);
}

export function onLoadSavedMon(handler: (mon: SavedMon) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const wrapped = (e: Event) => handler((e as CustomEvent<SavedMon>).detail);
  window.addEventListener(LOAD_EVENT, wrapped);
  return () => window.removeEventListener(LOAD_EVENT, wrapped);
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
