# PokePoke — Product Requirements Document

**Status:** Draft v1
**Author:** sean@thinkverse.co
**Last updated:** 2026-05-10
**Reference:** https://pokebase.app/pokemon-champions (the site this product replicates)

---

## 1. Summary

PokePoke is a companion web app for the *Pokémon Champions* competitive scene. It mirrors the feature surface of `pokebase.app/pokemon-champions`: a searchable Pokémon/move/ability/item database, a team builder, a shareable damage calculator, and a browser of tournament and community teams. The app targets full feature parity with the reference site, with one structural change — **no user accounts**. Personal teams are persisted purely via URL encoding (`?share=…`), while the public Teams browser is curated from anonymous submissions plus tournament imports.

### One-line value prop

> "Build, share, and stress-test *Pokémon Champions* teams in seconds — without an account."

---

## 2. Goals and non-goals

### Goals (G)

- **G1.** Reproduce every reader-facing page on `pokebase.app/pokemon-champions` with equivalent data depth and filter coverage.
- **G2.** Reach interactive in <2.5s on a median mobile connection for list pages with full client-side filter/sort.
- **G3.** Ship a team builder that round-trips a six-mon team through a URL (zero server write) in under 2KB encoded.
- **G4.** Damage calc must agree to the exact roll with the reference Pikalytics calculator for a defined test suite of 200 scenarios.
- **G5.** Public Teams browser is fully crawlable (SSR + structured data), filterable by type/Pokémon/move/regulation.

### Non-goals (NG)

- **NG1.** User accounts, login, or per-user dashboards.
- **NG2.** Real-time multiplayer features, chat, DMs, or notifications.
- **NG3.** Native mobile apps. The Pokémon GO and TCG Pocket sections of `pokebase.app` are out of scope.
- **NG4.** First-party tournament hosting or bracket management.
- **NG5.** Original art/sprite generation — we reuse public Pokémon assets under fair-use precedent set by other community tools.

---

## 3. Target users

| Persona | Need | Success looks like |
|---|---|---|
| **Ladder grinder** (daily player) | Quick lookups: usage %, top moves, counters. | Lands on Pokémon page from search, gets answer in <10s, leaves. |
| **Team builder** (weekly) | Drafts, tweaks, and stress-tests a six-mon team for a tournament regulation. | Builds a team, runs 8–15 calcs, shares a URL to a Discord. |
| **Coach / content creator** | Authoritative team breakdowns to embed in articles/videos. | Submits team with notes; sees it appear in Community Showcase. |
| **Casual fan** | Browse top tournament teams without committing. | Lands on `/teams`, filters by an archetype, opens 2–3. |

---

## 4. Information architecture

```
/pokemon-champions                        Hub: news, top usage, featured teams, jump-off links
  /pokemon                                Pokémon list (filter/sort/search)
    /pokemon/[slug]                       Pokémon detail (stats, movepool, abilities, usage, top sets)
  /moves                                  Moves list
    /moves/[slug]                         Move detail (description, learners, usage)
  /abilities                              Abilities list
    /abilities/[slug]                     Ability detail (description, holders, usage)
  /items                                  Items list (held items, mega stones, berries)
    /items/[slug]                         Item detail
  /team-builder                           Team builder (no auth, ?share= and ?team= params)
  /teams                                  Browse tournament + community teams (filter/sort)
  /damage-calc                            Damage calculator (standalone + linked from builder)
```

Global header: brand → `pokemon-champions` section nav (Pokémon, Moves, Abilities, Items, Team Builder, Teams, Damage Calc) → search.
Global footer: about, data sources/credits, contact, GitHub, last-data-refresh timestamp.

---

## 5. Features — page by page

### 5.1 Hub `/pokemon-champions`

**Purpose:** funnel users to a section in one click; show *what's hot*.

**Modules (top to bottom):**

1. **Hero** with current regulation badge (e.g., "Reg M-A"), search bar.
2. **Top 10 Pokémon by usage** — horizontal scroll of cards (sprite, name, usage %, primary type chip). Click → Pokémon detail.
3. **Featured Community Teams** — 3–6 cards from `/teams` flagged `featured=true`. Card shows team's 6 sprites, title, author handle, win rate (if known).
4. **Quick tools row** — three large CTAs: Team Builder · Damage Calculator · Browse Teams.
5. **Recent moves / item / ability spotlight** — editorial slot, hand-curated.
6. **Patch / data refresh callout** — "Usage data updated 2026-05-10."

### 5.2 Pokémon list `/pokemon`

**Reference:** `pokebase.app/pokemon-champions/pokemon`

**Columns (default, sortable):**

| # | Sprite | Name | Types | Usage % | HP | ATK | DEF | SpA | SpD | SPD | BST |

- **Density toggle:** comfortable (default) vs compact rows.
- **View toggle:** Table (desktop default) ↔ Card grid (mobile default).

**Filter rail (left on desktop, drawer on mobile):**

- **Search** — fuzzy name + dex number.
- **Type** — chip multiselect (Normal, Fire, Water, Electric, Grass, Ice, Fighting, Poison, Ground, Flying, Psychic, Bug, Rock, Ghost, Dragon, Dark, Steel, Fairy). Mode toggle: *any-of* / *all-of* (for dual-type).
- **Regulation** — single-select (e.g., Reg A, Reg M-A). Filters to legal mons only.
- **Ability** — searchable multiselect.
- **Move** — searchable multiselect; "knows ALL of" vs "knows ANY of" toggle.
- **Stat ranges** — six dual-thumb sliders, 1–255.
- **Usage range** — 0–100% slider.

**URL state:** every filter is reflected in the query string so a filtered view is shareable. Match the reference's encoding: `?filter=type%3D%5B%22fire%22%5D` style (key=`type` value=`["fire"]`).

**Empty state:** "No Pokémon match. Try removing the Move filter." with a one-click "Clear filters".

### 5.3 Pokémon detail `/pokemon/[slug]`

Sections in order:

1. Header: large sprite, name, dex #, types, regulation legality badge, usage %, "Add to Team Builder" button.
2. Base stats bar chart (HP/ATK/DEF/SpA/SpD/SPD with totals).
3. Abilities (name + short description; tooltip on hover; link to detail).
4. Type matchup grid (offensive + defensive 18×18 condensed view: weak/resist/immune chips).
5. Movepool table — name, type, category (physical/special/status), power, accuracy, PP, % of competitive sets using it.
6. **Top competitive sets** (from upstream usage API): item, ability, nature, EV spread, top 4 moves, with copy-to-builder button.
7. Common teammates (top 6 with co-usage %).
8. Teams featuring this Pokémon — links into `/teams?pokemon=<slug>`.

### 5.4 Moves list `/moves` + detail `/moves/[slug]`

**List columns:** Name · Type · Category · Power · Accuracy · PP · Priority · Effect (short) · Usage %.

**Filters:** type, category, power range, accuracy range, status-only toggle, contact toggle, spread/single-target.

**Detail:** full description, effect chance, priority, contact flag, target shape, list of learners (linked), usage history sparkline.

### 5.5 Abilities list `/abilities` + detail `/abilities/[slug]`

**List columns:** Name · Short description · # of Pokémon · Usage %.

**Filters:** search, "in current regulation" toggle.

**Detail:** long description, mechanics notes, holders (linked Pokémon list), notable interactions ("Pixilate + Hyper Voice", etc.).

### 5.6 Items list `/items` + detail `/items/[slug]`

**Categories** (filterable): Held items · Mega Stones · Berries · Type-boosting · Choice items · Misc.

**List columns:** Name · Category · Effect · Usage %.

**Detail:** description, stat math (e.g., Choice Band → ×1.5 ATK locked-in), eligible holders.

### 5.7 Team Builder `/team-builder`

**Reference:** `pokebase.app/pokemon-champions/team-builder` and `?team=<id>` / `?share=<gzip+base64>` URLs.

**Layout:** left panel is the 6-mon slot strip. Right panel is the **detail editor** for the selected slot. Below: **team summary** strip (type coverage matrix, weaknesses/resistances heatmap, speed tier chart).

**Per-slot editor:**

- Species picker (autocomplete + sprite grid).
- Nickname (optional, ≤12 chars).
- **Ability** dropdown — only valid abilities for species.
- **Held item** dropdown.
- **Tera type** — *only if* the active regulation allows Terastallization (PRD note: current Champions ruleset disables it; UI shows the field disabled with a tooltip).
- **Nature** dropdown.
- **Stat points** — six sliders allocating *Victory Points (VP)* per Champions' new system (replaces EVs+IVs). Total cap enforced per regulation.
- **Moves** — 4 dropdowns, filtered to species' learnset.
- **Notes** — markdown textarea per Pokémon (saved into share URL).

**Team-level controls:**

- **Regulation selector** — dictates legal mons, max VP, allowed mechanics. Changing it warns about invalidated slots.
- **Format selector** — Singles / Doubles. Affects damage calc defaults and target options.
- **Team notes** — markdown, saved into share URL.
- **Save / Share** → produces canonical `?share=<gzip+base64 JSON>` URL. Toast: "Link copied."
- **Open Damage Calc** — preserves team in URL.
- **Submit to Community** → see 5.8.

**Constraints:**

- No server-side persistence of personal teams. Closing the tab loses unshared work.
- Auto-snapshot every 5s to `localStorage` for crash recovery (one slot only; never synced).

**Two URL params (kept distinct):**

- `?share=<payload>` — encodes the whole team client-side (gzip + base64url JSON). Single source of truth.
- `?team=<id>` — references a server-stored team (only used after a Community Submission). Loads read-only by default; "Fork to edit" copies into `?share=`.

### 5.8 Teams browser `/teams`

**Purpose:** browse curated tournament rosters + community submissions.

**Card view:** grid, each card = 6 mini-sprites, title, regulation badge, author handle, source ("Tournament: Wolfey Patreon #2" / "Community Submission"), date, placement (if tournament).

**Filters:**

- Regulation
- Must contain Pokémon (multiselect)
- Must contain Move (multiselect)
- Type (any-of types appearing on the team)
- Source: Tournament · Community · Featured
- Sort: Newest · Top usage · Featured · Placement

**Team detail page** (route shape: `/teams/[id]`, internally rendered via `/team-builder?team=[id]`):

- Read-only builder view.
- Notes / analysis (markdown rendered).
- Fork button (clones into editable `?share=` URL).
- Open in Damage Calc.

**Community Showcase submission flow:**

1. From Team Builder, click "Submit". Modal collects: handle (free text, no auth), title, optional tournament name/placement, markdown notes.
2. Submission goes to a **moderation queue** (DB row, `status='pending'`). No public listing yet.
3. Admin reviews via private `/admin/queue` (gated by IP allowlist + shared secret env var). Approves → `status='approved'` → indexed publicly.
4. A submitter receives no notification (no accounts); the response shows a permalink they can bookmark.
5. Rate-limit: 3 submissions per IP per 24h. Spam protected by hCaptcha.

### 5.9 Damage Calculator `/damage-calc`

**Reference:** `pokebase.app/pokemon-champions/damage-calc` plus parity testing against Pikalytics.

**Layout:** two side-by-side Pokémon configs (Attacker, Defender). Below: **field conditions** strip. Below that: **result panel**.

**Per-side controls (mirrors team-slot editor, condensed):**

- Species, ability, item, nature, VP allocation, moves (multi-select up to 4).
- Level (default 50).
- Status (none / burn / paralyze / etc.).
- Stat-stage steppers (−6 to +6) for ATK, DEF, SpA, SpD, SPD, ACC, EVA.
- Health % slider.

**Field strip:**

- Weather: none / sun / rain / sand / snow.
- Terrain: none / electric / grassy / misty / psychic.
- Helping Hand toggle.
- Screens: Reflect, Light Screen, Aurora Veil.
- Spread move (doubles): on/off — applies 0.75× modifier.
- Critical hit: on/off.
- Field hazards (defender side): Stealth Rock, Spikes count, Toxic Spikes count.
- Format: Singles / Doubles (auto-set from team).

**Output:**

- For each selected attacker move: damage range (min–max), %-of-defender-HP range, KO probability (OHKO%, 2HKO%), guaranteed KO turns counting hazard chip.
- "Worst roll" and "Best roll" highlighted.
- Copy-as-text button: outputs the Showdown-style summary line.

**Multi-target panel:** load a full team on each side; matrix of attacker moves × defender mons.

**Reverse calc:** "What VP spread on defender survives this 2HKO?" returns recommended spreads.

**Correctness:** golden test suite of 200 scenarios drawn from Pikalytics; CI fails on any divergence outside the inherent damage-roll range.

---

## 6. Data model

Postgres via Prisma. All names are illustrative.

```
pokemon            (id, slug, dex_no, name, types[], base_stats jsonb, regulations[],
                    abilities[], hidden_ability, sprite_url, mega_evolves_to_id?)
move               (id, slug, name, type, category, power, accuracy, pp, priority,
                    target_shape, makes_contact, effect_text, effect_chance)
ability            (id, slug, name, short_desc, long_desc)
item               (id, slug, name, category, description, mechanics jsonb)

pokemon_move       (pokemon_id, move_id, learn_method)            -- learnset
pokemon_ability    (pokemon_id, ability_id, is_hidden)            -- joined abilities

usage_snapshot     (id, regulation, captured_at, source)
usage_pokemon      (snapshot_id, pokemon_id, usage_pct, rank)
usage_move         (snapshot_id, pokemon_id, move_id, pct)
usage_ability      (snapshot_id, pokemon_id, ability_id, pct)
usage_item         (snapshot_id, pokemon_id, item_id, pct)
usage_teammate     (snapshot_id, pokemon_id, teammate_id, pct)
usage_spread       (snapshot_id, pokemon_id, nature, vp jsonb, pct)

team               (id, title, author_handle, regulation, format,
                    source enum('tournament','community','featured'),
                    tournament_name?, placement?, notes_md,
                    status enum('pending','approved','rejected'),
                    created_at, approved_at, slot_data jsonb)   -- 6 slots inline
                                                                 -- (snapshot, not FKs, so historical teams survive data refreshes)

regulation         (id, slug, name, max_vp, allow_tera, banlist jsonb, valid_from, valid_to?)

audit_log          (id, actor, action, target_type, target_id, payload, at)
```

`team.slot_data` JSON shape per slot:
```jsonc
{
  "species": "incineroar", "nickname": "",
  "ability": "intimidate", "item": "safety-goggles",
  "nature": "careful", "tera_type": null,
  "vp": { "hp": 244, "atk": 0, "def": 4, "spa": 0, "spd": 252, "spe": 8 },
  "moves": ["fake-out", "parting-shot", "knock-off", "flare-blitz"],
  "notes_md": ""
}
```

---

## 7. Data sources and ingestion

| Concern | Source | Cadence |
|---|---|---|
| Static species/move/ability/item facts | Open community datasets (e.g., PokéAPI, Smogon dex JSON), corrected per Champions ruleset (PP changes on Protect, etc.) | One-shot import; manual patch PRs |
| Sprites/art | Existing community CDNs; cached and served via our Next.js Image Optimization | One-shot |
| Usage stats (Pokémon, moves, items, abilities, spreads, teammates) | Third-party Pikalytics-style API (decision: G1 in §11 open questions confirms vendor) | Cron: daily 03:00 UTC |
| Tournament team rosters | Vendor API (same as usage) where exposed; otherwise manual entry by admin | Weekly + ad-hoc post-tournament |

**Ingest job design:** Postgres-backed worker (BullMQ or Inngest), reads upstream API, writes a new `usage_snapshot`, references it as `current`. Reads always join through the `current` snapshot pointer so an in-flight refresh never serves a half-updated page.

**Failure mode:** if the upstream is down at refresh time, the previous snapshot stays current; banner on the hub reads "Usage data last updated <ts>" with an aria-live update so screen readers catch it.

**Legal:** all data ingest must respect the upstream's TOS. PRD assumes paid or open-license access; if the chosen vendor disallows redistribution, fall back to seeded + community-submitted data (see §11).

---

## 8. Tech stack (recommended)

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) on Node 22 | SSR for SEO on `/pokemon`, `/teams`, detail pages; RSC for cheap server filters; route handlers for the ingest cron. |
| Language | TypeScript (strict) | Zod schemas shared between API and client for filter URL parsing. |
| Styling | Tailwind v4 + shadcn/ui | Fast iteration on table-heavy UI; accessible primitives. |
| State (client) | URL + nuqs for filters; Zustand only for builder slot state. | URL-first state = shareable by default. |
| DB | Postgres 16 | Familiar, cheap, JSONB for usage snapshots. |
| ORM | Prisma | Schema-first; migrations in CI. |
| Search | Postgres `pg_trgm` + materialized view for autocomplete | Avoid Algolia cost; ≤20k rows total. |
| Queue/cron | Inngest (managed) or self-host BullMQ on Render | Scheduled ingest, retries, dashboards. |
| Hosting | Vercel (web) + Neon (DB) | Standard, scales to free until traction. |
| Image hosting | Vercel Image Optimization w/ remote loader | One-line config for sprites. |
| Observability | Sentry (errors) + Vercel Analytics (web vitals) + Logflare on Vercel logs | Cheap, covers the basics. |
| Spam | hCaptcha on submissions | No accounts means we need *something*. |

**Why not Supabase / SPA?** SEO is a primary acquisition channel; the Pokémon detail and Teams pages must be SSR-friendly. RSC also halves the JS shipped on list pages, which matters on mid-tier mobile.

---

## 9. URL design and share encoding

- **Filters:** `?filter=key%3Dvalue` (URL-encoded JSON). Match the reference site's shape so external links coexist. A redirect layer maps legacy/short forms to the canonical encoding.
- **Builder share:** `?share=<base64url(gzip(json))>`. JSON is `{ v: 1, reg: "M-A", fmt: "doubles", slots: [...6] }`. Hard cap 4KB encoded; fail gracefully if longer (we strip notes first).
- **Saved team:** `?team=<24-char-mongo-style id>` — read from DB.
- **Damage calc:** `?atk=<share-fragment>&def=<share-fragment>&field=<base64>`.

Decoder is shared TypeScript code between server and client. If `share` parsing fails, redirect to `/team-builder` with a toast.

---

## 10. SEO, performance, accessibility

- **SEO:** every detail page is SSR with structured data (`Thing`/`Article` schema), canonical URLs, OpenGraph cards (server-rendered SVG composite of team sprites).
- **Performance budgets:**
  - LCP <2.5s on Moto G Power-class device on 4G.
  - Total JS on `/pokemon` list <120KB gzipped (filters are RSC where possible).
  - Sprite images use AVIF with PNG fallback, lazy-loaded below the fold.
- **A11y:** WCAG 2.1 AA. Filter rail is keyboard navigable, all sliders have spin-button alternates. Color is never the only signal on type chips (each chip carries the type abbreviation).
- **i18n:** out of scope for v1 — English only. Codebase routes through `next-intl` so a future locale add is mechanical.

---

## 11. Open questions and risks

1. **Upstream usage API vendor.** Pikalytics has the data; is the access agreement compatible with our redistribution? **Owner:** sean. **Decision needed:** before Phase 2 (see §13).
2. **Tournament team licensing.** Re-publishing a player's roster needs at minimum attribution and ideally explicit opt-in. Plan: source-only-with-credit, plus a take-down endpoint.
3. **No-account spam.** hCaptcha + IP rate-limit covers casual abuse, but a determined actor can poison the queue. Admin tooling must handle bulk-rejects.
4. **Damage calc divergence.** Pikalytics is a moving target; what's our SLA if they ship a balance patch we miss? **Proposal:** publish our formula version; pin Pikalytics snapshot version in tests.
5. **Game balance changes.** Champions has already shipped non-trivial mid-stream changes (Protect PP). Schema accommodates per-regulation overrides for move stats but the UI to surface "this changed" needs design.
6. **Sprite/asset rights.** Risk of takedown. Mitigation: host community-licensed sprites; keep an `<img>` swap layer to switch source rapidly.

---

## 12. Metrics

| Metric | Target (90 days post-launch) |
|---|---|
| Weekly active users | 5,000 |
| Median time-to-build-team | <90s from `/team-builder` landing |
| Share-URLs created per WAU | ≥0.8 |
| Damage calcs run per WAU | ≥6 |
| Community submissions accepted | ≥30/week |
| LCP p75 on list pages | <2.5s |
| Error rate (Sentry, 5xx + uncaught) | <0.5% of sessions |

Instrumentation: PostHog (self-host or cloud) for funnel + heatmaps; events for filter changes, slot edits, share clicks, calc runs.

---

## 13. Milestones

**Phase 0 — Foundations (2 weeks)**
Next.js scaffold, schema, Pokémon/move/ability/item seed import, `/pokemon` list with filters, `/pokemon/[slug]` detail. Acceptance: 200ms p95 server response on list with all filters applied.

**Phase 1 — Builder + Calc (3 weeks)**
Team Builder with share URL; Damage Calculator with the 200-case test suite. Acceptance: every test case agrees with reference within roll bounds; share URL <2KB for typical team.

**Phase 2 — Public Teams (2 weeks)**
Tournament import job, community submission flow, moderation queue, `/teams` browser. Acceptance: 100 seeded tournament teams + working submission + moderation UI.

**Phase 3 — Polish & launch (1 week)**
SEO pass, OG cards, perf budgets met, error tracking, public launch.

**Phase 4 (post-launch) — Stretch**
Reverse damage calc, common-teammate widgets on Pokémon detail, RSS for new tournament teams.

---

## 14. Out of scope (explicit)

- Pokémon GO companion (`/pokemon-go/*` on the reference site).
- TCG Pocket companion (`/tcg-pocket/*`).
- Accounts, profiles, follows, comments, votes.
- Mobile apps.
- Live battle simulator.

---

## 15. Appendix — reference inventory

Pages confirmed on the reference site (`pokebase.app`) that this PRD covers:

- `/pokemon-champions` (hub)
- `/pokemon-champions/pokemon` (list) and `/pokemon-champions/pokemon/[slug]` (detail; example: `/basculegion`)
- `/pokemon-champions/moves`
- `/pokemon-champions/abilities` and `/pokemon-champions/abilities/[slug]` (examples: `/pixilate`, `/adaptability`, `/aerilate`, `/sharpness`)
- `/pokemon-champions/items`
- `/pokemon-champions/team-builder` (with `?team=<id>` and `?share=<payload>` URL params, optional `&tab=analysis`)
- `/pokemon-champions/teams`
- `/pokemon-champions/damage-calc`

Sample shared-team URL pattern observed:
`team-builder?share=H4sIA…` — gzip+base64url payload.

Sample server-stored-team URL pattern observed:
`team-builder?team=69da9eb6430ec4019d3f1204` — 24-char hex id (Mongo-shaped).
