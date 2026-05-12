import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import type { Locale } from "@/i18n/routing";
import {
  localizedPokemonName,
  localizedMoveName,
  localizedAbilityName,
  localizedItemName,
} from "@/lib/i18n-pokemon";
import { DamageCalcClient, type CalcRefPokemon, type CalcRefMove } from "./DamageCalcClient";
import type { RefAbility, RefItem } from "../team-builder/TeamBuilderClient";

export const dynamic = "force-dynamic";

export default async function DamageCalcPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const [pokemon, moves, abilities, items] = await Promise.all([
    prisma.pokemon.findMany(),
    prisma.move.findMany(),
    prisma.ability.findMany(),
    prisma.item.findMany(),
  ]);

  const refPokemon: CalcRefPokemon[] = pokemon.map((p) => ({
    slug: p.slug,
    name: localizedPokemonName(p, loc),
    type1: p.type1,
    type2: p.type2,
    spriteUrl: p.spriteUrl,
    hp: p.hp, atk: p.atk, def: p.def, spa: p.spa, spd: p.spd, spe: p.spe,
  }));
  const refMoves: CalcRefMove[] = moves.map((m) => ({
    slug: m.slug,
    name: localizedMoveName(m, loc),
    type: m.type,
    category: m.category,
    power: m.power ?? 0,
    targetShape: m.targetShape,
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
      <DamageCalcClient
        pokemon={refPokemon}
        moves={refMoves}
        abilities={refAbilities}
        items={refItems}
      />
    </main>
  );
}
