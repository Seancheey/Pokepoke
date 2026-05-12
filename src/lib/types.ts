export const POKEMON_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];

// Tailwind-resolvable type colors. Using inline classes (rather than dynamic) so the
// Tailwind JIT picks them up at build time.
export const TYPE_COLORS: Record<PokemonType, { bg: string; text: string; border: string }> = {
  normal:   { bg: "bg-stone-300",   text: "text-stone-900",   border: "border-stone-400" },
  fire:     { bg: "bg-orange-500",  text: "text-white",        border: "border-orange-600" },
  water:    { bg: "bg-sky-500",     text: "text-white",        border: "border-sky-600" },
  electric: { bg: "bg-yellow-400",  text: "text-yellow-950",   border: "border-yellow-500" },
  grass:    { bg: "bg-green-500",   text: "text-white",        border: "border-green-600" },
  ice:      { bg: "bg-cyan-300",    text: "text-cyan-950",     border: "border-cyan-400" },
  fighting: { bg: "bg-red-700",     text: "text-white",        border: "border-red-800" },
  poison:   { bg: "bg-purple-600",  text: "text-white",        border: "border-purple-700" },
  ground:   { bg: "bg-amber-600",   text: "text-white",        border: "border-amber-700" },
  flying:   { bg: "bg-indigo-400",  text: "text-white",        border: "border-indigo-500" },
  psychic:  { bg: "bg-pink-500",    text: "text-white",        border: "border-pink-600" },
  bug:      { bg: "bg-lime-500",    text: "text-lime-950",     border: "border-lime-600" },
  rock:     { bg: "bg-yellow-700",  text: "text-white",        border: "border-yellow-800" },
  ghost:    { bg: "bg-violet-700",  text: "text-white",        border: "border-violet-800" },
  dragon:   { bg: "bg-indigo-700",  text: "text-white",        border: "border-indigo-800" },
  dark:     { bg: "bg-zinc-800",    text: "text-white",        border: "border-zinc-900" },
  steel:    { bg: "bg-slate-400",   text: "text-slate-950",    border: "border-slate-500" },
  fairy:    { bg: "bg-pink-300",    text: "text-pink-950",     border: "border-pink-400" },
};
