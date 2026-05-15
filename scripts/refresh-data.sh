#!/usr/bin/env bash
# Refresh PokeAPI CSV dump + Smogon Champions usage stats, then re-import to
# Postgres. Run monthly (Smogon publishes new chaos data around the 1st of
# each month).
#
#   bash scripts/refresh-data.sh
#
# Uses BSD `date -v-1m` for month rollback — macOS native. On Linux replace
# with `date -d "-1 month" +%Y-%m`.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p data/pokeapi

PA_BASE="https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv"
SMOGON_FORMAT="gen9championsvgc2026regma"
# 0 gives the best roster / low-usage move-item-spread coverage. 1760 remains
# useful as a compact high-skill fallback if the broad dump is unavailable.
SMOGON_CUTOFFS=("0" "1760")

# ─── 1) PokeAPI CSVs ─────────────────────────────────────────────────────────
echo "→ Refreshing PokeAPI CSVs from $PA_BASE"
PA_FILES=(
  pokemon pokemon_species pokemon_species_names pokemon_stats pokemon_types
  pokemon_abilities pokemon_forms pokemon_form_names pokemon_moves
  abilities ability_names ability_flavor_text ability_prose
  moves move_names move_flavor_text move_effect_prose move_damage_classes
  items item_names item_flavor_text item_prose item_categories
  item_category_prose item_flags item_flag_map
  type_efficacy types type_names languages version_groups
)
fail=0
for f in "${PA_FILES[@]}"; do
  if curl -sfL "$PA_BASE/$f.csv" -o "data/pokeapi/$f.csv"; then
    :
  else
    echo "  ✗ $f.csv — skipped (network or 404)"
    fail=$((fail + 1))
  fi
done
echo "  PokeAPI: $((${#PA_FILES[@]} - fail))/${#PA_FILES[@]} files OK"

# ─── 2) Smogon Champions stats ──────────────────────────────────────────────
# The chaos dump for a given month is usually published 1-3 days into the next
# month. Try the current month first; fall back to the last two months.
months=()
months+=("$(date +%Y-%m)")
months+=("$(date -v-1m +%Y-%m)")
months+=("$(date -v-2m +%Y-%m)")

for cutoff in "${SMOGON_CUTOFFS[@]}"; do
  target="data/pokeapi/smogon-championsvgc2026regma-${cutoff}.json"
  got=""
  for m in "${months[@]}"; do
    url="https://www.smogon.com/stats/$m/chaos/${SMOGON_FORMAT}-${cutoff}.json"
    echo "  trying $m cutoff $cutoff..."
    if curl -sfL "$url" -o "$target.tmp"; then
      mv "$target.tmp" "$target"
      got="$m"
      break
    fi
    rm -f "$target.tmp"
  done

  if [[ -z "$got" ]]; then
    echo "  ✗ no Smogon chaos JSON for cutoff $cutoff in the last 3 months — aborting"
    exit 1
  fi
  echo "  Smogon stats: ✓ using $got/$SMOGON_FORMAT-$cutoff.json ($(du -h "$target" | cut -f1))"
done

# ─── 3) Reimport into Postgres ──────────────────────────────────────────────
echo "→ Re-importing to Postgres..."
npm run db:import

echo "✓ Done. Next run: in about a month, when Smogon publishes a new chaos dump."
