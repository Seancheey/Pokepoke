import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import type { Locale } from "@/i18n/routing";
import {
  localizedPokemonName,
  localizedMoveName,
  localizedAbilityName,
  localizedItemName,
} from "@/lib/i18n-pokemon";
import { TeamBuilderClient, type RefPokemon, type RefMove, type RefAbility, type RefItem } from "./TeamBuilderClient";
import { decodeTeam, type TeamShare } from "@/lib/team-share";

export const dynamic = "force-dynamic";

export default async function TeamBuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const shareParam = Array.isArray(sp.share) ? sp.share[0] : sp.share;
  const initialTeam: TeamShare | null = shareParam
    ? await decodeTeam(shareParam)
    : null;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const [pokemon, moves, abilities, items] = await Promise.all([
    prisma.pokemon.findMany({
      where: { games: { contains: '"pokemon-champions"' } },
    }),
    prisma.move.findMany(),
    prisma.ability.findMany(),
    prisma.item.findMany({
      where: { games: { contains: '"pokemon-champions"' } },
    }),
  ]);

  // Trim reference rows to only the fields the client needs (cuts ~30% off the payload).
  const refPokemon: RefPokemon[] = pokemon.map((p) => {
    let usage: RefPokemon["usage"] = null;
    try {
      const parsed = JSON.parse(p.usageStats);
      if (parsed && Array.isArray(parsed.topMoves)) usage = parsed;
    } catch {
      /* leave usage null */
    }
    return {
      slug: p.slug,
      name: localizedPokemonName(p, loc),
      type1: p.type1,
      type2: p.type2,
      spriteUrl: p.spriteUrl,
      abilities: JSON.parse(p.abilities) as string[],
      hiddenAbility: p.hiddenAbility,
      hp: p.hp, atk: p.atk, def: p.def, spa: p.spa, spd: p.spd, spe: p.spe,
      learnableMoves: JSON.parse(p.learnableMoves) as string[],
      usagePct: p.usagePct,
      usage,
    };
  });
  const refMoves: RefMove[] = moves.map((m) => ({
    slug: m.slug,
    name: localizedMoveName(m, loc),
    type: m.type,
    category: m.category,
    power: m.power ?? null,
  }));
  const refAbilities: RefAbility[] = abilities.map((a) => ({
    slug: a.slug,
    name: localizedAbilityName(a, loc),
  }));
  const refItems: RefItem[] = items.map((i) => ({
    slug: i.slug,
    name: localizedItemName(i, loc),
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <TeamBuilderClient
        pokemon={refPokemon}
        moves={refMoves}
        abilities={refAbilities}
        items={refItems}
        initialTeam={initialTeam}
      />
    </main>
  );
}
