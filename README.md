# pokeDD

A Pokémon Champions competitive companion — Pokémon / move / ability / item
database, team builder with URL sharing, single-mon analyzer, and a
damage calculator that knows the meta.

🎮 **Live site:** **[www.pokedd.com](https://www.pokedd.com)**
⭐ **If pokeDD is useful, please star this repo!**

## What it does

- **Pokédex** — every Champions-legal Pokémon (`/pokemon-champions/pokemon`)
  with localized names, stats, learnsets, type matchups, and per-mon
  usage % drawn from monthly Smogon ladder dumps.
- **Move / ability / item catalogs** with sortable tables, multi-language
  search, and competitive usage badges.
- **Team Builder** — six slots, no account, share a team via URL. Type
  coverage + defense / offense matrices update live as you tweak.
- **Pokémon Builder** — focus on a single mon: speed tier vs the top 30,
  OHKO probability against the meta (your moves vs theirs), 1v1 outcome
  badges, custom comparison list.
- **Damage Calculator** — full damage formula with weather / terrain /
  screens / status / hazards / ~25 ability modifiers / item modifiers /
  always-crit + multi-hit handling.
- **My Pokémon** — localStorage stash of saved builds, surfaced as a
  floating Poké Ball bottom-left of every page. Load saved builds into
  either builder in one click.
- **Singles + Doubles** — the Nav toggle switches every usage stat
  (top moves / items / abilities / spreads) between the Champions BSS
  and VGC chaos dumps.
- **i18n** — full English / 日本語 / 简体中文 / 繁體中文 support, including
  hand-curated translations for Gen 9 abilities and moves that
  PokeAPI hasn't catalogued.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) App Router + Turbopack |
| Language | TypeScript strict |
| Styling | Tailwind v4 |
| i18n | [next-intl v4](https://next-intl.dev/) |
| DB | [Neon Postgres](https://neon.tech) accessed via Prisma 6 |
| Deploy | [Vercel](https://vercel.com) (pdx1 region, co-located with Neon) |
| Data sources | [PokeAPI](https://pokeapi.co) CSV dump + [Smogon](https://www.smogon.com/stats/) chaos JSON |

## Getting started locally

```bash
# 1. Install
npm install

# 2. Set up DB credentials
cp .env.example .env
#   ... then fill in DATABASE_URL (pooled) + DIRECT_URL (unpooled) for Neon

# 3. Pull the public data (PokeAPI CSVs + Smogon Champions chaos JSON)
bash scripts/refresh-data.sh

# 4. Apply migrations + seed
npx prisma migrate deploy
npm run db:import

# 5. Run the dev server
npm run dev
```

Visit `http://localhost:3000` — the app redirects `/` → `/pokemon-champions`.

For deeper architectural notes (framework gotchas, data import pipeline,
debugging recipes), see [`AGENTS.md`](./AGENTS.md).

## Contributing

Issues and PRs welcome. Translation fixes especially — Gen 9 abilities
and Champions-specific moves still need community review for accuracy.
If you spot something off in the live site, file an issue with a
screenshot and the page URL.

## Star me

If pokeDD has helped you build a team or won you a game, give the repo
a ⭐ — it helps me prioritize features and translations.

[![Star on GitHub](https://img.shields.io/github/stars/Seancheey/PokeDD?style=social)](https://github.com/Seancheey/PokeDD)

## License

MIT.
